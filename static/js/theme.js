/*
 * TTTTheme: manajer tema papan.
 * Tema diterapkan lewat atribut <html data-theme="..."> sehingga seluruh
 * tampilan (latar, grid, simbol X/O) berubah instan lewat CSS variables.
 * Skrip kecil di <head> (base.html) sudah menerapkan tema tersimpan sebelum
 * halaman digambar; berkas ini mengurus pergantian tema dan penyimpanannya.
 */
(() => {
  "use strict";

  const STORAGE_KEY = "ttt:theme";
  const root = document.documentElement;
  const meta = document.getElementById("theme-color-meta");
  const options = [...document.querySelectorAll('input[name="board-theme"]')];
  const colors = Object.fromEntries(options.map((input) => [input.value, input.dataset.color]));
  const listeners = new Set();

  const isValid = (id) => Object.prototype.hasOwnProperty.call(colors, id);

  function apply(id) {
    root.dataset.theme = id;
    if (meta && colors[id]) meta.content = colors[id];
  }

  function set(id, { persist = true } = {}) {
    if (!isValid(id)) return;
    apply(id);
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, id); } catch { /* abaikan */ }
    }
    listeners.forEach((fn) => fn(id));
  }

  window.TTTTheme = {
    get current() { return root.dataset.theme; },
    set,
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };

  // Selaraskan dengan tema yang sudah diterapkan skrip di <head>.
  if (isValid(root.dataset.theme)) apply(root.dataset.theme);
})();
