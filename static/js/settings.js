/*
 * Modal Pengaturan (dipakai di Lobby dan saat bermain):
 * volume utama, mute BGM/SFX, dan pilihan tema papan.
 * Bergantung pada TTTAudio (audio.js) dan TTTTheme (theme.js).
 */
(() => {
  "use strict";

  const dialog = document.getElementById("settings-dialog");
  const openBtn = document.getElementById("settings-open");
  if (!dialog || !openBtn) return;

  const volume = document.getElementById("vol-master");
  const volumeOut = document.getElementById("vol-master-out");
  const bgmSwitch = document.getElementById("sw-bgm");
  const sfxSwitch = document.getElementById("sw-sfx");
  const themeInputs = [...dialog.querySelectorAll('input[name="board-theme"]')];

  // ---- Tampilkan nilai saat ini ---------------------------------------------
  function renderAudio() {
    const { master, bgm, sfx } = TTTAudio.settings;
    const percent = Math.round(master * 100);
    volume.value = percent;
    volume.style.setProperty("--fill", `${percent}%`);
    volumeOut.textContent = `${percent}%`;
    volume.setAttribute("aria-valuetext", `${percent} persen`);
    bgmSwitch.checked = bgm;
    sfxSwitch.checked = sfx;
    document.getElementById("sw-bgm-state").textContent = bgm ? "Aktif" : "Dibisukan";
    document.getElementById("sw-sfx-state").textContent = sfx ? "Aktif" : "Dibisukan";
  }

  function renderTheme() {
    for (const input of themeInputs) input.checked = input.value === TTTTheme.current;
  }

  // ---- Interaksi ------------------------------------------------------------------
  volume.addEventListener("input", () => TTTAudio.set({ master: Number(volume.value) / 100 }));
  volume.addEventListener("change", () => TTTAudio.sfx("tick")); // umpan balik saat slider dilepas

  bgmSwitch.addEventListener("change", () => {
    TTTAudio.set({ bgm: bgmSwitch.checked });
    TTTAudio.sfx(bgmSwitch.checked ? "on" : "off");
  });
  sfxSwitch.addEventListener("change", () => {
    const enabled = sfxSwitch.checked;
    if (enabled) TTTAudio.set({ sfx: true });
    TTTAudio.sfx(enabled ? "on" : "off"); // bunyi "off" terdengar sebelum SFX dibisukan
    if (!enabled) TTTAudio.set({ sfx: false });
  });

  for (const input of themeInputs) {
    input.addEventListener("change", () => {
      if (input.checked) TTTTheme.set(input.value);
    });
  }

  TTTAudio.onChange(renderAudio);
  TTTTheme.onChange(renderTheme);

  // ---- Buka / tutup ---------------------------------------------------------------
  // <dialog> asli mengurus fokus, tombol Esc, dan latar; cabang else hanya cadangan.
  function close() {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  openBtn.addEventListener("click", () => {
    renderAudio();
    renderTheme();
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  });

  dialog.addEventListener("click", (event) => {
    // Klik pada latar (::backdrop) mengarah ke elemen <dialog> itu sendiri.
    if (event.target === dialog || event.target.closest("[data-close]")) close();
  });

  renderAudio();
  renderTheme();
})();
