/*
 * TTTAudio: mesin audio global (Web Audio API, tanpa berkas suara).
 * Dimuat di semua halaman, jadi musik dan efek suara sama sejak Lobby.
 *
 *   TTTAudio.settings           -> { master: 0..1, bgm: bool, sfx: bool }
 *   TTTAudio.set({ master })    -> ubah & simpan pengaturan
 *   TTTAudio.sfx("moveX")       -> mainkan efek suara
 *   TTTAudio.onChange(fn)       -> dipanggil tiap pengaturan berubah
 */
(() => {
  "use strict";

  const STORAGE_KEY = "ttt:audio";
  const LEGACY_KEY = "ttt:sound-enabled"; // tombol suara versi sebelumnya
  const DEFAULTS = { master: 0.7, bgm: true, sfx: true };

  // ---- Pengaturan tersimpan -----------------------------------------------
  const clamp01 = (n) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : DEFAULTS.master));

  function load() {
    const out = { ...DEFAULTS };
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === "object") {
        if ("master" in saved) out.master = clamp01(Number(saved.master));
        if ("bgm" in saved) out.bgm = saved.bgm !== false;
        if ("sfx" in saved) out.sfx = saved.sfx !== false;
      } else if (localStorage.getItem(LEGACY_KEY) === "false") {
        out.bgm = false;
        out.sfx = false;
      }
    } catch { /* localStorage tidak tersedia: pakai default */ }
    return out;
  }

  let settings = load();
  const listeners = new Set();

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* abaikan */ }
  }

  // ---- Graf audio -----------------------------------------------------------
  // sfxBus ---------------------------> master -> compressor -> speaker
  // bgmBus -> bgmFilter --------------^
  let ctx = null;
  let master, sfxBus, bgmBus, bgmFilter;

  function ensureContext() {
    if (ctx) return ctx;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
    const compressor = ctx.createDynamicsCompressor();
    master = ctx.createGain();
    sfxBus = ctx.createGain();
    bgmBus = ctx.createGain();
    bgmFilter = ctx.createBiquadFilter();
    bgmFilter.type = "lowpass";
    bgmFilter.frequency.value = 3000;

    sfxBus.connect(master);
    bgmBus.connect(bgmFilter).connect(master);
    master.connect(compressor).connect(ctx.destination);

    bgmBus.gain.value = 0;
    applyGains(true);
    ctx.addEventListener("statechange", syncBgm);
    return ctx;
  }

  function applyGains(instant = false) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const ramp = (param, value, tc) =>
      instant ? (param.value = value) : param.setTargetAtTime(value, t, tc);
    ramp(master.gain, settings.master ** 2, 0.03); // kurva kuadrat: terasa lebih alami
    ramp(sfxBus.gain, 1.8, 0.03);
    ramp(bgmBus.gain, settings.bgm ? 1.4 : 0, settings.bgm ? 0.4 : 0.05);
  }

  // ---- Karakter suara per tema ---------------------------------------------
  const FLAVORS = {
    classic: {
      bpm: 76, wave: "triangle", padWave: "sine", cutoff: 2200, level: 1,
      arp: [0, 1, 2, 1, 2, 1, 0, 1],
      chords: [
        { bass: 45, tones: [57, 60, 64] }, // Am
        { bass: 41, tones: [53, 57, 60] }, // F
        { bass: 48, tones: [55, 60, 64] }, // C
        { bass: 43, tones: [55, 59, 62] }, // G
      ],
    },
    cyberpunk: {
      bpm: 104, wave: "sawtooth", padWave: "square", cutoff: 1500, level: 0.6,
      arp: [0, 2, 1, 2, 0, 2, 1, 2],
      chords: [
        { bass: 38, tones: [50, 53, 57] }, // Dm
        { bass: 46, tones: [50, 53, 58] }, // Bb
        { bass: 41, tones: [53, 57, 60] }, // F
        { bass: 48, tones: [52, 55, 60] }, // C
      ],
    },
    wooden: {
      bpm: 88, wave: "triangle", padWave: "triangle", cutoff: 1800, level: 1.15,
      arp: [0, 2, 1, 2, 0, 2, 1, 2],
      chords: [
        { bass: 48, tones: [55, 60, 64] }, // C
        { bass: 45, tones: [57, 60, 64] }, // Am
        { bass: 41, tones: [53, 57, 60] }, // F
        { bass: 43, tones: [55, 59, 62] }, // G
      ],
    },
    pastel: {
      bpm: 100, wave: "sine", padWave: "sine", cutoff: 3500, level: 1.1,
      arp: [0, 1, 2, 1, 0, 1, 2, 1],
      chords: [
        { bass: 41, tones: [57, 60, 65] }, // F
        { bass: 48, tones: [55, 60, 64] }, // C
        { bass: 38, tones: [57, 62, 65] }, // Dm
        { bass: 46, tones: [58, 62, 65] }, // Bb
      ],
    },
  };
  const currentFlavor = () => FLAVORS[document.documentElement.dataset.theme] || FLAVORS.classic;
  const midiToHz = (m) => 440 * 2 ** ((m - 69) / 12);

  // Satu nada dengan envelope (attack singkat, release halus).
  function tone(freq, when, dur, { type = "sine", vol = 0.1, attack = 0.012, dest }) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), when + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(gain).connect(dest);
    osc.start(when);
    osc.stop(when + dur + 0.05);
  }

  // ---- BGM: loop 4 bar dengan scheduler lookahead ------------------------------
  const LOOKAHEAD = 0.4;     // detik nada dijadwalkan lebih awal
  const TICK_MS = 120;
  const VELOCITY = [1, 0.55, 0.8, 0.55, 0.9, 0.55, 0.75, 0.5];
  let bgmTimer = null;
  let stepIndex = 0;         // 0..31 (4 bar x 8 langkah 8th-note)
  let nextTime = 0;
  let flavor = FLAVORS.classic;

  function scheduleStep(step, when, stepDur) {
    const chord = flavor.chords[Math.floor(step / 8) % flavor.chords.length];
    const s = step % 8;
    const lvl = flavor.level;

    if (s === 0) {
      for (const m of chord.tones) {
        tone(midiToHz(m - 12), when, stepDur * 8.5, { type: flavor.padWave, vol: 0.018 * lvl, attack: 0.5, dest: bgmBus });
      }
    }
    if (s === 0 || s === 4) {
      tone(midiToHz(chord.bass), when, stepDur * 3.6, { type: "triangle", vol: (s === 0 ? 0.08 : 0.05) * lvl, attack: 0.02, dest: bgmBus });
    }
    tone(midiToHz(chord.tones[flavor.arp[s]] + (s >= 6 ? 12 : 0)), when, stepDur * 1.6,
      { type: flavor.wave, vol: 0.05 * VELOCITY[s] * lvl, attack: 0.008, dest: bgmBus });
  }

  function pump() {
    if (!ctx || ctx.state !== "running") return;
    while (nextTime < ctx.currentTime + LOOKAHEAD) {
      if (stepIndex % 8 === 0) { // ganti karakter musik tepat di awal bar
        flavor = currentFlavor();
        bgmFilter.frequency.setTargetAtTime(flavor.cutoff, nextTime, 0.05);
      }
      const stepDur = 60 / flavor.bpm / 2;
      scheduleStep(stepIndex, nextTime, stepDur);
      nextTime += stepDur;
      stepIndex = (stepIndex + 1) % 32;
    }
  }

  function startBgm() {
    if (bgmTimer !== null) return;
    nextTime = ctx.currentTime + 0.1;
    stepIndex = 0;
    flavor = currentFlavor();
    pump();
    bgmTimer = setInterval(pump, TICK_MS);
  }

  function stopBgm() {
    if (bgmTimer === null) return;
    clearInterval(bgmTimer);
    bgmTimer = null;
  }

  // Sinkronkan BGM dengan pengaturan + status context (autoplay policy).
  function syncBgm() {
    if (!ctx) return;
    const shouldPlay = settings.bgm && settings.master > 0 && ctx.state === "running";
    if (shouldPlay) startBgm(); else stopBgm();
  }

  // ---- Efek suara -----------------------------------------------------------------
  // Tiap nada: [frekuensi Hz, offset detik, durasi detik, volume?]
  const SFX = {
    moveX:   [[440, 0, 0.07], [660, 0.055, 0.08]],
    moveO:   [[520, 0, 0.07], [780, 0.055, 0.08]],
    win:     [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.2], [1047, 0.38, 0.3]],
    loss:    [[392, 0, 0.13], [330, 0.14, 0.13], [262, 0.28, 0.24]],
    draw:    [[392, 0, 0.1], [392, 0.14, 0.1]],
    restart: [[440, 0, 0.08], [554, 0.07, 0.08]],
    click:   [[600, 0, 0.04, 0.07]],
    on:      [[520, 0, 0.05, 0.08], [780, 0.05, 0.07, 0.08]],
    off:     [[780, 0, 0.05, 0.08], [520, 0.05, 0.07, 0.08]],
    tick:    [[660, 0, 0.09, 0.1]],
    notify:  [[740, 0, 0.05, 0.06], [988, 0.06, 0.08, 0.06]],
    blip:    [[520, 0, 0.03, 0.035]],
  };
  const WAVE_BY_THEME = { classic: "sine", cyberpunk: "square", wooden: "triangle", pastel: "sine" };
  const WAVE_GAIN = { sine: 1, square: 0.5, triangle: 1.2 };

  function sfx(name, { pitch = 1 } = {}) {
    if (!settings.sfx || settings.master === 0) return;
    const notes = SFX[name];
    if (!notes || !ensureContext()) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    if (ctx.state === "closed") return;

    const type = WAVE_BY_THEME[document.documentElement.dataset.theme] || "sine";
    const now = ctx.currentTime;
    for (const [freq, offset, dur, vol = 0.14] of notes) {
      tone(freq * pitch, now + offset, dur, { type, vol: vol * WAVE_GAIN[type], dest: sfxBus });
    }
  }

  // ---- API publik -----------------------------------------------------------------
  function set(patch) {
    const next = { ...settings };
    if ("master" in patch) next.master = clamp01(Number(patch.master));
    if ("bgm" in patch) next.bgm = Boolean(patch.bgm);
    if ("sfx" in patch) next.sfx = Boolean(patch.sfx);
    settings = next;
    save();
    ensureContext();
    applyGains();
    if (ctx && ctx.state === "suspended" && (next.bgm || next.sfx)) ctx.resume().catch(() => {});
    syncBgm();
    listeners.forEach((fn) => fn({ ...settings }));
  }

  window.TTTAudio = {
    get settings() { return { ...settings }; },
    set,
    sfx,
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };

  // ---- Autoplay policy: mulai setelah interaksi pertama -------------------------
  ensureContext();
  syncBgm(); // jika browser sudah mengizinkan, musik langsung jalan

  const UNLOCK_EVENTS = ["pointerdown", "touchend", "keydown", "click"];
  function unlock() {
    if (!ensureContext()) return;
    ctx.resume().then(() => {
      if (ctx.state === "running") {
        UNLOCK_EVENTS.forEach((e) => window.removeEventListener(e, unlock, true));
        syncBgm();
      }
    }).catch(() => {});
  }
  if (ctx && ctx.state !== "running") {
    UNLOCK_EVENTS.forEach((e) => window.addEventListener(e, unlock, true));
  }

  // Hemat baterai: jeda saat tab tidak terlihat.
  let pausedByVisibility = false;
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden && ctx.state === "running") {
      pausedByVisibility = true;
      ctx.suspend().catch(() => {});
    } else if (!document.hidden && pausedByVisibility) {
      pausedByVisibility = false;
      ctx.resume().catch(() => {});
    }
  });

  // Bunyi klik ringan untuk semua kontrol UI (Lobby, Settings, dll).
  document.addEventListener("click", (event) => {
    if (event.target.closest(".btn, .choice, .theme-card, .icon-btn")) sfx("click");
  });
})();
