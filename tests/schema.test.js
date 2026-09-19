'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { SCHEMA_VERSION, LS, LS_PREV, migrateStatePure, migrateStateFromPure, detectVersion } = require('../lib/schema');

test('текущая схема v2 и новый ключ', () => {
  assert.equal(SCHEMA_VERSION, 2);
  assert.equal(LS, 'talapSurveyV2');
  assert.ok(LS_PREV.includes('talapSurveyV1'));
});

test('миграция v1: чинит chosenUnis, plan и cal', () => {
  const s = migrateStatePure({ chosenUni: { name: 'MIT' }, plan: { steps: [], v: 1 }, planChecks: null });
  assert.deepEqual(s.chosenUnis, [{ name: 'MIT' }]);
  assert.equal(s.plan, null);
  assert.deepEqual(s.cal, { level: 'years', y: null, m: null });
});

test('миграция v1 -> v2 добавляет collapsed и dayGoals', () => {
  const s = migrateStateFromPure({ plan: { v: 2, monthPlans: { '2026-0': [] } } }, 1);
  assert.deepEqual(s.collapsed, {});
  assert.deepEqual(s.plan.dayGoals, {});
  assert.deepEqual(s.plan.dayChecks, {});
});

test('detectVersion различает документы', () => {
  assert.equal(detectVersion({ v: 2 }), 2);
  assert.equal(detectVersion({ state: {} }), 1);
  assert.equal(detectVersion(null), 0);
});
