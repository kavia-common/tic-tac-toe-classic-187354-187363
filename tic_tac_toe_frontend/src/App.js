import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/**
 * Ocean Professional theme constants from style guide.
 * Using CSS variables for runtime theming and smooth transitions.
 */
const OCEAN_THEME = {
  primary: '#2563EB', // blue
  secondary: '#F59E0B', // amber
  error: '#EF4444',
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827',
};

/**
 * Utility: read environment with CRA prefix.
 */
const env = {
  NODE_ENV: process.env.REACT_APP_NODE_ENV || process.env.NODE_ENV || 'development',
  PORT: process.env.REACT_APP_PORT || '3000',
  FEATURE_FLAGS: process.env.REACT_APP_FEATURE_FLAGS || '',
};

/**
 * Board helpers
 */
const LINES = [
  [0,1,2],[3,4,5],[6,7,8], // rows
  [0,3,6],[1,4,7],[2,5,8], // cols
  [0,4,8],[2,4,6],         // diagonals
];

function calculateWinner(squares) {
  for (const [a,b,c] of LINES) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a,b,c] };
    }
  }
  if (squares.every(Boolean)) return { winner: null, line: [], isDraw: true };
  return null;
}

function pickRandomMove(board) {
  const empty = board.map((v,i) => (v ? null : i)).filter(v => v !== null);
  if (empty.length === 0) return null;
  const idx = Math.floor(Math.random() * empty.length);
  return empty[idx];
}

// PUBLIC_INTERFACE
export default function App() {
  // Theme handling
  const [dark, setDark] = useState(false);

  // Game state
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [mode, setMode] = useState('pvp'); // 'pvp' | 'cpu'
  const [scores, setScores] = useState({ X: 0, O: 0, Draws: 0 });
  const [highlight, setHighlight] = useState([]);

  const status = useMemo(() => {
    const res = calculateWinner(board);
    if (res?.winner) return `${res.winner} wins`;
    if (res?.isDraw) return 'Draw';
    return `Turn: ${xIsNext ? 'X' : 'O'}`;
  }, [board, xIsNext]);

  // Apply theme variables to root for Ocean Professional vibe
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', dark ? '#0b1220' : OCEAN_THEME.background);
    root.style.setProperty('--bg-secondary', dark ? '#0f172a' : '#eef2ff');
    root.style.setProperty('--text-primary', dark ? '#f8fafc' : OCEAN_THEME.text);
    root.style.setProperty('--text-secondary', OCEAN_THEME.primary);
    root.style.setProperty('--border-color', dark ? 'rgba(255,255,255,0.08)' : '#e5e7eb');
    root.style.setProperty('--button-bg', OCEAN_THEME.primary);
    root.style.setProperty('--button-text', '#ffffff');
  }, [dark]);

  // Detect winner/draw, update scores and highlight
  useEffect(() => {
    const res = calculateWinner(board);
    if (res?.winner) {
      setHighlight(res.line);
      setScores(s => ({ ...s, [res.winner]: (s[res.winner] || 0) + 1 }));
    } else if (res?.isDraw) {
      setScores(s => ({ ...s, Draws: s.Draws + 1 }));
    } else {
      setHighlight([]);
    }
  }, [board]);

  // Simple CPU opponent (plays as 'O' when mode === 'cpu')
  useEffect(() => {
    const res = calculateWinner(board);
    if (mode === 'cpu' && !res && !xIsNext) {
      const timer = setTimeout(() => {
        // Try to win or block, otherwise random
        const move = findBestAIMove(board, 'O', 'X') ?? pickRandomMove(board);
        if (move !== null && board[move] === null) {
          const next = board.slice();
          next[move] = 'O';
          setBoard(next);
          setXIsNext(true);
        }
      }, 400); // slight delay for UX
      return () => clearTimeout(timer);
    }
  }, [mode, xIsNext, board]);

  function handleClick(i) {
    const res = calculateWinner(board);
    if (res || board[i]) return;
    if (mode === 'cpu' && !xIsNext) return;

    const next = board.slice();
    next[i] = xIsNext ? 'X' : 'O';
    setBoard(next);
    setXIsNext(!xIsNext);
  }

  function resetBoard() {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setHighlight([]);
  }

  function resetScores() {
    setScores({ X: 0, O: 0, Draws: 0 });
  }

  // PUBLIC_INTERFACE
  const toggleTheme = () => setDark(v => !v);

  const isProd = env.NODE_ENV === 'production';

  return (
    <div className="App">
      <header className="App-header" style={styles.appHeader}>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
          style={styles.themeToggle}
        >
          {dark ? '☀️ Light' : '🌙 Dark'}
        </button>

        <div style={styles.container}>
          <div style={styles.headerRow}>
            <div>
              <h1 style={styles.title}>Tic Tac Toe</h1>
              <p style={styles.subtitle}>Ocean Professional</p>
            </div>
            <div style={styles.modeWrap} aria-label="Game mode selection">
              <label style={styles.modeLabel}>Mode</label>
              <div style={styles.segment}>
                <button
                  onClick={() => { setMode('pvp'); resetBoard(); }}
                  style={{
                    ...styles.segmentBtn,
                    ...(mode === 'pvp' ? styles.segmentBtnActive : {}),
                  }}
                  aria-pressed={mode === 'pvp'}
                >
                  2 Players
                </button>
                <button
                  onClick={() => { setMode('cpu'); resetBoard(); }}
                  style={{
                    ...styles.segmentBtn,
                    ...(mode === 'cpu' ? styles.segmentBtnActive : {}),
                  }}
                  aria-pressed={mode === 'cpu'}
                >
                  Vs Computer
                </button>
              </div>
            </div>
          </div>

          <div style={styles.boardCard}>
            <div role="status" aria-live="polite" style={styles.statusRow}>
              <span style={styles.statusText}>{status}</span>
              {!isProd && (
                <span style={styles.badge}>PORT {env.PORT}</span>
              )}
            </div>

            <div style={styles.board}>
              {board.map((val, i) => {
                const isWinning = highlight.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => handleClick(i)}
                    aria-label={`Cell ${i + 1} ${val ? 'taken by ' + val : 'empty'}`}
                    style={{
                      ...styles.cell,
                      ...(val ? styles.cellFilled : {}),
                      ...(isWinning ? styles.cellWin : {}),
                    }}
                  >
                    <span style={{
                      ...styles.cellMark,
                      color: val === 'X' ? OCEAN_THEME.primary : OCEAN_THEME.secondary
                    }}>
                      {val}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={styles.controls}>
              <button onClick={resetBoard} style={styles.primaryBtn}>Reset Board</button>
              <button onClick={resetScores} style={styles.ghostBtn}>Reset Scores</button>
            </div>
          </div>

          <div style={styles.scoreRow} aria-label="Scoreboard">
            <ScoreCard label="Player X" value={scores.X} color={OCEAN_THEME.primary} />
            <ScoreCard label={mode === 'cpu' ? 'Computer (O)' : 'Player O'} value={scores.O} color={OCEAN_THEME.secondary} />
            <ScoreCard label="Draws" value={scores.Draws} color="#6b7280" />
          </div>

          <footer style={styles.footer}>
            <small style={{ color: 'var(--text-primary)', opacity: 0.7 }}>
              {env.NODE_ENV} • Smooth, modern, minimal UI
            </small>
          </footer>
        </div>
      </header>
    </div>
  );
}

/**
 * Simple minimax-lite: try win, then block, else center/corner/side.
 */
function findBestAIMove(board, ai, human) {
  // 1. Win if possible
  for (const i of emptyIndices(board)) {
    const copy = board.slice();
    copy[i] = ai;
    if (calculateWinner(copy)?.winner === ai) return i;
  }
  // 2. Block if human can win
  for (const i of emptyIndices(board)) {
    const copy = board.slice();
    copy[i] = human;
    if (calculateWinner(copy)?.winner === human) return i;
  }
  // 3. Take center
  if (board[4] === null) return 4;
  // 4. Corners
  const corners = [0,2,6,8].filter(i => board[i] === null);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  // 5. Sides
  const sides = [1,3,5,7].filter(i => board[i] === null);
  if (sides.length) return sides[Math.floor(Math.random() * sides.length)];
  return null;
}

function emptyIndices(board) {
  const out = [];
  for (let i = 0; i < board.length; i++) if (!board[i]) out.push(i);
  return out;
}

function ScoreCard({ label, value, color }) {
  return (
    <div style={{ ...styles.scoreCard, borderColor: 'var(--border-color)' }}>
      <div style={{ ...styles.dot, backgroundColor: color }} />
      <div style={styles.scoreTextWrap}>
        <span style={styles.scoreLabel}>{label}</span>
        <span style={styles.scoreValue}>{value}</span>
      </div>
    </div>
  );
}

/**
 * Inline styles created to align with the "Ocean Professional" theme and modern UI guidance.
 * Uses subtle shadows, rounded corners, and smooth transitions.
 */
const styles = {
  appHeader: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, rgba(37,99,235,0.06) 0%, rgba(249,250,251,1) 60%)',
    padding: '48px 16px',
  },
  themeToggle: {
    position: 'fixed',
    top: 20,
    right: 20,
    background: OCEAN_THEME.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all .2s ease',
    boxShadow: '0 8px 24px rgba(37,99,235,0.25)',
    zIndex: 10,
  },
  container: {
    width: '100%',
    maxWidth: 980,
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
    marginBottom: 16,
  },
  title: {
    margin: 0,
    color: 'var(--text-primary)',
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 0,
    color: OCEAN_THEME.primary,
    fontWeight: 600,
  },
  modeWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  modeLabel: {
    fontSize: 12,
    color: 'var(--text-primary)',
    opacity: 0.65,
  },
  segment: {
    display: 'inline-flex',
    background: '#ffffff',
    border: '1px solid var(--border-color)',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  },
  segmentBtn: {
    padding: '8px 12px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'all .2s ease',
  },
  segmentBtnActive: {
    background: 'linear-gradient(180deg, rgba(37,99,235,0.1), rgba(37,99,235,0.08))',
    color: OCEAN_THEME.primary,
  },
  boardCard: {
    background: OCEAN_THEME.surface,
    border: '1px solid var(--border-color)',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusText: {
    color: 'var(--text-primary)',
    fontWeight: 700,
    letterSpacing: 0.2,
  },
  badge: {
    fontSize: 12,
    background: 'rgba(37,99,235,0.1)',
    color: OCEAN_THEME.primary,
    padding: '4px 8px',
    borderRadius: 999,
    border: `1px solid rgba(37,99,235,0.2)`,
  },
  board: {
    display: 'grid',
    gap: 10,
    gridTemplateColumns: 'repeat(3, 1fr)',
    width: 'min(92vw, 420px)',
    margin: '0 auto',
  },
  cell: {
    width: '100%',
    aspectRatio: '1 / 1',
    background: '#ffffff',
    border: '1px solid var(--border-color)',
    borderRadius: 12,
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
    transition: 'transform .08s ease, box-shadow .2s ease, background .2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFilled: {
    background: 'linear-gradient(180deg, rgba(37,99,235,0.03), rgba(0,0,0,0.01))',
  },
  cellWin: {
    outline: `2px solid ${OCEAN_THEME.secondary}`,
    boxShadow: '0 8px 30px rgba(245,158,11,0.35)',
  },
  cellMark: {
    fontSize: 'clamp(44px, 8vw, 64px)',
    fontWeight: 900,
    letterSpacing: '-0.04em',
    userSelect: 'none',
  },
  controls: {
    marginTop: 16,
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryBtn: {
    background: OCEAN_THEME.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '10px 16px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 10px 24px rgba(37,99,235,0.35)',
  },
  ghostBtn: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 12,
    padding: '10px 16px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  scoreRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
    gap: 16,
    marginTop: 16,
  },
  scoreCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#ffffff',
    border: '1px solid',
    borderRadius: 14,
    padding: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  scoreTextWrap: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
  },
  scoreLabel: {
    color: 'var(--text-primary)',
    opacity: 0.75,
    fontWeight: 600,
  },
  scoreValue: {
    color: 'var(--text-primary)',
    fontWeight: 900,
    fontSize: 20,
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
  },
};
