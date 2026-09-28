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


# ---- Insight langkah (bahan dialog bot) ------------------------------------
def test_move_returns_insight(client):
    data = client.post("/api/move", json={"board": EMPTY, "turn": "X", "position": 4}).get_json()
    assert data["insight"] == {"kind": "normal", "blocks": False, "threats": 0}


def test_move_insight_reports_player_block(client):
    board = ["X", "X", "", "O", "", "", "", "", ""]  # X mengancam kotak 3; giliran O
    data = client.post("/api/move", json={"board": board, "turn": "O", "position": 2}).get_json()
    assert data["insight"]["kind"] == "block" and data["insight"]["blocks"] is True


def test_bot_move_insight_for_win_and_block(client):
    win = ["O", "O", "", "X", "X", "", "", "", ""]
    data = client.post("/api/bot-move", json={"board": win, "turn": "O", "difficulty": "hard"}).get_json()
    assert data["insight"]["kind"] == "win"

    block = ["X", "X", "", "", "O", "", "", "", ""]
    data = client.post("/api/bot-move", json={"board": block, "turn": "O", "difficulty": "hard"}).get_json()
    assert data["move"] == 2 and data["insight"]["blocks"] is True


# ---- Halaman: Settings & dialog --------------------------------------------
def test_settings_dialog_is_on_menu_and_game_pages(client):
    for url in ("/", "/game?mode=pvc&difficulty=easy", "/game?mode=pvp"):
        html = client.get(url).get_data(as_text=True)
        assert 'id="settings-dialog"' in html and 'id="settings-open"' in html
        assert 'id="vol-master"' in html and 'id="sw-bgm"' in html and 'id="sw-sfx"' in html


def test_all_board_themes_are_offered(client):
    html = client.get("/").get_data(as_text=True)
    for theme in ("classic", "cyberpunk", "wooden", "pastel"):
        assert f'name="board-theme" value="{theme}"' in html
        assert f'[data-theme="{theme}"]' in client.get("/static/css/style.css").get_data(as_text=True)


def test_bot_dialog_only_in_player_vs_computer(client):
    pvc = client.get("/game?mode=pvc&difficulty=hard").get_data(as_text=True)
    pvp = client.get("/game?mode=pvp").get_data(as_text=True)
    assert 'id="dialog"' in pvc and "bot-dialogue.js" in pvc
    assert 'id="dialog"' not in pvp and "bot-dialogue.js" not in pvp


def test_new_static_assets_are_served(client):
    for name in ("audio", "theme", "settings", "bot-dialogue", "chatbox", "game"):
        assert client.get(f"/static/js/{name}.js").status_code == 200
