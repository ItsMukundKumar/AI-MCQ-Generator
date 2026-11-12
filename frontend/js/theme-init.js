// Runs before first paint so the saved/system theme is applied without a flash.
(function () {
  try {
    var t = localStorage.getItem('mcq.theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = t;
  } catch (e) {}
})();
