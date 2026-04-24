# Integration Test Writer

## Triggers
- User wants integration tests
- User says "integration test", "API test", "service test"

## What It Does

### Test Coverage
```
API/DB/SERVICE
        ↓
1. SETUP
   → Database state
   → Mock external services
   → Test fixtures
        ↓
2. EXECUTE
   → Call the API/function
   → Perform action
        ↓
3. ASSERT
   → Response status
   → Data in DB
   → Side effects
        ↓
OUTPUT: Integration tests
```

### Output Format
```typescript
// tests/integration/orders.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { db } from '../../src/db';

describe('POST /api/orders', () => {
  beforeEach(async () => {
    await db.order.deleteMany();
  });
  
  it('should create order and return 201', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ userId: '123', items: [{ id: '1', qty: 2 }] });
    
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    
    const order = await db.order.findFirst();
    expect(order.userId).toBe('123');
  });
});
```

## Commands
| Command | Action |
|---------|--------|
| `write integration` | API tests |
| `add fixtures` | Test data |
| `mock external` | Mock services |
