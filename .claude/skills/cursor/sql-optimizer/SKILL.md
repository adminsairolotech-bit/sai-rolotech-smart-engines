# SQL Optimizer

## Triggers
- User has slow SQL queries
- User says "slow query", "optimize SQL", "performance", "index"

## What It Does

### Optimization Steps
```
SLOW QUERY
        ↓
1. ANALYZE
   → EXPLAIN ANALYZE
   → Find full table scans
   → Identify missing indexes
        ↓
2. OPTIMIZE
   → Add indexes
   → Rewrite query
   → Optimize JOINs
   → Limit results
        ↓
OUTPUT: Faster query
```

### Output Format
```sql
-- ❌ Before (slow)
SELECT * FROM orders, users
WHERE orders.user_id = users.id
AND users.created_at > '2024-01-01';

-- ✅ After (optimized)
SELECT o.id, o.total, u.email
FROM orders o
INNER JOIN users u ON o.user_id = u.id
WHERE u.created_at > '2024-01-01'
LIMIT 100;

-- Add index
CREATE INDEX idx_users_created ON users(created_at);
```

## Commands
| Command | Action |
|---------|--------|
| `optimize query` | Rewrite query |
| `add index` | Create index |
| `analyze explain` | Show query plan |
