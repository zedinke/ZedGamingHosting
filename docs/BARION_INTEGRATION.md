# 🔐 Barion Payment Gateway Integration

## Áttekintés

A Zed Gaming Hosting platform teljes Barion payment gateway integrációval rendelkezik, amely lehetővé teszi a valódi online fizetéseket magyar forintban (HUF) és egyéb pénznemekben.

## Implementált Funkciók

### ✅ 1. Barion Service (`barion.service.ts`)

**Felelősségek:**
- Barion API kommunikáció
- Payment inicializálás
- Webhook feldolgozás
- Refund kezelés

**Kulcs metódusok:**

```typescript
// Payment indítás
async startPayment(request: BarionPaymentRequest): Promise<BarionPaymentResponse>

// Payment státusz lekérdezés
async getPaymentState(paymentId: string): Promise<any>

// Webhook callback feldolgozás
async processCallback(paymentId: string): Promise<{ orderId, status, isSuccessful }>

// Refund (rendelés lemondás)
async refundPayment(paymentId: string, amount: number, orderId: string): Promise<boolean>
```

### ✅ 2. Payments Controller (`payments.controller.ts`)

**Végpontok:**

| Endpoint | Típus | Leírás |
|----------|-------|--------|
| `GET /payments/barion/callback` | Public | Barion webhook endpoint |
| `GET /payments/barion/status` | Public | Manual payment check |

**Webhook Flow:**
```
1. Barion meghívja: /payments/barion/callback?paymentId=XXX
2. Service lekérdezi a payment státuszt
3. Ha Succeeded → Order PAID státuszba
4. Server provisioning + Email küldés trigger
```

### ✅ 3. Payment Service módosítások

**Barion redirect generálás:**
```typescript
async generateBarionRedirect(orderId: string, userId: string) {
  // Valódi Barion API hívás
  const result = await barionService.startPayment({
    orderId,
    orderNumber,
    amount,
    currency,
    payerEmail,
  });
  
  return { redirectUrl: result.gatewayUrl, paymentId: result.paymentId };
}
```

## Konfiguráció

### Környezeti változók (.env)

```env
# Barion API
BARION_POS_KEY=your-pos-key-here
BARION_ENVIRONMENT=test # vagy 'production'
BARION_PAYEE_EMAIL=payee@zedhosting.com

# App URLs
API_URL=https://api.zedhosting.com
APP_URL=https://zedhosting.com
```

### Test mód vs Production

**Test mód (BARION_ENVIRONMENT=test):**
- Sandbox Barion környezet
- Mock credit card használat
- Nincs valódi tranzakció

**Production mód (BARION_ENVIRONMENT=production):**
- Éles Barion API
- Valódi bankkártya szükséges
- Valós fizetések

### Mock mód (POS_KEY nélkül)

Ha nincs BARION_POS_KEY beállítva:
- Service mock mode-ban működik
- Redirect URL: `/payment/barion/mock?orderId=XXX`
- Fejlesztéshez használatos

## Használat

### Frontend példa

```typescript
// Order payment indítás
const response = await apiClient.post(
  `/orders/${orderId}/payment`,
  { method: 'barion' }
);

// Redirect user to Barion
window.location.href = response.redirectUrl;
```

### Payment flow diagram

```
┌──────────┐
│  User    │
│  Order   │
└────┬─────┘
     │
     ▼
┌──────────────────┐
│ POST /orders/:id │ method: barion
│    /payment      │
└────┬─────────────┘
     │
     ▼
┌─────────────────────┐
│ PaymentService      │
│ .generateBarion()   │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│ BarionService       │
│ .startPayment()     │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│ Barion API          │
│ Creates payment     │
└────┬────────────────┘
     │ Returns gateway URL
     ▼
┌─────────────────────┐
│ User redirected to  │
│ Barion payment page │
└────┬────────────────┘
     │ User pays
     ▼
┌─────────────────────┐
│ Barion sends        │
│ webhook callback    │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│ GET /payments/      │
│ barion/callback     │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│ Order → PAID        │
│ Server provision    │
│ Email send          │
└─────────────────────┘
```

## Tesztelés

### Test fizetés Barion Sandbox-szal

1. Állítsd be test mode-ot:
```env
BARION_ENVIRONMENT=test
BARION_POS_KEY=your-test-pos-key
```

2. Használj test credit card-ot:
```
Card number: 9999999999999000
Exp: 12/25
CVC: 123
```

3. Rendelés létrehozás és payment indítás:
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer TOKEN" \
  -d '{"planId":"plan-1","billingCycle":"MONTHLY"}'

# Response: { "id": "order-xyz" }

curl -X POST http://localhost:3000/api/orders/order-xyz/payment \
  -H "Authorization: Bearer TOKEN" \
  -d '{"method":"barion"}'

# Response: { "redirectUrl": "https://secure.test.barion.com/..." }
```

4. Látogass el a redirectUrl-re és fizess test card-dal

5. Barion webhook automatikusan meghívja:
```
GET /payments/barion/callback?paymentId=XXXX
```

6. Order státusz ellenőrzés:
```bash
curl http://localhost:3000/api/orders/order-xyz \
  -H "Authorization: Bearer TOKEN"

# status: "PAID"
```

### Manual webhook trigger (dev)

```bash
# Ha webhook nem jön automatikusan
curl "http://localhost:3000/api/payments/barion/status?paymentId=PAYMENT_ID"
```

## Refund / Lemondás

Order cancel automatikusan Barion refund-ot triggerel:

```typescript
// orders.controller.ts
@Delete(':id')
async cancel(@Param('id') orderId: string, @Request() req: any) {
  // Ha PAID orderből Barion payment → refund
  return this.ordersService.cancelOrder(orderId, req.user?.id);
}
```

Refund flow:
1. User lemondja az ordert
2. `OrdersService.cancelOrder()` meghívódik
3. Ha payment method = 'barion' → `BarionService.refundPayment()`
4. Barion API refund kérés
5. Pénz visszamegy user-nek (vagy wallet-be)

## Biztonság

### Webhook védelem

- **IP whitelist**: Csak Barion IP-kről fogadunk webhook-ot (opcionális)
- **Payment ID validáció**: Minden webhook esetén ellenőrizzük a payment state-et
- **Order ownership**: Csak saját order update-elése

### Érzékeny adatok

- POS Key `.env` fájlban, **NEM** commitolva
- API hívások HTTPS-en keresztül
- User credit card adatokat **NEM** tároljuk - Barion kezeli

## Hibaelhárítás

### Common issues

**Problem:** "Barion not configured - using mock mode"
- **Megoldás:** Állítsd be a `BARION_POS_KEY`-t az `.env`-ben

**Problem:** Webhook nem jön vissza
- **Megoldás 1:** Ellenőrizd a Barion dashboard-ban a CallbackUrl beállítást
- **Megoldás 2:** ngrok/localhost tunnel kell dev környezetben
- **Megoldás 3:** Manual check: `GET /payments/barion/status?paymentId=XXX`

**Problem:** "Barion error: Invalid POSKey"
- **Megoldás:** Test/Prod POSKey keverés - ellenőrizd az ENVIRONMENT-et

**Problem:** Payment Prepared státuszban ragadt
- **Megoldás:** User nem fejezte be a fizetést - várj vagy cancel

## Logging

Minden Barion műveletet logolunk:

```
[BarionService] Barion service initialized in test mode
[BarionService] Barion payment started: abc123 for order order-xyz
[PaymentsController] Received Barion callback for payment: abc123
[PaymentsController] Order order-xyz marked as PAID via Barion payment abc123
```

Log szintek:
- **INFO**: Sikeres műveletek
- **WARN**: Mock mode, retry attempts
- **ERROR**: API errors, failed payments

## Next Steps

### Opcionális fejlesztések:

- [ ] Subscription/recurring payment támogatás
- [ ] Multi-currency support (EUR, USD)
- [ ] Partial refund kezelés
- [ ] Payment retry logic failed payments-hez
- [ ] Admin dashboard: payment history, analytics

---

## Kapcsolódó Dokumentáció

- [Barion API Docs](https://docs.barion.com/)
- [node-barion SDK](https://github.com/aron123/node-barion)
- [Order Management Workflow](./INVOICE_EMAIL_INTEGRATION.md)

---

**Status:** ✅ Production Ready (Barion test mode-dal tesztelve)
