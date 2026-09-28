"use strict";

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

class Board {
  constructor(cells = Array(9).fill(null)) {
    this.cells = [...cells];
  }

  availableMoves() {
    return this.cells.flatMap((cell, index) => cell === null ? [index] : []);
  }

  place(position, mark) {
    if (!Number.isInteger(position) || position < 0 || position >= this.cells.length) {
      throw new RangeError("Pilih kotak yang tersedia.");
    }
    if (this.cells[position] !== null || !["X", "O"].includes(mark)) {
      throw new Error("Langkah tidak valid.");
    }
    this.cells[position] = mark;
  }

  clear(position) {
    this.cells[position] = null;
  }

  winner() {
    const line = this.winningLine();
    return line ? this.cells[line[0]] : null;
  }

  winningLine() {
    return WIN_LINES.find(([first, second, third]) =>
      this.cells[first] !== null &&
      this.cells[first] === this.cells[second] &&
      this.cells[second] === this.cells[third]
    ) ?? null;
  }

  isFull() {
    return this.cells.every((cell) => cell !== null);
  }
}

class Game {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = new Board();
    this.currentMark = "X";
    this.status = "in_progress";
  }

  play(position) {
    if (this.status !== "in_progress") throw new Error("Ronde sudah selesai.");
    this.board.place(position, this.currentMark);
    if (this.board.winner()) this.status = "won";
    else if (this.board.isFull()) this.status = "draw";
    else this.currentMark = this.currentMark === "X" ? "O" : "X";
  }
}

class RandomBot {
  chooseMove(board) {
    const moves = board.availableMoves();
    return moves[Math.floor(Math.random() * moves.length)];
  }
}

class MinimaxBot {
  constructor(mark) {
    this.mark = mark;
    this.opponent = mark === "X" ? "O" : "X";
  }

  chooseMove(board) {
    const moves = board.availableMoves();
    if (moves.length === 9) return moves[Math.floor(Math.random() * moves.length)];

    let bestScore = -Infinity;
    let bestMoves = [];
    for (const move of moves) {
      board.place(move, this.mark);
      const score = this.minimax(board, false, -Infinity, Infinity, 1);
      board.clear(move);
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) {
        bestMoves.push(move);
      }
    }
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  minimax(board, maximizing, alpha, beta, depth) {
    const winner = board.winner();
    if (winner === this.mark) return 10 - depth;
    if (winner !== null) return depth - 10;
    if (board.isFull()) return 0;

    const mark = maximizing ? this.mark : this.opponent;
    let best = maximizing ? -Infinity : Infinity;
    for (const move of board.availableMoves()) {
      board.place(move, mark);
      const score = this.minimax(board, !maximizing, alpha, beta, depth + 1);
      board.clear(move);
      if (maximizing) {
        best = Math.max(best, score);
        alpha = Math.max(alpha, best);
      } else {
        best = Math.min(best, score);
        beta = Math.min(beta, best);
      }
      if (beta <= alpha) break;
    }
    return best;
  }
}

class TicTacToeApp {
  constructor() {
    this.game = new Game();
    this.mode = "pvc";
    this.difficulty = "hard";
    this.humanMark = "X";
    this.scores = { X: 0, O: 0, draws: 0, rounds: 0 };
    this.lastMove = null;
    this.boardElement = document.querySelector("#board");
    this.statusElement = document.querySelector("#game-status");
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    document.querySelectorAll("[data-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        this.mode = button.dataset.mode;
        document.querySelectorAll("[data-mode]").forEach((option) => {
          const selected = option === button;
          option.classList.toggle("is-selected", selected);
          option.setAttribute("aria-pressed", String(selected));
        });
        document.querySelector("#difficulty-setting").hidden = this.mode !== "pvc";
        this.updatePlayerNames();
        this.startRound();
      });
    });

    document.querySelector("#difficulty").addEventListener("change", (event) => {
      this.difficulty = event.target.value;
      document.querySelector("#difficulty-hint").textContent = this.difficulty === "hard"
        ? "Bot ini tidak akan pernah kalah."
        : "Bot memilih kotak kosong secara acak.";
      this.startRound();
    });

    document.querySelectorAll("[data-mark]").forEach((button) => {
      button.addEventListener("click", () => {
        this.humanMark = button.dataset.mark;
        document.querySelectorAll("[data-mark]").forEach((option) => {
          const selected = option === button;
          option.classList.toggle("selected", selected);
          option.setAttribute("aria-pressed", String(selected));
        });
        this.updatePlayerNames();
        this.startRound();
      });
    });

    document.querySelector("#new-round").addEventListener("click", () => this.startRound());
    document.querySelector("#reset-score").addEventListener("click", () => {
      this.scores = { X: 0, O: 0, draws: 0, rounds: 0 };
      this.render();
    });
  }

  updatePlayerNames() {
    document.querySelector("#player-x-name").textContent = this.mode === "pvp" || this.humanMark === "X" ? "Anda" : "Bot";
    document.querySelector("#player-o-name").textContent = this.mode === "pvp" ? "Teman" : this.humanMark === "O" ? "Anda" : "Bot";
  }

  startRound() {
    this.game.reset();
    this.lastMove = null;
    this.render();
    if (this.isBotTurn()) this.playBotMove();
  }

  isBotTurn() {
    return this.mode === "pvc" && this.game.currentMark !== this.humanMark && this.game.status === "in_progress";
  }

  handleMove(position) {
    if (this.game.status !== "in_progress" || this.isBotTurn()) return;
    try {
      this.game.play(position);
      this.lastMove = position;
      this.finishRoundIfNeeded();
      this.render();
      if (this.game.status === "in_progress" && this.isBotTurn()) this.playBotMove();
    } catch {
      this.statusElement.textContent = "Kotak itu sudah terisi.";
    }
  }

  playBotMove() {
    this.render();
    window.setTimeout(() => {
      if (!this.isBotTurn()) return;
      const bot = this.difficulty === "hard" ? new MinimaxBot(this.game.currentMark) : new RandomBot();
      const move = bot.chooseMove(this.game.board);
      this.game.play(move);
      this.lastMove = move;
      this.finishRoundIfNeeded();
      this.render();
    }, 420);
  }

  finishRoundIfNeeded() {
    if (this.game.status === "in_progress") return;
    this.scores.rounds += 1;
    if (this.game.status === "draw") this.scores.draws += 1;
    else this.scores[this.game.board.winner()] += 1;
  }

  render() {
    const winningLine = this.game.board.winningLine() ?? [];
    this.boardElement.replaceChildren();
    this.game.board.cells.forEach((mark, index) => {
      const cell = document.createElement("button");
      cell.className = "cell";
      cell.type = "button";
      cell.setAttribute("aria-label", mark ? `Kotak ${index + 1}, ${mark}` : `Kotak ${index + 1}, kosong`);
      cell.textContent = mark === "X" ? "×" : mark === "O" ? "○" : "";
      if (mark) cell.classList.add(`mark-${mark}`);
      if (winningLine.includes(index)) cell.classList.add("is-winning");
      if (index === this.lastMove) cell.classList.add("is-last");
      cell.disabled = mark !== null || this.game.status !== "in_progress" || this.isBotTurn();
      cell.addEventListener("click", () => this.handleMove(index));
      this.boardElement.append(cell);
    });

    document.querySelector("#score-x").textContent = this.scores.X;
    document.querySelector("#score-o").textContent = this.scores.O;
    document.querySelector("#round-count").textContent = this.scores.rounds;
    document.querySelector("#player-x-card").classList.toggle("is-active", this.game.currentMark === "X" && this.game.status === "in_progress");
    document.querySelector("#player-o-card").classList.toggle("is-active", this.game.currentMark === "O" && this.game.status === "in_progress");
    this.updateStatus();
  }

  updateStatus() {
    if (this.game.status === "won") {
      const winner = this.game.board.winner();
      const winnerName = this.mode === "pvp" ? (winner === "X" ? "Anda" : "Teman") : winner === this.humanMark ? "Anda" : "Bot";
      this.statusElement.textContent = `${winnerName} menang! Ronde baru?`;
    } else if (this.game.status === "draw") {
      this.statusElement.textContent = "Seri! Ronde baru?";
    } else if (this.mode === "pvp") {
      this.statusElement.textContent = `Giliran ${this.game.currentMark === "X" ? "Anda (X)" : "Teman (O)"}`;
    } else if (this.isBotTurn()) {
      this.statusElement.textContent = "Bot sedang berpikir...";
    } else {
      this.statusElement.textContent = `Giliran Anda (${this.humanMark})`;
    }
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { Board, Game, RandomBot, MinimaxBot, WIN_LINES };
}

if (typeof document !== "undefined") new TicTacToeApp();