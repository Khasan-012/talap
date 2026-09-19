'use strict';
// Контракты: фронт действительно использует новые механизмы,
// а lib-зеркала не разъехались с браузерным кодом.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('index.html slim: стили и скрипты вынесены в модули', () => {
  const html = read('index.html');
  assert.ok(!html.includes('<style>'), 'без инлайн-стилей');
  assert.ok(html.includes('css/styles.css'));
  for (const f of ['js/config.js', 'js/ai-tier.js', 'js/unis-photos.js', 'js/plan.js', 'js/boot.js']) {
    assert.ok(html.includes(f), 'подключён ' + f);
  }
});

test('все промпты идут через compactProfileText с бюджетом', () => {
  const ai = read('js/ai-tier.js');
  assert.ok(ai.includes('compactProfileText(PROFILE_BUDGETS.tier)'));
  assert.ok(ai.includes('compactProfileText(PROFILE_BUDGETS.detail)'));
  assert.ok(read('js/plan.js').includes('compactProfileText(PROFILE_BUDGETS.plan)'));
  const awards = read('js/awards.js');
  assert.ok(awards.includes('compactProfileText(PROFILE_BUDGETS.assess)'));
  assert.ok(awards.includes('compactProfileText(PROFILE_BUDGETS.contests)'));
});

test('сырой profileText() больше не склеивается в промпты', () => {
  for (const f of ['js/ai-tier.js', 'js/plan.js', 'js/awards.js']) {
    const t = read(f);
    // допустимы: определение function profileText(, упоминания compactProfileText и комментарии
    const raws = (t.match(/(?<![A-Za-z])profileText\(\)/g) || []).length;
    const defs = (t.match(/function profileText\(\)/g) || []).length;
    assert.ok(raws - defs <= 1, f + ': raw calls leaking into prompts');
  }
});

test('версия схемы совпадает в lib и фронте', () => {
  const cfg = read('js/config.js');
  const lib = read('lib/schema.js');
  assert.ok(cfg.includes('SCHEMA_VERSION = 2'));
  assert.ok(lib.includes('SCHEMA_VERSION = 2'));
  assert.ok(cfg.includes('talapSurveyV2'));
});

test('фото: wiki-резолвер и инициалы подключены к рендеру', () => {
  const photos = read('js/unis-photos.js');
  assert.ok(photos.includes('resolveUniPhoto'));
  assert.ok(photos.includes('initialsFor'));
  assert.ok(photos.includes('upgradeUniPhotos'));
  assert.ok(read('js/plan.js').includes('upgradeUniPhotos(box)'));
  assert.ok(read('js/ai-tier.js').includes('upgradeUniPhotos(body)'));
});

test('fallbackTier держит 20 вузов (5/9/6)', () => {
  const plan = read('js/plan.js');
  const body = plan.slice(plan.indexOf('function fallbackTier'));
  const dreams = (body.match(/tier:'DREAM'/g) || []).length;
  const targets = (body.match(/tier:'TARGET'/g) || []).length;
  const safeties = (body.match(/tier:'SAFETY'/g) || []).length;
  assert.equal(dreams, 5);
  assert.equal(targets, 9);
  assert.equal(safeties, 6);
});
