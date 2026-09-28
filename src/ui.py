"""Tampilan CLI terminal: menu, papan berwarna, dan input pemain."""

from __future__ import annotations

import os
import sys
import time
from typing import Mapping, Optional, TypeVar

from .board import Board, InvalidMoveError, Mark
from .game import Game, GameMode, GameStatus
from .player import Difficulty, Player

T = TypeVar("T")


class QuitGame(Exception):
    """Dilempar saat pemain mengetik 'q' untuk keluar."""


class _Ansi:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RED = "\033[91m"
    CYAN = "\033[96m"
    YELLOW = "\033[93m"
    GREEN = "\033[92m"


class ConsoleUI:
    """Antarmuka baris perintah. Warna otomatis mati jika terminal tidak mendukung."""

    WIDTH = 34

    def __init__(
        self,
        use_color: Optional[bool] = None,
        clear_screen: bool = True,
        bot_delay: float = 0.7,
    ) -> None:
        if use_color is None:
            use_color = sys.stdout.isatty() and "NO_COLOR" not in os.environ
        self._color = use_color
        self._clear = clear_screen and sys.stdout.isatty()
        self._bot_delay = bot_delay
        if os.name == "nt":
            os.system("")  # aktifkan ANSI di Windows 10+

    # ---- Helper tampilan -------------------------------------------------
    def _paint(self, text: str, *codes: str) -> str:
        if not self._color or not codes:
            return text
        return "".join(codes) + text + _Ansi.RESET

    def _mark_text(self, mark: Mark) -> str:
        color = _Ansi.RED if mark is Mark.X else _Ansi.CYAN
        return self._paint(mark.value, _Ansi.BOLD, color)

    def _clear_screen(self) -> None:
        if self._clear:
            print("\033[2J\033[H", end="")

    def _banner(self) -> None:
        line = "═" * self.WIDTH
        print(self._paint(line, _Ansi.YELLOW))
        print(self._paint("TIC TAC TOE".center(self.WIDTH), _Ansi.BOLD, _Ansi.YELLOW))
        print(self._paint(line, _Ansi.YELLOW))

    # ---- Input -----------------------------------------------------------
    def _input(self, prompt: str) -> str:
        answer = input(prompt).strip()
        if answer.lower() in {"q", "quit", "keluar"}:
            raise QuitGame
        return answer

    def _ask_choice(self, prompt: str, options: Mapping[str, T]) -> T:
        while True:
            answer = self._input(prompt).lower()
            if answer in options:
                return options[answer]
            print(self._paint("  Pilihan tidak valid, coba lagi.", _Ansi.RED))

    # ---- Menu setup ------------------------------------------------------
    def show_welcome(self) -> None:
        self._clear_screen()
        self._banner()
        print(self._paint("  Ketik 'q' kapan saja untuk keluar.\n", _Ansi.DIM))

    def choose_mode(self) -> GameMode:
        print("Pilih mode permainan:")
        print("  1) Player vs Player")
        print("  2) Player vs Komputer")
        return self._ask_choice("> ", {"1": GameMode.PVP, "2": GameMode.PVC})

    def choose_difficulty(self) -> Difficulty:
        print("\nTingkat kesulitan komputer:")
        print("  1) Sulit  (Minimax, tak terkalahkan)")
        print("  2) Mudah  (langkah acak)")
        return self._ask_choice("> ", {"1": Difficulty.HARD, "2": Difficulty.EASY})

    def choose_mark(self) -> Mark:
        print("\nPilih simbol Anda (X jalan lebih dulu):")
        return self._ask_choice("X / O > ", {"x": Mark.X, "o": Mark.O})

    def ask_name(self, label: str, default: str) -> str:
        answer = self._input(f"\nNama {label} [{default}]: ")
        return answer or default

    # ---- Selama permainan ------------------------------------------------
    def _board_text(self, board: Board, highlight: tuple[int, ...] = ()) -> str:
        def fmt(position: int, mark: Mark) -> str:
            if mark is Mark.EMPTY:
                return self._paint(str(position), _Ansi.DIM)
            if position in highlight:
                return self._paint(mark.value, _Ansi.BOLD, _Ansi.GREEN)
            return self._mark_text(mark)

        return "\n".join("    " + row for row in board.render(fmt).split("\n"))

    def show_board(self, board: Board, current: Player, notice: Optional[str] = None) -> None:
        self._clear_screen()
        self._banner()
        print()
        print(self._board_text(board))
        print()
        if notice:
            print(self._paint(f"  {notice}", _Ansi.DIM))
        print(f"  Giliran: {current.name} ({self._mark_text(current.mark)})")

    def prompt_move(self, board: Board, player: Player) -> int:
        """Minta langkah dari manusia sampai input valid."""
        while True:
            raw = self._input(f"  {player.name}, pilih kotak (1-9): ")
            try:
                position = board.parse_position(raw)
                board.validate_move(position)
                return position
            except InvalidMoveError as err:
                print(self._paint(f"  ✗ {err}", _Ansi.RED))

    def show_bot_thinking(self, player: Player) -> None:
        print(self._paint(f"  {player.name} sedang berpikir...", _Ansi.DIM))
        time.sleep(self._bot_delay)

    # ---- Hasil -----------------------------------------------------------
    def show_result(self, game: Game) -> None:
        self._clear_screen()
        self._banner()
        print()
        print(self._board_text(game.board, game.winning_line or ()))
        print()
        if game.status is GameStatus.WON and game.winner:
            winner = game.winner
            text = f"🎉 {winner.name} ({winner.mark.value}) menang!"
            print(self._paint(f"  {text}", _Ansi.BOLD, _Ansi.GREEN))
        else:
            print(self._paint("  🤝 Permainan seri!", _Ansi.BOLD, _Ansi.YELLOW))

    def show_scoreboard(self, names: tuple[str, str], wins: Mapping[str, int], draws: int) -> None:
        print(self._paint("\n  ── Skor ──", _Ansi.BOLD))
        for name in names:
            print(f"  {name}: {wins.get(name, 0)}")
        print(f"  Seri: {draws}\n")

    def ask_play_again(self) -> bool:
        return self._ask_choice("  Main lagi? (y/n): ", {"y": True, "n": False})

    def show_goodbye(self) -> None:
        print(self._paint("\n  Terima kasih sudah bermain! 👋\n", _Ansi.YELLOW))
