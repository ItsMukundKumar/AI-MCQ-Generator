// All backend communication lives here. Change BASE if FastAPI runs elsewhere.
export const BASE = 'https://ai-mcq-generator-api.onrender.com';

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const FALLBACK = {
  400: 'That request is not valid right now.',
  404: 'This session has expired or no longer exists.',
  409: 'That step was already completed for this session.',
  413: 'The file is too large.',
  422: 'Some of the values were not accepted.',
  502: 'The AI service could not generate the quiz. Please try again.',
};
const NO_SERVER = `Cannot reach the server at ${BASE}. Make sure FastAPI is running and CORS is enabled.`;

// FastAPI sends `detail` as a string, or as a list of objects for 422 validation errors.
function detailOf(body, status) {
  const d = body && body.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return d.map((x) => x.msg).join('; ');
  return FALLBACK[status] || `Unexpected server error (${status}).`;
}

async function req(path, opts = {}) {
  let res;
  try { res = await fetch(BASE + path, opts); } catch { throw new ApiError(0, NO_SERVER); }
  let body = null;
  try { body = await res.json(); } catch { /* empty or non-JSON body */ }
  if (!res.ok) throw new ApiError(res.status, detailOf(body, res.status));
  return body;
}
const post = (b) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });

export const api = {
  health: () => req('/health'),
  getSession: (id) => req(`/sessions/${id}`),
  deleteSession: (id) => req(`/sessions/${id}`, { method: 'DELETE' }),
  configure: (id, question_count, difficulty) => req(`/sessions/${id}/configure`, post({ question_count, difficulty })),
  generate: (id) => req(`/generate/${id}`, { method: 'POST' }),
  submit: (id, answers) => req(`/evaluation/${id}`, post({ answers })),
  results: (id) => req(`/results/${id}`),

  // fetch() cannot report upload progress, so only the file upload uses XMLHttpRequest.
  upload(file, onProgress) {
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest();
      x.open('POST', BASE + '/upload/');
      x.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
      x.onerror = () => reject(new ApiError(0, NO_SERVER));
      x.onload = () => {
        let b = null;
        try { b = JSON.parse(x.responseText); } catch { /* ignore */ }
        x.status >= 200 && x.status < 300 ? resolve(b) : reject(new ApiError(x.status, detailOf(b, x.status)));
      };
      const f = new FormData();
      f.append('file', file); // backend field name is "file"
      x.send(f);
    });
  },
};
