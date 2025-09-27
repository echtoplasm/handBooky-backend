drop database if EXISTS student_handbook_app;


create database student_handbook_app;
\c student_handbook_app;

CREATE EXTENSION IF NOT EXISTS vector;

-- Website chunks table for RAG system
CREATE TABLE IF NOT EXISTS rag_chunks_website (
    website_chunk_id TEXT NOT NULL,
    text TEXT NOT NULL,
    embedding VECTOR(1024) NOT NULL,    
    metadata JSONB DEFAULT '{}'::JSONB
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

