"""Aplikasi web Flask: halaman menu, halaman game, dan API langkah/bot.

Server bersifat stateless: klien mengirim papan + giliran, server memvalidasi,
memproses langkah, lalu mengembalikan papan baru beserta status permainannya.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from flask import Flask, jsonify, redirect, render_template, request, url_for

from .board import Board, InvalidMoveError, Mark
from .player import Difficulty, create_bot

ROOT = Path(__file__).resolve().parent.parent
MODES = ("pvc", "pvp")
FIRST_CHOICES = ("me", "opp")  # "me" = pemain 1 jalan duluan


class ApiError(Exception):
    """Kesalahan input dari klien; dikembalikan sebagai JSON 400."""


# ---- Helper validasi & serialisasi -----------------------------------------
def _parse_mark(raw: object) -> Mark:
    if raw not in ("X", "O"):
        raise ApiError("Giliran ('turn') harus 'X' atau 'O'.")
    return Mark(raw)


def _read_state(payload: Any) -> tuple[Board, Mark]:
    """Baca & validasi {board, turn}. Papan harus mungkin terjadi dan belum selesai."""
    if not isinstance(payload, dict):
        raise ApiError("Body request harus berupa JSON object.")
    try:
        board = Board.from_cells(payload.get("board"))
    except InvalidMoveError as err:
        raise ApiError(str(err)) from None
    turn = _parse_mark(payload.get("turn"))

    cells = board.to_list()
    x_count, o_count = cells.count("X"), cells.count("O")
    if abs(x_count - o_count) > 1:
        raise ApiError("Papan tidak valid: jumlah X dan O terlalu timpang.")
    if (x_count > o_count and turn is Mark.X) or (o_count > x_count and turn is Mark.O):
        raise ApiError(f"Papan tidak cocok dengan giliran {turn.value}.")
    if board.winner() is not None or board.is_full():
        raise ApiError("Permainan sudah selesai.")
    return board, turn


def _snapshot(board: Board, played: Mark) -> dict[str, Any]:
    """Ringkasan state setelah `played` melangkah. Indeks kotak 0-8."""
    winner = board.winner()
    line = board.winning_line()
    if winner is not None:
        status = "won"
    elif board.is_full():
        status = "draw"
    else:
        status = "in_progress"
    return {
        "board": board.to_list(),
        "status": status,
        "winner": winner.value if winner else None,
        "winning_line": [p - 1 for p in line] if line else None,
        "next": played.opponent.value if status == "in_progress" else None,
    }


def _parse_config(args: Any) -> dict[str, str] | None:
    """Validasi query string halaman game. None berarti tidak valid."""
    mode = args.get("mode")
    mark = args.get("mark", "X")
    first = args.get("first", "me")
    try:
        difficulty = Difficulty.parse(args.get("difficulty", "medium")).value
    except ValueError:
        return None
    if mode not in MODES or mark not in ("X", "O") or first not in FIRST_CHOICES:
        return None
    return {"mode": mode, "difficulty": difficulty, "mark": mark, "first": first}


# ---- Factory aplikasi -------------------------------------------------------
def create_app() -> Flask:
    app = Flask(
        __name__,
        template_folder=str(ROOT / "templates"),
        static_folder=str(ROOT / "static"),
    )

    @app.errorhandler(ApiError)
    def handle_api_error(err: ApiError):
        return jsonify(error=str(err)), 400

    @app.get("/")
    def menu():
        return render_template("index.html")

    @app.get("/game")
    def game():
        config = _parse_config(request.args)
        if config is None:
            return redirect(url_for("menu"))
        return render_template("game.html", cfg=config)

    @app.post("/api/move")
    def api_move():
        """Terapkan langkah pemain manusia. Body: {board, turn, position (0-8)}."""
        payload = request.get_json(silent=True)
        board, turn = _read_state(payload)
        position = payload.get("position")
        if not isinstance(position, int) or isinstance(position, bool) or not 0 <= position <= 8:
            raise ApiError("Posisi kotak ('position') harus angka 0 sampai 8.")
        try:
            board.place(position + 1, turn)
        except InvalidMoveError as err:
            raise ApiError(str(err)) from None
        return jsonify(_snapshot(board, turn) | {"move": position})

    @app.post("/api/bot-move")
    def api_bot_move():
        """Minta bot melangkah. Body: {board, turn, difficulty: easy|medium|hard}."""
        payload = request.get_json(silent=True)
        board, turn = _read_state(payload)
        try:
            difficulty = Difficulty.parse(payload.get("difficulty"))
        except ValueError as err:
            raise ApiError(str(err)) from None
        move = create_bot(difficulty, turn).choose_move(board)
        board.place(move, turn)
        return jsonify(_snapshot(board, turn) | {"move": move - 1})

    return app
