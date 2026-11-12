// Application wiring: navigation, upload/configure flow, resume-on-refresh.
import { api } from './api.js';
import { $, $$, icons, show, toast, confirmDialog, initTheme, fmtSize } from './ui.js';
import { S, persist, restore, reset, startQuiz, initQuiz } from './quiz.js';
import { renderResults, initResults } from './results.js';

const limits = { maxQ: 50, maxMB: 10 };
let uploading = false, generating = false;

/* ---------- navigation ---------- */
const showResults = (r) => { S.results = r; renderResults(r); show('results'); };

function setStep(n) {
  $$('#stepper li').forEach((li, i) => {
    li.classList.toggle('done', i < n - 1);
    li.classList.toggle('cur', i === n - 1);
    i === n - 1 ? li.setAttribute('aria-current', 'step') : li.removeAttribute('aria-current');
  });
}

function startLearning() {
  if (S.results) return newQuiz();
  if (S.id && S.questions.length) { startQuiz(); return show('quiz'); }
  show('create');
}

function newQuiz() {
  if (S.id) api.deleteSession(S.id).catch(() => {}); // best-effort cleanup; the server also expires sessions
  reset(); resetCreateUI(); show('create');
}

async function expired(msg = 'Your quiz session has expired on the server (sessions are kept in memory for a limited time). Please start a new quiz.') {
  reset(); resetCreateUI(); show('landing');
  if (await confirmDialog({ title: 'Session expired', body: `<p>${msg}</p>`, ok: 'Start a new quiz', cancel: 'Not now' })) show('create');
}

/* ---------- upload ---------- */
const upMsg = (t, cls = '') => { const m = $('#up-msg'); m.textContent = t; m.className = 'msg ' + cls; };

function resetCreateUI() {
  $('#chip').hidden = true; $('#drop').hidden = false; $('#step-config').hidden = true;
  $('#f-bar').style.width = '0'; $('#file').value = ''; upMsg(''); setStep(1);
}

function showUploaded() {
  $('#drop').hidden = true; $('#chip').hidden = false;
  $('#f-name').textContent = S.filename;
  $('#f-meta').textContent = `${fmtSize(S.size)}${S.pages ? ' · ' + S.pages + ' pages' : ''}`;
  $('#f-bar').style.width = '100%';
  upMsg('Upload complete. Your PDF is ready.', 'ok');
  $('#step-config').hidden = false;
  setCount(S.count); $(`input[name=diff][value=${S.difficulty}]`).checked = true;
  setStep(2); icons();
}

async function handleFile(file) {
  if (!file || uploading) return;
  if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== 'application/pdf')) return upMsg('Only PDF files are supported.', 'err');
  if (file.size > limits.maxMB * 1048576) return upMsg(`This file is ${fmtSize(file.size)}. The limit is ${limits.maxMB} MB.`, 'err');
  if (S.id) { api.deleteSession(S.id).catch(() => {}); reset(); }
  uploading = true;
  $('#drop').hidden = true; $('#chip').hidden = false; $('#step-config').hidden = true;
  $('#f-name').textContent = file.name; $('#f-meta').textContent = fmtSize(file.size);
  $('#f-bar').style.width = '0'; upMsg('Uploading…');
  $('#f-replace').disabled = $('#f-remove').disabled = true;
  try {
    const { session: s } = await api.upload(file, (p) => { $('#f-bar').style.width = p * 100 + '%'; });
    Object.assign(S, { id: s.session_id, filename: s.filename, size: s.file_size_bytes, pages: s.page_count });
    persist(); showUploaded(); toast('PDF uploaded successfully.', 'success');
  } catch (e) {
    $('#chip').hidden = true; $('#drop').hidden = false; $('#file').value = '';
    upMsg(e.message, 'err'); toast(e.message, 'error');
  } finally { uploading = false; $('#f-replace').disabled = $('#f-remove').disabled = false; }
}

/* ---------- configure + generate ---------- */
function setCount(v) {
  const n = Math.min(Math.max(parseInt(v, 10) || 1, 1), limits.maxQ);
  $('#q-num').value = $('#q-range').value = n; S.count = n;
}

async function generate() {
  if (generating || !S.id) return;
  generating = true;
  $('#gen').disabled = true; $('#gen-loading').hidden = false; setStep(3);
  try {
    S.count = +$('#q-num').value; S.difficulty = $('input[name=diff]:checked').value;
    await api.configure(S.id, S.count, S.difficulty);
    const r = await api.generate(S.id);
    Object.assign(S, { questions: r.questions, difficulty: r.difficulty, answers: {}, marked: new Set(), current: 0 });
    persist(); startQuiz(); show('quiz');
  } catch (e) {
    if (e.status === 404) return expired();
    toast(e.message, 'error'); setStep(2);
  } finally { generating = false; $('#gen').disabled = false; $('#gen-loading').hidden = true; }
}

/* ---------- resume after refresh ---------- */
async function resume() {
  if (!restore()) return;
  try {
    const s = await api.getSession(S.id); // validate with the backend first
    if (s.is_submitted) return showResults(await api.results(S.id));
    if (s.has_generated_mcqs) {
      if (!S.questions.length) return expired('Your quiz was generated, but its questions could not be restored in this browser. Please start a new quiz.');
      startQuiz(); show('quiz'); return toast('Welcome back. Your answers were restored.', 'success');
    }
    S.filename = s.filename; show('create'); showUploaded();
  } catch (e) {
    if (e.status === 404) expired(); else toast(e.message, 'error');
  }
}

async function loadLimits() {
  try {
    const h = await api.health();
    if (h.max_questions) limits.maxQ = h.max_questions;
    if (h.max_upload_size_mb) limits.maxMB = h.max_upload_size_mb;
  } catch (e) { toast(e.message, 'error'); }
  $('#q-num').max = $('#q-range').max = limits.maxQ;
  $('#q-hint').textContent = `Choose 1 to ${limits.maxQ} questions.`;
  $('#limits').textContent = `PDF files only · up to ${limits.maxMB} MB`;
}

/* ---------- init ---------- */
initTheme();
initQuiz({ onDone: showResults, onExpired: () => expired() });
initResults({ onNew: newQuiz, onHome: () => show('landing') });

document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-go],[data-scroll],[data-start]'); if (!a) return;
  e.preventDefault();
  $('#menu').classList.remove('open'); $('#burger').setAttribute('aria-expanded', 'false');
  if ('start' in a.dataset) return startLearning();
  if (a.dataset.go) return show(a.dataset.go);
  if ($('#view-landing').hidden) show('landing');
  document.getElementById(a.dataset.scroll).scrollIntoView({ behavior: 'smooth' });
});
$('#burger').addEventListener('click', () => {
  const o = $('#menu').classList.toggle('open'); $('#burger').setAttribute('aria-expanded', o);
});

$('#browse').addEventListener('click', () => $('#file').click());
$('#f-replace').addEventListener('click', () => $('#file').click());
$('#file').addEventListener('change', (e) => { handleFile(e.target.files[0]); e.target.value = ''; });
$('#f-remove').addEventListener('click', () => { if (S.id) api.deleteSession(S.id).catch(() => {}); reset(); resetCreateUI(); });
const drop = $('#drop');
['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (e) => handleFile(e.dataTransfer.files[0]));

$('#q-num').addEventListener('input', (e) => setCount(e.target.value));
$('#q-range').addEventListener('input', (e) => setCount(e.target.value));
$$('[data-delta]').forEach((b) => b.addEventListener('click', () => setCount(+$('#q-num').value + +b.dataset.delta)));
$('#gen').addEventListener('click', generate);

icons();
loadLimits().then(resume);
