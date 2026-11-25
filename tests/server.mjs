// Sobe o app compilado (`npm run build` antes) contra um Postgres em memória (PGlite).
// Nenhum valor de .env é usado: todas as chaves são sobrepostas e nenhum e-mail sai da máquina.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const require = createRequire(path.join(root, 'package.json'));

export const DB_PORT = 55432;
export const APP_PORT = 3199;
export const BASE = `http://127.0.0.1:${APP_PORT}`;
export const JWT_SECRET = crypto.randomBytes(48).toString('base64');
export const ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');

function testEnv() {
    const env = { ...process.env };
    // Só os NOMES são lidos dos arquivos .env.
    for (const file of fs.readdirSync(root).filter((name) => name.startsWith('.env'))) {
        for (const line of fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/)) {
            const match = line.match(/^\s*(?:export\s+)?([A-Za-z_]\w*)\s*=/);
            if (match) env[match[1]] = 'x-teste';
        }
    }
    const dbUrl = `postgresql://postgres@127.0.0.1:${DB_PORT}/postgres?sslmode=disable`;
    return Object.assign(env, {
        NODE_ENV: 'production',
        DATABASE_URL: dbUrl,
        DIRECT_DATABASE_URL: dbUrl,
        JWT_SECRET,
        ENCRYPTION_KEY,
        GMAIL_USER: 'teste@example.invalid',
        GMAIL_APP_PASSWORD: 'x-teste',
        SECURITY_ALERT_EMAIL_TO: '',
        SECURITY_SLACK_WEBHOOK_URL: '',
        LANCAMENTO_NOTIFY_EMAIL: 'destino@example.invalid',
        BLOB_READ_WRITE_TOKEN: 'x-teste',
        TRUSTED_PROXY: 'true',
        VERCEL: '',
    });
}

// Garante que o carregador de .env do Next não troca nada pelo valor real.
function assertEnvIsIsolated(env) {
    const code = `
        const before = { ...process.env };
        require(require.resolve('@next/env', { paths: [require.resolve('next')] })).loadEnvConfig(process.cwd(), false);
        const changed = Object.keys(before).filter((k) => before[k] !== process.env[k] && !/^(__NEXT|NODE_|PATH)/i.test(k));
        if (changed.length) { console.error('env trocado:', changed.join(',')); process.exit(1); }
    `;
    return new Promise((resolve, reject) => {
        spawn(process.execPath, ['-e', code], { cwd: root, env, stdio: 'inherit' })
            .on('exit', (status) => (status ? reject(new Error('ambiente de teste não está isolado')) : resolve()));
    });
}

export async function startServer() {
    const env = testEnv();
    await assertEnvIsIsolated(env);

    const db = new PGlite();
    const migrations = path.join(root, 'prisma', 'migrations');
    for (const dir of fs.readdirSync(migrations).sort()) {
        const file = path.join(migrations, dir, 'migration.sql');
        if (fs.existsSync(file)) await db.exec(fs.readFileSync(file, 'utf8'));
    }
    const socket = new PGLiteSocketServer({ db, port: DB_PORT, host: '127.0.0.1', maxConnections: 20 });
    await socket.start();

    const state = { logs: '' };
    const app = spawn(
        process.execPath,
        ['--require', path.join(root, 'tests', 'no-smtp.cjs'), require.resolve('next/dist/bin/next'), 'start', '-p', String(APP_PORT), '-H', '127.0.0.1'],
        { cwd: root, env }
    );
    app.stdout.on('data', (data) => { state.logs += data; });
    app.stderr.on('data', (data) => { state.logs += data; });

    let up = false;
    for (let i = 0; i < 60 && !up; i += 1) {
        up = await fetch(`${BASE}/robots.txt`).then((res) => res.ok, () => false);
        if (!up) await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (!up) {
        app.kill();
        throw new Error(`o app não subiu (rodou "npm run build"?)\n${state.logs}`);
    }

    return {
        db,
        state,
        async stop() {
            app.kill();
            await socket.stop();
            await db.close();
        },
    };
}
