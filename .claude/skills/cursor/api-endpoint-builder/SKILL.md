# API Endpoint Builder

## Triggers
- User wants to create API endpoints
- User says "create API", "add endpoint", "API route", "REST"

## What It Does

### API Design Process
```
RESOURCE/ACTION
        ↓
1. DESIGN ENDPOINTS
   → HTTP method
   → URL structure
   → Request/response format
   → Status codes
        ↓
2. VALIDATION
   → Input validation
   → Required fields
   → Type checking
   → Sanitization
        ↓
3. BUSINESS LOGIC
   → What to do
   → Error handling
   → Edge cases
   → Logging
        ↓
4. RESPONSE
   → Success response
   → Error response
   → Pagination if list
        ↓
OUTPUT: Complete endpoint
```

### Output Format
```
# API Endpoint: {Method} /{resource}

## Specification

### Request
```http
{METHOD} /api/{resource}
Content-Type: application/json

{
  "field1": "string (required)",
  "field2": "number (optional)",
  "field3": "boolean (default: true)"
}
```

### Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "createdAt": "ISO8601"
  }
}
```

### Status Codes
| Code | When |
|------|------|
| 200 | Success |
| 201 | Created |
| 400 | Invalid input |
| 401 | Unauthorized |
| 404 | Not found |
| 500 | Server error |

## Implementation

### Route Handler
```typescript
// src/routes/{resource}.ts
import { Router } from 'express';
import { z } from 'zod';
import { {handler} } from '../handlers/{resource}';

const router = Router();

// Validation schema
const createSchema = z.object({
  field1: z.string().min(1, 'Field1 is required'),
  field2: z.number().optional(),
  field3: z.boolean().default(true),
});

router.{METHOD}('/', async (req, res) => {
  try {
    // Validate
    const validated = createSchema.parse(req.body);
    
    // Handle
    const result = await {handler}(validated);
    
    // Respond
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        errors: error.errors 
      });
    }
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
```

### Handler
```typescript
// src/handlers/{resource}.ts
export async function {handler}(
  data: z.infer<typeof createSchema>
): Promise<{Resource}> {
  // Business logic here
  
  const resource = await db.{resource}.create({
    data: {
      field1: data.field1,
      field2: data.field2,
      field3: data.field3,
    },
  });
  
  return resource;
}
```

## CRUD Template
| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| Create | POST | /api/{resource} | Create new |
| Read | GET | /api/{resource} | List all |
| Read | GET | /api/{resource}/:id | Get one |
| Update | PUT | /api/{resource}/:id | Update |
| Delete | DELETE | /api/{resource}/:id | Delete |

## Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": [
      { "field": "field1", "message": "Required" }
    ]
  }
}
```

## Commands
| Command | Action |
|---------|--------|
| `create API` | Full endpoint |
| `add CRUD` | All CRUD endpoints |
| `add validation` | Input validation |
| `add pagination` | Paginated list |
