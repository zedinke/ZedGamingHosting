#!/bin/bash
set -e

echo "=== Ubuntu 24.04 Server Setup for ZedHosting ==="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Update system
echo -e "${YELLOW}[1/7] Updating system packages...${NC}"
apt-get update -y
apt-get upgrade -y

# Install prerequisites
echo -e "${YELLOW}[2/7] Installing prerequisites...${NC}"
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ufw \
    openssl

# Install Docker
echo -e "${YELLOW}[3/7] Installing Docker...${NC}"
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
    echo -e "${GREEN}Docker is already installed${NC}"
fi

# Verify Docker installation
echo -e "${GREEN}Docker version:${NC}"
docker --version
echo -e "${GREEN}Docker Compose version:${NC}"
docker compose version

# Start and enable Docker
systemctl start docker
systemctl enable docker

echo -e "${GREEN}[4/7] Docker installed successfully!${NC}"

# Configure firewall
echo -e "${YELLOW}[5/7] Configuring firewall...${NC}"
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 3000/tcp  # API
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

echo -e "${GREEN}[6/7] Firewall configured${NC}"

# Create project directory
echo -e "${YELLOW}[7/7] Creating project directory...${NC}"
mkdir -p /opt/zedhosting
cd /opt/zedhosting

# Generate .env file with secure random values
echo -e "${YELLOW}Generating .env file with secure random values...${NC}"
cat > .env << 'ENVEOF'
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=POSTGRES_PASSWORD_PLACEHOLDER
POSTGRES_DB=zedhosting

# Redis
REDIS_PASSWORD=REDIS_PASSWORD_PLACEHOLDER

# Security secrets
JWT_SECRET=JWT_SECRET_PLACEHOLDER
ENCRYPTION_KEY=ENCRYPTION_KEY_PLACEHOLDER
HASH_SECRET=HASH_SECRET_PLACEHOLDER

# Licensing (UPDATE THIS!)
LICENSE_KEY=your_valid_license_key
LICENSE_SERVER_URL=https://license.zedhosting.com

# API Config
API_URL=https://116.203.226.140
PORT=3000
ENVEOF

# Generate secure random values
DB_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
REDIS_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
JWT_SEC=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
ENC_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
HASH_SEC=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# Replace placeholders (escape special characters for sed)
DB_PASS_ESC=$(echo "$DB_PASS" | sed 's/[[\.*^$()+?{|]/\\&/g')
REDIS_PASS_ESC=$(echo "$REDIS_PASS" | sed 's/[[\.*^$()+?{|]/\\&/g')
JWT_SEC_ESC=$(echo "$JWT_SEC" | sed 's/[[\.*^$()+?{|]/\\&/g')
ENC_KEY_ESC=$(echo "$ENC_KEY" | sed 's/[[\.*^$()+?{|]/\\&/g')
HASH_SEC_ESC=$(echo "$HASH_SEC" | sed 's/[[\.*^$()+?{|]/\\&/g')

sed -i "s/POSTGRES_PASSWORD_PLACEHOLDER/$DB_PASS_ESC/g" .env
sed -i "s/REDIS_PASSWORD_PLACEHOLDER/$REDIS_PASS_ESC/g" .env
sed -i "s/JWT_SECRET_PLACEHOLDER/$JWT_SEC_ESC/g" .env
sed -i "s/ENCRYPTION_KEY_PLACEHOLDER/$ENC_KEY_ESC/g" .env
sed -i "s/HASH_SECRET_PLACEHOLDER/$HASH_SEC_ESC/g" .env

echo -e "${GREEN}.env file generated at /opt/zedhosting/.env${NC}"
echo -e "${YELLOW}⚠️  IMPORTANT: Update LICENSE_KEY in .env file!${NC}"

echo ""
echo -e "${GREEN}=== Setup completed successfully! ===${NC}"
echo ""
echo "Next steps:"
echo "1. Copy your project files to /opt/zedhosting"
echo "2. Update LICENSE_KEY in /opt/zedhosting/.env"
echo "3. Run: cd /opt/zedhosting && docker compose up -d --build"
echo "4. Run: docker compose exec api npx prisma migrate deploy"

