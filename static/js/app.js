let gameState = { players: {}, pot: 0, starting_chips: 1000 };
let currentPlayerId = null;

// Fetch and render state
async function refreshState() {
    try {
        const response = await fetch('/api/state');
        gameState = await response.json();
        renderUI();
    } catch (error) {
        console.error('Failed to fetch state:', error);
    }
}

function renderUI() {
    renderPot();
    renderPlayers();
    document.getElementById('starting-chips').value = gameState.starting_chips;
}

function renderPot() {
    document.getElementById('pot-amount').textContent = `$${gameState.pot}`;
    document.getElementById('win-pot-amount').textContent = gameState.pot;
}

function renderPlayers() {
    const container = document.getElementById('players-container');
    container.innerHTML = '';

    const players = Object.values(gameState.players);
    if (players.length === 0) {
        container.innerHTML = '<p class="no-players">No players yet. Add players to start!</p>';
        return;
    }

    players.forEach(player => {
        container.appendChild(createPlayerCard(player));
    });
}

function createPlayerCard(player) {
    const card = document.createElement('div');
    card.className = 'player-card' + (player.folded ? ' folded' : '');
    const foldedLabel = player.folded ? '<div class="folded-label">FOLDED</div>' : '';
    card.innerHTML = `
        ${foldedLabel}
        <div class="player-name">${escapeHtml(player.name)}</div>
        <div class="player-chips">$${player.chips}</div>
        <div class="player-actions">
            ${player.folded ? '' : `
                <button class="btn btn-bet" onclick="openBetModal(${player.id})">Bet</button>
                <button class="btn btn-fold" onclick="foldPlayer(${player.id})">Fold</button>
                <button class="btn btn-win" onclick="openWinModal(${player.id})" ${gameState.pot === 0 ? 'disabled' : ''}>Win</button>
            `}
        </div>
        <button class="btn-remove" onclick="removePlayer(${player.id})">×</button>
    `;
    return card;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Player management
async function addPlayer() {
    const input = document.getElementById('player-name');
    const name = input.value.trim();
    if (!name) return;

    try {
        await fetch('/api/players', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        input.value = '';
        refreshState();
    } catch (error) {
        console.error('Failed to add player:', error);
    }
}

async function removePlayer(playerId) {
    if (!confirm('Remove this player?')) return;

    try {
        await fetch(`/api/players/${playerId}`, { method: 'DELETE' });
        refreshState();
    } catch (error) {
        console.error('Failed to remove player:', error);
    }
}

// Betting
function openBetModal(playerId) {
    currentPlayerId = playerId;
    const player = gameState.players[playerId];
    document.getElementById('bet-player-name').textContent = player.name;
    document.getElementById('bet-available').textContent = player.chips;
    document.getElementById('custom-bet').value = '';
    document.getElementById('custom-bet').max = player.chips;
    document.getElementById('bet-modal').classList.add('show');
}

async function placeBet(amount) {
    if (!currentPlayerId) return;

    const player = gameState.players[currentPlayerId];
    if (amount === 'all') {
        amount = player.chips;
    }
    amount = parseInt(amount);
    if (isNaN(amount) || amount <= 0) return;

    try {
        const response = await fetch('/api/bet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player_id: currentPlayerId, amount })
        });
        if (response.ok) {
            closeModals();
            refreshState();
        } else {
            const data = await response.json();
            alert(data.error || 'Bet failed');
        }
    } catch (error) {
        console.error('Failed to place bet:', error);
    }
}

// Winning
function openWinModal(playerId) {
    if (gameState.pot === 0) return;
    currentPlayerId = playerId;
    const player = gameState.players[playerId];
    document.getElementById('win-player-name').textContent = player.name;
    document.getElementById('win-pot-amount').textContent = gameState.pot;
    document.getElementById('custom-win').value = '';
    document.getElementById('custom-win').max = gameState.pot;
    document.getElementById('win-modal').classList.add('show');
}

async function collectWin(amount) {
    if (!currentPlayerId) return;

    if (amount !== null) {
        amount = parseInt(amount);
        if (isNaN(amount) || amount <= 0) return;
    }

    try {
        const response = await fetch('/api/win', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player_id: currentPlayerId, amount })
        });
        if (response.ok) {
            closeModals();
            refreshState();
        } else {
            const data = await response.json();
            alert(data.error || 'Collection failed');
        }
    } catch (error) {
        console.error('Failed to collect win:', error);
    }
}

// Settings
async function updateSettings() {
    const startingChips = parseInt(document.getElementById('starting-chips').value);
    if (isNaN(startingChips) || startingChips < 100) {
        alert('Starting chips must be at least 100');
        return;
    }

    try {
        await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ starting_chips: startingChips })
        });
        refreshState();
    } catch (error) {
        console.error('Failed to update settings:', error);
    }
}

async function resetGame() {
    if (!confirm('Start a new game? This will remove all players and reset the pot.')) return;

    try {
        await fetch('/api/reset', { method: 'POST' });
        refreshState();
    } catch (error) {
        console.error('Failed to reset game:', error);
    }
}

// Folding
async function foldPlayer(playerId) {
    try {
        await fetch('/api/fold', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player_id: playerId })
        });
        refreshState();
    } catch (error) {
        console.error('Failed to fold:', error);
    }
}

async function newHand() {
    try {
        await fetch('/api/new-hand', { method: 'POST' });
        refreshState();
    } catch (error) {
        console.error('Failed to start new hand:', error);
    }
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
    currentPlayerId = null;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    refreshState();

    document.getElementById('add-player-btn').addEventListener('click', addPlayer);
    document.getElementById('player-name').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addPlayer();
    });

    document.getElementById('new-game-btn').addEventListener('click', resetGame);
    document.getElementById('new-hand-btn').addEventListener('click', newHand);
    document.getElementById('rules-btn').addEventListener('click', () => {
        document.getElementById('rules-modal').classList.add('show');
    });
    document.getElementById('update-settings-btn').addEventListener('click', updateSettings);

    // Quick bet buttons
    document.querySelectorAll('.quick-bet').forEach(btn => {
        btn.addEventListener('click', () => placeBet(btn.dataset.amount));
    });

    document.getElementById('custom-bet-btn').addEventListener('click', () => {
        placeBet(document.getElementById('custom-bet').value);
    });
    document.getElementById('custom-bet').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') placeBet(document.getElementById('custom-bet').value);
    });

    // Win buttons
    document.getElementById('take-all-btn').addEventListener('click', () => collectWin(null));
    document.getElementById('custom-win-btn').addEventListener('click', () => {
        collectWin(document.getElementById('custom-win').value);
    });
    document.getElementById('custom-win').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') collectWin(document.getElementById('custom-win').value);
    });

    // Close modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModals();
        });
    });
});
