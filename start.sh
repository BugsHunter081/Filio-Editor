#!/bin/bash
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

if ! pg_lsclusters 2>/dev/null | grep -q online; then
  pg_ctlcluster 15 main start || true
fi

cd "$ROOT/backend"
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

cd "$ROOT/frontend"
if [ ! -d node_modules ]; then
  npm install
fi
npm run dev

trap "kill $BACKEND_PID" EXIT
