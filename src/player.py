"""Class Player: Human, RandomBot (Easy), MediumBot, dan MinimaxBot (Hard)."""

from __future__ import annotations

import math
import random
from abc import ABC, abstractmethod
from enum import Enum
from typing import Callable, Optional

from .board import Board, Mark

# Fungsi yang meminta langkah dari manusia (disediakan oleh UI).
MoveProvider = Callable[[Board, "Player"], int]


class Difficulty(Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

    @classmethod
    def parse(cls, raw: object) -> Difficulty:
        try:
            return cls(str(raw).lower())
        except ValueError:
            valid = ", ".join(d.value for d in cls)
            raise ValueError(f"Tingkat kesulitan tidak dikenal. Pilih salah satu: {valid}.") from None


class Player(ABC):
    """Kelas dasar semua pemain."""

    is_bot: bool = False

    def __init__(self, name: str, mark: Mark) -> None:
        self.name = name
        self.mark = mark

    @abstractmethod
    def choose_move(self, board: Board) -> int:
        """Pilih posisi (1-9) untuk langkah berikutnya."""

    def __repr__(self) -> str:
        return f"{type(self).__name__}(name={self.name!r}, mark={self.mark.value!r})"


class HumanPlayer(Player):
    """Pemain manusia. Input diambil lewat `move_provider` agar lepas dari UI."""

    def __init__(self, name: str, mark: Mark, move_provider: MoveProvider) -> None:
        super().__init__(name, mark)
        self._move_provider = move_provider

    def choose_move(self, board: Board) -> int:
        return self._move_provider(board, self)


class RandomBot(Player):
    """Easy: memilih kotak kosong secara acak."""

    is_bot = True

    def choose_move(self, board: Board) -> int:
        return random.choice(board.available_moves())


class MediumBot(Player):
    """Medium: logika ofensif/defensif sederhana, sisanya acak.

    Urutan keputusan:
      1. Jika bisa menang dalam satu langkah, ambil (ofensif).
      2. Jika lawan hampir menang, blokir (defensif). Kadang lengah, sesuai
         `block_chance`, supaya masih bisa dikalahkan.
      3. Selain itu, 50% memilih tengah/sudut, sisanya kotak acak.
    Bot ini tidak merencanakan jebakan (fork), jadi pemain yang cermat bisa menang.
    """

    is_bot = True
    PREFERRED = (5, 1, 3, 7, 9)  # tengah lalu sudut

    def __init__(
        self,
        name: str,
        mark: Mark,
        rng: Optional[random.Random] = None,
        block_chance: float = 0.85,
    ) -> None:
        super().__init__(name, mark)
        self._rng = rng or random.Random()
        self._block_chance = block_chance

    def choose_move(self, board: Board) -> int:
        winning = self._finishing_move(board, self.mark)
        if winning is not None:
            return winning

        if self._rng.random() < self._block_chance:
            block = self._finishing_move(board, self.mark.opponent)
            if block is not None:
                return block

        moves = board.available_moves()
        if self._rng.random() < 0.5:
            good = [m for m in self.PREFERRED if m in moves]
            if good:
                return self._rng.choice(good)
        return self._rng.choice(moves)

    @staticmethod
    def _finishing_move(board: Board, mark: Mark) -> Optional[int]:
        """Posisi yang membuat `mark` menang seketika, atau None."""
        for line in Board.WIN_LINES:
            cells = [board.get(p) for p in line]
            if cells.count(mark) == 2 and cells.count(Mark.EMPTY) == 1:
                return line[cells.index(Mark.EMPTY)]
        return None


class MinimaxBot(Player):
    """Hard: Minimax + alpha-beta pruning. Tidak akan pernah kalah."""

    is_bot = True

    def choose_move(self, board: Board) -> int:
        moves = board.available_moves()
        if len(moves) == Board.CELL_COUNT:
            return random.choice(moves)  # papan kosong: semua langkah setara

        work = board.copy()
        best_score = -math.inf
        best_moves: list[int] = []
        for move in moves:
            work.place(move, self.mark)
            score = self._minimax(work, False, -math.inf, math.inf, depth=1)
            work.clear_cell(move)
            if score > best_score:
                best_score, best_moves = score, [move]
            elif score == best_score:
                best_moves.append(move)
        return random.choice(best_moves)  # variasi di antara langkah sama baik

    def _minimax(
        self, board: Board, maximizing: bool, alpha: float, beta: float, depth: int
    ) -> float:
        winner = board.winner()
        if winner is self.mark:
            return 10 - depth  # menang lebih cepat = lebih baik
        if winner is not None:
            return depth - 10  # kalah lebih lambat = lebih baik
        if board.is_full():
            return 0

        mark = self.mark if maximizing else self.mark.opponent
        best = -math.inf if maximizing else math.inf
        for move in board.available_moves():
            board.place(move, mark)
            score = self._minimax(board, not maximizing, alpha, beta, depth + 1)
            board.clear_cell(move)
            if maximizing:
                best = max(best, score)
                alpha = max(alpha, best)
            else:
                best = min(best, score)
                beta = min(beta, best)
            if beta <= alpha:
                break
        return best


def create_bot(difficulty: Difficulty, mark: Mark, name: str = "Komputer") -> Player:
    """Factory untuk membuat bot sesuai tingkat kesulitan."""
    if difficulty is Difficulty.HARD:
        return MinimaxBot(name, mark)
    if difficulty is Difficulty.MEDIUM:
        return MediumBot(name, mark)
    return RandomBot(name, mark)
