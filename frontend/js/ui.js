// Generic UI helpers: DOM shortcuts, views, toasts, dialog, theme.
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
// Escape all model/user text before it goes into innerHTML.
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const icons = () => window.lucide && window.lucide.createIcons();
export const fmtSize = (b) => (b < 1048576 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1048576).toFixed(1) + ' MB');

export function show(view) {
  $$('.view').forEach((v) => { v.hidden = v.id !== 'view-' + view; });
  window.scrollTo({ top: 0 });
  icons();
}

export function toast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.setAttribute('role', type === 'error' ? 'alert' : 'status');
  t.textContent = msg;
  $('#toasts').append(t);
  setTimeout(() => t.remove(), 5500);
}

// Promise-based modal (native <dialog>: focus trap + Esc handled by the browser).
export function confirmDialog({ title, body, ok = 'Confirm', cancel = 'Cancel' }) {
  const d = $('#dlg');
  $('#dlg-title').textContent = title;
  $('#dlg-body').innerHTML = body;
  $('#dlg-ok').textContent = ok;
  $('#dlg-cancel').textContent = cancel;
  return new Promise((res) => {
    d.addEventListener('close', () => res(d.returnValue === 'ok'), { once: true });
    d.returnValue = '';
    d.showModal();
    icons();
  });
}

export function initTheme() {
  const root = document.documentElement, btn = $('#theme');
  const set = (t, save) => {
    root.dataset.theme = t;
    btn.setAttribute('aria-pressed', t === 'dark');
    if (save) try { localStorage.setItem('mcq.theme', t); } catch { /* storage unavailable */ }
  };
  set(root.dataset.theme || 'light', false);
  btn.addEventListener('click', () => set(root.dataset.theme === 'dark' ? 'light' : 'dark', true));
  // Follow the OS only while the user has not chosen a theme themselves.
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('mcq.theme')) set(e.matches ? 'dark' : 'light', false);
  });
}
