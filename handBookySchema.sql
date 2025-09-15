drop database if EXISTS student_handbook_app;


create database student_handbook_app;
-- Connect to database
\c student_handbook_app;

-- Enable pgvector extension for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Website chunks table for RAG system
CREATE TABLE IF NOT EXISTS rag_chunks_website (
    website_chunk_id            TEXT PRIMARY KEY,           -- e.g., "abtech.edu:/path#0"
    text          TEXT NOT NULL,              -- chunk text (embedded content)
    embedding     VECTOR(1536) NOT NULL,      -- pgvector column
    
    -- Lightweight metadata for filtering
    doc_id        TEXT NOT NULL,              -- "abtech.edu:/path"
    url           TEXT NOT NULL,
    title         TEXT,
    site          TEXT,                       -- e.g., "abtech.edu"
    section       TEXT,                       -- e.g., "catalog", "news"
    content_type  TEXT,                       -- e.g., "course", "news", "page"
    last_modified TIMESTAMPTZ,
    fetched_at    TIMESTAMPTZ,
    prerequisites TEXT[] DEFAULT '{}',
    corequisites  TEXT[] DEFAULT '{}',
    heading_path  TEXT[] DEFAULT '{}',
    chunk_index   INT,
    char_start    INT,
    char_end      INT,
    
    -- Keep full original metadata for flexibility/debugging
    metadata      JSONB DEFAULT '{}'::JSONB
);

-- Handbook chunks table for RAG system
CREATE TABLE IF NOT EXISTS rag_chunks_handbook (
    handbook_chunk_id SERIAL PRIMARY KEY,
    text              TEXT NOT NULL,
    embedding         VECTOR(1024) NOT NULL,
    page_number       INT,
    last_modified     TIMESTAMPTZ DEFAULT NOW(),
    fetched_at        TIMESTAMPTZ DEFAULT NOW(),
    chunk_index       INT,
    metadata          JSONB DEFAULT '{}'::JSONB
);

