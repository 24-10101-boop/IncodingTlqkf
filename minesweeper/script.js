const CONFIG = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 }
};

let currentDifficulty = 'easy';
let board = [];
let minesLeft = 0;
let timeElapsed = 0;
let timerId = null;
let isFirstClick = true;
let isGameOver = false;

// DOM Elements
const boardEl = document.getElementById('game-board');
const mineCountEl = document.getElementById('mine-count');
const timerEl = document.getElementById('timer');
const restartBtn = document.getElementById('restart-btn');
const difficultySelect = document.getElementById('difficulty');
const overlay = document.getElementById('game-over-overlay');
const endMessageEl = document.getElementById('end-message');
const playAgainBtn = document.getElementById('play-again-btn');

function initGame() {
    // Reset state
    board = [];
    timeElapsed = 0;
    isFirstClick = true;
    isGameOver = false;
    clearInterval(timerId);
    timerId = null;
    
    // UI Reset
    updateTimerText();
    restartBtn.textContent = '😊';
    overlay.classList.add('hidden');
    overlay.classList.remove('win', 'lose');
    
    const { rows, cols, mines } = CONFIG[currentDifficulty];
    minesLeft = mines;
    updateMineCountText();
    
    // Build Board UI & Data
    boardEl.style.gridTemplateColumns = `repeat(${cols}, 32px)`;
    boardEl.innerHTML = '';
    
    // Adjust max-height or max-width dynamically if needed, 
    // but css will handle most thanks to overflow:auto
    
    for (let r = 0; r < rows; r++) {
        const rowData = [];
        for (let c = 0; c < cols; c++) {
            const cellState = {
                r, c,
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            };
            rowData.push(cellState);
            
            const cellEl = document.createElement('div');
            cellEl.classList.add('cell');
            cellEl.dataset.r = r;
            cellEl.dataset.c = c;
            
            // Events
            cellEl.addEventListener('click', () => handleCellClick(r, c));
            cellEl.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                handleCellRightClick(r, c);
            });
            cellEl.addEventListener('mousedown', (e) => {
                if(!isGameOver && e.button !== 2 && !cellState.isRevealed) {
                    restartBtn.textContent = '😮';
                }
            });
            cellEl.addEventListener('mouseup', (e) => {
                if(!isGameOver) {
                    restartBtn.textContent = '😊';
                }
            });
            // Handle mouseleave so face resets if dragged outside
            cellEl.addEventListener('mouseleave', () => {
                if(!isGameOver) {
                    restartBtn.textContent = '😊';
                }
            });
            
            boardEl.appendChild(cellEl);
        }
        board.push(rowData);
    }
}

function placeMines(firstR, firstC) {
    const { rows, cols, mines } = CONFIG[currentDifficulty];
    let placed = 0;
    
    while (placed < mines) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        
        // Don't place mine on first clicked cell or already placed
        // Also ensure 3x3 around first click is clear for better start
        const isCloseToFirst = Math.abs(r - firstR) <= 1 && Math.abs(c - firstC) <= 1;
        
        if (!board[r][c].isMine && !isCloseToFirst) {
            board[r][c].isMine = true;
            placed++;
        }
    }
    // Note: if the board is extremely dense, ensuring 3x3 is clear might cause infinite loops.
    // For standard difficulties, 99 mines in 480 cells is ~20%. It will easily find space.
    
    // Calculate neighbor mines
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (!board[r][c].isMine) {
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) {
                            count++;
                        }
                    }
                }
                board[r][c].neighborMines = count;
            }
        }
    }
}

function handleCellClick(r, c) {
    if (isGameOver || board[r][c].isFlagged || board[r][c].isRevealed) return;
    
    if (isFirstClick) {
        isFirstClick = false;
        placeMines(r, c);
        startTimer();
    }
    
    if (board[r][c].isMine) {
        gameOver(false, r, c);
        return;
    }
    
    revealCell(r, c);
    checkWinCondition();
}

function handleCellRightClick(r, c) {
    if (isGameOver || board[r][c].isRevealed) return;
    
    const cell = board[r][c];
    const cellEl = getCellEl(r, c);
    
    if (cell.isFlagged) {
        cell.isFlagged = false;
        cellEl.classList.remove('flagged');
        cellEl.textContent = '';
        minesLeft++;
    } else {
        cell.isFlagged = true;
        cellEl.classList.add('flagged');
        cellEl.textContent = '🚩';
        minesLeft--;
    }
    
    updateMineCountText();
}

function revealCell(r, c) {
    const { rows, cols } = CONFIG[currentDifficulty];
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    
    const cell = board[r][c];
    if (cell.isRevealed || cell.isFlagged) return;
    
    cell.isRevealed = true;
    const cellEl = getCellEl(r, c);
    cellEl.classList.add('revealed', 'animate');
    
    if (cell.neighborMines > 0) {
        cellEl.textContent = cell.neighborMines;
        cellEl.dataset.value = cell.neighborMines;
    } else {
        // Flood fill empty cells with small delay for visual effect
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr !== 0 || dc !== 0) {
                    setTimeout(() => revealCell(r + dr, c + dc), 15);
                }
            }
        }
    }
}

function getCellEl(r, c) {
    const { cols } = CONFIG[currentDifficulty];
    return boardEl.children[r * cols + c];
}

function gameOver(isWin, triggerR = -1, triggerC = -1) {
    isGameOver = true;
    clearInterval(timerId);
    
    const { rows, cols } = CONFIG[currentDifficulty];
    
    if (isWin) {
        restartBtn.textContent = '😎';
        endMessageEl.textContent = 'You Win!';
        overlay.classList.add('win');
        // Flag remaining mines automatically
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (board[r][c].isMine && !board[r][c].isFlagged) {
                    const cellEl = getCellEl(r, c);
                    board[r][c].isFlagged = true;
                    cellEl.classList.add('flagged');
                    cellEl.textContent = '🚩';
                }
            }
        }
        minesLeft = 0;
        updateMineCountText();
    } else {
        restartBtn.textContent = '😵';
        endMessageEl.textContent = 'Game Over';
        overlay.classList.add('lose');
        
        // Reveal all mines safely but highlight the exploded one
        // and show falsely flagged
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = board[r][c];
                const cellEl = getCellEl(r, c);
                
                if (r === triggerR && c === triggerC) {
                    cellEl.classList.add('revealed', 'exploded');
                    cellEl.textContent = '💣';
                } else if (cell.isMine && !cell.isFlagged) {
                    cellEl.classList.add('revealed', 'mine');
                    cellEl.textContent = '💣';
                } else if (!cell.isMine && cell.isFlagged) {
                    cellEl.classList.add('revealed');
                    cellEl.textContent = '❌';
                }
            }
        }
    }
    
    setTimeout(() => {
        overlay.classList.remove('hidden');
    }, 1200);
}

function checkWinCondition() {
    const { rows, cols, mines } = CONFIG[currentDifficulty];
    let revealedCount = 0;
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c].isRevealed) revealedCount++;
        }
    }
    
    if (revealedCount === (rows * cols) - mines) {
        gameOver(true);
    }
}

function startTimer() {
    timerId = setInterval(() => {
        timeElapsed++;
        if (timeElapsed > 999) timeElapsed = 999;
        updateTimerText();
    }, 1000);
}

function formatNumber(num) {
    if(num < 0) return "-" + Math.abs(num).toString().padStart(2, '0');
    return num.toString().padStart(3, '0');
}

function updateMineCountText() {
    mineCountEl.textContent = formatNumber(minesLeft);
}

function updateTimerText() {
    timerEl.textContent = formatNumber(timeElapsed);
}

// Global Event Listeners
difficultySelect.addEventListener('change', (e) => {
    currentDifficulty = e.target.value;
    initGame();
});

restartBtn.addEventListener('click', initGame);
playAgainBtn.addEventListener('click', initGame);

// Remove context menu from entire window to prevent popup accidentally
window.addEventListener('contextmenu', e => {
    if(e.target.closest('.game-container')) {
        e.preventDefault();
    }
});

// Initialize
initGame();
