# Database Schema Designer

## Triggers
- User wants database schema
- User says "database", "schema", "tables", "PostgreSQL", "SQL"

## What It Does

### Schema Design
```
DATA REQUIREMENTS
        ↓
1. IDENTIFY ENTITIES
   → User, Order, Product, etc.
   → Attributes per entity
   → Relationships
        ↓
2. DESIGN TABLES
   → Columns + types
   → Primary keys
   → Foreign keys
   → Indexes
        ↓
3. NORMALIZE
   → 1NF, 2NF, 3NF
   → Remove redundancy
   → Optimize for queries
        ↓
OUTPUT: Migration SQL
```

### Output Format
```sql
-- Migration: create_{table}

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

ALTER TABLE orders
  ADD CONSTRAINT fk_orders_user
  FOREIGN KEY (user_id) REFERENCES users(id);
```

## Commands
| Command | Action |
|---------|--------|
| `design schema` | Full schema |
| `add table` | New table |
| `add relation` | Foreign key |
| `optimize query` | Index suggestions |
