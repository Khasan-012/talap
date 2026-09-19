'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initialsFor, hueFor, wikiTitlesFor, wikiApiURL, curatedMatch } = require('../lib/photos');

test('инициалы из 1-2 слов, фолбэк — шапка', () => {
  assert.equal(initialsFor('Massachusetts Institute of Technology'), 'MI');
  assert.equal(initialsFor('НУ'), 'Н');
  assert.equal(initialsFor(''), '🎓');
});

test('hue стабилен и в диапазоне', () => {
  const h = hueFor('MIT');
  assert.ok(h >= 0 && h < 360);
  assert.equal(hueFor('MIT'), h);
});

test('wiki-заголовки и URL корректны', () => {
  assert.deepEqual(wikiTitlesFor(''), []);
  assert.deepEqual(wikiTitlesFor('MIT'), ['MIT', 'MIT University']);
  assert.deepEqual(wikiTitlesFor('Harvard University'), ['Harvard University']);
  const url = wikiApiURL('KAIST');
  assert.ok(url.includes('wikipedia.org'));
  assert.ok(url.includes('KAIST'));
});

test('curatedMatch находит по подстроке без регистра', () => {
  const entries = [{ k: ['mit'], u: 'u1' }, { k: ['назарбаев'], u: 'u2' }];
  assert.equal(curatedMatch('MIT University', entries), 'u1');
  assert.equal(curatedMatch('Назарбаев Университет', entries), 'u2');
  assert.equal(curatedMatch('Unknown College', entries), '');
});
