const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  try {
    const response = await page.goto('http://127.0.0.1:4173/index.html', { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200, 'main page should load');
    await page.locator('#tracks .track').first().waitFor();
    assert.equal(await page.locator('#tracks .track').count(), 6, 'six subject tracks should render');

    await page.locator('#tracks [data-track="geo"]').click();
    await page.locator('#workspace:not(.hide)').waitFor();
    assert.match(await page.locator('#trackTag').innerText(), /地理/);

    await page.locator('#menu [data-mode="people"]').click();
    await page.locator('#stage:not(.hide) article.entry').first().waitFor();
    assert.ok(await page.locator('#stage article.entry').count() > 0, 'people entries should render');

    await page.locator('#categorySearch').fill('サヘル');
    assert.ok(await page.locator('#stage article.entry:visible').count() > 0, 'category search should find サヘル');
    await page.locator('#clearCategoryFilter').click();
    assert.ok(await page.locator('#stage article.entry:visible').count() > 1, 'clear filter should restore entries');

    await page.locator('#menuBack').click();
    await page.locator('#menu [data-mode="timeline"]').click();
    assert.ok(await page.locator('#stage article.event').count() > 0, 'timeline events should render');
    await page.locator('#menuBack').click();
    await page.locator('#backHome').click();
    await page.locator('#home').waitFor();

    await page.locator('#subject-wide-search summary').click();
    await page.locator('#sws-query').fill('サヘル');
    await page.locator('#sws-results .sws-result').first().waitFor();
    assert.ok(await page.locator('#sws-results .sws-result').count() > 0, 'global search should return results');
    await page.locator('#sws-reset').click();
    assert.equal((await page.locator('#sws-query').inputValue()), '', 'global search reset should clear query');

    assert.deepEqual(pageErrors, [], 'page should have no uncaught JavaScript errors');
    console.log('Browser smoke test passed: page load, 6 tracks, people list, category filter/reset, timeline, navigation, global search/reset; no uncaught page errors.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
