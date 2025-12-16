# Tic Tac Toe Frontend (React)

Modern, responsive Tic Tac Toe with Ocean Professional theme.

## Features
- Two-player local play and optional simple computer opponent
- Win/draw detection, reset board, and score tracking (X/O/Draws)
- Ocean Professional theme (blue/amber accents), smooth transitions, rounded corners
- Responsive centered grid with controls
- Uses CRA; runs on port 3000 by default

## Scripts
- `npm start` — start dev server at http://localhost:3000
- `npm test` — run tests
- `npm run build` — production build

## Environment
This app reads optional env variables (prefixed `REACT_APP_`):
- `REACT_APP_NODE_ENV` — environment override (falls back to NODE_ENV)
- `REACT_APP_PORT` — UI display only (CRA dev server port is still 3000)
- `REACT_APP_FEATURE_FLAGS` — reserved for future toggles

Note: Do not commit a .env with secrets. Provide values through the environment as needed.

## Notes
- The computer opponent uses a simple strategy: win > block > center > corner > side.
- The theme toggle (🌙/☀️) switches between light/dark variants of the Ocean palette.

