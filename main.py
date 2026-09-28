"""Entry point: jalankan dengan `python main.py`."""

from __future__ import annotations

from collections import Counter

from src.board import Mark
from src.game import Game, GameMode, GameStatus
from src.player import HumanPlayer, Player, create_bot
from src.ui import ConsoleUI, QuitGame


def create_players(ui: ConsoleUI) -> tuple[Player, Player]:
    """Bangun pasangan (pemain X, pemain O) berdasarkan pilihan di menu."""
    mode = ui.choose_mode()

    if mode is GameMode.PVP:
        name_x = ui.ask_name("Pemain 1 (X)", "Pemain 1")
        name_o = ui.ask_name("Pemain 2 (O)", "Pemain 2")
        if name_o == name_x:
            name_o += " (2)"
        return (
            HumanPlayer(name_x, Mark.X, ui.prompt_move),
            HumanPlayer(name_o, Mark.O, ui.prompt_move),
        )

    name = ui.ask_name("Anda", "Pemain")
    difficulty = ui.choose_difficulty()
    human_mark = ui.choose_mark()
    human = HumanPlayer(name, human_mark, ui.prompt_move)
    bot = create_bot(difficulty, human_mark.opponent)
    return (human, bot) if human_mark is Mark.X else (bot, human)


def play_round(ui: ConsoleUI, game: Game) -> None:
    notice = None
    while not game.is_over:
        player = game.current_player
        ui.show_board(game.board, player, notice)
        if player.is_bot:
            ui.show_bot_thinking(player)
        move = game.play_turn()
        notice = f"{player.name} memilih kotak {move}." if player.is_bot else None
    ui.show_result(game)


def main() -> int:
    ui = ConsoleUI()
    try:
        ui.show_welcome()
        player_x, player_o = create_players(ui)
        wins: Counter[str] = Counter()
        draws = 0

        while True:
            game = Game(player_x, player_o)
            play_round(ui, game)
            if game.status is GameStatus.WON and game.winner:
                wins[game.winner.name] += 1
            else:
                draws += 1
            ui.show_scoreboard((player_x.name, player_o.name), wins, draws)
            if not ui.ask_play_again():
                break
    except (QuitGame, KeyboardInterrupt, EOFError):
        pass
    ui.show_goodbye()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
