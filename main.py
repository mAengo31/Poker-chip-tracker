from flask import Flask, render_template, jsonify, request
from game_state import GameState

app = Flask(__name__)
game = GameState()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/state")
def get_state():
    return jsonify(game.get_state())


@app.route("/api/players", methods=["POST"])
def add_player():
    data = request.get_json()
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Name required"}), 400
    player = game.add_player(name)
    return jsonify(player)


@app.route("/api/players/<int:player_id>", methods=["DELETE"])
def remove_player(player_id):
    success = game.remove_player(player_id)
    if success:
        return jsonify({"success": True})
    return jsonify({"error": "Player not found"}), 404


@app.route("/api/bet", methods=["POST"])
def place_bet():
    data = request.get_json()
    player_id = data.get("player_id")
    amount = data.get("amount")
    if not isinstance(amount, int) or amount <= 0:
        return jsonify({"error": "Invalid amount"}), 400
    success, error = game.bet(player_id, amount)
    if not success:
        return jsonify({"error": error}), 400
    return jsonify({
        "success": True,
        "player": game.players[player_id],
        "pot": game.pot
    })


@app.route("/api/win", methods=["POST"])
def collect_win():
    data = request.get_json()
    player_id = data.get("player_id")
    amount = data.get("amount")  # None means take all
    success, error = game.win(player_id, amount)
    if not success:
        return jsonify({"error": error}), 400
    return jsonify({
        "success": True,
        "player": game.players[player_id],
        "pot": game.pot
    })


@app.route("/api/settings", methods=["POST"])
def update_settings():
    data = request.get_json()
    starting_chips = data.get("starting_chips")
    if starting_chips and isinstance(starting_chips, int):
        game.set_starting_chips(starting_chips)
    return jsonify({"success": True, "starting_chips": game.starting_chips})


@app.route("/api/fold", methods=["POST"])
def fold_player():
    data = request.get_json()
    player_id = data.get("player_id")
    success, error = game.fold(player_id)
    if not success:
        return jsonify({"error": error}), 400
    return jsonify({"success": True, "player": game.players[player_id]})


@app.route("/api/new-hand", methods=["POST"])
def new_hand():
    game.new_hand()
    return jsonify({"success": True})


@app.route("/api/reset", methods=["POST"])
def reset_game():
    game.reset()
    return jsonify({"success": True})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
