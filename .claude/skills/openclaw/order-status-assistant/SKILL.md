# Order Status Assistant

## Triggers
- User wants to check order status
- User says "order status", "where is my order", "delivery date"

## What It Does

### 1. Order Lookup
```
Input: Order ID / Phone / Email
       ↓
Fetch: Order from database/system
       ↓
Display: Status + Timeline + Details
```

### 2. Status Templates
```
PLACED: "Your order #{id} has been placed successfully! 
         Expected delivery: {date}"

PROCESSING: "Your order is being prepared. 
             We'll notify you when it's shipped."

SHIPPED: "Great news! Your order has been shipped.
          Track: {tracking_link}
          Expected: {delivery_date}"

OUT_FOR_DELIVERY: "Your order is out for delivery!
                   Expected by: {time} today"

DELIVERED: "✓ Delivered on {date} at {time}
             Left at: {location}
             Received by: {name if signed}"

CANCELLED: "Your order #{id} has been cancelled.
            Refund will be processed in 3-5 business days."

RETURNED: "Your return request has been accepted.
           We'll pick up on {date}"
```

### 3. Quick Status Card
```
┌─────────────────────────────────┐
│ 📦 Order #ORD-12345            │
│ ─────────────────────────────────│
│ Status: 🚚 Out for Delivery     │
│ Expected: Today by 7 PM          │
│ ─────────────────────────────────│
│ Item: Wireless Mouse            │
│ Qty: 1 | ₹599                   │
│ ─────────────────────────────────│
│ [Track] [Contact Support]       │
└─────────────────────────────────┘
```
