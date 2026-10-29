'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:4173/practice.html');
    await page.selectOption('#mode', 'common');
    await page.click('#start');
    await page.waitForSelector('#pdfExportControls:not(.hidden)');
    const openExport = async (button) => {
      const pending = page.waitForEvent('popup');
      await page.click(button);
      const popup = await pending;
      await popup.waitForLoadState('domcontentloaded');
      return popup;
    };
    let popup = await openExport('#pdfQuestions');
    let text = await popup.locator('body').innerText();
    assert.match(text, /問題/);
    assert.doesNotMatch(text, /正解：|解答・解説/);
    await popup.close();
    popup = await openExport('#pdfAnswers');
    text = await popup.locator('body').innerText();
    assert.match(text, /正解：/);
    assert.match(text, /解説：/);
    await popup.close();
    popup = await openExport('#pdfCombined');
    text = await popup.locator('body').innerText();
    assert.match(text, /問題/);
    assert.match(text, /解答・解説/);
    assert.match(text, /正解：/);
    await popup.close();
    console.log('PASS PDF export modes');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
