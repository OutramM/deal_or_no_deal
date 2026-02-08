// Money values in the cases
const moneyValues = [
    0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750,
    1000, 5000, 10000, 25000, 50000, 75000, 100000, 200000,
    300000, 400000, 500000, 750000, 1000000
];

// Round schedule - minimum 4 cases per round before banker offers
const roundSchedule = [6, 6, 6, 4, 4, 1, 1, 1];

// Game state
let gameState = {
    cases: [],
    playerCaseIndex: null,
    openedCases: [],
    currentRound: 0,
    casesToOpenThisRound: 0,
    casesOpenedThisRound: 0,
    gamePhase: 'choose-case',
    eliminatedValues: [],
    totalCasesOpened: 0,
    currentOffer: 0,
    highestOffer: 0,
    lastCaseIndex: null
};

// Format money display
function formatMoney(amount) {
    if (amount < 1) return `$${amount.toFixed(2)}`;
    return `$${amount.toLocaleString()}`;
}

// Initialize cases with random values
function initializeCases() {
    gameState.cases = [...moneyValues].sort(() => Math.random() - 0.5);
}

// Render all cases on the grid
function renderCases() {
    const grid = document.getElementById('cases-grid');
    grid.innerHTML = '';
    
    const remainingCases = [];
    for (let i = 0; i < 26; i++) {
        if (!gameState.openedCases.includes(i) && i !== gameState.playerCaseIndex) {
            remainingCases.push(i);
        }
    }
    
    for (let i = 0; i < 26; i++) {
        const caseDiv = document.createElement('div');
        caseDiv.className = 'case';
        caseDiv.textContent = i + 1;
        
        if (gameState.openedCases.includes(i)) {
            caseDiv.classList.add('opened');
            caseDiv.innerHTML = `${i + 1}<br><small style="font-size: 0.5em;">${formatMoney(gameState.cases[i])}</small>`;
        } else if (gameState.playerCaseIndex === i) {
            caseDiv.classList.add('player-case');
            caseDiv.innerHTML = `<div style="display: flex; flex-direction: column; align-items: center;">★<div>${i + 1}</div>★</div>`;
        } else {
            caseDiv.onclick = () => handleCaseClick(i);
        }
        
        grid.appendChild(caseDiv);
    }
}

// Render money board
function renderMoneyBoard() {
    const leftColumn = document.getElementById('money-left');
    const rightColumn = document.getElementById('money-right');
    
    leftColumn.innerHTML = '';
    rightColumn.innerHTML = '';
    
    const midpoint = Math.ceil(moneyValues.length / 2);
    
    moneyValues.forEach((value, index) => {
        const valueDiv = document.createElement('div');
        valueDiv.className = 'money-value';
        if (gameState.eliminatedValues.includes(value)) {
            valueDiv.classList.add('eliminated');
        }
        valueDiv.textContent = formatMoney(value);
        
        if (index < midpoint) {
            leftColumn.appendChild(valueDiv);
        } else {
            rightColumn.appendChild(valueDiv);
        }
    });
}

// Update banker offer display
function updateBankerDisplay() {
    document.getElementById('current-offer').textContent = 
        gameState.currentOffer > 0 ? formatMoney(gameState.currentOffer) : '---';
    document.getElementById('highest-offer').textContent = 
        formatMoney(gameState.highestOffer);
}

// Handle case click
function handleCaseClick(caseIndex) {
    if (gameState.gamePhase === 'choose-case') {
        // Player choosing their case
        gameState.playerCaseIndex = caseIndex;
        gameState.gamePhase = 'opening-cases';
        gameState.currentRound = 0;
        gameState.casesToOpenThisRound = roundSchedule[0];
        gameState.casesOpenedThisRound = 0;
        updateStatus();
        renderCases();
    } else if (gameState.gamePhase === 'opening-cases') {
        // Opening other cases
        if (caseIndex !== gameState.playerCaseIndex && !gameState.openedCases.includes(caseIndex)) {
            gameState.openedCases.push(caseIndex);
            gameState.eliminatedValues.push(gameState.cases[caseIndex]);
            gameState.casesOpenedThisRound++;
            gameState.totalCasesOpened++;
            
            renderCases();
            renderMoneyBoard();
            
            // Check if only 2 cases remain
            if (gameState.openedCases.length === 24) {
                setTimeout(() => offerSwitch(), 800);
            } else if (gameState.casesOpenedThisRound >= gameState.casesToOpenThisRound) {
                // Round complete, show banker offer
                setTimeout(() => showBankerOffer(), 800);
            } else {
                updateStatus();
            }
        }
    }
}

// Calculate banker's offer
function calculateBankerOffer() {
    const remainingValues = gameState.cases.filter((val, idx) => 
        !gameState.openedCases.includes(idx) && idx !== gameState.playerCaseIndex
    );
    remainingValues.push(gameState.cases[gameState.playerCaseIndex]);
    
    const average = remainingValues.reduce((a, b) => a + b, 0) / remainingValues.length;
    
    // Banker offers increase as game progresses
    let multiplier;
    if (gameState.totalCasesOpened <= 6) multiplier = 0.08;
    else if (gameState.totalCasesOpened <= 12) multiplier = 0.18;
    else if (gameState.totalCasesOpened <= 18) multiplier = 0.35;
    else if (gameState.totalCasesOpened <= 22) multiplier = 0.60;
    else multiplier = 0.80;
    
    // Add some randomness
    const randomFactor = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1
    
    return Math.round(average * multiplier * randomFactor);
}

// Show banker offer
function showBankerOffer() {
    gameState.gamePhase = 'banker-offer';
    const offer = calculateBankerOffer();
    gameState.currentOffer = offer;
    
    if (offer > gameState.highestOffer) {
        gameState.highestOffer = offer;
    }
    
    updateBankerDisplay();
    
    document.getElementById('offer-amount').textContent = formatMoney(offer);
    document.getElementById('banker-offer-panel').classList.remove('hidden');
    
    updateStatus();
}

// Accept the deal
function acceptDeal() {
    const offer = gameState.currentOffer;
    endGame(true, offer);
}

// Reject the deal
function rejectDeal() {
    document.getElementById('banker-offer-panel').classList.add('hidden');
    gameState.currentRound++;
    
    if (gameState.currentRound < roundSchedule.length) {
        gameState.gamePhase = 'opening-cases';
        gameState.casesToOpenThisRound = roundSchedule[gameState.currentRound];
        gameState.casesOpenedThisRound = 0;
        gameState.currentOffer = 0;
        updateBankerDisplay();
        updateStatus();
    }
}

// Offer to switch cases
function offerSwitch() {
    gameState.gamePhase = 'switch-offer';
    
    const lastCaseIndex = gameState.cases.findIndex((val, idx) => 
        !gameState.openedCases.includes(idx) && idx !== gameState.playerCaseIndex
    );
    
    gameState.lastCaseIndex = lastCaseIndex;
    
    document.getElementById('player-case-num').textContent = gameState.playerCaseIndex + 1;
    document.getElementById('other-case-num').textContent = lastCaseIndex + 1;
    document.getElementById('switch-panel').classList.remove('hidden');
    
    document.getElementById('game-status').textContent = 'FINAL DECISION!';
    document.getElementById('cases-to-open').textContent = 'Switch or keep your case?';
}

// Switch cases
function switchCases() {
    const tempIndex = gameState.playerCaseIndex;
    gameState.playerCaseIndex = gameState.lastCaseIndex;
    gameState.openedCases.push(tempIndex);
    
    endGame(false, 'switched');
}

// Keep current case
function keepCase() {
    gameState.openedCases.push(gameState.lastCaseIndex);
    
    endGame(false, 'kept');
}

// End the game
function endGame(tookDeal, info) {
    gameState.gamePhase = 'game-over';
    
    let finalAmount, title, message;
    
    if (tookDeal) {
        finalAmount = info;
        title = '🤝 YOU TOOK THE DEAL! 🤝';
        message = 'You accepted the banker\'s offer!';
    } else {
        finalAmount = gameState.cases[gameState.playerCaseIndex];
        if (info === 'switched') {
            title = '🔄 YOU SWITCHED CASES! 🔄';
            message = 'Let\'s see what was in your new case...';
        } else if (info === 'kept') {
            title = '💼 YOU KEPT YOUR CASE! 💼';
            message = 'Let\'s reveal what was inside...';
        } else {
            title = '💼 GAME OVER! 💼';
            message = 'Here\'s what you won...';
        }
    }
    
    document.getElementById('game-over-title').textContent = title;
    document.getElementById('final-amount').textContent = formatMoney(finalAmount);
    
    if (finalAmount >= 100000) {
        message += ' 🎉 INCREDIBLE! You\'re walking away rich! 🎉';
    } else if (finalAmount >= 10000) {
        message += ' 👏 Well done! That\'s a great win! 👏';
    } else if (finalAmount >= 1000) {
        message += ' 😊 Not bad at all!';
    } else {
        message += ' 💪 Better luck next time!';
    }
    
    document.getElementById('game-over-message').textContent = message;
    
    if (!tookDeal) {
        document.getElementById('case-reveal').textContent = `Your case was #${gameState.playerCaseIndex + 1}`;
    } else {
        document.getElementById('case-reveal').textContent = `Your case #${gameState.playerCaseIndex + 1} contained ${formatMoney(gameState.cases[gameState.playerCaseIndex])}`;
    }
    
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');
}

// Update status display
function updateStatus() {
    const status = document.getElementById('game-status');
    const casesToOpen = document.getElementById('cases-to-open');
    
    if (gameState.gamePhase === 'choose-case') {
        status.textContent = 'CHOOSE YOUR CASE';
        casesToOpen.textContent = 'Pick the case you want to keep';
    } else if (gameState.gamePhase === 'opening-cases') {
        const remaining = gameState.casesToOpenThisRound - gameState.casesOpenedThisRound;
        status.textContent = `ROUND ${gameState.currentRound + 1}`;
        casesToOpen.textContent = `Open ${remaining} more case${remaining !== 1 ? 's' : ''} to continue`;
    } else if (gameState.gamePhase === 'banker-offer') {
        status.textContent = 'THE BANKER IS CALLING...';
        casesToOpen.textContent = 'Deal or No Deal?';
    }
}

// Start the game
function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    initializeCases();
    renderCases();
    renderMoneyBoard();
    updateBankerDisplay();
    updateStatus();
}