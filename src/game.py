"""Logika utama game: state, giliran, dan deteksi menang/seri."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from .board import Board, Mark
from .player import Player


class GameMode(Enum):
    PVP = "pvp"  # Player vs Player
    PVC = "pvc"  # Player vs Computer


class GameStatus(Enum):
    IN_PROGRESS = "in_progress"
    WON = "won"
    DRAW = "draw"


class Game:
    """Mengatur jalannya satu ronde. Tidak melakukan I/O apa pun."""

    def __init__(
        self,
        player_x: Player,
        player_o: Player,
        board: Optional[Board] = None,
        first: Mark = Mark.X,
    ) -> None:
        if player_x.mark is not Mark.X or player_o.mark is not Mark.O:
            raise ValueError("player_x harus bermark X dan player_o harus bermark O.")
        self.board: Board = board if board is not None else Board()
        self._players = {Mark.X: player_x, Mark.O: player_o}
        if first is Mark.EMPTY:
            raise ValueError("first harus Mark.X atau Mark.O.")
        self._first = first
        self._current_mark = first  # default: X jalan duluan
        self._status = GameStatus.IN_PROGRESS
        self._update_status()

    # ---- Properti --------------------------------------------------------
    @property
    def current_player(self) -> Player:
        return self._players[self._current_mark]

    @property
    def status(self) -> GameStatus:
        return self._status

    @property
    def is_over(self) -> bool:
        return self._status is not GameStatus.IN_PROGRESS

    @property
    def winner(self) -> Optional[Player]:
        mark = self.board.winner()
        return self._players[mark] if mark else None

    @property
    def winning_line(self) -> Optional[tuple[int, int, int]]:
        return self.board.winning_line()

    # ---- Aksi ------------------------------------------------------------
    def play_turn(self) -> int:
        """Minta langkah dari pemain saat ini, terapkan, lalu ganti giliran."""
        if self.is_over:
            raise RuntimeError("Permainan sudah selesai.")
        player = self.current_player
        move = player.choose_move(self.board)
        self.board.place(move, player.mark)
        self._update_status()
        if not self.is_over:
            self._current_mark = self._current_mark.opponent
        return move

    def reset(self) -> None:
        self.board.reset()
        self._current_mark = self._first
        self._update_status()

    # ---- Internal --------------------------------------------------------
    def _update_status(self) -> None:
        if self.board.winner() is not None:
            self._status = GameStatus.WON
        elif self.board.is_full():
            self._status = GameStatus.DRAW
        else:
            self._status = GameStatus.IN_PROGRESS
