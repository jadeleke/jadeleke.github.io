// Apply the saved appearance before the first paint. Content never depends on JS.
(function () {
  const root = document.documentElement;
  root.classList.add('js');
  let theme;
  try { theme = localStorage.getItem('theme'); } catch (_) {}
  root.dataset.theme = theme === 'dark' || theme === 'light' ? theme : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
})();
