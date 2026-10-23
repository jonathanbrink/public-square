(function () {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const fields = ['title', 'description', 'topic', 'scope', 'state', 'city', 'zip'];
  const states = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','District of Columbia','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
  states.forEach(state => $('#state').add(new Option(state, state)));
  let storage;
  try { storage = window.localStorage; } catch { storage = { getItem() { throw Error('Unavailable'); } }; }
  const store = PublicSquareDrafts.createDraftStore(storage);
  const catalog = window.publicSquareConcerns || [];
  let current = null, dirty = false, conflict = false, remoteChange = false, validated = false;
  const announce = message => { $('#status').textContent = message; };
  function values() {
    const data = Object.fromEntries(fields.map(field => [field, $('#' + field).value.trim()]));
    if (!['state', 'city'].includes(data.scope)) data.state = '';
    if (data.scope !== 'city') data.city = '';
    if (data.scope !== 'zip') data.zip = '';
    return data;
  }
  function area(d) {
    return d.scope === 'national' ? 'United States' : d.scope === 'state' ? d.state : d.scope === 'city' ? [d.city, d.state].filter(Boolean).join(', ') : d.scope === 'zip' && d.zip ? 'ZIP ' + d.zip : 'Location unfinished';
  }
  function setConflict(value) { conflict = value; $('#conflict').hidden = !value; }
  function locationFields() {
    const scope = $('#scope').value;
    for (const field of ['state', 'city', 'zip']) {
      const visible = field === 'state' ? ['state', 'city'].includes(scope) : scope === field;
      $('#' + field + '-field').hidden = !visible;
      $('#' + field).disabled = !visible;
      $('#' + field).required = visible;
    }
  }
  function validate(focus = false) {
    const d = values(), errors = {};
    if (d.title.length < 10) errors.title = 'Use at least 10 characters to describe the concern.';
    if (d.description.length < 30) errors.description = 'Add at least 30 characters about what is happening.';
    if (!d.topic) errors.topic = 'Choose a topic, or Other / unsure.';
    if (!d.scope) errors.scope = 'Choose the area affected.';
    if (['state', 'city'].includes(d.scope) && !d.state) errors.state = 'Choose a state or district.';
    if (d.scope === 'city' && !d.city) errors.city = 'Enter the city affected.';
    if (d.scope === 'zip' && !/^\d{5}$/.test(d.zip)) errors.zip = 'Enter a five-digit ZIP code.';
    fields.forEach(field => {
      $('#' + field + '-error').textContent = errors[field] || '';
      $('#' + field).setAttribute('aria-invalid', String(Boolean(errors[field])));
    });
    if (focus && Object.keys(errors).length) $('#' + Object.keys(errors)[0]).focus();
    return Object.keys(errors).length === 0;
  }
  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  const stopwords = new Set(['that','this','with','from','have','more','here','their','they','about','concern','people','community','making','everyone','should']);
  const words = text => new Set(text.toLowerCase().match(/[a-z]{4,}/g)?.filter(word => !stopwords.has(word)) || []);
  function renderMatches() {
    const d = values(), tokens = words(d.title + ' ' + d.description), list = $('#similar-list');
    list.replaceChildren();
    if (!tokens.size && !d.topic) { list.append(el('p', 'Start with a title or topic to see possible matches.', 'hint')); return; }
    const matches = catalog.map(c => {
      const candidate = words(c.title + ' ' + c.description);
      const overlap = [...tokens].filter(word => candidate.has(word)).length;
      const topic = d.topic === c.topic;
      const local = d.scope === 'city' ? d.city.toLowerCase() === c.city.toLowerCase() && d.state === c.state : d.scope === 'state' ? d.state === c.state : d.scope === 'zip' ? d.zip === c.zip : false;
      return { c, score: overlap * 3 + Number(topic) * 2 + Number(local), reason: [overlap ? 'Shared words' : '', topic ? 'same topic' : '', local ? 'same area' : ''].filter(Boolean).join(' · ') };
    }).filter(m => m.score >= 2).sort((a, b) => b.score - a.score).slice(0, 3);
    if (!matches.length) list.append(el('p', 'No close matches in this sample catalog. You can keep drafting.', 'hint'));
    matches.forEach(({ c, reason }) => {
      const article = el('article', undefined, 'match');
      article.append(el('h3', c.title), el('p', reason + ' · ' + c.city + ', ' + c.state));
      const link = el('a', 'View concern ↗');
      link.href = 'concern.html?' + new URLSearchParams({ id: c.id, back: 'results.html?' + new URLSearchParams({ q: c.title }) });
      link.target = '_blank'; link.rel = 'noopener';
      link.setAttribute('aria-label', 'View concern: ' + c.title + ' (opens in a new tab)');
      article.append(link); list.append(article);
    });
  }
  function renderDrafts() {
    const list = $('#draft-list'); list.replaceChildren();
    const drafts = store.drafts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (!drafts.length) list.append(el('p', 'No drafts yet. Save your first thought, even if it’s unfinished.', 'hint'));
    drafts.forEach(d => {
      const article = el('article', undefined, 'draft-card' + (d.id === current?.id ? ' active' : ''));
      article.append(el('h3', d.title || 'Untitled concern'), el('p', area(d) + ' · ' + new Date(d.updatedAt).toLocaleDateString()));
      const actions = el('div', undefined, 'actions');
      const open = el('button', 'Open draft'); open.type = 'button'; open.setAttribute('aria-label', 'Open draft: ' + (d.title || 'Untitled concern'));
      open.addEventListener('click', () => { if (mayLeave()) load(d); });
      const remove = el('button', 'Delete'); remove.type = 'button'; remove.setAttribute('aria-label', 'Delete draft: ' + (d.title || 'Untitled concern'));
      remove.addEventListener('click', () => {
        if (!confirm('Delete this private draft? This cannot be undone.')) return;
        if (remoteChange) { announce('Drafts changed in another tab. Reload or save a separate copy before deleting.'); return; }
        const result = store.remove(d.id);
        if (!result.ok) { remoteChange = true; setConflict(true); announce('Drafts changed in another tab. Reload before deleting.'); return; }
        if (current?.id === d.id) load(null); else { renderDrafts(); $('#drafts-heading').setAttribute('tabindex', '-1'); $('#drafts-heading').focus(); }
        announce(result.persistent ? 'Private draft deleted.' : 'Draft removed from this page only. Browser storage could not be updated.');
      });
      actions.append(open, remove); article.append(actions); list.append(article);
    });
  }
  function mayLeave() { return !dirty || confirm('Leave your unsaved changes? Save your draft first to keep them.'); }
  function load(draft) {
    current = draft; dirty = false; validated = false; setConflict(false);
    fields.forEach(field => { $('#' + field).value = draft?.[field] || ''; $('#' + field + '-error').textContent = ''; $('#' + field).removeAttribute('aria-invalid'); });
    $('#save-state').textContent = draft ? (store.persistent ? 'Saved in this browser' : 'On this page only') : 'New draft';
    locationFields(); renderMatches(); renderDrafts(); $('#editor-heading').focus();
  }
  function save(asCopy = false) {
    if ((conflict || remoteChange) && !asCopy) { setConflict(true); announce('Choose Reload saved version or Save a separate copy.'); return false; }
    if (asCopy) { store.reload(); remoteChange = false; }
    const now = new Date().toISOString();
    const record = { ...values(), version: 1, id: !asCopy && current ? current.id : crypto.randomUUID(), createdAt: !asCopy && current ? current.createdAt : now, updatedAt: now };
    const result = store.save(record);
    if (!result.ok) { remoteChange = true; setConflict(true); announce('Drafts changed in another tab. Choose how to continue.'); return false; }
    current = record; dirty = false; setConflict(false); renderDrafts();
    $('#save-state').textContent = result.persistent ? 'Saved in this browser' : 'On this page only';
    announce(result.persistent ? 'Private draft saved in this browser. Nothing was published.' : store.problem || 'Draft kept on this page only. It will be lost when this page closes.');
    return true;
  }
  $('#concern-form').addEventListener('input', () => {
    dirty = true; $('#save-state').textContent = 'Unsaved changes'; locationFields(); renderMatches(); if (validated) validate();
  });
  $('#concern-form').addEventListener('submit', event => {
    event.preventDefault(); validated = true;
    if (!validate(true)) { announce('Check the highlighted fields before previewing. You can still save an unfinished draft.'); return; }
    const d = values();
    $('#preview-heading').textContent = d.title; $('#preview-meta').textContent = d.topic + ' · ' + area(d); $('#preview-description').textContent = d.description;
    $('#preview').showModal();
  });
  $('#save').addEventListener('click', () => save());
  $('#save-preview').addEventListener('click', () => { if (save()) $('#preview').close(); else { $('#preview').close(); $('#copy-draft').focus(); } });
  $('#close-preview').addEventListener('click', () => $('#preview').close());
  $('#edit-preview').addEventListener('click', () => { $('#preview').close(); $('#title').focus(); });
  $('#new-draft').addEventListener('click', () => { if (mayLeave()) { if (remoteChange) { store.reload(); remoteChange = false; } load(null); } });
  $('#reload-draft').addEventListener('click', () => {
    if (!mayLeave()) return;
    const id = current?.id; store.reload(); remoteChange = false; load(store.drafts.find(d => d.id === id) || null); announce(store.problem || 'Loaded the saved browser version.');
  });
  $('#copy-draft').addEventListener('click', () => save(true));
  window.addEventListener('beforeunload', event => { if (dirty || (!store.persistent && store.drafts.length)) { event.preventDefault(); event.returnValue = ''; } });
  window.addEventListener('storage', event => {
    if (event.key !== PublicSquareDrafts.KEY && event.key !== null) return;
    if (dirty) { remoteChange = true; setConflict(true); announce('Browser drafts changed in another tab. Your unsaved work is still here.'); }
    else { const id = current?.id; store.reload(); load(store.drafts.find(d => d.id === id) || null); announce(store.problem || 'Drafts updated from another tab.'); }
  });
  locationFields(); renderMatches(); renderDrafts();
  if (store.problem) announce(store.problem);
})();
