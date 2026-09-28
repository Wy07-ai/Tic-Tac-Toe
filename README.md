# 🎮 Tic Tac Toe (Python CLI)

Game Tic Tac Toe berbasis terminal dengan arsitektur modular, OOP, dan type hinting.

## Fitur
- **Player vs Player** (lokal, bergantian)
- **Player vs Komputer**
  - *Sulit*: algoritma **Minimax + alpha-beta pruning** (tidak pernah kalah)
  - *Mudah*: langkah acak
- Tampilan terminal berwarna, kemenangan disorot, papan bernomor 1-9, papan skor antar ronde

## Struktur
```
tic-tac-toe/
├── src/
│   ├── board.py    # Papan 3x3, validasi, render
│   ├── player.py   # Player, HumanPlayer, RandomBot, MinimaxBot
│   ├── game.py     # State game, giliran, menang/seri
│   └── ui.py       # Antarmuka CLI
├── tests/test_game.py
├── main.py         # Entry point
└── requirements.txt
```

Prinsip desain: `Game` tidak melakukan I/O; `HumanPlayer` menerima *move provider*
dari UI, sehingga logika mudah diuji dan UI mudah diganti (misalnya GUI/web).

## Menjalankan
Butuh **Python 3.10+** (tanpa dependensi eksternal untuk bermain).

```bash
python main.py        # di Windows bisa: py main.py
```

Kotak diberi nomor:
```
 1 │ 2 │ 3
───┼───┼───
 4 │ 5 │ 6
───┼───┼───
 7 │ 8 │ 9
```
Ketik `q` kapan saja untuk keluar. Set `NO_COLOR=1` untuk mematikan warna.

## Menjalankan Unit Test
Dari folder root proyek:

```bash
# Tanpa instalasi apa pun (unittest bawaan Python)
python -m unittest discover -s tests -v

# Atau dengan pytest
pip install -r requirements.txt
python -m pytest -v
```
