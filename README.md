# LLM Benchmarking Platform

This repository contains a starter implementation for an LLM benchmarking platform.

- Backend: Django + Django REST Framework (DRF)
- Auth: JWT via `djangorestframework-simplejwt`
- Database: SQLite (default for development)

Models implemented:
- `LLM`, `LLMResult`, `UnitTest`, `LLMUser`

Endpoints:
- JWT token obtain/refresh (SimpleJWT)
- CRUD for LLM, UnitTest and admin-only user management
- `POST /api/llms/{id}/run_tests/` — placeholder endpoint that triggers a test-run (currently creates a placeholder result)

Next steps:
- Add background runner (Celery) to actually run tests against LLMs
- Wire frontend React app to these endpoints
- Add LeetCodeDataset ingestion script
