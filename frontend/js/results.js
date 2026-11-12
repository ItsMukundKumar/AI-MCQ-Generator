// Results dashboard rendered from GET /results/{session_id}.
import { $, $$, esc, icons } from './ui.js';

const LETTERS = ['A', 'B', 'C', 'D'];
const STATUS = {
  correct: { label: 'Correct', icon: 'check-circle-2' },
  incorrect: { label: 'Incorrect', icon: 'x-circle' },
  unattempted: { label: 'Not attempted', icon: 'minus-circle' },
};
const statusOf = (q) => (q.submitted_answer == null ? 'unattempted' : q.is_correct ? 'correct' : 'incorrect');

export function renderResults(r) {
  const t = r.total_questions || 1;
  const pct = (x) => Math.round((x / t) * 1000) / 10;
  const score = +Number(r.score_percentage).toFixed(1);
  const note = score >= 80 ? 'Excellent work!' : score >= 50 ? 'Good effort. Review the explanations to close the gaps.' : 'Keep practising. The explanations below will help.';
  const qs = r.question_results.map((q) => ({ ...q, st: statusOf(q) }));
  const count = (s) => qs.filter((q) => q.st === s).length;
  const stat = (icon, cls, label, v) => `<div class="card stat ${cls}"><i data-lucide="${icon}"></i><strong>${v}</strong><span>${label}</span></div>`;
  const seg = (cls, v) => (v ? `<span class="seg ${cls}" style="flex:${v}"></span>` : '');

  $('#results-root').innerHTML = `
  <section class="card pad resh">
    <div class="ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="rt" cx="60" cy="60" r="52" pathLength="100"/><circle id="ring-fg" class="rf" cx="60" cy="60" r="52" pathLength="100" stroke-dasharray="0 100"/></svg>
      <div class="rv"><strong>${score}%</strong><span>Your Score</span></div></div>
    <div><h1>Quiz Completed!</h1><p class="lead sm">${note}</p>
      <div class="row wrapx"><button class="btn primary" type="button" data-act="new"><i data-lucide="rotate-ccw"></i>Try Another Quiz</button><button class="btn" type="button" data-act="home"><i data-lucide="home"></i>Return to Home</button></div></div>
  </section>
  <div class="stats">
    ${stat('list', '', 'Total questions', r.total_questions)}${stat('pencil', '', 'Attempted', r.attempted_questions)}
    ${stat('check-circle-2', 'ok', 'Correct', r.correct_answers)}${stat('x-circle', 'bad', 'Incorrect', r.incorrect_answers)}
    ${stat('minus-circle', 'na', 'Unattempted', r.unattempted_questions)}
  </div>
  <section class="card pad"><h2>Performance breakdown</h2>
    <div class="stack" role="img" aria-label="${r.correct_answers} correct, ${r.incorrect_answers} incorrect, ${r.unattempted_questions} unattempted">${seg('ok', r.correct_answers)}${seg('bad', r.incorrect_answers)}${seg('na', r.unattempted_questions)}</div>
    <ul class="legend"><li><i class="dot ok"></i>Correct: ${r.correct_answers} (${pct(r.correct_answers)}%)</li><li><i class="dot bad"></i>Incorrect: ${r.incorrect_answers} (${pct(r.incorrect_answers)}%)</li><li><i class="dot na"></i>Unattempted: ${r.unattempted_questions} (${pct(r.unattempted_questions)}%)</li></ul></section>

  <section class="review"><h2>Question-by-question review</h2>
    <div class="filters" role="group" aria-label="Filter questions">
      ${[['all', 'All Questions', qs.length], ['correct', 'Correct', count('correct')], ['incorrect', 'Incorrect', count('incorrect')], ['unattempted', 'Unattempted', count('unattempted')]]
        .map(([k, l, c], i) => `<button type="button" class="btn ${i ? '' : 'primary'}" data-act="filter" data-f="${k}" aria-pressed="${!i}">${l} (${c})</button>`).join('')}</div>
    <div class="jump" role="group" aria-label="Jump to question">${qs.map((q, i) => `<button type="button" class="qn st-${q.st}" data-act="jump" data-i="${i}" aria-label="Question ${i + 1}: ${STATUS[q.st].label}">${i + 1}<em aria-hidden="true">${{ correct: '✓', incorrect: '✗', unattempted: '–' }[q.st]}</em></button>`).join('')}</div>
    <p id="rv-empty" class="muted" hidden>No questions match this filter.</p>
    <div id="rv-list">${qs.map((q, i) => `
      <article class="card pad rq ${q.st}" id="rq-${i}" data-st="${q.st}">
        <div class="row between wrapx"><span class="badge soft">Question ${i + 1}</span><span class="pill ${q.st}"><i data-lucide="${STATUS[q.st].icon}"></i>${STATUS[q.st].label}</span></div>
        <h3 class="qtext">${esc(q.question)}</h3>
        <ul class="ropts">${LETTERS.map((l) => {
          const c = l === q.correct_answer, u = l === q.submitted_answer;
          return `<li class="ropt ${c ? 'ok' : u ? 'bad' : ''}"><span class="ltr">${l}</span><span class="otxt">${esc(q.options[l])}</span>
            ${c || u ? `<span class="tag">${c && u ? 'Your answer · Correct' : c ? 'Correct answer' : 'Your answer · Incorrect'}</span>` : ''}</li>`;
        }).join('')}</ul>
        ${q.st === 'unattempted' ? '<p class="na-note">You did not attempt this question.</p>' : ''}
        <div class="expl"><strong><i data-lucide="lightbulb"></i>Explanation</strong><p>${esc(q.explanation)}</p></div>
      </article>`).join('')}</div>
  </section>
  <div class="row center wrapx fin"><button class="btn primary lg" type="button" data-act="new">Try Another Quiz</button><button class="btn lg" type="button" data-act="home">Return to Home</button></div>`;

  icons();
  requestAnimationFrame(() => requestAnimationFrame(() => $('#ring-fg').setAttribute('stroke-dasharray', `${Math.min(score, 100)} 100`)));
}

export function initResults({ onNew, onHome }) {
  const root = $('#results-root');
  const filter = (f) => {
    let n = 0;
    $$('#rv-list .rq').forEach((a) => { const on = f === 'all' || a.dataset.st === f; a.hidden = !on; n += on; });
    $$('[data-act=filter]', root).forEach((b) => { const on = b.dataset.f === f; b.classList.toggle('primary', on); b.setAttribute('aria-pressed', on); });
    $('#rv-empty').hidden = n > 0;
  };
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'new') onNew();
    else if (b.dataset.act === 'home') onHome();
    else if (b.dataset.act === 'filter') filter(b.dataset.f);
    else if (b.dataset.act === 'jump') {
      filter('all'); // make sure the target is visible
      document.getElementById('rq-' + b.dataset.i).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}
