import { chromium, devices } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:3000';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.join(process.cwd(), 'artifacts', `qa-visual-${timestamp}`);

mkdirSync(outDir, { recursive: true });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function collectNavMetrics(page, selector) {
  return page.$$eval(selector, (els) =>
    els.map((el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        text: (el.textContent || '').trim(),
        width: rect.width,
        height: rect.height,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
      };
    })
  );
}

function compareMetrics(before, after) {
  const issues = [];
  const byText = new Map(after.map((item) => [item.text, item]));

  for (const b of before) {
    const a = byText.get(b.text);
    if (!a) continue;
    const widthDiff = Math.abs(a.width - b.width);
    const heightDiff = Math.abs(a.height - b.height);

    if (widthDiff > 1.5 || heightDiff > 1.5) {
      issues.push({
        text: b.text,
        widthBefore: b.width,
        widthAfter: a.width,
        heightBefore: b.height,
        heightAfter: a.height,
      });
    }
  }

  return issues;
}

async function run() {
  const report = {
    baseUrl: BASE_URL,
    screenshotsDir: outDir,
    checks: [],
    errors: [],
  };

  const server = spawn('npm', ['run', 'start', '--', '-p', '3000'], {
    shell: true,
    stdio: 'ignore',
  });

  await sleep(10000);

  const browser = await chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const desktopPage = await desktopContext.newPage();

    const desktopErrors = [];
    desktopPage.on('pageerror', (err) => desktopErrors.push(`pageerror: ${err.message}`));
    desktopPage.on('console', (msg) => {
      if (msg.type() === 'error') desktopErrors.push(`console: ${msg.text()}`);
    });

    await desktopPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await desktopPage.screenshot({ path: path.join(outDir, 'desktop-home-initial.png'), fullPage: true });

    const desktopNavBefore = await collectNavMetrics(desktopPage, '.nav-desktop .nav-link');
    await desktopPage.reload({ waitUntil: 'networkidle' });
    await desktopPage.screenshot({ path: path.join(outDir, 'desktop-home-reload.png'), fullPage: true });
    const desktopNavAfter = await collectNavMetrics(desktopPage, '.nav-desktop .nav-link');

    const desktopNavIssues = compareMetrics(desktopNavBefore, desktopNavAfter);
    report.checks.push({
      name: 'desktop-nav-metrics-stable-after-reload',
      passed: desktopNavIssues.length === 0,
      details: desktopNavIssues,
    });

    await desktopPage.goto(`${BASE_URL}/servicos`, { waitUntil: 'networkidle' });
    await desktopPage.screenshot({ path: path.join(outDir, 'desktop-servicos.png'), fullPage: true });

    await desktopPage.goto(`${BASE_URL}/imoveis`, { waitUntil: 'networkidle' });
    await desktopPage.screenshot({ path: path.join(outDir, 'desktop-imoveis.png'), fullPage: true });

    report.checks.push({
      name: 'desktop-console-and-page-errors',
      passed: desktopErrors.length === 0,
      details: desktopErrors,
    });

    await desktopContext.close();

    const mobileDevice = devices['iPhone 12'];
    const mobileContext = await browser.newContext({ ...mobileDevice });
    const mobilePage = await mobileContext.newPage();

    const mobileErrors = [];
    mobilePage.on('pageerror', (err) => mobileErrors.push(`pageerror: ${err.message}`));
    mobilePage.on('console', (msg) => {
      if (msg.type() === 'error') mobileErrors.push(`console: ${msg.text()}`);
    });

    await mobilePage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await mobilePage.screenshot({ path: path.join(outDir, 'mobile-home-initial.png'), fullPage: true });

    const mobileNavBefore = await collectNavMetrics(mobilePage, '.nav-link-mobile');
    await mobilePage.reload({ waitUntil: 'networkidle' });
    await mobilePage.screenshot({ path: path.join(outDir, 'mobile-home-reload.png'), fullPage: true });

    await mobilePage.click('.menu-toggle');
    await mobilePage.waitForSelector('.nav-mobile.open', { state: 'visible' });
    await mobilePage.screenshot({ path: path.join(outDir, 'mobile-menu-open.png'), fullPage: true });

    const mobileMenuTexts = await mobilePage.$$eval('.nav-link-mobile', (els) =>
      els.map((el) => (el.textContent || '').trim())
    );
    const hasContatoInMobileMenu = mobileMenuTexts.some((text) => text.toLowerCase().includes('contato'));

    const mobileNavAfter = await collectNavMetrics(mobilePage, '.nav-link-mobile');
    const mobileNavIssues = compareMetrics(mobileNavBefore, mobileNavAfter);

    report.checks.push({
      name: 'mobile-nav-metrics-stable-after-reload',
      passed: mobileNavIssues.length === 0,
      details: mobileNavIssues,
    });
    report.checks.push({
      name: 'mobile-menu-without-contato-link',
      passed: !hasContatoInMobileMenu,
      details: mobileMenuTexts,
    });
    report.checks.push({
      name: 'mobile-console-and-page-errors',
      passed: mobileErrors.length === 0,
      details: mobileErrors,
    });

    await mobileContext.close();
  } catch (error) {
    report.errors.push(error.message);
  } finally {
    await browser.close();
    try {
      server.kill('SIGTERM');
    } catch {}
    await sleep(1000);
    try {
      server.kill('SIGKILL');
    } catch {}
  }

  const passedChecks = report.checks.filter((c) => c.passed).length;
  const totalChecks = report.checks.length;
  report.summary = `${passedChecks}/${totalChecks} checks passed`;

  const reportPath = path.join(outDir, 'report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`Visual E2E report saved at: ${reportPath}`);
  console.log(`Screenshots saved at: ${outDir}`);
  console.log(`Summary: ${report.summary}`);

  if (report.errors.length > 0) {
    console.log('Run errors:');
    for (const err of report.errors) console.log(`- ${err}`);
    process.exitCode = 1;
    return;
  }

  for (const check of report.checks) {
    console.log(`[${check.passed ? 'PASS' : 'FAIL'}] ${check.name}`);
    if (!check.passed && Array.isArray(check.details)) {
      for (const detail of check.details.slice(0, 5)) {
        console.log(`  ${JSON.stringify(detail)}`);
      }
    }
  }

  if (passedChecks !== totalChecks) {
    process.exitCode = 1;
  }
}

run();
