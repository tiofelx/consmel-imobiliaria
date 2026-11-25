// Preload dos testes (tests/server.mjs): nenhum e-mail sai da máquina.
const dns = require('dns');
const block = (host) => /gmail|googlemail/i.test(String(host));
for (const target of [dns, dns.promises, dns.Resolver.prototype, dns.promises.Resolver.prototype]) {
  for (const name of ['lookup', 'resolve', 'resolve4', 'resolve6']) {
    const real = target[name];
    if (typeof real !== 'function') continue;
    target[name] = function (host, ...rest) {
      if (!block(host)) return real.call(this, host, ...rest);
      const err = Object.assign(new Error('SMTP bloqueado no teste'), { code: 'ENOTFOUND' });
      const cb = rest[rest.length - 1];
      if (typeof cb === 'function') return process.nextTick(cb, err);
      return Promise.reject(err);
    };
  }
}
