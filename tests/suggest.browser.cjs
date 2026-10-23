const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  try {
    await page.goto(base + '/suggest.html');
    await page.getByRole('button', { name: 'Preview concern', exact: false }).click();
    assert.equal(await page.locator('#title').getAttribute('aria-invalid'), 'true');
    assert.equal(await page.locator('#title').evaluate(el => el === document.activeElement), true);
    await page.locator('#title').fill('A first thought');
    await page.locator('#save').click();
    assert.match(await page.locator('#status').innerText(), /saved in this browser/);
    await page.reload();
    await page.getByRole('button', { name: 'Open draft: A first thought', exact: true }).click();
    assert.equal(await page.locator('#title').inputValue(), 'A first thought');
    await page.locator('#title').fill('Safer streets for walking and biking');
    await page.locator('#description').fill('Our neighbors need safer crossings near school so children can walk and bike safely.');
    await page.locator('#topic').selectOption('Transportation');
    await page.locator('#scope').selectOption('city');
    await page.locator('#state').selectOption('Oregon');
    await page.locator('#city').fill('Portland');
    assert.match(await page.locator('#similar-list').innerText(), /Safer streets/);
    const match = page.locator('#similar-list a').first();
    assert.equal(await match.getAttribute('target'), '_blank');
    const detail = await context.newPage();
    await detail.goto(base + '/' + await match.getAttribute('href'));
    assert.match(await detail.locator('h1').innerText(), /Safer streets for walking and biking/);
    await detail.close();
    await page.getByRole('button', { name: 'Preview concern', exact: false }).click();
    assert.equal(await page.locator('#preview').evaluate(el => el.open), true);
    assert.match(await page.locator('#preview-meta').innerText(), /Portland, Oregon/);
    await page.locator('#save-preview').click();
    assert.equal(await page.locator('#preview').evaluate(el => el.open), false);
    const priorityKey = await page.evaluate(() => localStorage.getItem('public-square-priorities-v1'));
    assert.equal(priorityKey, null);
    await page.locator('#description').fill('<img src=x onerror="window.injected=true"> This is authored text that must never become markup.');
    await page.getByRole('button', { name: 'Preview concern', exact: false }).click();
    assert.equal(await page.locator('#preview-description img').count(), 0);
    assert.equal(await page.evaluate(() => window.injected), undefined);
    await page.keyboard.press('Escape');
    await page.locator('#scope').selectOption('zip'); await page.locator('#zip').fill('123');
    await page.getByRole('button', { name: 'Preview concern', exact: false }).click();
    assert.equal(await page.locator('#zip').getAttribute('aria-invalid'), 'true');
    await page.locator('#zip').fill('97211'); await page.locator('#save').click();

    // Editing the same draft in two tabs must preserve both versions on request.
    const other = await context.newPage(); other.on('dialog', dialog => dialog.accept());
    await other.goto(base + '/suggest.html'); await other.getByRole('button', { name: /^Open draft:/ }).click();
    await page.locator('#title').fill('My unsaved local version');
    await other.locator('#title').fill('A version from another tab'); await other.locator('#save').click();
    await page.locator('#conflict').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#title').inputValue(), 'My unsaved local version');
    await page.locator('#copy-draft').click();
    assert.equal(await page.locator('.draft-card').count(), 2);
    await other.close();

    // Small screens and enlarged text must not introduce horizontal scrolling.
    await page.setViewportSize({ width: 375, height: 812 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.addStyleTag({ content: 'body {font-size:200%} input,textarea,select,button {font-size:inherit}' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('#save').click();
    await page.getByRole('button', { name: 'Delete draft: My unsaved local version', exact: true }).click();
    assert.equal(await page.locator('.draft-card').count(), 1);

    // Existing pages retain their data, filters, and personal-priority behavior.
    for (const file of ['index.html', 'v1.html']) {
      await page.goto(base + '/' + file);
      assert.equal(await page.locator('#concerns .concern').count(), 8);
      assert.ok(await page.locator('a[href="suggest.html"]').count());
      await page.locator('[data-priority="concern-1"]').click();
      assert.equal(await page.locator('[data-priority="concern-1"]').getAttribute('aria-pressed'), 'true');
      await page.locator('[data-priority="concern-1"]').click();
    }
    await page.goto(base + '/results.html?level=city&state=Oregon&city=Portland');
    assert.equal(await page.locator('#concerns .concern').count(), 2);
    await page.goto(base + '/map.html'); assert.ok(await page.locator('[data-state]').count() >= 50);
    // Prevent future drift between the new matching catalog and existing sample priorities.
    const sandbox = { window: {} }; vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../concerns.js'), 'utf8'), sandbox);
    const original = JSON.parse(fs.readFileSync(path.join(__dirname, '../priorities.js'), 'utf8').match(/const priorityCatalog=(\[.*?\]);/)[1]);
    assert.equal(JSON.stringify(sandbox.window.publicSquareConcerns), JSON.stringify(original));

    // Storage disabled and malformed records must be honest and non-destructive.
    const failed = await browser.newContext();
    await failed.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Storage blocked'); }; });
    const failurePage = await failed.newPage(); await failurePage.goto(base + '/suggest.html');
    await failurePage.locator('#title').fill('Work worth keeping'); await failurePage.locator('#save').click();
    assert.match(await failurePage.locator('#status').innerText(), /page only/);
    assert.equal(await failurePage.locator('#save-state').innerText(), 'On this page only');
    await failed.close();
    const corrupt = await browser.newContext(); const corruptPage = await corrupt.newPage();
    await corruptPage.goto(base + '/suggest.html');
    await corruptPage.evaluate(() => localStorage.setItem('public-square-drafts-v1', '{broken'));
    await corruptPage.reload(); await corruptPage.locator('#save').click();
    assert.equal(await corruptPage.evaluate(() => localStorage.getItem('public-square-drafts-v1')), '{broken');
    assert.match(await corruptPage.locator('#status').innerText(), /not be overwritten/);
    await corrupt.close();
    assert.deepEqual(errors, []);
    console.log('PASS: draft lifecycle, preview, validation, safe text, matching, cross-tab conflicts, storage failures, mobile/text sizing, catalog consistency, and existing-page regressions.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
