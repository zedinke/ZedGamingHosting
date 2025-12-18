# Node Onboarding (Debian 12)

This guide shows how to add a brand-new Debian 12 server as a Node (daemon host) in a fully non‑interactive way.

## Prerequisites
- Fresh Debian 12 (bookworm) server with root SSH access
- From Admin → Nodes, create a Node and obtain:
  - NODE_ID (UUID)
  - API_KEY (provisioning token)
- Backend public URL (e.g. https://zedgaminghosting.hu)

## One‑liner install
SSH to the new server and run:

```bash
sudo bash -c "curl -fsSL https://raw.githubusercontent.com/zedinke/ZedGamingHosting/main/scripts/install_node.sh | bash -s -- \
  --manager-url https://zedgaminghosting.hu \
  --node-id <NODE_UUID> \
  --api-key <API_KEY> \
  --branch main \
  --daemon-port 3001"
```

This will:
- Install Docker Engine + Compose plugin
- Clone/update the repo at `/opt/zedhosting-node`
- Generate `/opt/zedhosting-node/.env` with `MANAGER_URL`, `API_KEY`, `NODE_ID`, `DAEMON_PORT`
- Build and start only the `daemon` service using docker compose (no other services)
- Install a systemd unit `zed-daemon.service` for auto‑start on boot

## Optional flags
- `--repo-url <URL>`: Use a different repository URL
- `--branch <name>`: Checkout a specific branch (default: main)
- `--daemon-port <port>`: Daemon HTTP port (default: 3001)
- `--with-traefik true`: Opens ports 80/443 in UFW (Traefik managed separately)
- `--game-port-range 20000:30000`: Reserved range for game ports (firewall policy to be applied separately if desired)

## Verification
- Check container status: `docker ps | grep zed-daemon`
- Tail logs: `docker logs -f zed-daemon`
- Health check: `curl -s http://127.0.0.1:3001/health`
- In Admin → Nodes, the Node status should transition from `PROVISIONING` to `ONLINE` after registration and heartbeats.

## Troubleshooting
- If registration fails, verify outbound connectivity to `MANAGER_URL` and that `API_KEY`/`NODE_ID` match the values from Admin → Nodes.
- Ensure firewall allows the daemon port (default 3001) if you need to reach it remotely.
- Re-run: `systemctl restart zed-daemon` to rebuild/redeploy daemon from the checked-out repo.
