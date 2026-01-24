#!/bin/bash
# Settings API Verification Script
# Run this script after starting the backend server to verify the settings API

set -e

echo "=== Settings API Verification Script ==="
echo ""

# Wait for server to be ready
echo "Waiting for server to start..."
sleep 2

# Test 1: GET /api/settings (empty)
echo "Test 1: GET /api/settings (should be empty initially)"
curl -s http://localhost:8080/api/settings | jq .
echo ""

# Test 2: POST /api/settings (create settings)
echo "Test 2: POST /api/settings (create new settings)"
curl -s -X POST http://localhost:8080/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "default_model": "llama3.2:3b",
      "temperature": "0.8",
      "max_tokens": "4096"
    }
  }' | jq .
echo ""

# Test 3: GET /api/settings (verify settings were saved)
echo "Test 3: GET /api/settings (verify settings were saved)"
curl -s http://localhost:8080/api/settings | jq .
echo ""

# Test 4: POST /api/settings (update existing settings)
echo "Test 4: POST /api/settings (update temperature)"
curl -s -X POST http://localhost:8080/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "temperature": "0.5"
    }
  }' | jq .
echo ""

# Test 5: GET /api/settings (verify update)
echo "Test 5: GET /api/settings (verify temperature updated to 0.5)"
curl -s http://localhost:8080/api/settings | jq .
echo ""

# Test 6: POST /api/settings (add new setting)
echo "Test 6: POST /api/settings (add new setting)"
curl -s -X POST http://localhost:8080/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "theme": "dark",
      "font_size": "14"
    }
  }' | jq .
echo ""

# Test 7: Error handling - empty settings
echo "Test 7: POST /api/settings (empty settings - should return 400)"
curl -s -X POST http://localhost:8080/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {}
  }'
echo ""
echo ""

# Test 8: Error handling - invalid JSON
echo "Test 8: POST /api/settings (invalid JSON - should return 400)"
curl -s -X POST http://localhost:8080/api/settings \
  -H "Content-Type: application/json" \
  -d 'invalid json'
echo ""
echo ""

echo "=== All tests completed ==="
echo ""
echo "Expected results:"
echo "- Test 1: Empty settings object"
echo "- Test 2: Settings with default_model, temperature, max_tokens"
echo "- Test 3: Same as Test 2"
echo "- Test 4: Settings with temperature=0.5, other settings unchanged"
echo "- Test 5: Same as Test 4"
echo "- Test 6: Settings with all 5 keys (3 original + 2 new)"
echo "- Test 7: Error response with 400 status"
echo "- Test 8: Error response with 400 status"
