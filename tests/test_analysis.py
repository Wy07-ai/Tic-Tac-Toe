"""Tes analisis langkah (src/analysis.py) yang dipakai dialog bot."""

import pytest

from src.analysis import describe_move, winning_positions
from src.board import Board, Mark


def board_from(cells: str) -> Board:
    """Bangun papan dari 9 karakter: X, O, atau titik untuk kosong."""
    return Board.from_cells(["" if c == "." else c for c in cells])


def test_winning_positions_lists_every_immediate_win():
    board = board_from("XX.O.O...")
    assert winning_positions(board, Mark.X) == [3]
    assert winning_positions(board, Mark.O) == [5]


def test_winning_positions_ignores_lines_blocked_by_opponent():
    assert winning_positions(board_from("XXO......"), Mark.X) == []


def test_move_that_completes_a_line_is_win():
    insight = describe_move(board_from("XX.OO...."), 3, Mark.X)
    assert insight.kind == "win"


def test_move_that_closes_opponent_threat_is_block():
    # O mengancam menang di kotak 6; X menutupnya tanpa membuat ancaman sendiri.
    insight = describe_move(board_from("X..OO...."), 6, Mark.X)
    assert insight.kind == "block" and insight.blocks and insight.threats == 0


def test_move_with_one_new_threat_is_threat():
    insight = describe_move(board_from("X...O...."), 2, Mark.X)
    assert insight.kind == "threat" and insight.threats == 1 and not insight.blocks


def test_move_with_two_new_threats_is_fork():
    # X di 1 dan 9; melangkah ke 3 menciptakan ancaman di 2 (baris) dan 6 (kolom).
    insight = describe_move(board_from("X...O...X"), 3, Mark.X)
    assert insight.kind == "fork" and insight.threats == 2


def test_block_that_also_threatens_is_reported_as_threat_but_keeps_block_flag():
    # O mengancam menang di 6 (baris 4-5-6). X menutup di 6 dan, karena sudah punya 3,
    # sekaligus membuat ancaman baru di 9 (kolom 3-6-9).
    insight = describe_move(board_from("..X" "OO." "..."), 6, Mark.X)
    assert insight.blocks is True
    assert insight.kind in {"threat", "fork"} and insight.threats >= 1


def test_plain_move_is_normal():
    assert describe_move(Board(), 5, Mark.X).kind == "normal"


def test_describe_move_does_not_mutate_board():
    board = board_from("X...O....")
    before = board.to_list()
    describe_move(board, 9, Mark.X)
    assert board.to_list() == before


def test_invalid_position_raises():
    with pytest.raises(ValueError):
        describe_move(board_from("X........"), 1, Mark.O)


def test_as_dict_is_json_friendly():
    data = describe_move(Board(), 5, Mark.X).as_dict()
    assert data == {"kind": "normal", "blocks": False, "threats": 0}
