(() => {
  const button = document.getElementById("theme-toggle");
  const meta = document.getElementById("theme-color-meta");
  const storageKey = "ttt:theme";
  let theme = "light";

  try {
    if (localStorage.getItem(storageKey) === "dark") theme = "dark";
  } catch {}

  function applyTheme() {
    const isDark = theme === "dark";
    document.documentElement.dataset.theme = theme;
    button.textContent = isDark ? "Mode terang" : "Mode gelap";
    button.setAttribute("aria-pressed", String(isDark));
    meta.content = isDark ? "#141a25" : "#eef2f8";
  }

  button.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    try { localStorage.setItem(storageKey, theme); } catch {}
    applyTheme();
  });

  applyTheme();
})();