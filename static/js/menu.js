(() => {
  const form = document.getElementById("menu-form");
  const difficultyField = document.getElementById("difficulty-field");
  const hint = document.getElementById("difficulty-hint");

  const HINTS = {
    easy: "Langkah acak. Santai untuk pemanasan.",
    medium: "Menyerang dan menghadang, tapi kadang lengah.",
    hard: "Minimax: tidak pernah kalah. Hasil terbaikmu adalah seri.",
  };

  function sync() {
    const mode = form.elements.mode.value;
    const pvp = mode === "pvp";
    difficultyField.hidden = pvp;
    difficultyField.disabled = pvp; // tidak ikut terkirim saat dua pemain

    hint.textContent = HINTS[form.elements.difficulty.value] || "";
    document.getElementById("mark-legend").textContent = pvp ? "Simbol Pemain 1" : "Simbol kamu";
    document.getElementById("first-me").textContent = pvp ? "Pemain 1" : "Kamu";
    document.getElementById("first-opp").textContent = pvp ? "Pemain 2" : "Komputer";
  }

  form.addEventListener("change", sync);
  sync();
})();
