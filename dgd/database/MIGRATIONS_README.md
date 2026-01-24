# Database Migrations

This document describes the migration system for Dojo Genesis Desktop.

## Overview

The migration system uses embedded SQL files to version and apply database schema changes. Migrations are applied automatically when the database is opened.

## Migration Files

Migrations are stored in `database/migrations/` with the naming convention:
```
NNN_description.sql
```

Where `NNN` is a zero-padded version number (e.g., `001`, `002`, etc.).

### Current Migrations

1. **001_add_token_tracking.sql**: Adds `prompt_tokens` and `completion_tokens` columns to the `messages` table for LLM usage tracking
2. **002_add_settings_table.sql**: Creates the `settings` table for application configuration

## How Migrations Work

1. On database initialization, the `migrations` table is created to track applied migrations
2. All migration files are loaded from the embedded filesystem
3. Unapplied migrations are executed in order within transactions
4. Each successful migration is recorded in the `migrations` table
5. If a migration fails, the transaction is rolled back

## Adding New Migrations

1. Create a new SQL file in `database/migrations/` with the next version number:
   ```sql
   -- Migration NNN: Description
   -- More details about what this migration does
   
   ALTER TABLE ...;
   CREATE TABLE ...;
   ```

2. The migration will be automatically applied on next database open

3. Test the migration:
   ```bash
   go test ./database/... -v
   ```

## Migration Safety

- **Idempotent**: Migrations can be safely run multiple times (already-applied migrations are skipped)
- **Transactional**: Each migration runs in a transaction and rolls back on error
- **Backward Compatible**: The base schema is created first, then migrations are applied
- **Testing**: Comprehensive tests ensure migrations work on fresh and existing databases

## Verification

Check migration status:
```bash
go run cmd/verify_schema/main.go
```

Or query the database directly:
```sql
SELECT * FROM migrations ORDER BY version;
```

## Building with SQLite (CGO)

SQLite requires CGO to be enabled. On Windows, ensure GCC is installed and in PATH:

```bash
# Using Scoop
scoop install mingw

# Set environment variables
set PATH=C:\Users\<username>\scoop\apps\mingw\current\bin;%PATH%
set CGO_ENABLED=1

# Build
go build -o dgd.exe cmd/dgd/main.go
```

## Testing

Run all database tests:
```bash
go test ./database/... -v
```

Specific migration tests:
- `TestMigrations`: Verifies all migrations are applied
- `TestTokenTracking`: Tests token column functionality
- `TestMigrationIdempotency`: Ensures migrations can be safely rerun
- `TestLegacyDatabaseUpgrade`: Tests upgrading from v0.1.0 schema
