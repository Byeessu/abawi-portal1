#!/bin/bash
# ABAWI Portal — Deploy to Netlify
# Usage: bash deploy.sh

set -e

echo "=== ABAWI Portal Deploy ==="

# 1. Build
echo "[1/3] Building..."
npm run build

# 2. Link or deploy
echo "[2/3] Checking Netlify link..."
if [ ! -f ".netlify/state.json" ]; then
  echo "  → Linking to Netlify site..."
  node_modules/.bin/netlify link
fi

# 3. Deploy
echo "[3/3] Deploying to production..."
node_modules/.bin/netlify deploy --prod --dir=dist

echo "=== Deploy complete ==="
