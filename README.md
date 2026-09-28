🎮 Tic Tac Toe — Flask Web Game

A modern Tic Tac Toe web game built with Python + Flask, featuring multiple game modes, three AI difficulty levels, interactive bot dialogue, themes, audio effects, settings, and automated tests.

Project type: Web application
Backend: Python / Flask
Frontend: HTML, CSS, JavaScript
AI: Random, heuristic, and Minimax with alpha-beta pruning

✨ Features

🎯 Game Modes

Player vs Computer (PvC)

Player vs Player (PvP)

Choose whether you play as X or O

Choose who makes the first move

Scoreboard for wins, draws, and losses

Automatic detection of wins, draws, and winning lines

🤖 Three AI Difficulties

Difficulty

Bot

Behavior

🟢 Easy

RandomBot

Chooses an available square randomly

🟡 Medium

MediumBot

Prioritizes winning moves, can block the opponent, and otherwise makes semi-random strategic choices

🔴 Hard

MinimaxBot

Uses Minimax with alpha-beta pruning and cannot be beaten under optimal play

The Hard bot also randomizes between equally optimal moves so that every game does not necessarily begin with exactly the same sequence.

💬 RPG-Style Bot Dialogue

When playing against the computer, the bot reacts to what happens on the board.

The dialogue system can recognize:

🏆 Winning moves

🛡️ Blocking moves

🎯 Threats

♟️ Forks

👀 When the player blocks the bot

🤝 Draws

😈 Different personalities based on difficulty

Each difficulty has its own persona:

Bobo — Easy

Nova — Medium

Zero — Hard

The dialogue supports randomized responses, contextual comments, avatar moods, typing effects, and short-term protection against repeating the same lines.

🎨 Themes

Four board themes are available:

🌑 Classic Dark

💜 Cyberpunk Neon

🪵 Wooden Retro

🌸 Pastel Minimal

Themes can be changed instantly and are saved using localStorage.

🔊 Audio & Settings

The settings panel includes:

Master volume

BGM toggle

SFX toggle

Theme selection

Light/dark UI preference

Audio is generated through the Web Audio API, so the project does not require separate audio files for its game sounds.

📱 Responsive UI

The interface is designed to work across different screen sizes and includes:

Animated Tic Tac Toe board

Animated X/O marks

Animated winning lines

Responsive layout

Accessible status messages

Reduced-motion support

🧠 How the AI Works

Easy

The Easy bot simply chooses one of the currently available squares at random.

available moves
      ↓
random choice
      ↓
make move

Medium

The Medium bot follows a simple priority system:

🏆 Take an immediate winning move if available.

🛡️ Try to block the opponent.

🎯 Prefer the center or corners sometimes.

🎲 Otherwise choose an available square randomly.

The bot intentionally has a chance to miss a block, keeping the difficulty beatable.

Hard

The Hard bot uses Minimax with alpha-beta pruning.

Conceptually:

Current position
      │
      ▼
Generate possible moves
      │
      ▼
Simulate opponent responses
      │
      ▼
Evaluate resulting positions
      │
      ▼
Choose the optimal move

For a standard 3×3 Tic Tac Toe board, this makes the Hard bot unbeatable when playing correctly.

🔍 Move Analysis

The backend contains a dedicated move-analysis module in src/analysis.py.

A move can be classified as:

Type

Meaning

win

The move immediately wins the game

fork

The move creates two or more winning threats

threat

The move creates one immediate winning threat

block

The move prevents an opponent's immediate win

normal

A normal move without one of the conditions above

The analysis is used by the bot dialogue system to make its reactions correspond to what actually happened on the board.

🌐 Web API

The Flask backend is stateless. The browser sends the current board and turn to the server, and the server validates and processes the requested move.

POST /api/move

Apply a player's move.

Example request:

{
  "board": ["X", "X", "", "O", "", "", "", "", ""],
  "turn": "X",
  "position": 2
}

position uses a 0–8 index:

0 | 1 | 2
---------
3 | 4 | 5
---------
6 | 7 | 8

POST /api/bot-move

Ask the selected AI difficulty to make a move.

{
  "board": ["X", "", "", "", "O", "", "", "", ""],
  "turn": "X",
  "difficulty": "hard"
}

Supported difficulties:

easy
medium
hard

API Response

The game endpoints return information such as:

{
  "board": ["X", "", "O", "", "X", "", "", "", ""],
  "status": "in_progress",
  "winner": null,
  "winning_line": null,
  "next": "O",
  "move": 4,
  "insight": {
    "kind": "normal",
    "blocks": false,
    "threats": 0
  }
}

Invalid requests return HTTP 400 with an error message.

🗂️ Project Structure

tic-tac-toe/
├── main.py
├── requirements.txt
├── README.md
│
├── src/
│   ├── __init__.py
│   ├── board.py
│   ├── game.py
│   ├── player.py
│   ├── analysis.py
│   └── web.py
│
├── templates/
│   ├── base.html
│   ├── index.html
│   └── game.html
│
├── static/
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       ├── audio.js
│       ├── bot-dialogue.js
│       ├── chatbox.js
│       ├── game.js
│       ├── menu.js
│       ├── settings.js
│       └── theme.js
│
└── tests/
    ├── test_analysis.py
    ├── test_api.py
    ├── test_game.py
    │
    └── js/
        └── bot-dialogue.test.js

Main modules

File

Responsibility

main.py

Starts the Flask development server

src/board.py

Board state, validation, winning lines, and rendering

src/game.py

Game state, turns, wins, and draws

src/player.py

Human player and AI implementations

src/analysis.py

Analyzes the meaning of moves

src/web.py

Flask pages, API endpoints, validation, and theme configuration

static/js/game.js

Browser-side game interaction

static/js/bot-dialogue.js

Bot personalities and dialogue logic

static/js/chatbox.js

RPG-style dialogue UI and typing effect

static/js/audio.js

BGM and sound effects

static/js/theme.js

Theme management

static/js/settings.js

Settings dialog

static/css/style.css

UI, animations, and themes

🚀 Installation

Requirements

Python 3.10+

Flask 3.0+

pytest 7.0+ for Python tests

Node.js 18+ for JavaScript dialogue tests

1. Clone the repository

git clone <your-repository-url>
cd tic-tac-toe

2. Install Python dependencies

pip install -r requirements.txt

Using a virtual environment is recommended:

python -m venv .venv

Activate it:

Windows PowerShell

.venv\Scripts\Activate.ps1

Linux / macOS

source .venv/bin/activate

Then:

pip install -r requirements.txt

▶️ Running the Game

Start the Flask server:

python main.py

The application will normally be available at:

http://127.0.0.1:5000

Open that address in your browser. 🎮

Using another port

The application reads the PORT environment variable.

Linux / macOS

PORT=5001 python main.py

Windows PowerShell

$env:PORT=5001
python main.py

🧪 Testing

Python tests

Run:

python -m pytest -v

The test suite covers:

Board validation

Win/draw detection

Turn handling

Player behavior

Easy/Medium/Hard AI

Minimax behavior

API validation

API responses

Move analysis

Theme availability

Settings UI

Bot dialogue integration

The current Python test suite in this project passes with:

35 passed, 1 skipped

JavaScript tests

The bot dialogue module can also be tested independently with Node.js:

node --test tests/js/bot-dialogue.test.js

The JavaScript tests cover:

Bot personas

Dialogue categories

Win/loss/draw reactions

Threat and fork detection

Player blocking reactions

Randomized dialogue

Dialogue memory

Contextual board comments

🎨 Adding a New Theme

To add another board theme:

1. Add the CSS variables

Edit:

static/css/style.css

Add a new selector:

[data-theme="my-theme"] {
    /* theme variables */
}

2. Register the theme

Edit the THEMES collection in:

src/web.py

Add the theme's:

id

name

desc

color

The theme will then become available in the Settings interface.

🛠️ Development Notes

The project separates the core game logic from the web interface.

                 ┌──────────────────┐
                 │   Flask Web App  │
                 │    src/web.py    │
                 └────────┬─────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
       ┌─────────────┐        ┌──────────────┐
       │ Game Logic  │        │ Move Analysis│
       │ board/game  │        │  analysis.py │
       │   player    │        └──────────────┘
       └──────┬──────┘
              │
              ▼
       ┌─────────────┐
       │    AI Bots  │
       │ Random      │
       │ Medium      │
       │ Minimax     │
       └─────────────┘

The frontend communicates with the backend through the Flask API, while presentation-specific features such as themes, audio, animations, and dialogue remain on the client side.

📜 License

No license file is currently included in this repository.

If this project is going to be published publicly, consider adding an appropriate open-source license such as MIT, Apache-2.0, or GPL-3.0.

🎮 Enjoy the Game

Choose your symbol, select your opponent, pick a difficulty, and see whether you can beat Zero on Hard. 🤖🔥

Good luck — and watch the corners.