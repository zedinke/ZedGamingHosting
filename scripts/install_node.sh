#!/usr/bin/env bash
set -euo pipefail

# Non-interactive installer for a new Node (daemon host) on Debian 12 (bookworm)
# - Installs Docker Engine + Compose plugin
# - Clones the repo (or updates it) to /opt/zedhosting-node
# - Generates minimal .env with MANAGER_URL, API_KEY, NODE_ID, DAEMON_PORT
# - Builds and starts only the daemon service via docker compose (no deps)
# - Installs a systemd unit to auto-start daemon on boot

usage() {
  cat <<USAGE
Usage: sudo bash install_node.sh \\
  --manager-url https://api.example.com \\
  --node-id <UUID> \\
  --api-key <TOKEN> \\
  [--repo-url https://github.com/zedinke/ZedGamingHosting.git] \\
  [--branch main] \\
  [--daemon-port 3001] \\
  [--with-traefik false] \\
  [--game-port-range 20000:30000]

Notes:
- Run as root (or with sudo)
- manager-url should be the public base URL of the backend (e.g. https://zedgaminghosting.hu)
- node-id and api-key come from the Admin → Nodes flow
USAGE
}

REPO_URL="https://github.com/zedinke/ZedGamingHosting.git"
BRANCH="main"
INSTALL_DIR="/opt/zedhosting-node"
DAEMON_PORT="3001"
WITH_TRAEFIK="false"
GAME_PORT_RANGE="20000:30000"

MANAGER_URL=""
NODE_ID=""
API_KEY=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --manager-url)
      MANAGER_URL="$2"; shift 2;;
    --node-id)
      NODE_ID="$2"; shift 2;;
    --api-key)
      API_KEY="$2"; shift 2;;
    --repo-url)
      REPO_URL="$2"; shift 2;;
    --branch)
      BRANCH="$2"; shift 2;;
    --daemon-port)
      DAEMON_PORT="$2"; shift 2;;
    --with-traefik)
      WITH_TRAEFIK="$2"; shift 2;;
    --game-port-range)
      GAME_PORT_RANGE="$2"; shift 2;;
    -h|--help)
      usage; exit 0;;
    *)
      echo "Unknown option: $1"; usage; exit 1;;
  esac
done

if [[ -z "$MANAGER_URL" || -z "$NODE_ID" || -z "$API_KEY" ]]; then
  echo "Missing required flags." >&2
  usage
  exit 1
fi

echo "=== Installing Node (daemon host) on Debian 12 ==="

echo "[1/6] Installing prerequisites"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg lsb-release git ufw jq

echo "[2/6] Installing Docker Engine + Compose plugin"
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
else
  echo "Docker already installed: $(docker --version)"
fi

echo "[3/6] Firewall (UFW) rules"
ufw --force enable || true
ufw allow 22/tcp || true
ufw allow ${DAEMON_PORT}/tcp || true
if [[ "$WITH_TRAEFIK" == "true" ]]; then
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
fi

echo "[4/6] Fetching repository to ${INSTALL_DIR}"
mkdir -p "$INSTALL_DIR"
if [[ -d "$INSTALL_DIR/.git" ]]; then
  git -C "$INSTALL_DIR" fetch --all --prune
  git -C "$INSTALL_DIR" checkout "$BRANCH"
  git -C "$INSTALL_DIR" pull --rebase
else
  git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$INSTALL_DIR"
fi

echo "[5/6] Generating .env for daemon"
cat >"$INSTALL_DIR/.env" <<ENVEOF
# Minimal env for daemon on a remote node
NODE_ENV=production
DAEMON_PORT=${DAEMON_PORT}
MANAGER_URL=${MANAGER_URL}
API_KEY=${API_KEY}
NODE_ID=${NODE_ID}

# Optional Redis (daemon runs without it; fill if available)
# REDIS_HOST=
# REDIS_PORT=6379
# REDIS_PASSWORD=
# REDIS_DB=0
ENVEOF

echo "[5b/6] Creating systemd unit: zed-daemon.service"
cat >/etc/systemd/system/zed-daemon.service <<UNIT
[Unit]
Description=ZedHosting Daemon (docker compose)
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
WorkingDirectory=${INSTALL_DIR}
RemainAfterExit=yes
ExecStart=/usr/bin/docker compose up -d --no-deps --build daemon
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable zed-daemon.service

echo "[6/6] Starting daemon via systemd"
systemctl start zed-daemon.service

echo "Waiting for daemon to start (10s)"
sleep 10
docker logs zed-daemon --tail 50 || true

echo "=== Done. Node should register against ${MANAGER_URL}. ==="
echo "If registration fails, verify API connectivity and credentials." 
