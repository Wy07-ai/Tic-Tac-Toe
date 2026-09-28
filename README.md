# Tic Tac Toe (Flask)

Game Tic Tac Toe berbasis web dengan backend Python/Flask.

- **Mode**: Player vs Player atau Player vs Computer
- **Bot AI** (`src/player.py`):
  - **Easy**: langkah acak
  - **Medium**: menang jika bisa, memblokir lawan (kadang lengah), selain itu acak dengan preferensi tengah/sudut
  - **Hard**: Minimax + alpha-beta pruning, tidak pernah kalah
- Pilih simbol (X/O) dan siapa yang jalan duluan, skorboard (Menang, Seri, Kalah), animasi gambar tanda dan garis kemenangan, responsif
- **Pengaturan** (tombol di pojok kanan atas, tersedia di Lobby dan saat bermain):
  - Audio: volume utama, mute musik latar (BGM), mute efek suara (SFX). Musik dan SFX dibuat lewat Web Audio API (tanpa berkas suara) dan berbeda karakter tiap tema
  - 4 tema papan: **Classic Dark** (default), **Cyberpunk Neon**, **Wooden Retro**, **Pastel Minimal**. Berganti instan lewat CSS variables dan tersimpan di `localStorage`
- **Dialog bot ala RPG** (mode Player vs Komputer): Bobo (Easy), Nova (Medium), dan Zero (Hard) bereaksi terhadap alur permainan: sapaan awal, memblokir, mengancam/menjebak, pemain memblokir, dan hasil ronde. Kalimat diacak dan tidak berulang beruntun
- Tema terang/gelap yang tersimpan dan efek suara untuk langkah, hasil ronde, serta ronde baru

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
│   ├── analysis.py    # Makna sebuah langkah (menang/fork/ancaman/blok) untuk dialog bot
│   └── web.py         # App Flask: halaman + API + daftar tema
├── templates/         # base.html (modal Settings), index.html (menu), game.html (papan + dialog)
├── static/
│   ├── css/style.css  # Tema (CSS variables), modal Settings, dialog bot
│   └── js/
│       ├── audio.js         # TTTAudio: master volume, BGM, SFX (global, aktif sejak Lobby)
│       ├── theme.js         # TTTTheme: ganti tema + simpan
│       ├── settings.js      # Logika modal Pengaturan
│       ├── bot-dialogue.js  # Kalimat & logika reaksi bot (murni, bisa diuji di Node)
│       ├── chatbox.js       # UI gelembung chat + efek mengetik
│       ├── menu.js, game.js
└── tests/             # test_game.py, test_api.py, test_analysis.py (pytest); js/ (node --test)
```

## API

Server stateless: klien mengirim papan (list 9 isian `"X"`, `"O"`, atau `""`) dan giliran,
server memvalidasi lalu membalas papan baru. Indeks kotak 0-8 (kiri-atas ke kanan-bawah).

| Endpoint | Body | Fungsi |
|---|---|---|
| `POST /api/move` | `{board, turn, position}` | Terapkan langkah pemain |
| `POST /api/bot-move` | `{board, turn, difficulty}` | Bot (`easy`/`medium`/`hard`) memilih dan menerapkan langkah |

Respons: `{board, status: in_progress|won|draw, winner, winning_line, next, move, insight}`.
`insight` = `{kind: win|fork|threat|block|normal, blocks, threats}`, dipakai dialog bot untuk memilih reaksi.
Input tidak valid (kotak terisi, giliran salah, papan mustahil, permainan selesai) dibalas HTTP 400 `{error}`.

## Tes

```bash
python -m pytest -v      # backend (Python)
node --test              # logika dialog bot (Node 18+, tanpa dependensi)
```

## Menambah tema
Tambahkan blok `[data-theme="nama"]` di `static/css/style.css` (salin salah satu tema sebagai patokan),
lalu daftarkan `{id, name, desc, color}` di `THEMES` pada `src/web.py`. Kartu pilihan tema muncul otomatis.
