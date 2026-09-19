'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PROFILE_BUDGETS, clipText, compactProfileTextPure } = require('../lib/profile');

function bigState() {
  return {
    name: 'Айгерим', age: '16', grade: '11 класс', admitYear: '2027',
    studyCountry: 'abroad', studyCountryWhich: 'США', grant: 'only', relocate: 'yes',
    professionText: '', dreamJob: 'AI-инженер',
    considerJobs: ['Разработчик', 'AI / Data-специалист', 'Учёный'],
    interests: ['💻 Компьютеры и технологии', '🤖 Искусственный интеллект и роботы'],
    sittest: { 0: 'tech', 1: 'tech', 2: 'sci' },
    skills: ['Программирование', 'Анализ данных'], skillLevel: { 'Программирование': 'mid' },
    progLangs: ['Python', 'JavaScript'], progExp: '2',
    subj: {
      'Математика': { grade: '5', like: 5, ease: 4, deep: 'yes' },
      'История': { grade: '4', like: 2, ease: 3, deep: 'no' }
    },
    langs: ['Английский', 'Казахский'], langLevel: { 'Английский': 'b2' },
    career: { kz: 'yes', abroad: 'yes', business: 'no', science: 'yes' },
    myAwards: [
      { sphere: 'IT и хакатоны', title: 'Хакатон Astana Hub — финал с приложением для школы', result: '2 место' },
      { sphere: 'Олимпиады', title: 'Областная олимпиада по информатике', result: '1 место' },
      { sphere: 'Наука', title: 'Конкурс научных проектов', result: 'финалист' },
      { sphere: 'Спорт', title: 'Городской забег', result: 'участник' }
    ],
    achDetail: 'x'.repeat(500),
    freeText: 'y'.repeat(600),
    hobbies: ['Спорт', 'Чтение книг', 'Видеоигры']
  };
}

test('бюджет соблюдается для всех режимов', () => {
  const S = bigState();
  for (const key of Object.keys(PROFILE_BUDGETS)) {
    const out = compactProfileTextPure(S, ['IT 90%'], PROFILE_BUDGETS[key]);
    assert.ok(out.length <= PROFILE_BUDGETS[key], key + ': ' + out.length);
  }
});

test('приоритеты: цель, грант и скоринг всегда внутри', () => {
  const out = compactProfileTextPure(bigState(), ['IT 90%'], 4000);
  assert.ok(out.includes('США'));
  assert.ok(out.includes('only'));
  assert.ok(out.includes('Тесты:'));
  assert.ok(out.includes('Математика'));
  assert.ok(!out.includes('История'), 'незначимые предметы вырезаются');
});

test('награды режутся до 3, длинные тексты клиппуются', () => {
  const out = compactProfileTextPure(bigState(), [], 4000);
  assert.ok(out.includes('Хакатон'));
  assert.ok(!out.includes('Городской забег'), '4-я награда не влезает');
  assert.ok(out.length <= 4000);
  assert.equal(clipText('abcdef', 5), 'abcd…');
  assert.equal(clipText('abc', 5), 'abc');
});
