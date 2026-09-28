"""Struktur data papan 3x3, rendering, dan validasi input."""

from __future__ import annotations

from enum import Enum
from typing import Callable, Optional, Sequence

CellFormatter = Callable[[int, "Mark"], str]


class Mark(str, Enum):
    """Isi sebuah kotak pada papan."""

    X = "X"
    O = "O"
    EMPTY = " "

    @property
    def opponent(self) -> Mark:
        """Simbol lawan. Tidak valid untuk kotak kosong."""
        if self is Mark.X:
            return Mark.O
        if self is Mark.O:
            return Mark.X
        raise ValueError("Kotak kosong tidak punya lawan.")


class InvalidMoveError(ValueError):
    """Dilempar saat langkah tidak valid (di luar papan, terisi, atau bukan angka)."""


class Board:
    """Papan Tic Tac Toe 3x3.

    Posisi memakai penomoran 1-9 (sesuai yang dilihat pemain):

        1 | 2 | 3
        4 | 5 | 6
        7 | 8 | 9
    """

    SIZE = 3
    CELL_COUNT = SIZE * SIZE
    WIN_LINES: tuple[tuple[int, int, int], ...] = (
        (1, 2, 3), (4, 5, 6), (7, 8, 9),  # baris
        (1, 4, 7), (2, 5, 8), (3, 6, 9),  # kolom
        (1, 5, 9), (3, 5, 7),             # diagonal
    )

    def __init__(self) -> None:
        self._cells: list[Mark] = [Mark.EMPTY] * self.CELL_COUNT

    # ---- Konversi dari/ke list (dipakai API web) -------------------------
    @classmethod
    def from_cells(cls, cells: Sequence[str]) -> Board:
        """Bangun papan dari list 9 isian: "X", "O", atau "" (kosong)."""
        if not isinstance(cells, (list, tuple)) or len(cells) != cls.CELL_COUNT:
            raise InvalidMoveError("Papan harus berupa list berisi 9 kotak.")
        board = cls()
        for index, raw in enumerate(cells):
            if raw in ("", " "):
                continue
            if raw not in ("X", "O"):
                raise InvalidMoveError("Isi kotak hanya boleh 'X', 'O', atau kosong.")
            board._cells[index] = Mark(raw)
        return board

    def to_list(self) -> list[str]:
        """Kebalikan dari from_cells: kotak kosong menjadi string kosong."""
        return ["" if cell is Mark.EMPTY else cell.value for cell in self._cells]

    # ---- Akses & validasi ------------------------------------------------
    @staticmethod
    def parse_position(raw: str) -> int:
        """Ubah input teks menjadi posisi 1-9, atau lempar InvalidMoveError."""
        text = raw.strip()
        if not text.isdigit():
            raise InvalidMoveError("Masukkan angka 1-9.")
        return int(text)

    def validate_move(self, position: int) -> None:
        if not 1 <= position <= self.CELL_COUNT:
            raise InvalidMoveError("Pilih angka antara 1 sampai 9.")
        if self._cells[position - 1] is not Mark.EMPTY:
            raise InvalidMoveError(f"Kotak {position} sudah terisi.")

    def get(self, position: int) -> Mark:
        return self._cells[position - 1]

    def is_valid_move(self, position: int) -> bool:
        try:
            self.validate_move(position)
        except InvalidMoveError:
            return False
        return True

    # ---- Mutasi ----------------------------------------------------------
    def place(self, position: int, mark: Mark) -> None:
        if mark is Mark.EMPTY:
            raise ValueError("Tidak bisa menempatkan kotak kosong.")
        self.validate_move(position)
        self._cells[position - 1] = mark

    def clear_cell(self, position: int) -> None:
        """Kosongkan kotak (dipakai untuk undo pada algoritma Minimax)."""
        self._cells[position - 1] = Mark.EMPTY

    def reset(self) -> None:
        self._cells = [Mark.EMPTY] * self.CELL_COUNT

    def copy(self) -> Board:
        clone = Board()
        clone._cells = list(self._cells)
        return clone

    # ---- Query status ----------------------------------------------------
    def available_moves(self) -> list[int]:
        return [i + 1 for i, cell in enumerate(self._cells) if cell is Mark.EMPTY]

    def is_full(self) -> bool:
        return Mark.EMPTY not in self._cells

    def winning_line(self) -> Optional[tuple[int, int, int]]:
        """Kembalikan tiga posisi yang membentuk kemenangan, atau None."""
        for line in self.WIN_LINES:
            a, b, c = (self.get(p) for p in line)
            if a is not Mark.EMPTY and a is b is c:
                return line
        return None

    def winner(self) -> Optional[Mark]:
        line = self.winning_line()
        return self.get(line[0]) if line else None

    # ---- Render ----------------------------------------------------------
    def render(self, formatter: Optional[CellFormatter] = None) -> str:
        """Render papan menjadi teks.

        `formatter(posisi, mark)` boleh dipakai UI untuk memberi warna.
        Secara default kotak kosong menampilkan nomor posisinya.
        """

        def default(position: int, mark: Mark) -> str:
            return str(position) if mark is Mark.EMPTY else mark.value

        fmt = formatter or default
        rows = []
        for r in range(self.SIZE):
            cells = [
                f" {fmt(p, self.get(p))} "
                for p in range(r * self.SIZE + 1, (r + 1) * self.SIZE + 1)
            ]
            rows.append("│".join(cells))
        separator = "\n" + "┼".join(["───"] * self.SIZE) + "\n"
        return separator.join(rows)

    def __str__(self) -> str:
        return self.render()
