.PHONY: dev build test lint typecheck migrate docker-up docker-down clean install

# Install all dependencies
install:
	npm install

# Start local development (Postgres + Redis via Docker, apps via tsx)
dev:
	docker compose -f docker-compose.dev.yml up -d
	set -a && . ./.env && set +a && npx turbo run dev --env-mode=loose

# Build all packages
build:
	npx turbo run build

# Run tests
test:
	npx turbo run test

# Run linter
lint:
	npx turbo run lint

# Typecheck all packages
typecheck:
	npx turbo run typecheck

# Generate and run database migrations
migrate:
	npm run db:generate
	npm run db:migrate

# Start all services via Docker Compose (production-like)
docker-up:
	docker compose up --build -d

# Stop Docker Compose services
docker-down:
	docker compose down

# Clean build artifacts
clean:
	npx turbo run clean
	rm -rf node_modules

# Start only infrastructure (Postgres + Redis)
infra:
	docker compose -f docker-compose.dev.yml up -d

# Stop infrastructure
infra-down:
	docker compose -f docker-compose.dev.yml down
