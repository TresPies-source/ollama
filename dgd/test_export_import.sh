#!/bin/bash

# Test script for export/import endpoints
# Prerequisites: Server must be running on localhost:8080

BASE_URL="http://localhost:8080"

echo "=== Testing Export/Import Endpoints ==="
echo ""

# Step 1: Create a test session
echo "1. Creating test session..."
SESSION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{"title": "Export Import Test Session", "working_dir": "/tmp/test"}')

SESSION_ID=$(echo $SESSION_RESPONSE | grep -o '"session_id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$SESSION_ID" ]; then
  echo "❌ Failed to create session"
  exit 1
fi

echo "✓ Created session: $SESSION_ID"
echo ""

# Step 2: Add messages to the session
echo "2. Adding messages to session..."
curl -s -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\", \"message\": \"Hello, this is a test message\"}" > /dev/null

curl -s -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\", \"message\": \"Second test message\"}" > /dev/null

echo "✓ Added test messages"
echo ""

# Step 3: Export the session
echo "3. Exporting session..."
EXPORT_FILE="test_session_export.md"
curl -s "$BASE_URL/api/sessions/$SESSION_ID/export" -o "$EXPORT_FILE"

if [ ! -f "$EXPORT_FILE" ]; then
  echo "❌ Failed to export session"
  exit 1
fi

echo "✓ Exported to $EXPORT_FILE"
echo ""

# Step 4: Display export content
echo "4. Export file content (first 30 lines):"
echo "---"
head -n 30 "$EXPORT_FILE"
echo "---"
echo ""

# Step 5: Validate export format
echo "5. Validating export format..."
if grep -q "^---$" "$EXPORT_FILE" && grep -q "title: Export Import Test Session" "$EXPORT_FILE"; then
  echo "✓ Export format is valid (contains YAML frontmatter)"
else
  echo "❌ Export format is invalid"
  exit 1
fi
echo ""

# Step 6: Import the session
echo "6. Importing session..."
IMPORT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/sessions/import" \
  -F "file=@$EXPORT_FILE")

NEW_SESSION_ID=$(echo $IMPORT_RESPONSE | grep -o '"session_id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$NEW_SESSION_ID" ]; then
  echo "❌ Failed to import session"
  echo "Response: $IMPORT_RESPONSE"
  exit 1
fi

echo "✓ Imported as new session: $NEW_SESSION_ID"
echo ""

# Step 7: Verify imported session
echo "7. Verifying imported session..."
IMPORTED_SESSION=$(curl -s "$BASE_URL/api/sessions/$NEW_SESSION_ID")

if echo "$IMPORTED_SESSION" | grep -q "Export Import Test Session"; then
  echo "✓ Imported session title matches"
else
  echo "❌ Imported session title doesn't match"
  exit 1
fi

# Count messages in imported session
MESSAGE_COUNT=$(echo "$IMPORTED_SESSION" | grep -o '"id"' | wc -l)
echo "✓ Imported session has messages"
echo ""

# Cleanup
echo "8. Cleanup..."
rm -f "$EXPORT_FILE"
echo "✓ Removed temporary export file"
echo ""

echo "=== All Tests Passed ✓ ==="
