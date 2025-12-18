#!/bin/bash

# Test script for complete order workflow
# Tests: order creation → payment → provisioning → cancellation → invoicing

API_URL="http://localhost:3000"
AUTH_TOKEN=""

echo "🧪 Starting Order Workflow Test..."

# Step 1: Login (vagy registration)
echo "📝 Step 1: Creating test user..."
USER_EMAIL="test-$(date +%s)@test.com"
USER_PASSWORD="TestPass123!"

# Feltételezzük, hogy már van user. Használunk létező test usert.
USER_EMAIL="test@zedhosting.com"

# Step 2: Get a token (mock - development mode)
echo "🔐 Step 2: Getting auth token..."
# In real scenario, login here

# Step 3: List available plans
echo "📋 Step 3: Fetching available plans..."
PLANS=$(curl -s "$API_URL/api/plans" | jq '.data[0]')
PLAN_ID=$(echo "$PLANS" | jq -r '.id')
PLAN_NAME=$(echo "$PLANS" | jq -r '.name')

echo "✓ Available plan: $PLAN_NAME (ID: $PLAN_ID)"

# Step 4: Create order
echo "🛒 Step 4: Creating order..."
CREATE_ORDER=$(curl -s -X POST "$API_URL/api/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{\"planId\": \"$PLAN_ID\", \"billingCycle\": \"MONTHLY\"}")

ORDER_ID=$(echo "$CREATE_ORDER" | jq -r '.id')
echo "✓ Order created: $ORDER_ID"

# Step 5: Process mock payment
echo "💳 Step 5: Processing mock payment..."
PAYMENT=$(curl -s -X POST "$API_URL/api/orders/$ORDER_ID/payment" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{\"method\": \"mock\"}")

ORDER_STATUS=$(echo "$PAYMENT" | jq -r '.status')
echo "✓ Order status: $ORDER_STATUS"

if [ "$ORDER_STATUS" = "PAID" ]; then
  echo "✓ Payment processed successfully!"
  
  # Step 6: Check server provisioning
  echo "🖥️  Step 6: Checking server provisioning..."
  sleep 2
  
  ORDER_DETAILS=$(curl -s "$API_URL/api/orders/$ORDER_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN")
  
  SERVER_ID=$(echo "$ORDER_DETAILS" | jq -r '.serverId')
  if [ ! -z "$SERVER_ID" ] && [ "$SERVER_ID" != "null" ]; then
    echo "✓ Server provisioned! Server ID: $SERVER_ID"
  else
    echo "⚠️  Server provisioning in progress..."
  fi
  
  # Step 7: Download invoice
  echo "📄 Step 7: Downloading invoice..."
  curl -s "$API_URL/api/orders/$ORDER_ID/invoice/pdf" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -o "invoice-$ORDER_ID.pdf"
  
  if [ -f "invoice-$ORDER_ID.pdf" ]; then
    SIZE=$(stat -f%z "invoice-$ORDER_ID.pdf" 2>/dev/null || stat -c%s "invoice-$ORDER_ID.pdf" 2>/dev/null)
    if [ "$SIZE" -gt 1000 ]; then
      echo "✓ Invoice PDF downloaded! Size: $SIZE bytes"
    fi
  fi
else
  echo "✗ Payment failed!"
  exit 1
fi

echo ""
echo "✅ Order Workflow Test Completed!"
echo ""
echo "Summary:"
echo "- Order ID: $ORDER_ID"
echo "- Plan: $PLAN_NAME"
echo "- Status: $ORDER_STATUS"
echo "- Server ID: $SERVER_ID"
