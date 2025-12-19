#!/bin/sh
echo "=== First POST ==="
curl -s -X POST -H 'Content-Type: application/json' -d '{"paymentId":"TEST_IDEMPOTENCY_123","status":"SUCCESS","eventId":"TEST_IDEMPOTENCY_EVENT_123"}' http://127.0.0.1:3000/api/payments/upay/webhook
echo
sleep 2
echo "=== Second POST (should show deduped:true) ==="
curl -s -X POST -H 'Content-Type: application/json' -d '{"paymentId":"TEST_IDEMPOTENCY_123","status":"SUCCESS","eventId":"TEST_IDEMPOTENCY_EVENT_123"}' http://127.0.0.1:3000/api/payments/upay/webhook
