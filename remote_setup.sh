#!/bin/bash
set -e

echo "=== Ubuntu 24.04 Server Setup for ZedHosting ==="
echo ""

# Update system
echo "[1/7] Updating system packages..."
apt-get update -y
apt-get upgrade -y

# Install prerequisites
echo "[2/7] Installing prerequisites..."
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ufw

# Install Docker
echo "[3/7] Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Set up the repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker Engine
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
    echo "Docker is already installed"
fi

# Verify Docker installation
docker --version
docker compose version

# Start and enable Docker
systemctl start docker
systemctl enable docker

echo "[4/7] Docker installed successfully!"

# Configure firewall
echo "[5/7] Configuring firewall..."
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 3000/tcp  # API
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

echo "[6/7] Firewall configured"

# Create project directory
echo "[7/7] Creating project directory..."
mkdir -p /opt/zedhosting
cd /opt/zedhosting

echo ""
echo "=== Setup completed successfully! ==="
echo ""
echo "Next steps:"
echo "1. Copy your project files to /opt/zedhosting"
echo "2. Create .env file with your configuration"
echo "3. Run: docker compose up -d --build"
echo "4. Run: docker compose exec api npx prisma migrate deploy"
