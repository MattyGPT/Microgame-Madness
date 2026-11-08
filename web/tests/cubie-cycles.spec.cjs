const { test, expect } = require('@playwright/test');
const Customs = require('../customs.js');
const path = require('node:path');

async function show(page, id) {
  const item = Customs.catalog.find(item => item.id === id);
  await page.setContent(`<div style="padding:100px;width:400px;height:400px">${Customs.svg(item)}</div>`);
  await page.addStyleTag({ path: path.resolve(__dirname, '../style.css') });
}
async function seek(page, time) {
  await page.evaluate(time => {
    for (const animation of document.getAnimations()) {
      animation.pause();
      animation.currentTime = time;
    }
  }, time);
}
async function style(page, selector, property) {
  return page.locator(selector).evaluate((element, property) => getComputedStyle(element)[property], property);
}

test('hourglass transfers for thirty seconds and flips the attached face', async ({ page }) => {
  await show(page, 'shop_hourglass');
  await expect(page.locator('.hourglass-turn .cubie-eyes')).toHaveCount(1);
  await expect(page.locator('.hourglass-turn .cubie-smile')).toHaveCount(1);
  await seek(page, 0);
  expect(await style(page, '.hourglass-sand-top', 'transform')).toBe('matrix(1, 0, 0, 1, 0, 0)');
  await seek(page, 15000);
  const middle = await style(page, '.hourglass-sand-top', 'transform');
  expect(middle).toBe('matrix(1, 0, 0, 1, 0, 17)');
  await seek(page, 30000);
  expect(await page.locator('.hourglass-turn').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).b)).toBeCloseTo(0, 4);
  expect(await style(page, '.hourglass-sand-top', 'transform')).toBe('matrix(1, 0, 0, 1, 0, 34)');
  await seek(page, 31000);
  expect(await style(page, '.hourglass-turn', 'transform')).toBe('matrix(-1, 0, 0, -1, 0, 0)');
  await seek(page, 61000);
  expect(await style(page, '.hourglass-sand-top', 'transform')).toBe('matrix(1, 0, 0, 1, 0, 0)');
  await seek(page, 62000);
  expect(await page.locator('.hourglass-turn').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).b)).toBeCloseTo(0, 4);
});

test('camera flashes then prints a photo every eight seconds', async ({ page }, testInfo) => {
  await show(page, 'shop_camera');
  await seek(page, 0);
  expect(await style(page, '.camera-flash', 'opacity')).toBe('1');
  expect(await style(page, '.camera-photo', 'opacity')).toBe('0');
  await seek(page, 3000);
  expect(await style(page, '.camera-flash', 'opacity')).toBe('0');
  expect(await style(page, '.camera-photo', 'transform')).toBe('matrix(1, 0, 0, 1, 0, 0)');
  await page.screenshot({path:testInfo.outputPath('printed-photo.png')});
  await seek(page, 8000);
  expect(await style(page, '.camera-flash', 'opacity')).toBe('1');
  expect(await style(page, '.camera-photo', 'opacity')).toBe('0');
});
