"""Unit test. Jalankan: `python -m unittest discover -s tests -v` atau `python -m pytest`."""

import random
import unittest

from src.board import Board, InvalidMoveError, Mark
from src.game import Game, GameStatus
from src.player import MinimaxBot, Player, RandomBot


class ScriptedPlayer(Player):
    """Pemain uji yang memainkan langkah sesuai daftar."""

    def __init__(self, mark: Mark, moves: list[int]) -> None:
        super().__init__("Scripted", mark)
        self._moves = iter(moves)

    def choose_move(self, board: Board) -> int:
        return next(self._moves)


def fill(board: Board, x: list[int], o: list[int]) -> Board:
    for p in x:
        board.place(p, Mark.X)
    for p in o:
        board.place(p, Mark.O)
    return board


class BoardTests(unittest.TestCase):
    def test_new_board_is_empty(self) -> None:
        board = Board()
        self.assertEqual(board.available_moves(), list(range(1, 10)))
        self.assertFalse(board.is_full())
        self.assertIsNone(board.winner())

    def test_place_and_occupied(self) -> None:
        board = Board()
        board.place(5, Mark.X)
        self.assertEqual(board.get(5), Mark.X)
        with self.assertRaises(InvalidMoveError):
            board.place(5, Mark.O)

    def test_out_of_range(self) -> None:
        board = Board()
        for bad in (0, 10, -1):
            with self.assertRaises(InvalidMoveError):
                board.validate_move(bad)

    def test_parse_position(self) -> None:
        self.assertEqual(Board.parse_position(" 7 "), 7)
        for bad in ("", "abc", "1.5", "-2"):
            with self.assertRaises(InvalidMoveError):
                Board.parse_position(bad)

    def test_all_win_lines(self) -> None:
        for line in Board.WIN_LINES:
            board = Board()
            for p in line:
                board.place(p, Mark.O)
            self.assertEqual(board.winner(), Mark.O)
            self.assertEqual(board.winning_line(), line)

    def test_copy_is_independent(self) -> None:
        board = Board()
        clone = board.copy()
        clone.place(1, Mark.X)
        self.assertEqual(board.get(1), Mark.EMPTY)

    def test_render_shows_numbers_and_marks(self) -> None:
        board = Board()
        board.place(1, Mark.X)
        text = board.render()
        self.assertIn("X", text)
        self.assertIn("9", text)


class GameTests(unittest.TestCase):
    def test_x_wins(self) -> None:
        game = Game(ScriptedPlayer(Mark.X, [1, 2, 3]), ScriptedPlayer(Mark.O, [4, 5]))
        while not game.is_over:
            game.play_turn()
        self.assertEqual(game.status, GameStatus.WON)
        self.assertEqual(game.winner.mark, Mark.X)
        self.assertEqual(game.winning_line, (1, 2, 3))

    def test_draw(self) -> None:
        # X O X / X O O / O X X  -> seri
        game = Game(
            ScriptedPlayer(Mark.X, [1, 3, 4, 8, 9]),
            ScriptedPlayer(Mark.O, [2, 5, 6, 7]),
        )
        while not game.is_over:
            game.play_turn()
        self.assertEqual(game.status, GameStatus.DRAW)
        self.assertIsNone(game.winner)

    def test_turn_alternates(self) -> None:
        game = Game(ScriptedPlayer(Mark.X, [1]), ScriptedPlayer(Mark.O, [2]))
        self.assertEqual(game.current_player.mark, Mark.X)
        game.play_turn()
        self.assertEqual(game.current_player.mark, Mark.O)

    def test_no_turn_after_game_over(self) -> None:
        game = Game(ScriptedPlayer(Mark.X, [1, 2, 3]), ScriptedPlayer(Mark.O, [4, 5]))
        while not game.is_over:
            game.play_turn()
        with self.assertRaises(RuntimeError):
            game.play_turn()

    def test_wrong_marks_rejected(self) -> None:
        with self.assertRaises(ValueError):
            Game(ScriptedPlayer(Mark.O, []), ScriptedPlayer(Mark.X, []))


class BotTests(unittest.TestCase):
    def test_minimax_takes_winning_move(self) -> None:
        board = fill(Board(), x=[1, 2], o=[4, 5])
        self.assertEqual(MinimaxBot("Bot", Mark.X).choose_move(board), 3)

    def test_minimax_blocks_opponent(self) -> None:
        board = fill(Board(), x=[1, 2], o=[5])
        self.assertEqual(MinimaxBot("Bot", Mark.O).choose_move(board), 3)

    def test_random_bot_picks_valid_move(self) -> None:
        board = fill(Board(), x=[1, 2, 3], o=[4, 5])
        for _ in range(20):
            self.assertIn(RandomBot("Bot", Mark.O).choose_move(board), [6, 7, 8, 9])

    def test_minimax_never_loses_to_random(self) -> None:
        random.seed(42)
        for bot_mark in (Mark.X, Mark.O):
            for _ in range(30):
                bot = MinimaxBot("Minimax", bot_mark)
                rnd = RandomBot("Random", bot_mark.opponent)
                px, po = (bot, rnd) if bot_mark is Mark.X else (rnd, bot)
                game = Game(px, po)
                while not game.is_over:
                    game.play_turn()
                if game.status is GameStatus.WON:
                    self.assertIs(game.winner, bot)

    def test_minimax_vs_minimax_is_draw(self) -> None:
        game = Game(MinimaxBot("A", Mark.X), MinimaxBot("B", Mark.O))
        while not game.is_over:
            game.play_turn()
        self.assertEqual(game.status, GameStatus.DRAW)


if __name__ == "__main__":
    unittest.main()
