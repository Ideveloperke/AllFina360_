-- One-time setup for a locally installed Postgres (no Docker). Requires pgvector installed.
-- Run as a superuser:
--   psql -U postgres -h localhost -f infra/postgres/create-local-db.sql
-- Matches DATABASE_URL in .env.example. Development only: change the password elsewhere.

SELECT 'CREATE ROLE allfina LOGIN PASSWORD ''allfina'''
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'allfina')\gexec

SELECT 'CREATE DATABASE allfina OWNER allfina'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'allfina')\gexec

\connect allfina
-- Extensions need superuser, so create them here rather than in the app migration.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

SELECT extname, extversion FROM pg_extension WHERE extname IN ('vector', 'pgcrypto');
