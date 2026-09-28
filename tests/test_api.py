"""Tes endpoint Flask. Jalankan: `python -m pytest` (butuh Flask + pytest)."""

import pytest

flask = pytest.importorskip("flask")

from src.web import create_app  # noqa: E402

EMPTY = [""] * 9


@pytest.fixture()
def client():
    return create_app().test_client()


def test_pages_render(client):
    assert client.get("/").status_code == 200
    ok = client.get("/game?mode=pvc&difficulty=hard&mark=O&first=opp")
    assert ok.status_code == 200 and b'data-me="O"' in ok.data
    assert client.get("/game?mode=nope").status_code == 302  # kembali ke menu
    assert client.get("/static/js/game.js").status_code == 200


def test_move_applies_and_switches_turn(client):
    data = client.post("/api/move", json={"board": EMPTY, "turn": "X", "position": 4}).get_json()
    assert data["board"][4] == "X" and data["next"] == "O" and data["status"] == "in_progress"


def test_move_detects_win_and_line(client):
    board = ["X", "X", "", "O", "O", "", "", "", ""]
    data = client.post("/api/move", json={"board": board, "turn": "X", "position": 2}).get_json()
    assert data["status"] == "won" and data["winner"] == "X"
    assert data["winning_line"] == [0, 1, 2] and data["next"] is None


def test_move_detects_draw(client):
    board = ["X", "O", "X", "X", "O", "O", "O", "X", ""]
    data = client.post("/api/move", json={"board": board, "turn": "X", "position": 8}).get_json()
    assert data["status"] == "draw" and data["winner"] is None


@pytest.mark.parametrize(
    "payload",
    [
        {"board": EMPTY, "turn": "X", "position": 9},                          # di luar papan
        {"board": EMPTY, "turn": "X", "position": "1"},                        # bukan angka
        {"board": ["X"] + [""] * 8, "turn": "X", "position": 1},               # giliran salah
        {"board": ["X", "X", "X", "O", "O", "", "", "", ""], "turn": "O", "position": 5},  # sudah selesai
        {"board": ["X", "X", "X", "X"] + [""] * 5, "turn": "O", "position": 5},  # papan mustahil
        {"board": ["X", "", ""], "turn": "X", "position": 1},                  # ukuran salah
        {"board": ["X"] + [""] * 8, "turn": "O", "position": 0},               # kotak terisi
    ],
)
def test_move_rejects_bad_input(client, payload):
    res = client.post("/api/move", json=payload)
    assert res.status_code == 400 and "error" in res.get_json()


def test_move_rejects_non_json(client):
    assert client.post("/api/move", data="halo").status_code == 400


@pytest.mark.parametrize("difficulty", ["easy", "medium", "hard"])
def test_bot_move_is_legal(client, difficulty):
    board = ["X", "", "", "", "O", "", "", "", ""]
    data = client.post("/api/bot-move", json={"board": board, "turn": "X", "difficulty": difficulty}).get_json()
    assert board[data["move"]] == "" and data["board"][data["move"]] == "X"


def test_bot_move_hard_takes_win_and_medium_blocks(client):
    win = ["O", "O", "", "X", "X", "", "", "", ""]
    data = client.post("/api/bot-move", json={"board": win, "turn": "O", "difficulty": "hard"}).get_json()
    assert data["move"] == 2 and data["status"] == "won"


def test_bot_move_rejects_bad_difficulty(client):
    res = client.post("/api/bot-move", json={"board": EMPTY, "turn": "X", "difficulty": "godlike"})
    assert res.status_code == 400
