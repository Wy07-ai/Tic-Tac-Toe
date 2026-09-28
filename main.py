"""Entry point: jalankan dengan `python main.py`, lalu buka URL yang tampil."""

from __future__ import annotations

import os

from src.web import create_app

HOST = "127.0.0.1"
DEFAULT_PORT = 5000


def main() -> int:
    port = int(os.environ.get("PORT", DEFAULT_PORT))  # ganti jika port 5000 terpakai
    app = create_app()
    print(f"\n  Tic Tac Toe berjalan di http://{HOST}:{port}")
    print("  Tekan Ctrl+C untuk berhenti.\n")
    app.run(host=HOST, port=port, debug=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
