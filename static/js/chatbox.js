/*
 * TTTChat: UI kotak dialog ala RPG.
 *
 *   const chat = TTTChat.create(document.getElementById("dialog"), { onBlip });
 *   chat.say("Halo!", "happy");   // gelembung dengan efek mengetik (antre berurutan)
 *   chat.system("Ronde 2");       // baris info di tengah
 *   chat.flush();                 // selesaikan/buang antrean (mis. saat ronde baru)
 *
 * Pesan diantre agar tidak saling menimpa; sebelum tiap pesan muncul indikator
 * "sedang mengetik". Pembaca layar menerima teks utuh sekali (bukan per huruf).
 */
(() => {
  "use strict";

  const MAX_BUBBLES = 40;   // riwayat yang dipertahankan di DOM
  const MAX_QUEUE = 4;      // pesan tertunda; yang paling lama dibuang
  const CHAR_MS = 24;       // kecepatan mengetik
  const PAUSE_MS = 110;     // jeda tambahan setelah tanda baca
  const GAP_MS = 220;       // jeda antar pesan
  const TYPING_MS = 380;    // lama indikator "sedang mengetik"

  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function create(root, { onBlip, onMessage } = {}) {
    const log = root.querySelector(".dialog-log");
    let queue = [];
    let running = false;
    let epoch = 0;          // naik saat flush(); membatalkan pemrosesan yang sedang berjalan
    let skipTyping = null;  // fungsi untuk menyelesaikan efek ketik yang aktif

    // ---- DOM helper ------------------------------------------------------------
    function append(el) {
      log.appendChild(el);
      while (log.children.length > MAX_BUBBLES) log.firstElementChild.remove();
      scrollDown();
    }

    function scrollDown() {
      log.scrollTo({ top: log.scrollHeight, behavior: reducedMotion() ? "auto" : "smooth" });
    }

    function setMood(mood) {
      root.dataset.mood = mood || "neutral";
    }

    function markOld() {
      for (const b of log.querySelectorAll(".bubble.is-latest")) b.classList.remove("is-latest");
    }

    function typingIndicator() {
      const el = document.createElement("div");
      el.className = "bubble typing is-latest";
      el.setAttribute("aria-hidden", "true");
      el.innerHTML = "<i></i><i></i><i></i>";
      return el;
    }

    // ---- Menampilkan satu pesan -------------------------------------------------------
    async function show(item, myEpoch) {
      if (item.type === "system") {
        const el = document.createElement("p");
        el.className = "dialog-sys";
        el.textContent = item.text;
        append(el);
        return;
      }

      // 1) indikator "sedang mengetik"
      if (!reducedMotion() && item.typingMs > 0) {
        const dots = typingIndicator();
        markOld();
        append(dots);
        await wait(item.typingMs);
        dots.remove();
        if (myEpoch !== epoch) return;
      }

      // 2) gelembung: teks utuh untuk pembaca layar + salinan visual yang diketik
      const bubble = document.createElement("div");
      bubble.className = "bubble is-latest is-typing";
      const sr = document.createElement("span");
      sr.className = "sr-only";
      sr.textContent = item.text;
      const visible = document.createElement("span");
      visible.setAttribute("aria-hidden", "true");
      bubble.append(sr, visible);
      markOld();
      append(bubble);
      setMood(item.mood);
      if (onMessage) onMessage(item);

      if (reducedMotion()) {
        visible.textContent = item.text;
        bubble.classList.remove("is-typing");
        return;
      }

      await new Promise((resolve) => {
        let i = 0;
        let timer = null;
        const finish = () => {
          clearTimeout(timer);
          visible.textContent = item.text;
          bubble.classList.remove("is-typing");
          skipTyping = null;
          scrollDown();
          resolve();
        };
        skipTyping = finish;
        const step = () => {
          i += 1;
          visible.textContent = item.text.slice(0, i);
          if (onBlip && i % 3 === 0 && item.text[i - 1] !== " ") onBlip();
          if (i >= item.text.length) return finish();
          timer = setTimeout(step, /[.,!?…]/.test(item.text[i - 1]) ? CHAR_MS + PAUSE_MS : CHAR_MS);
        };
        step();
      });
    }

    async function pump() {
      if (running) return;
      running = true;
      const myEpoch = epoch;
      while (queue.length && myEpoch === epoch) {
        const item = queue.shift();
        await show(item, myEpoch);
        if (myEpoch === epoch && queue.length) await wait(GAP_MS);
      }
      if (myEpoch === epoch) running = false;
    }

    function enqueue(item) {
      queue.push(item);
      // Buang pesan bot terlama bila menumpuk (info sistem selalu dipertahankan).
      while (queue.filter((q) => q.type === "say").length > MAX_QUEUE) {
        queue.splice(queue.findIndex((q) => q.type === "say"), 1);
      }
      pump();
    }

    return {
      say(text, mood = "neutral", { typingMs = TYPING_MS } = {}) {
        enqueue({ type: "say", text, mood, typingMs });
      },
      system(text) {
        enqueue({ type: "system", text });
      },
      /** Selesaikan ketikan yang sedang berjalan dan buang pesan yang menunggu. */
      flush() {
        epoch += 1;
        running = false;
        queue = [];
        if (skipTyping) skipTyping();
        log.querySelectorAll(".bubble.typing").forEach((el) => el.remove());
      },
      setMood,
    };
  }

  window.TTTChat = { create };
})();
