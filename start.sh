#!/usr/bin/env bash
cd "$(dirname "$0")"
fuser -k 4000/tcp 3000/tcp 2>/dev/null || true
(cd backend && ./node_modules/.bin/tsx src/index.ts) &
BACKEND_PID=$!
(cd frontend && ./node_modules/.bin/vite --port 3000 --host 0.0.0.0) &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT INT TERM
wait
