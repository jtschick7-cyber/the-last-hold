#!/usr/bin/env bash
# Builds one branch for one channel into an output folder (technical design §11.3).
# Usage: build-channel.sh <live|preview> <branch> <out-dir>
set -euo pipefail

channel="$1"
branch="$2"
out="$3"

work="$(mktemp -d)"
git worktree add --detach "$work" "origin/$branch"
mkdir -p "$out"

if [ ! -f "$work/package.json" ]; then
  # main holds only docs until v0.0 is merged; serve a plain page meanwhile.
  cat > "$out/index.html" <<'HTML'
<!doctype html>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>The Last Hold</title>
<body style="background:#16120f;color:#ece3d6;font-family:system-ui;padding:1.5rem">
<h1>The Last Hold</h1>
<p>No live release yet. The preview build is at <a style="color:#e08a3c" href="preview/">preview/</a>.</p>
</body>
HTML
  echo "$branch has no app yet; wrote a placeholder page."
  exit 0
fi

cd "$work"
npm ci
LH_CHANNEL="$channel" \
  LH_BRANCH="$branch" \
  LH_COMMIT="$(git rev-parse --short HEAD)" \
  npm run build -- --outDir "$out" --emptyOutDir
