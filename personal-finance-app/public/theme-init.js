(function () {
  try {
    var bgs = { red: '#121212', blue: '#14161c', cyan: '#121a1c', violet: '#15121d', rose: '#1a1316' };
    var t = localStorage.getItem('fintrack_theme');
    if (t) {
      t = t.replace(/[^a-z0-9-]/gi, '');
      if (t && bgs[t]) {
        document.documentElement.classList.add('theme-' + t);
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', bgs[t]);
      }
    }
  } catch (e) {}
})();
