# Dockerfile Generator

## Triggers
- User wants Docker setup
- User says "Dockerfile", "docker", "container", "docker-compose"

## What It Does

### Docker Setup
```
PROJECT
        ↓
1. ANALYZE
   → Language/framework
   → Build requirements
   → Runtime needs
   → Port mappings
        ↓
2. GENERATE DOCKERFILE
   → Base image
   → Dependencies
   → Build step
   → Runtime config
        ↓
3. DOCKER-COMPOSE
   → Services
   → Environment
   → Volumes
   → Networks
        ↓
OUTPUT: Docker setup
```

### Output Format
```dockerfile
# Dockerfile
FROM node:18-alpine AS base
WORKDIR /app

# Dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Build
FROM deps AS build
COPY . .
RUN npm run build

# Runtime
FROM base AS runtime
COPY --from=build /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Commands
| Command | Action |
|---------|--------|
| `dockerize` | Full Docker setup |
| `add compose` | docker-compose.yml |
| `optimize docker` | Smaller image |
