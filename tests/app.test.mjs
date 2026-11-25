// Testes de ponta a ponta do app compilado. Uso: npm run build && npm test
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { after, before, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import * as OTPAuth from 'otpauth';
import { parseBrazilianNumber } from '../lib/validations.js';
import { BASE, ENCRYPTION_KEY, JWT_SECRET, startServer } from './server.mjs';

let server;
let db;
let ipCount = 0;
const nextIp = () => `10.${Math.floor(++ipCount / 200)}.0.${(ipCount % 200) + 1}`;
const jwtKey = new TextEncoder().encode(JWT_SECRET);
const wait = (ms = 1500) => new Promise((resolve) => setTimeout(resolve, ms));
// Senhas geradas a cada execução.
const randomPassword = () => `T1-${crypto.randomBytes(12).toString('hex')}`;
const PASSWORD = randomPassword();
const NEW_PASSWORD = randomPassword();

const sign = (payload) => new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('1h').sign(jwtKey);
// O Prisma grava horários em UTC; inserções diretas precisam fazer o mesmo.
const rows = async (sql, params) => (await db.query(sql, params)).rows;

function call(url, { method = 'GET', body, form, cookie, ip = nextIp(), headers = {} } = {}) {
    return fetch(BASE + url, {
        method,
        redirect: 'manual',
        headers: {
            'x-forwarded-for': ip,
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(cookie ? { cookie } : {}),
            ...headers,
        },
        body: form ?? (body ? JSON.stringify(body) : undefined),
    });
}
const post = (url, body, options = {}) => call(url, { method: 'POST', body, ...options });
const cookieFrom = (response, name) => response.headers.getSetCookie().find((c) => c.startsWith(`${name}=`))?.split(';')[0];

async function createUser(email, { role = 'CLIENT', secret = null } = {}) {
    const id = `u${crypto.randomBytes(8).toString('hex')}`;
    await rows(
        'insert into users (id, email, password, name, role, "emailVerified", "twoFactorEnabled", "twoFactorSecret", "updatedAt") values ($1,$2,$3,$4,$5,now(),$6,$7,now())',
        [id, email, await bcrypt.hash(PASSWORD, 4), 'Pessoa Teste', role, Boolean(secret), secret]
    );
    return { id, email, role };
}
const sessionFor = async (user, extra = {}) => `session=${await sign({ userId: user.id, email: user.email, role: user.role, name: 'Teste', ...extra })}`;

let admin;
let adminCookie;

before(async () => {
    server = await startServer();
    db = server.db;
    admin = await createUser('admin@example.com', { role: 'ADMIN' });
    adminCookie = await sessionFor(admin);
});
after(async () => { await server?.stop(); });

test('números no padrão brasileiro', () => {
    for (const [input, expected] of [['1500', 1500], ['1.200', 1200], ['2.500,50', 2500.5], ['120,5', 120.5], ['120.5', 120.5], ['R$ 350.000,00', 350000], ['', null]]) {
        assert.equal(parseBrazilianNumber(input), expected, input);
    }
});

test('contato: grava, aceita nome com ponto e usa o interesse do imóvel', async () => {
    const res = await post('/api/contact', { name: 'Maria J. Souza', email: 'm@example.com', phone: '(17) 99999-0000', transactionType: 'Aluguel' });
    assert.equal(res.status, 201);
    assert.equal((await rows("select interest from clients where email = 'm@example.com'"))[0].interest, 'Aluguel');
});

test('contato: falha do banco vira erro 500 com log', async () => {
    await db.exec('alter table clients rename to clients_off');
    const res = await post('/api/contact', { name: 'Ana', email: 'a@example.com', phone: '(17) 99999-0000' });
    await db.exec('alter table clients_off rename to clients');
    await wait();
    assert.equal(res.status, 500);
    assert.match(server.state.logs, /Erro ao salvar contato/);
});

test('lançamento: grava, avisa depois da resposta e aparece no admin', async () => {
    assert.equal((await post('/api/lancamento-leads', { name: 'Ana L. Lima', email: 'ana@example.com', phone: '(17) 98888-0000' })).status, 201);
    await wait();
    assert.match(server.state.logs, /Erro ao enviar aviso de lead/);
    assert.equal((await call('/admin/leads')).status, 307);
    const page = await (await call('/admin/leads', { cookie: adminCookie })).text();
    assert.match(page, /Ana L\. Lima/);
});

test('imóvel: área com milhar, edição preserva características, home sem endereço', async () => {
    const form = new FormData();
    const fields = { title: 'Terreno de Teste', transactionType: 'Venda', category: 'Terreno', price: '350.000,00', totalArea: '1.200', usableArea: '2.500,50', street: 'Rua Secreta', city: 'Guaraci', latitude: '-20.5', longitude: '-48.9', features: '["Piscina"]' };
    for (const [key, value] of Object.entries(fields)) form.append(key, value);
    const created = await call('/api/properties', { method: 'POST', form, cookie: adminCookie });
    assert.equal(created.status, 201);
    const property = await created.json();
    assert.deepEqual([property.price, property.totalArea, property.usableArea], [350000, 1200, 2500.5]);

    const edited = await call(`/api/properties/${property.id}`, { method: 'PUT', cookie: adminCookie, body: { ...fields, features: undefined, totalArea: '1.350', existingImageUrls: [] } });
    assert.equal(edited.status, 200);
    const after = await edited.json();
    assert.deepEqual([after.totalArea, after.features], [1350, ['Piscina']]);

    const home = await (await call('/')).text();
    assert.match(home, /Terreno de Teste/);
    assert.doesNotMatch(home, /Rua Secreta/);
    assert.match(await (await call('/sitemap.xml')).text(), new RegExp(property.id));
    assert.equal((await call('/imoveis?tipo=venda&tipo=aluguel')).status, 200);
});

test('formulários: limite de observações, mensagem de erro e alerta decidido no servidor', async () => {
    const ok = await post('/api/clients', { name: 'Joao Silva', email: 'j@example.com', phone: '(11) 90000-0000', interest: 'Cadastro de Imóvel', address: 'Rua 1 - Centro - Salvador / BA', notes: 'a'.repeat(1500) });
    assert.equal(ok.status, 201);
    assert.equal((await rows("select source from alerts where email = 'j@example.com'"))[0].source, 'cadastro-imovel');

    const bad = await post('/api/clients', { name: 'R2D2', email: 'j@example.com' });
    assert.equal((await bad.json()).details[0].message, 'Nome contém caracteres inválidos');
    assert.equal((await post('/api/alerts', { source: 'register' })).status, 405);
});

test('admin: clientes e agenda validam os campos', async () => {
    const [{ id }] = await rows('select id from clients limit 1');
    assert.equal((await call(`/api/clients/${id}`, { method: 'PUT', cookie: adminCookie, body: { name: 'X' } })).status, 400);
    assert.equal((await post('/api/events', { title: 'Visita', date: 'ontem' }, { cookie: adminCookie })).status, 400);
    assert.equal((await post('/api/events', { title: 'Visita', date: '2026-12-01', time: '09:00', type: 'visit' }, { cookie: adminCookie })).status, 201);
});

test('eventos de segurança: teto por IP e alerta ao vivo vindo do banco', async () => {
    const ip = '10.99.0.1';
    for (let i = 0; i < 40; i += 1) await call('/api/stats', { ip });
    await wait();
    assert.equal(Number((await rows('select count(*) n from security_events where ip = $1', [ip]))[0].n), 30);

    await rows("insert into security_events (id, event, severity, ip, route, reason, \"createdAt\") values ('ev1', 'teste', 'critical', '10.0.0.9', '/x', 'motivo', now() at time zone \'utc\')");
    const live = await (await call('/api/admin/alerts/live', { cookie: adminCookie })).json();
    assert.ok(live.alerts.some((alert) => alert.id === 'ev1'));
    assert.ok(live.now);
});

test('sessão: token antigo vale até a versão mudar; papel vem do banco', async () => {
    const user = await createUser('sessao@example.com', { role: 'ADMIN' });
    const cookie = await sessionFor(user);
    assert.equal((await call('/api/stats', { cookie })).status, 200);
    await rows('update users set role = $1 where id = $2', ['CLIENT', user.id]);
    assert.equal((await call('/api/stats', { cookie })).status, 403);
    await rows('update users set role = $1, "sessionVersion" = 1 where id = $2', ['ADMIN', user.id]);
    assert.equal((await call('/api/stats', { cookie })).status, 403);
    assert.equal((await call('/api/stats', { cookie: await sessionFor(user, { sv: 1 }) })).status, 200);
});

test('ataque de vários IPs não trava navegador já conhecido', async () => {
    const user = await createUser('dono@example.com');
    const first = await post('/api/auth/login', { email: user.email, password: PASSWORD });
    assert.equal(first.status, 200);
    const device = cookieFrom(first, 'known_device');
    assert.ok(device);
    // O cookie de navegador não vale como sessão.
    assert.equal((await call('/api/auth/2fa/generate', { cookie: device.replace('known_device=', 'session=') })).status, 401);

    await rows('insert into rate_limits ("key", "count", "expiresAt") values ($1, 100, (now() at time zone \'utc\') + interval \'1 hour\') on conflict ("key") do update set "count" = 100', [`auth:acct:${user.email}`]);
    assert.equal((await post('/api/auth/login', { email: user.email, password: PASSWORD })).status, 429);
    assert.equal((await post('/api/auth/login', { email: user.email, password: PASSWORD }, { cookie: device })).status, 200);
});

test('redefinição de senha: troca a senha e derruba sessões', async () => {
    const user = await createUser('esqueci@example.com');
    const oldSession = await sessionFor(user);
    // E-mail bloqueado no teste: com ou sem conta a resposta é a mesma, e só a conta existente tenta enviar.
    const mailErrors = () => server.state.logs.split('Verification email error').length - 1;
    const before = mailErrors();
    const known = await post('/api/auth/forgot-password', { email: user.email });
    const unknown = await post('/api/auth/forgot-password', { email: 'ninguem@example.com' });
    assert.deepEqual([known.status, unknown.status], [200, 200]);
    assert.ok(cookieFrom(unknown, 'pending_email'));
    await wait();
    assert.equal(mailErrors() - before, 1);

    const code = '12345678';
    const codeMac = crypto.createHmac('sha256', JWT_SECRET).update(`email-code:${user.email}:${code}`).digest('hex');
    const cookie = `pending_email=${await sign({ email: user.email, via: 'reset', stage: 'email_pending', codeMac })}`;
    assert.equal((await post('/api/auth/verify-email', { token: code, password: 'curta' }, { cookie })).status, 400);
    assert.equal((await post('/api/auth/verify-email', { token: '00000000', password: NEW_PASSWORD }, { cookie })).status, 401);
    assert.equal((await post('/api/auth/verify-email', { token: code, password: NEW_PASSWORD }, { cookie })).status, 200);

    assert.equal((await call('/api/auth/2fa/generate', { cookie: oldSession })).status, 401);
    assert.equal((await post('/api/auth/login', { email: user.email, password: PASSWORD })).status, 401);
    assert.equal((await post('/api/auth/login', { email: user.email, password: NEW_PASSWORD })).status, 200);
});

test('2FA: desativar exige código e encerra as outras sessões', async () => {
    const secret = new OTPAuth.Secret({ size: 20 });
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    const data = Buffer.concat([cipher.update(secret.base32), cipher.final()]);
    const stored = [iv, data, cipher.getAuthTag()].map((part) => part.toString('hex')).join(':');
    const user = await createUser('doisfatores@example.com', { secret: stored });
    const cookie = await sessionFor(user);
    const totp = new OTPAuth.TOTP({ secret });

    const wrong = totp.generate() === '000000' ? '111111' : '000000';
    assert.equal((await post('/api/auth/2fa/disable', { token: wrong }, { cookie })).status, 400);
    const res = await post('/api/auth/2fa/disable', { token: totp.generate() }, { cookie });
    assert.equal(res.status, 200);
    assert.equal((await call('/api/auth/2fa/generate', { cookie })).status, 401);
    assert.equal((await call('/api/auth/2fa/generate', { cookie: cookieFrom(res, 'session') })).status, 200);
});

test('limite por IP: login certo devolve só a própria tentativa', async () => {
    const user = await createUser('contador@example.com');
    const ip = '10.77.0.1';
    for (let i = 0; i < 3; i += 1) await post('/api/auth/login', { email: `alvo${i}@example.com`, password: 'errada' }, { ip });
    assert.equal((await post('/api/auth/login', { email: user.email, password: PASSWORD }, { ip })).status, 200);
    assert.equal((await rows('select count from rate_limits where "key" = $1', [`auth:${ip}`]))[0].count, 3);
});

test('e-mail: maiúsculas entram na mesma conta; migração normaliza sem colidir', async () => {
    const user = await createUser('caixa@example.com');
    assert.equal((await post('/api/auth/login', { email: ' Caixa@Example.com ', password: PASSWORD })).status, 200);
    assert.ok(user.id);

    for (const email of ['Mista@example.com', 'Dupla@example.com', 'dupla@example.com']) await createUser(email);
    await db.exec(fs.readFileSync(new URL('../prisma/migrations/20261126000000_lowercase_user_email/migration.sql', import.meta.url), 'utf8'));
    const emails = (await rows("select email from users where lower(email) in ('mista@example.com', 'dupla@example.com')")).map((r) => r.email).sort();
    assert.deepEqual(emails, ['Dupla@example.com', 'dupla@example.com', 'mista@example.com']);
});

test('imóvel: edição com formulário multipart aplica os vídeos', async () => {
    const video = 'https://loja.public.blob.vercel-storage.com/v.mp4';
    await rows('insert into properties (id, title, "transactionType", category, price, videos, "updatedAt") values ($1, $2, $3, $4, 1, $5, now())', ['VID1', 'Casa', 'Venda', 'Casa', [video]]);
    const form = new FormData();
    form.append('title', 'Casa');
    form.append('existingImageUrls', '[]');
    form.append('videos', '[]');
    assert.equal((await call('/api/properties/VID1', { method: 'PUT', form, cookie: adminCookie })).status, 200);
    assert.deepEqual((await rows("select videos from properties where id = 'VID1'"))[0].videos, []);
});

test('formulários públicos: só JSON; IPv6 conta por /64', async () => {
    for (const url of ['/api/contact', '/api/clients', '/api/lancamento-leads']) {
        const res = await call(url, { method: 'POST', form: '{}', headers: { 'Content-Type': 'text/plain' } });
        assert.equal(res.status, 415, url);
    }
    const statuses = [];
    for (let i = 1; i <= 6; i += 1) {
        const res = await post('/api/lancamento-leads', { name: 'Ana', email: 'v6@example.com', phone: '(17) 98888-0000' }, { ip: `2001:db8:1:1::${i}` });
        statuses.push(res.status);
    }
    assert.deepEqual(statuses, [201, 201, 201, 201, 429, 429]);
});

test('2FA: ativar pede a senha e encerra as outras sessões', async () => {
    const user = await createUser('ativa@example.com');
    const cookie = await sessionFor(user);
    const other = await sessionFor(user, { jti: 'outra' });
    const { secret } = await (await call('/api/auth/2fa/generate?manualEntry=true', { cookie })).json();
    const token = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secret) }).generate();

    assert.equal((await post('/api/auth/2fa/verify', { token }, { cookie })).status, 400);
    assert.equal((await post('/api/auth/2fa/verify', { token, password: 'errada' }, { cookie })).status, 400);
    const res = await post('/api/auth/2fa/verify', { token, password: PASSWORD }, { cookie });
    assert.equal(res.status, 200);
    assert.equal((await call('/api/auth/2fa/generate', { cookie: other })).status, 401);
    assert.equal((await call('/api/auth/2fa/generate', { cookie: cookieFrom(res, 'session') })).status, 409);

    const profile = await (await call('/perfil', { cookie: cookieFrom(res, 'session') })).text();
    assert.doesNotMatch(profile, /\$2[aby]\$/);
});

test('sair invalida o token', async () => {
    const user = await createUser('sair@example.com', { role: 'ADMIN' });
    const cookie = await sessionFor(user);
    assert.equal((await call('/api/stats', { cookie })).status, 200);
    assert.equal((await call('/api/auth/logout', { method: 'POST', cookie })).status, 200);
    assert.equal((await call('/api/stats', { cookie })).status, 403);
});

test('CSP: sem unsafe-inline em script e todo script com o nonce da resposta', async () => {
    for (const url of ['/', '/login', '/esqueci-senha', '/lancamento', '/nao-existe']) {
        const res = await call(url);
        const scriptSrc = res.headers.get('content-security-policy').split(';').find((part) => part.trim().startsWith('script-src'));
        assert.doesNotMatch(scriptSrc, /unsafe/, url);
        const nonce = scriptSrc.match(/'nonce-([^']+)'/)[1];
        const scripts = (await res.text()).match(/<script\b[^>]*>/g) ?? [];
        assert.ok(scripts.length > 0, url);
        assert.deepEqual(scripts.filter((tag) => !tag.includes(`nonce="${nonce}"`)), [], url);
    }
});
