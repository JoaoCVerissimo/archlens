# ArchLens

AI-powered software architecture review platform. Analyzes Git repositories and produces detailed engineering reviews using the Claude API, acting like a senior staff engineer reviewing your codebase.

## Architecture

```mermaid
graph TB
    subgraph Frontend
        Web[Next.js App<br/>Port 3000]
    end

    subgraph Backend
        API[Fastify API<br/>Port 3001]
        Worker[BullMQ Worker]
    end

    subgraph Infrastructure
        PG[(PostgreSQL)]
        Redis[(Redis)]
    end

    subgraph External
        Claude[Claude API]
        GitHub[GitHub]
    end

    Web --> API
    API --> PG
    API --> Redis
    Worker --> PG
    Worker --> Redis
    Worker --> Claude
    Worker --> GitHub
```

### Services

| Service | Tech | Purpose |
|---------|------|---------|
| **Web** | Next.js, Tailwind, React Flow | Dashboard, repository management, report viewing, dependency graphs |
| **API** | Fastify, TypeScript | REST API for repositories, analyses, reports, and graphs |
| **Worker** | BullMQ, TypeScript | Background jobs: git clone, file indexing, Claude analysis, report generation |
| **PostgreSQL** | v16 | Persistent storage for repos, files, dependencies, analyses, findings, reports |
| **Redis** | v7 | Job queue backing store for BullMQ |

### Analysis Pipeline

```
Repository → Clone/Upload → Index Files → Build Dependency Graph
    → Chunk by Module → Analyze Each Module (Claude) → Synthesize
    → Extract Findings → Generate Report
```

The codebase is broken into logical modules (by directory), each analyzed independently, then synthesized into a unified architecture review.

## Project Structure

```
archlens/
├── apps/
│   ├── api/          # Fastify REST API
│   ├── worker/       # BullMQ background worker
│   └── web/          # Next.js frontend
├── packages/
│   ├── shared/       # Shared types, constants, utilities
│   └── db/           # Drizzle ORM schema + migrations
├── docker-compose.yml
├── docker-compose.dev.yml
├── Makefile
└── turbo.json
```

## Quick Start

### Prerequisites

- Node.js >= 20
- Docker & Docker Compose
- An [Anthropic API key](https://console.anthropic.com/)

### Setup

```bash
# Clone the repository
git clone <repo-url> && cd archlens

# Copy environment variables
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Install dependencies
make install

# Start infrastructure (Postgres + Redis)
make infra

# Run database migrations
make migrate

# Start development servers
make dev
```

The app will be available at:
- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001

### Docker (Production-like)

```bash
# Build and start all services
make docker-up

# Stop all services
make docker-down
```

## API Reference

All endpoints are prefixed with `/api/v1`. Authenticate with `X-API-Key` header.

### Repositories

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/repositories` | Create & ingest repository |
| `GET` | `/repositories` | List repositories |
| `GET` | `/repositories/:id` | Get repository details |
| `DELETE` | `/repositories/:id` | Delete repository |
| `GET` | `/repositories/:id/files` | List indexed files |
| `POST` | `/repositories/:id/reindex` | Re-trigger indexing |

### Analyses

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/repositories/:id/analyses` | Trigger analysis |
| `GET` | `/repositories/:id/analyses` | List analyses |
| `GET` | `/analyses/:id` | Get analysis with progress |
| `GET` | `/analyses/:id/findings` | Get findings |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/analyses/:id/reports` | Generate report |
| `GET` | `/reports/:id` | Get report |
| `GET` | `/repositories/:id/reports` | List reports |

### Graphs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/repositories/:id/graph` | File-level dependency graph |
| `GET` | `/repositories/:id/graph/modules` | Module-level graph |

### Example: Analyze a Repository

```bash
# Create repository
curl -X POST http://localhost:3001/api/v1/repositories \
  -H "Content-Type: application/json" \
  -H "X-API-Key: archlens-dev-key" \
  -d '{"name": "my-project", "sourceType": "github", "sourceUrl": "https://github.com/owner/repo"}'

# Trigger full analysis (after indexing completes)
curl -X POST http://localhost:3001/api/v1/repositories/<id>/analyses \
  -H "Content-Type: application/json" \
  -H "X-API-Key: archlens-dev-key" \
  -d '{"analysisType": "full"}'

# Check analysis progress
curl http://localhost:3001/api/v1/analyses/<id> \
  -H "X-API-Key: archlens-dev-key"

# Get findings
curl http://localhost:3001/api/v1/analyses/<id>/findings \
  -H "X-API-Key: archlens-dev-key"
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | — | Claude API key |
| `DATABASE_URL` | Yes | `postgres://archlens:archlens_dev@localhost:5432/archlens` | PostgreSQL connection string |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection string |
| `API_PORT` | No | `3001` | API server port |
| `API_KEY` | No | `archlens-dev-key` | API authentication key |
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:3001/api/v1` | API URL for frontend |

## Development

```bash
make install      # Install dependencies
make infra        # Start Postgres + Redis
make migrate      # Run database migrations
make dev          # Start all services in dev mode
make typecheck    # TypeScript type checking
make lint         # Run linters
make build        # Build all packages
make clean        # Clean build artifacts
```

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, React Flow, SWR
- **Backend:** Fastify 5, TypeScript, Drizzle ORM
- **AI:** Claude API via Anthropic SDK
- **Database:** PostgreSQL 16
- **Queue:** Redis 7 + BullMQ
- **Build:** Turborepo, npm workspaces
- **Infrastructure:** Docker, Docker Compose

## License

MIT
