// Quiz state (single source of truth), persistence and the quiz screen.
import { api } from './api.js';
import { $, esc, icons, toast, confirmDialog } from './ui.js';

const fresh = () => ({
  id: null, filename: '', size: 0, pages: 0,
  count: 10, difficulty: 'Normal',
  questions: [],          // public questions only: {question, options}
  answers: {},            // { questionIndex: 'A'|'B'|'C'|'D' }
  marked: new Set(),
  current: 0, submitting: false, results: null,
});
export const S = fresh();
const KEY = 'mcq.session.v1';
const LETTERS = ['A', 'B', 'C', 'D'];

// Only non-sensitive data is stored: the backend never sends answers before submission.
export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      id: S.id, filename: S.filename, size: S.size, pages: S.pages, count: S.count, difficulty: S.difficulty,
      questions: S.questions, answers: S.answers, marked: [...S.marked], current: S.current,
    }));
  } catch { /* storage full/unavailable: app still works for this visit */ }
}
export function restore() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (!d || !d.id) return false;
    Object.assign(S, fresh(), d, { marked: new Set(d.marked || []) });
    return true;
  } catch { return false; }
}
export function reset() { Object.assign(S, fresh()); try { localStorage.removeItem(KEY); } catch { /* ignore */ } }

const answered = () => Object.keys(S.answers).length;

export function renderQuiz() {
  const n = S.questions.length, i = S.current, q = S.questions[i], a = answered(), m = S.marked.size;
  $('#qz-title').textContent = 'Quiz: ' + S.filename.replace(/\.pdf$/i, '');
  $('#qz-file').textContent = S.filename;
  $('#qz-diff').textContent = S.difficulty;
  $('#qz-total').textContent = n + ' questions';
  $('#p-cur').textContent = `Question ${i + 1} of ${n}`;
  $('#p-stats').textContent = `Answered: ${a} · Remaining: ${n - a} · Marked: ${m}`;
  $('#p-bar').style.width = (a / n) * 100 + '%';
  $('#p-wrap').setAttribute('aria-valuenow', Math.round((a / n) * 100));
  $('#q-toggle-t').textContent = `Question navigator (${n - a} unanswered)`;

  const hadFocus = document.activeElement && document.activeElement.name === 'ans';
  const isMarked = S.marked.has(i);
  $('#q-card').innerHTML = `
    <div class="row between wrapx"><span class="badge soft">Question ${i + 1} of ${n}</span>
      <button class="btn ghost ${isMarked ? 'on' : ''}" type="button" data-act="mark" aria-pressed="${isMarked}"><i data-lucide="flag"></i>${isMarked ? 'Marked for review' : 'Mark for Review'}</button></div>
    <h2 class="qtext">${esc(q.question)}</h2>
    <fieldset class="opts"><legend class="sr">Answer choices for question ${i + 1}</legend>
      ${LETTERS.map((l) => `<label class="opt ${S.answers[i] === l ? 'sel' : ''}"><input type="radio" name="ans" value="${l}" ${S.answers[i] === l ? 'checked' : ''}>
        <span class="ltr">${l}</span><span class="otxt">${esc(q.options[l])}</span><span class="tick"><i data-lucide="check-circle-2"></i><span class="sr">Selected</span></span></label>`).join('')}
    </fieldset>
    <div class="row between wrapx qa">
      <button class="btn" type="button" data-act="prev" ${i === 0 ? 'disabled' : ''}><i data-lucide="arrow-left"></i>Previous Question</button>
      <button class="btn ghost" type="button" data-act="clear" ${i in S.answers ? '' : 'disabled'}>Clear Answer</button>
      <button class="btn primary" type="button" data-act="next" ${i === n - 1 ? 'disabled' : ''}>Next Question<i data-lucide="arrow-right"></i></button>
    </div>`;

  $('#q-grid').innerHTML = S.questions.map((_, k) => {
    const ans = k in S.answers, mk = S.marked.has(k);
    return `<button type="button" class="qn ${k === i ? 'cur' : ''} ${ans ? 'ans' : ''} ${mk ? 'mk' : ''}" data-i="${k}"
      aria-label="Question ${k + 1}, ${ans ? 'answered' : 'unanswered'}${mk ? ', marked for review' : ''}" ${k === i ? 'aria-current="true"' : ''}>${k + 1}${ans ? '<em aria-hidden="true">✓</em>' : ''}${mk ? '<em class="fl" aria-hidden="true">⚑</em>' : ''}</button>`;
  }).join('');
  icons();
  if (hadFocus) { const c = $('#q-card input:checked'); if (c) c.focus(); }
}

function go(i) {
  S.current = Math.min(Math.max(i, 0), S.questions.length - 1);
  persist(); renderQuiz();
}

export function startQuiz() { S.current = Math.min(S.current, S.questions.length - 1); renderQuiz(); }

function setBusy(b) {
  S.submitting = b;
  $('#view-quiz').toggleAttribute('inert', b);
  $('#view-quiz').setAttribute('aria-busy', b);
  $('#submit').innerHTML = b ? '<span class="spin sm"></span>Submitting…' : 'Submit Quiz';
}

async function submit(onDone, onExpired) {
  if (S.submitting) return;
  const n = S.questions.length, a = answered(), left = n - a;
  const ok = await confirmDialog({
    title: 'Submit your quiz?',
    body: `<dl class="sum"><div><dt>Total questions</dt><dd>${n}</dd></div><div><dt>Answered</dt><dd>${a}</dd></div>
      <div><dt>Unanswered</dt><dd>${left}</dd></div><div><dt>Marked for review</dt><dd>${S.marked.size}</dd></div></dl>
      ${left ? `<p class="warn"><i data-lucide="alert-triangle"></i> You still have ${left} unanswered question${left > 1 ? 's' : ''}. They will count as unattempted.</p>` : '<p class="muted">Answers cannot be changed after submitting.</p>'}`,
    ok: left ? 'Submit anyway' : 'Submit quiz', cancel: 'Return to quiz',
  });
  if (!ok) return;
  setBusy(true);
  try {
    try { await api.submit(S.id, S.answers); }
    catch (e) { if (e.status !== 409) throw e; /* already submitted: just fetch the results */ }
    S.results = await api.results(S.id);
    persist();
    onDone(S.results);
  } catch (e) {
    if (e.status === 404) onExpired(); else toast(e.message, 'error');
  } finally { setBusy(false); }
}

export function initQuiz({ onDone, onExpired }) {
  $('#q-card').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b || S.submitting) return;
    const act = b.dataset.act;
    if (act === 'prev') go(S.current - 1);
    else if (act === 'next') go(S.current + 1);
    else if (act === 'clear') { delete S.answers[S.current]; persist(); renderQuiz(); }
    else if (act === 'mark') { S.marked.has(S.current) ? S.marked.delete(S.current) : S.marked.add(S.current); persist(); renderQuiz(); }
  });
  // Selecting an answer only updates local state; nothing is sent until Submit.
  $('#q-card').addEventListener('change', (e) => {
    if (e.target.name !== 'ans' || S.submitting) return;
    S.answers[S.current] = e.target.value; persist(); renderQuiz();
  });
  $('#q-grid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]'); if (!b) return;
    go(+b.dataset.i);
    if (innerWidth < 900) { $('#q-side').classList.remove('open'); $('#q-toggle').setAttribute('aria-expanded', 'false'); $('#q-card').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
  $('#q-toggle').addEventListener('click', () => {
    const o = $('#q-side').classList.toggle('open');
    $('#q-toggle').setAttribute('aria-expanded', o);
  });
  $('#submit').addEventListener('click', () => submit(onDone, onExpired));
}
