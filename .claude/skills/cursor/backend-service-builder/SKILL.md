# Backend Service Builder

## Triggers
- User wants backend service code
- User says "backend", "service", "API server", "Express"

## What It Does

### Service Structure
```
SERVICE REQUIREMENT
        ↓
1. DESIGN
   → Routes
   → Controllers
   → Services
   → Models
        ↓
2. IMPLEMENT
   → Express/Fastify setup
   → Route handlers
   → Business logic
   → Database layer
        ↓
OUTPUT: Complete service
```

### Output Format
```typescript
// src/services/{name}.ts
export class {Name}Service {
  async create(data: CreateDTO): Promise<Entity> {
    const entity = await this.repository.create(data);
    await this.cache.invalidate(key);
    return entity;
  }

  async findById(id: string): Promise<Entity | null> {
    const cached = await this.cache.get(id);
    if (cached) return cached;
    
    const entity = await this.repository.findById(id);
    if (entity) await this.cache.set(id, entity);
    return entity;
  }
}
```

## Commands
| Command | Action |
|---------|--------|
| `create service` | Full service |
| `add CRUD` | CRUD operations |
| `add validation` | Request validation |
