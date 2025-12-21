#!/usr/bin/env bash
set -euo pipefail

email="testbilling$RANDOM@test.com"
echo "Registering $email"

cat > /tmp/payload.json <<'EOF'
{
	"email": "REPLACE_EMAIL",
	"password": "SecureTest123!@#",
	"billing": {
		"fullName": "John Doe",
		"country": "US",
		"city": "New York",
		"postalCode": "10001",
		"street": "123 Main St",
		"phone": "555-1234",
		"type": "INDIVIDUAL",
		"companyName": "Acme Corp",
		"taxNumber": "12-3456789"
	}
}
EOF

sed -i "s/REPLACE_EMAIL/$email/" /tmp/payload.json

# Copy payload into container
cat /tmp/payload.json | docker exec -i zed-api sh -c "cat > /tmp/payload.json"

# Call API inside container
docker exec -i zed-api wget -qO- --header="Content-Type: application/json" --post-file=/tmp/payload.json http://127.0.0.1:3000/api/auth/register
