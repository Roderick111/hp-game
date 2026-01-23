#!/bin/bash
# Test verdict endpoint with curl to see exact error

echo "================================"
echo "VERDICT ENDPOINT CURL TEST"
echo "================================"
echo ""

# Make sure backend is running first
echo "📡 Testing verdict endpoint..."
echo ""

# Test valid request
curl -X POST http://localhost:8000/api/submit-verdict \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": "case_001",
    "player_id": "default",
    "accused_suspect_id": "draco_malfoy",
    "reasoning": "The evidence clearly shows Draco is guilty based on the wand signature found at the scene.",
    "evidence_cited": ["wand_signature", "witness_statement"]
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -v 2>&1 | tee verdict_test_output.txt

echo ""
echo "================================"
echo "Output saved to verdict_test_output.txt"
echo ""
echo "Check for:"
echo "  - HTTP Status code (200 = success, 400 = bad request, 500 = server error)"
echo "  - Response body (JSON with mentor feedback)"
echo "  - Any validation errors"
echo "================================"
