-- Dojo Genesis Desktop Database Schema
-- SQLite 3.x

-- Sessions table: Tracks user sessions
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    title TEXT NOT NULL,
    working_dir TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived', 'deleted'))
);

-- Messages table: Stores chat messages
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    agent_type TEXT CHECK(agent_type IN ('supervisor', 'dojo', 'librarian', 'builder')),
    mode TEXT CHECK(mode IN ('mirror', 'scout', 'gardener', 'implementation')),
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Traces table: Stores Harness Trace metadata
CREATE TABLE IF NOT EXISTS traces (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    message_id TEXT,
    span_id TEXT NOT NULL,
    parent_id TEXT,
    event_type TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_ms INTEGER,
    token_count INTEGER,
    cost_usd REAL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Trace details table: Stores full trace JSON
CREATE TABLE IF NOT EXISTS trace_details (
    trace_id TEXT PRIMARY KEY,
    inputs TEXT, -- JSON
    outputs TEXT, -- JSON
    metadata TEXT, -- JSON
    FOREIGN KEY (trace_id) REFERENCES traces(id) ON DELETE CASCADE
);

-- Seeds table: Stores knowledge seeds
CREATE TABLE IF NOT EXISTS seeds (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    content TEXT NOT NULL, -- Markdown content
    category TEXT,
    tags TEXT, -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    usage_count INTEGER DEFAULT 0
);

-- Files table: Tracks files in working directory
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    path TEXT NOT NULL,
    content_hash TEXT,
    size_bytes INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Tool calls table: Stores tool execution history
CREATE TABLE IF NOT EXISTS tool_calls (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    arguments TEXT NOT NULL, -- JSON
    result TEXT, -- JSON
    error TEXT,
    duration_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_tokens ON messages(prompt_tokens, completion_tokens);
CREATE INDEX IF NOT EXISTS idx_traces_session ON traces(session_id);
CREATE INDEX IF NOT EXISTS idx_traces_message ON traces(message_id);
CREATE INDEX IF NOT EXISTS idx_files_session ON files(session_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_message ON tool_calls(message_id);
CREATE INDEX IF NOT EXISTS idx_seeds_name ON seeds(name);
CREATE INDEX IF NOT EXISTS idx_seeds_category ON seeds(category);
