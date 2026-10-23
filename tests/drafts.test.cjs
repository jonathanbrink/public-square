const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDraftStore, KEY } = require('../drafts.js');
const draft = id => ({ version: 1, id, title: '', description: '', topic: '', scope: '', state: '', city: '', zip: '', createdAt: '2026-10-23T00:00:00.000Z', updatedAt: '2026-10-23T00:00:00.000Z' });
function memory(initial = {}) {
  const data = new Map(Object.entries(initial));
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}
test('incomplete drafts persist, reopen, update, and delete without touching priorities', () => {
  const storage = memory({ 'public-square-priorities-v1': '["concern-1"]' });
  const store = createDraftStore(storage);
  assert.equal(store.save(draft('one')).persistent, true);
  const reopened = createDraftStore(storage);
  assert.equal(reopened.drafts[0].id, 'one');
  reopened.save({ ...reopened.drafts[0], title: 'Changed title' });
  assert.equal(createDraftStore(storage).drafts[0].title, 'Changed title');
  reopened.remove('one');
  assert.deepEqual(createDraftStore(storage).drafts, []);
  assert.equal(storage.getItem('public-square-priorities-v1'), '["concern-1"]');
});
test('bad stored records remain untouched while new work is kept in memory', () => {
  for (const raw of ['{broken', '{}', '[{"version":2}]', JSON.stringify([draft('x'), draft('x')])]) {
    const storage = memory({ [KEY]: raw });
    const store = createDraftStore(storage);
    assert.equal(store.persistent, false);
    assert.equal(store.save(draft('new')).persistent, false);
    assert.equal(storage.getItem(KEY), raw);
    assert.equal(store.drafts[0].id, 'new');
  }
});
test('quota failure preserves current work and can recover on a later save', () => {
  const storage = memory(); const write = storage.setItem;
  storage.setItem = () => { throw Error('quota'); };
  const store = createDraftStore(storage);
  assert.equal(store.save(draft('one')).persistent, false);
  assert.equal(store.drafts.length, 1);
  storage.setItem = write;
  assert.equal(store.save({ ...draft('one'), title: 'Recovered' }).persistent, true);
  assert.equal(createDraftStore(storage).drafts[0].title, 'Recovered');
});
test('stale tabs cannot silently overwrite another tab’s drafts', () => {
  const storage = memory(); const first = createDraftStore(storage), second = createDraftStore(storage);
  first.save(draft('first'));
  assert.equal(second.save(draft('second')).conflict, true);
  second.reload(); second.save(draft('second'));
  assert.equal(createDraftStore(storage).drafts.length, 2);
});
test('invalid input cannot be saved and callers cannot mutate stored records', () => {
  const store = createDraftStore(memory());
  assert.equal(store.save({ ...draft('bad'), description: 42 }).invalid, true);
  store.save(draft('one'));
  const copy = store.drafts; copy[0].title = 'Unexpected edit';
  assert.equal(store.drafts[0].title, '');
});
