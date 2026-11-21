#!/usr/bin/env bash
# Runs once after the devcontainer is created, as `ubuntu`.
set -euo pipefail
WORKSPACE_DIR="${WORKSPACE_DIR:-/workspace/app}"
U=ubuntu

# Fresh named volumes mount as root.
for d in /commandhistory "/home/$U/.npm" "/home/$U/.claude" "/home/$U/.config/gh"; do
  sudo mkdir -p "$d"; sudo chown -R "$U:$U" "$d"
done
sudo chown "$U:$U" "/home/$U" "/home/$U/.config" || true
touch /commandhistory/.bash_history /commandhistory/.zsh_history

for rc in "/home/$U/.bashrc" "/home/$U/.zshrc"; do
  touch "$rc"
  grep -q commandhistory "$rc" || cat >> "$rc" <<'RC'
export HISTFILE=/commandhistory/.bash_history HISTSIZE=100000 HISTFILESIZE=100000
RC
done

# Git identity from .env (GIT_USERNAME / GIT_EMAIL), if set.
if [[ -f "$WORKSPACE_DIR/.env" ]]; then set -a; source "$WORKSPACE_DIR/.env"; set +a; fi
[[ -n "${GIT_USERNAME:-}" ]] && git config --global user.name "$GIT_USERNAME"
[[ -n "${GIT_EMAIL:-}" ]] && git config --global user.email "$GIT_EMAIL"
git config --global --add safe.directory "$WORKSPACE_DIR"

# Claude Code (native installer).
command -v claude >/dev/null || curl -fsSL https://claude.ai/install.sh | bash || true

# Install deps once the app has a package.json (the placeholder has none).
if [[ -f "$WORKSPACE_DIR/app/package.json" ]]; then
  (cd "$WORKSPACE_DIR/app" && npm install)
fi

echo "[postCreate] node $(node -v) / npm $(npm -v). Run: make dev"
