/* Private browser drafts. This store never writes to the public concern catalog or priorities. */
(function (root) {
  'use strict';
  const KEY = 'public-square-drafts-v1';
  const fields = ['title', 'description', 'topic', 'scope', 'state', 'city', 'zip'];
  function validRecord(draft) {
    return draft && draft.version === 1 && typeof draft.id === 'string' && draft.id.length > 0 &&
      fields.every(field => typeof draft[field] === 'string') &&
      draft.title.length <= 120 && draft.description.length <= 2000 && draft.city.length <= 100 &&
      draft.topic.length <= 100 && draft.state.length <= 100 && draft.scope.length <= 20 && draft.zip.length <= 5 &&
      typeof draft.createdAt === 'string' && Number.isFinite(Date.parse(draft.createdAt)) &&
      typeof draft.updatedAt === 'string' && Number.isFinite(Date.parse(draft.updatedAt));
  }
  function createDraftStore(storage) {
    let drafts = [], persistent = true, blocked = false, problem = '', baseline = null;
    function read() {
      try {
        const raw = storage.getItem(KEY);
        const parsed = JSON.parse(raw || '[]');
        if (!Array.isArray(parsed) || !parsed.every(validRecord) || new Set(parsed.map(d => d.id)).size !== parsed.length) throw new Error('Invalid draft records');
        drafts = parsed;
        baseline = raw;
        persistent = true;
        blocked = false;
        problem = '';
      } catch (error) {
        persistent = false;
        // Preserve unreadable data: no subsequent save may overwrite it.
        blocked = true;
        problem = 'Saved drafts could not be read. Existing browser data will not be overwritten. New work stays on this page only.';
      }
    }
    function write(next) {
      if (blocked) { drafts = next; return { ok: true, persistent: false }; }
      try {
        if (storage.getItem(KEY) !== baseline) return { ok: false, conflict: true };
        const raw = JSON.stringify(next);
        storage.setItem(KEY, raw);
        baseline = raw;
        drafts = next;
        persistent = true;
        problem = '';
        return { ok: true, persistent: true };
      } catch {
        drafts = next;
        persistent = false;
        problem = 'Browser storage is unavailable or full. Drafts stay on this page only and will be lost when it closes.';
        return { ok: true, persistent: false };
      }
    }
    read();
    return {
      get drafts() { return drafts.map(d => ({ ...d })); },
      get persistent() { return persistent; },
      get problem() { return problem; },
      reload: read,
      save(draft) {
        if (!validRecord(draft)) return { ok: false, invalid: true };
        return write([...drafts.filter(d => d.id !== draft.id), { ...draft }]);
      },
      remove(id) { return write(drafts.filter(d => d.id !== id)); }
    };
  }
  root.PublicSquareDrafts = { KEY, createDraftStore };
  if (typeof module !== 'undefined') module.exports = root.PublicSquareDrafts;
})(typeof window !== 'undefined' ? window : globalThis);
