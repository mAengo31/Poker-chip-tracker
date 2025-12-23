class GameState:
    def __init__(self):
        self.players = {}
        self.pot = 0
        self.starting_chips = 1000
        self._next_id = 1

    def add_player(self, name):
        player_id = self._next_id
        self._next_id += 1
        self.players[player_id] = {
            "id": player_id,
            "name": name,
            "chips": self.starting_chips,
            "folded": False
        }
        return self.players[player_id]

    def remove_player(self, player_id):
        if player_id in self.players:
            del self.players[player_id]
            return True
        return False

    def bet(self, player_id, amount):
        if player_id not in self.players:
            return False, "Player not found"
        player = self.players[player_id]
        if amount > player["chips"]:
            return False, "Insufficient chips"
        if amount <= 0:
            return False, "Invalid amount"
        player["chips"] -= amount
        self.pot += amount
        return True, None

    def win(self, player_id, amount=None):
        if player_id not in self.players:
            return False, "Player not found"
        if amount is None:
            amount = self.pot
        if amount > self.pot:
            return False, "Amount exceeds pot"
        if amount <= 0:
            return False, "Invalid amount"
        self.players[player_id]["chips"] += amount
        self.pot -= amount
        return True, None

    def set_starting_chips(self, amount):
        if amount > 0:
            self.starting_chips = amount
            return True
        return False

    def fold(self, player_id):
        if player_id not in self.players:
            return False, "Player not found"
        self.players[player_id]["folded"] = True
        return True, None

    def new_hand(self):
        for player in self.players.values():
            player["folded"] = False

    def get_state(self):
        return {
            "players": self.players,
            "pot": self.pot,
            "starting_chips": self.starting_chips
        }

    def reset(self):
        self.players = {}
        self.pot = 0
        self._next_id = 1
