// Apply the saved appearance before paint; follow the system until a user chooses.
(function () {
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  root.classList.add('js');

  function savedPreference() {
    let value;
    try { value = localStorage.getItem('theme'); } catch (_) {}
    return value === 'dark' || value === 'light' ? value : 'system';
  }

  function apply(preference) {
    root.dataset.themePreference = preference;
    root.dataset.theme = preference === 'system' ? (system.matches ? 'dark' : 'light') : preference;
    window.dispatchEvent(new Event('themechange'));
  }

  apply(savedPreference());
  system.addEventListener('change', () => {
    if (root.dataset.themePreference === 'system') apply('system');
  });
  // Keep open pages consistent when the preference is changed in another tab.
  window.addEventListener('storage', event => {
    if (event.key === 'theme' || event.key === null) apply(savedPreference());
  });
})();
