#!/usr/bin/env bash
set -euo pipefail

email="flowtest$RANDOM@test.com"
password="SecureTest123!@#"

echo "Registering $email"
cat > /tmp/register.json <<'EOF'
{
  "email": "REPLACE_EMAIL",
  "password": "REPLACE_PASSWORD",
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
sed -i "s/REPLACE_EMAIL/$email/; s/REPLACE_PASSWORD/$password/" /tmp/register.json

# Copy payload into container and register
cat /tmp/register.json | docker exec -i zed-api sh -c "cat > /tmp/register.json"
docker exec -i zed-api wget -qO- --header="Content-Type: application/json" --post-file=/tmp/register.json http://127.0.0.1:3000/api/auth/register

# Fetch token from DB
TOKEN=$(docker exec -i zed-mysql mysql -N -uroot -prT3Y8Au6KBNJ8zpp7uyMJhSeXgV8q1Wt zedhosting -e "SELECT emailVerificationToken FROM User WHERE email='$email';" | tr -d '\r')
echo "Token: $TOKEN"

# Attempt login before verification (should fail or block)
echo "Login before verification (expected to fail/block)"
docker exec -i zed-api wget -qO- --header="Content-Type: application/json" --post-data="{\"email\":\"$email\",\"password\":\"$password\"}" http://127.0.0.1:3000/api/auth/login || true

# Verify email
echo "Verifying email"
cat > /tmp/verify.json <<EOF
{"token":"$TOKEN"}
EOF
cat /tmp/verify.json | docker exec -i zed-api sh -c "cat > /tmp/verify.json"
docker exec -i zed-api wget -qO- --header="Content-Type: application/json" --post-file=/tmp/verify.json http://127.0.0.1:3000/api/auth/verify-email

# Login after verification (should succeed)
echo "Login after verification (expected success)"
docker exec -i zed-api wget -qO- --header="Content-Type: application/json" --post-data="{\"email\":\"$email\",\"password\":\"$password\"}" http://127.0.0.1:3000/api/auth/login

# Confirm BillingProfile row exists
echo "Check BillingProfile for user"
docker exec -i zed-mysql mysql -uroot -prT3Y8Au6KBNJ8zpp7uyMJhSeXgV8q1Wt zedhosting -e "SELECT b.id,b.userId FROM BillingProfile b JOIN User u ON b.userId=u.id WHERE u.email='$email';"
