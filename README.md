# Tic Tac Toe (Flask)

Game Tic Tac Toe berbasis web dengan backend Python/Flask.

- **Mode**: Player vs Player atau Player vs Computer
- **Bot AI** (`src/player.py`):
  - **Easy**: langkah acak
  - **Medium**: menang jika bisa, memblokir lawan (kadang lengah), selain itu acak dengan preferensi tengah/sudut
  - **Hard**: Minimax + alpha-beta pruning, tidak pernah kalah
- Pilih simbol (X/O) dan siapa yang jalan duluan, skorboard (Menang, Seri, Kalah), animasi gambar tanda dan garis kemenangan, responsif

## Menjalankan

```bash
pip install -r requirements.txt
python main.py
```

Buka **http://127.0.0.1:5000**. Jika port 5000 terpakai (misalnya AirPlay Receiver di macOS):
`PORT=5001 python main.py` (Windows PowerShell: `$env:PORT=5001; python main.py`).

## Struktur

```
tic-tac-toe/
├── main.py            # Entry point: menyalakan server lokal
├── src/
│   ├── board.py       # Papan 3x3, validasi, konversi list <-> Board
│   ├── game.py        # State ronde, giliran, menang/seri
│   ├── player.py      # Human, RandomBot, MediumBot, MinimaxBot, create_bot
│   └── web.py         # App Flask: halaman + API
├── templates/         # base.html, index.html (menu), game.html (papan)
├── static/            # css/style.css, js/menu.js, js/game.js
└── tests/             # test_game.py (logika & bot), test_api.py (endpoint)
```

## API

Server stateless: klien mengirim papan (list 9 isian `"X"`, `"O"`, atau `""`) dan giliran,
server memvalidasi lalu membalas papan baru. Indeks kotak 0-8 (kiri-atas ke kanan-bawah).

| Endpoint | Body | Fungsi |
|---|---|---|
| `POST /api/move` | `{board, turn, position}` | Terapkan langkah pemain |
| `POST /api/bot-move` | `{board, turn, difficulty}` | Bot (`easy`/`medium`/`hard`) memilih dan menerapkan langkah |

Respons: `{board, status: in_progress|won|draw, winner, winning_line, next, move}`.
Input tidak valid (kotak terisi, giliran salah, papan mustahil, permainan selesai) dibalas HTTP 400 `{error}`.

## Tes

```bash
python -m pytest -v
```
