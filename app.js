let game = new Chess();
let board = document.getElementById('board');
let status = document.getElementById('status');
let moveList = document.getElementById('moveList');
let selectedSquare = null;
let botEnabled = true;

const pieceUnicode = {
  'p': '♙', 'r': '♖', 'n': '♘', 'b': '♗', 'q': '♕', 'k': '♔',
  'P': '♟', 'R': '♜', 'N': '♞', 'B': '♝', 'Q': '♛', 'K': '♚'
};

function drawBoard() {
  board.innerHTML = '';
  const boardState = game.board();

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('div');
      square.className = 'square ' + ((row + col) % 2 === 0? 'light' : 'dark');
      square.dataset.row = row;
      square.dataset.col = col;

      const piece = boardState[row][col];
      if (piece) {
        square.textContent = pieceUnicode[piece.color === 'w'? piece.type.toUpperCase() : piece.type];
      }

      square.addEventListener('click', onSquareClick);
      board.appendChild(square);
    }
  }
  updateStatus();
}

function onSquareClick(e) {
  if (botEnabled && game.turn() === 'b') return; // bot's turn

  const row = parseInt(e.target.dataset.row);
  const col = parseInt(e.target.dataset.col);
  const square = 'abcdefgh'[col] + (8 - row);

  if (selectedSquare === null) {
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      selectedSquare = square;
      highlightLegalMoves(square);
      e.target.classList.add('selected');
    }
  } else {
    let move = { from: selectedSquare, to: square, promotion: 'q' };

    // Handle promotion choice
    const piece = game.get(selectedSquare);
    if (piece.type === 'p' && (square[1] === '8' || square[1] === '1')) {
      move.promotion = prompt('Promote to q, r, n, b?', 'q') || 'q';
    }

    const result = game.move(move);
    if (result) {
      updateMoveList();
      drawBoard();
      if (botEnabled &&!game.isGameOver()) {
        setTimeout(botMove, 300);
      }
    } else {
      removeHighlights();
    }
    selectedSquare = null;
  }
}

function highlightLegalMoves(square) {
  const moves = game.moves({ square: square, verbose: true });
  moves.forEach(move => {
    const targetRow = 8 - parseInt(move.to[1]);
    const targetCol = 'abcdefgh'.indexOf(move.to[0]);
    const target = document.querySelector(`[data-row="${targetRow}"][data-col="${targetCol}"]`);
    if (target) target.classList.add('legal');
  });
}

function removeHighlights() {
  document.querySelectorAll('.square').forEach(sq => {
    sq.classList.remove('selected', 'legal');
  });
}

function updateStatus() {
  let statusText = '';
  if (game.isGameOver()) {
    if (game.isCheckmate()) statusText = `Checkmate! ${game.turn() === 'w'? 'Black' : 'White'} wins`;
    else if (game.isDraw()) {
      if (game.isStalemate()) statusText = 'Stalemate - Draw';
      else if (game.isThreefoldRepetition()) statusText = 'Draw by repetition';
      else if (game.isInsufficientMaterial()) statusText = 'Draw - Insufficient material';
      else statusText = 'Draw by 50-move rule';
    }
    else statusText = 'Game Over';
  } else {
    statusText = `${game.turn() === 'w'? 'White' : 'Black'} to move`;
    if (game.isCheck()) statusText += ' + CHECK';
  }
  status.textContent = statusText;
}

function updateMoveList() {
  const history = game.history();
  let moves = '';
  for (let i = 0; i < history.length; i += 2) {
    moves += `${Math.floor(i/2)+1}. ${history[i]} ${history[i+1] || ''} `;
  }
  moveList.textContent = moves;
}

function resetGame() {
  game.reset();
  selectedSquare = null;
  removeHighlights();
  drawBoard();
}

function undoMove() {
  game.undo();
  game.undo(); // undo bot move too
  selectedSquare = null;
  removeHighlights();
  drawBoard();
}

function toggleBot() {
  botEnabled =!botEnabled;
  document.getElementById('botStatus').textContent = botEnabled? 'ON' : 'OFF';
}

// Bot AI - minimax depth 2
function botMove() {
  const bestMove = minimax(game, 2, -Infinity, Infinity, false).move;
  if (bestMove) {
    game.move(bestMove);
    updateMoveList();
    drawBoard();
  }
}

function minimax(g, depth, alpha, beta, isMaximizing) {
  if (depth === 0 || g.isGameOver()) {
    return { score: evaluateBoard(g) };
  }

  const moves = g.moves({ verbose: true });
  let bestMove = null;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let move of moves) {
      g.move(move);
      const evaluation = minimax(g, depth - 1, alpha, beta, false).score;
      g.undo();
      if (evaluation > maxEval) {
        maxEval = evaluation;
        bestMove = move;
      }
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (let move of moves) {
      g.move(move);
      const evaluation = minimax(g, depth - 1, alpha, beta, true).score;
      g.undo();
      if (evaluation < minEval) {
        minEval = evaluation;
        bestMove = move;
      }
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return { score: minEval, move: bestMove };
  }
}

function evaluateBoard(g) {
  const values = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
  let score = 0;
  const board = g.board();
  for (let row of board) {
    for (let piece of row) {
      if (piece) {
        const value = values[piece.type];
        score += piece.color === 'w'? value : -value;
      }
    }
  }
  return score;
}

drawBoard();
