# E2E Test Planner

## Triggers
- User wants end-to-end tests
- User says "e2e test", "end to end", "playwright", "cypress"

## What It Does

### Test Planning
```
USER FLOW
        ↓
1. MAP FLOW
   → User actions
   → Expected results
   → Edge cases
        ↓
2. DESIGN TESTS
   → Happy path
   → Error flows
   → Data setup
   → Assertions
        ↓
OUTPUT: Test suite
```

### Output Format
```typescript
// e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  
  test('should complete purchase successfully', async ({ page }) => {
    // Setup
    await page.goto('/products');
    await addToCart();
    
    // Action
    await page.click('[data-testid="checkout-btn"]');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="card"]', '4242424242424242');
    
    // Assert
    await expect(page.locator('.success')).toBeVisible();
    await expect(page.locator('.order-id')).toContainText('ORD-');
  });
  
  test('should show error for invalid card', async ({ page }) => {
    // ...
  });
});
```

## Commands
| Command | Action |
|---------|--------|
| `plan e2e` | Test plan |
| `write tests` | Generate tests |
| `add assertions` | Check results |
