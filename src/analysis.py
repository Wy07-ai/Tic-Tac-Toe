"""Analisis sebuah langkah untuk memberi konteks pada dialog bot di UI web.

Modul ini murni (tanpa I/O): menerima papan sebelum langkah, posisi, dan mark,
lalu menjelaskan apa arti langkah tersebut (menang, memblokir, membuat ancaman).
"""

from __future__ import annotations

from dataclasses import asdict, dataclass

from .board import Board, Mark


def winning_positions(board: Board, mark: Mark) -> list[int]:
    """Posisi (1-9) yang membuat `mark` menang seketika bila ditempati."""
    found: set[int] = set()
    for line in Board.WIN_LINES:
        cells = [board.get(p) for p in line]
        if cells.count(mark) == 2 and cells.count(Mark.EMPTY) == 1:
            found.add(line[cells.index(Mark.EMPTY)])
    return sorted(found)


@dataclass(frozen=True)
class MoveInsight:
    """Makna sebuah langkah.

    kind (prioritas tertinggi lebih dulu):
      win     - langkah ini menyelesaikan garis
      fork    - menciptakan >= 2 ancaman sekaligus (lawan tak bisa menutup semuanya)
      threat  - menciptakan tepat 1 ancaman (tinggal satu langkah lagi menang)
      block   - menutup ancaman lawan
      normal  - langkah biasa
    """

    kind: str
    blocks: bool  # menutup ancaman lawan (bisa bersamaan dengan threat/fork)
    threats: int  # jumlah ancaman menang-seketika milik pemain setelah langkah

    def as_dict(self) -> dict[str, object]:
        return asdict(self)


def describe_move(before: Board, position: int, mark: Mark) -> MoveInsight:
    """Jelaskan langkah `mark` ke `position` (1-9) pada papan `before`.

    `before` tidak diubah. Posisi harus sah (dilempar InvalidMoveError jika tidak).
    """
    blocks = position in winning_positions(before, mark.opponent)
    after = before.copy()
    after.place(position, mark)

    if after.winner() is mark:
        return MoveInsight("win", blocks, 0)

    threats = len(winning_positions(after, mark))
    if threats >= 2:
        kind = "fork"
    elif threats == 1:
        kind = "threat"
    elif blocks:
        kind = "block"
    else:
        kind = "normal"
    return MoveInsight(kind, blocks, threats)
