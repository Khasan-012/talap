'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { TIER_SPEC, normTier, dedupeTierList, validateTierList } = require('../lib/tiers');

test('normTier понимает RU/EN и однобуквенные тиры', () => {
  assert.equal(normTier('DREAM'), 'DREAM');
  assert.equal(normTier('мечта'), 'DREAM');
  assert.equal(normTier('S'), 'DREAM');
  assert.equal(normTier('target'), 'TARGET');
  assert.equal(normTier('целевые'), 'TARGET');
  assert.equal(normTier('A'), 'TARGET');
  assert.equal(normTier('safety'), 'SAFETY');
  assert.equal(normTier('страховочные'), 'SAFETY');
  assert.equal(normTier('???'), 'SAFETY');
});

test('спецификация тирлиста: 20 = 5 + 9 + 6', () => {
  assert.equal(TIER_SPEC.total, 20);
  assert.equal(TIER_SPEC.DREAM + TIER_SPEC.TARGET + TIER_SPEC.SAFETY, 20);
});

function makeList() {
  const mk = (tier, n, prefix) => Array.from({ length: n }, (_, i) => ({
    tier, name: prefix + ' ' + (i + 1), place: 'City', match: 80, reason: 'ok'
  }));
  return [...mk('DREAM', 5, 'Dream'), ...mk('TARGET', 9, 'Target'), ...mk('SAFETY', 6, 'Safety')];
}

test('валидный тирлист проходит проверку', () => {
  const v = validateTierList(makeList());
  assert.equal(v.ok, true);
  assert.deepEqual(v.counts, { DREAM: 5, TARGET: 9, SAFETY: 6 });
});

test('неверные количества и дубли отклоняются', () => {
  const bad = makeList().slice(0, 19);
  assert.equal(validateTierList(bad).ok, false);
  const dup = makeList();
  dup[1] = { ...dup[0] };
  const v = validateTierList(dup);
  assert.equal(v.ok, false);
  assert.ok(v.errors.some((e) => /duplicate/i.test(e)));
});

test('dedupe убирает повторы без учёта регистра', () => {
  const out = dedupeTierList([{ name: 'MIT' }, { name: 'mit' }, { name: 'Stanford' }, { name: '—' }]);
  assert.deepEqual(out.map((u) => u.name), ['MIT', 'Stanford']);
});
