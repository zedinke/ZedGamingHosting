# Admin Infrastructure Documentation

## Overview

The admin infrastructure provides comprehensive platform management capabilities with role-based access control. All admin endpoints require both JWT authentication and ADMIN role verification.

## Architecture

### Guard Chain
```
Request → JwtAuthGuard (verify token) → AdminGuard (verify ADMIN role) → Controller
```

### Authentication Pattern
```typescript
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/...')
export class AdminController {}
```

## Controllers

### 1. Admin Orders Controller
**File**: `apps/api/src/orders/admin-orders.controller.ts`

#### Endpoints

**GET /admin/orders** - List all orders with pagination and filters
```
Query Parameters:
- skip: number (default: 0)
- take: number (default: 50)
- status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' (optional)
- paymentMethod: 'MOCK' | 'BARION' | 'PAYPAL' | 'UPAY' | 'STRIPE' (optional)

Response:
{
  "data": [...],
  "pagination": { "skip": 0, "take": 50, "total": 500, "pages": 10 }
}
```

**GET /admin/orders/:id** - Get single order details
```
Response:
{
  "id": "uuid",
  "user": { "id", "email" },
  "plan": { "id", "name", "basePrice" },
  "gameServer": { "id", "hostname", "slots" },
  "totalAmount": 500,
  "status": "PAID",
  "paymentMethod": "PAYPAL",
  "paymentId": "PP-123456",
  "invoiceUrl": "...",
  "createdAt": "2024-01-15T10:30:00Z",
  "paidAt": "2024-01-15T10:35:00Z"
}
```

**PUT /admin/orders/:id** - Update order
```
Body:
{
  "notes": "New notes",
  "status": "PAID"
}

Response: Updated order object
```

**PUT /admin/orders/:id/refund** - Force refund order
```
Body:
{
  "reason": "Refund reason"
}

Response:
{
  "success": true,
  "message": "Order refunded",
  "refundId": "REF-12345"
}
```

**DELETE /admin/orders/:id** - Delete unpaid order
```
Response:
{
  "success": true,
  "message": "Order deleted"
}
```

### 2. Admin Users Controller
**File**: `apps/api/src/admin/admin-users.controller.ts`

#### Endpoints

**GET /admin/users** - List all users with pagination and search
```
Query Parameters:
- skip: number (default: 0)
- take: number (default: 50)
- role: 'SUPERADMIN' | 'RESELLER_ADMIN' | 'USER' | 'SUPPORT' (optional)
- search: string (searches email, optional)

Response:
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "USER",
      "balance": 1000,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": { "skip": 0, "take": 50, "total": 150, "pages": 3 }
}
```

**GET /admin/users/:id** - Get user details with order history
```
Response:
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "USER",
  "balance": 1000,
  "createdAt": "2024-01-01T00:00:00Z",
  "orders": [
    {
      "id": "order-uuid",
      "status": "PAID",
      "totalAmount": 500,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**PUT /admin/users/:id** - Update user
```
Body:
{
  "role": "SUPPORT",
  "balance": 5000
}

Response: Updated user object
```

**PUT /admin/users/:id/balance** - Adjust user balance
```
Body:
{
  "amount": 1000,
  "reason": "Credit adjustment"
}

Response:
{
  "id": "uuid",
  "email": "user@example.com",
  "balance": 6000
}
```

**DELETE /admin/users/:id** - Delete user (only if no active orders)
```
Response:
{
  "success": true,
  "message": "User deleted"
}
```

### 3. Admin Stats Controller
**File**: `apps/api/src/admin/admin-stats.controller.ts`

#### Endpoints

**GET /admin/stats** - Get platform-wide statistics
```
Response:
{
  "users": {
    "total": 150,
    "active": 45,
    "premium": 12
  },
  "orders": {
    "total": 500,
    "paid": 420,
    "pending": 80
  },
  "servers": {
    "total": 200,
    "active": 185
  },
  "nodes": {
    "total": 8,
    "healthy": 7
  },
  "revenue": {
    "total": 42500000,
    "thisMonth": 3200000,
    "lastMonth": 2890000
  }
}
```

### 4. Admin Settings Controller
**File**: `apps/api/src/admin/admin-settings.controller.ts`

#### Endpoints

**GET /admin/settings** - Get all platform settings
```
Response:
{
  "maxPlayersPerServer": 128,
  "maxServersPerUser": 10,
  "minBillingAmount": 100,
  "paymentProcessingFee": 3,
  "refundWindowDays": 30,
  "emailTemplatesEnabled": true,
  "maintenanceMode": false
}
```

**PUT /admin/settings** - Update platform settings
```
Body:
{
  "maxPlayersPerServer": 256,
  "refundWindowDays": 60,
  "maintenanceMode": true
}

Response: Updated settings object
```

## Usage Examples

### Get all paid orders
```bash
GET /admin/orders?status=PAID&take=100
```

### List admin users
```bash
GET /admin/users?role=SUPERADMIN
```

### Search user by email
```bash
GET /admin/users?search=admin@example.com
```

### Get monthly revenue
```bash
GET /admin/stats
# Response includes "revenue.thisMonth"
```

### Refund user order
```bash
PUT /admin/orders/order-id/refund
Body: { "reason": "Customer request" }
```

### Adjust user balance
```bash
PUT /admin/users/user-id/balance
Body: { "amount": -500, "reason": "Service credit" }
```

## Error Handling

All admin endpoints return standard error responses:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

Common error codes:
- **403 Forbidden** - User lacks ADMIN role
- **401 Unauthorized** - Invalid or missing JWT token
- **404 Not Found** - Resource not found
- **400 Bad Request** - Invalid parameters

## Security Considerations

1. **Role-Based Access Control**
   - All admin endpoints verify user.role === 'ADMIN'
   - Access attempts are logged

2. **Audit Logging**
   - All admin actions trigger audit log entries
   - IP addresses and action details are recorded

3. **Sensitive Operations**
   - User deletion blocked if active orders exist
   - Balance adjustments logged with reason
   - Refunds tracked with IDs and dates

4. **Database Queries**
   - Prisma select queries limit returned fields
   - Pagination prevents large dataset transfers
   - Indexes on frequently queried fields

## Testing Endpoints

Use Thunder Client or Postman:

```
Admin Token:
Authorization: Bearer <JWT_TOKEN_WITH_ADMIN_ROLE>

Example requests:
GET http://localhost:3000/admin/stats
GET http://localhost:3000/admin/orders?take=10
GET http://localhost:3000/admin/users?role=USER
PUT http://localhost:3000/admin/users/user-id/balance
```

## Performance Optimization

1. **Pagination**
   - Default: 50 items per page
   - Max: 100 items per page
   - Uses skip/take for efficient offset pagination

2. **Query Optimization**
   - Prisma select reduces field transfers
   - Only related data included when needed
   - Date-range filters on aggregation queries

3. **Caching Considerations** (Future)
   - Cache admin stats for 5 minutes
   - Invalidate on order/user changes
   - Redis-backed caching layer

## Integration with Payment Gateways

Admin stats include:
- Revenue calculations from all payment methods
- Order tracking across Barion, PayPal, Upay, Stripe
- Payment method distribution analysis

## Future Enhancements

- [ ] Real-time stats WebSocket updates
- [ ] Advanced reporting and exports (CSV/PDF)
- [ ] Custom dashboard widgets
- [ ] Scheduled reports via email
- [ ] Admin action approval workflow
- [ ] Two-factor authentication for admin accounts
- [ ] API rate limiting per admin user
- [ ] Bulk operations (CSV import/export)
