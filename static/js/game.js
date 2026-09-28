(() => {
  const root = document.getElementById("game");
  const cfg = {
    mode: root.dataset.mode,
    difficulty: root.dataset.difficulty,
    me: root.dataset.me,
    first: root.dataset.first,
    moveUrl: root.dataset.moveUrl,
    botUrl: root.dataset.botUrl,
  };
  const opp = cfg.me === "X" ? "O" : "X";
  const isPvc = cfg.mode === "pvc";
  const isBot = (mark) => isPvc && mark === opp;
  const DIFFICULTY = { easy: "Easy", medium: "Medium", hard: "Hard" };
  const BOT_DELAY = 550;

  const boardEl = document.getElementById("board");
  const cellsEl = document.getElementById("cells");
  const winLine = document.getElementById("win-line");
  const statusEl = document.getElementById("status");
  const scoreEls = { a: byId("score-a"), d: byId("score-d"), b: byId("score-b") };
  function byId(id) { return document.getElementById(id); }

  const storageKey = "ttt:" + [cfg.mode, cfg.difficulty, cfg.me, cfg.first].join("-");
  let scores = loadScores();
  let board, turn, over, busy, round = 0;

  // ---- Teks ----------------------------------------------------------------
  const nameOf = (mark) =>
    isPvc ? (mark === cfg.me ? "Kamu" : "Komputer") : (mark === cfg.me ? "Pemain 1" : "Pemain 2");

  byId("mode-label").textContent = isPvc
    ? `Melawan Komputer, tingkat ${DIFFICULTY[cfg.difficulty]}`
    : "Dua pemain di satu layar";
  byId("label-a").textContent = isPvc ? "Menang" : "Pemain 1 menang";
  byId("label-b").textContent = isPvc ? "Kalah" : "Pemain 2 menang";

  function setStatus(text, result = false) {
    statusEl.textContent = text;
    statusEl.classList.remove("is-result");
    if (result) { void statusEl.offsetWidth; statusEl.classList.add("is-result"); }
  }

  function turnText() {
    if (isBot(turn)) return "Komputer sedang berpikir…";
    return isPvc ? `Giliranmu (${turn})` : `Giliran ${nameOf(turn)} (${turn})`;
  }

  // ---- Skor ----------------------------------------------------------------
  function loadScores() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey));
      if (saved && ["a", "d", "b"].every((k) => Number.isInteger(saved[k]))) return saved;
    } catch (e) { /* abaikan */ }
    return { a: 0, d: 0, b: 0 };
  }
  function saveScores() {
    try { sessionStorage.setItem(storageKey, JSON.stringify(scores)); } catch (e) { /* abaikan */ }
  }
  function renderScores(bump) {
    for (const key of Object.keys(scoreEls)) scoreEls[key].textContent = scores[key];
    if (bump) {
      const el = scoreEls[bump];
      el.classList.remove("bump");
      void el.offsetWidth;
      el.classList.add("bump");
    }
  }

  // ---- Papan ---------------------------------------------------------------
  const cells = [];
  for (let i = 0; i < 9; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cell";
    btn.addEventListener("click", () => play(i));
    cellsEl.appendChild(btn);
    cells.push(btn);
  }

  const SVG_NS = "http://www.w3.org/2000/svg";
  function markSvg(mark) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("class", `mark mark-${mark.toLowerCase()} is-new`);
    const add = (tag, attrs) => {
      const el = document.createElementNS(SVG_NS, tag);
      el.setAttribute("pathLength", "1");
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      svg.appendChild(el);
    };
    if (mark === "X") {
      add("path", { d: "M22 22L78 78" });
      add("path", { d: "M78 22L22 78" });
    } else {
      add("circle", { cx: 50, cy: 50, r: 30, transform: "rotate(-90 50 50)" });
    }
    return svg;
  }

  function render() {
    boardEl.dataset.turn = over || isBot(turn) ? "" : turn;
    cells.forEach((btn, i) => {
      const value = board[i];
      if ((btn.dataset.mark || "") !== value) {
        btn.replaceChildren();
        btn.dataset.mark = value;
        if (value) btn.appendChild(markSvg(value));
      }
      btn.disabled = over || Boolean(value) || isBot(turn);
      btn.setAttribute("aria-label", `Kotak ${i + 1}, ${value || "kosong"}`);
    });
  }

  function drawWinLine(line) {
    const center = (i) => [(i % 3) * 100 + 50, Math.floor(i / 3) * 100 + 50];
    const [x1, y1] = center(line[0]);
    const [x2, y2] = center(line[2]);
    winLine.setAttribute("d", `M${x1} ${y1}L${x2} ${y2}`);
    winLine.classList.remove("show");
    void winLine.getBoundingClientRect();
    winLine.classList.add("show");
    line.forEach((i) => cells[i].classList.add("is-win"));
  }

  // ---- Server --------------------------------------------------------------
  async function post(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Permintaan ke server gagal.");
    return data;
  }
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function apply(data) {
    board = data.board;
    if (data.status === "in_progress") {
      turn = data.next;
      render();
      setStatus(turnText());
      return;
    }
    over = true;
    render();
    if (data.status === "won") {
      drawWinLine(data.winning_line);
      const mine = data.winner === cfg.me;
      scores[mine ? "a" : "b"] += 1;
      renderScores(mine ? "a" : "b");
      setStatus(
        isPvc
          ? (mine ? "Kamu menang!" : "Komputer menang.")
          : `${nameOf(data.winner)} (${data.winner}) menang!`,
        true
      );
    } else {
      scores.d += 1;
      renderScores("d");
      setStatus("Seri. Papan sudah penuh.", true);
    }
    saveScores();
  }

  async function play(i) {
    if (over || busy || board[i] || isBot(turn)) return;
    busy = true;
    const current = round;
    try {
      const data = await post(cfg.moveUrl, { board, turn, position: i });
      if (current !== round) return;
      apply(data);
    } catch (err) {
      if (current === round) setStatus(err.message);
    } finally {
      if (current === round) busy = false;
    }
    if (current === round && !over && isBot(turn)) botTurn();
  }

  async function botTurn() {
    busy = true;
    const current = round;
    try {
      const [data] = await Promise.all([
        post(cfg.botUrl, { board, turn, difficulty: cfg.difficulty }),
        sleep(BOT_DELAY),
      ]);
      if (current !== round) return;
      apply(data);
    } catch (err) {
      if (current === round) setStatus(`${err.message} Tekan Main Lagi untuk mengulang.`);
    } finally {
      if (current === round) busy = false;
    }
  }

  // ---- Ronde ---------------------------------------------------------------
  function newRound() {
    round += 1;
    board = Array(9).fill("");
    over = false;
    busy = false;
    turn = cfg.first === "me" ? cfg.me : opp;

    winLine.classList.remove("show");
    cells.forEach((btn) => btn.classList.remove("is-win"));
    boardEl.classList.remove("fresh");
    void boardEl.offsetWidth;
    boardEl.classList.add("fresh");

    render();
    setStatus(turnText());
    if (isBot(turn)) botTurn();
  }

  byId("btn-again").addEventListener("click", newRound);
  byId("btn-menu").addEventListener("click", () => {
    try { sessionStorage.removeItem(storageKey); } catch (e) { /* abaikan */ }
  });

  renderScores();
  newRound();
})();
