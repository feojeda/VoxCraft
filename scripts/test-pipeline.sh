#!/usr/bin/env bash
# ttsQwen End-to-End Pipeline Test
#
# Validates the complete TTS pipeline running in Docker Compose:
# 1. Wait for API to be healthy
# 2. POST a generate request
# 3. Poll job status until completed
# 4. Verify audio files are accessible
#
# Usage:
#   ./scripts/test-pipeline.sh
#   API_URL=http://my-host:8000 ./scripts/test-pipeline.sh

set -euo pipefail

API_URL="${API_URL:-http://localhost:8000}"
TIMEOUT="${TIMEOUT:-60}"
SPEAKER="ryan"
TEXT="Hello, this is a test."

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ttsQwen Pipeline Integration Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "API: ${API_URL}"
echo "Speaker: ${SPEAKER}"
echo "Text: ${TEXT}"
echo "Timeout: ${TIMEOUT}s"
echo ""

# Step 1: Wait for API health
echo "⏳ Waiting for API to be healthy..."
elapsed=0
while [ $elapsed -lt $TIMEOUT ]; do
  if curl -sf "${API_URL}/api/health" > /dev/null 2>&1; then
    echo "✅ API is healthy"
    break
  fi
  sleep 2
  elapsed=$((elapsed + 2))
  echo "   ... waiting (${elapsed}s/${TIMEOUT}s)"
done

if [ $elapsed -ge $TIMEOUT ]; then
  echo "❌ API did not become healthy within ${TIMEOUT}s"
  exit 1
fi

# Step 2: Submit generation request
echo ""
echo "📤 Submitting TTS generation request..."
response=$(curl -sf -X POST "${API_URL}/api/generate" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"${TEXT}\", \"speaker\": \"${SPEAKER}\", \"speed\": 1.0}")

job_id=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['job_id'])" 2>/dev/null || echo "")

if [ -z "$job_id" ]; then
  echo "❌ Failed to get job_id from response: $response"
  exit 1
fi

echo "✅ Job created: ${job_id}"

# Step 3: Poll job status
echo ""
echo "⏳ Polling job status (timeout: ${TIMEOUT}s)..."
elapsed=0
status="queued"
while [ $elapsed -lt $TIMEOUT ]; do
  response=$(curl -sf "${API_URL}/api/jobs/${job_id}" || echo "{}")
  status=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'unknown'))" 2>/dev/null || echo "unknown")

  if [ "$status" = "completed" ]; then
    echo "✅ Job completed"
    break
  elif [ "$status" = "failed" ]; then
    error=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('error_message', 'Unknown error'))" 2>/dev/null || echo "Unknown error")
    echo "❌ Job failed: ${error}"
    exit 1
  fi

  progress=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('progress', 0))" 2>/dev/null || echo "0")
  echo "   ... status=${status}, progress=${progress}% (${elapsed}s/${TIMEOUT}s)"

  sleep 3
  elapsed=$((elapsed + 3))
done

if [ "$status" != "completed" ]; then
  echo "❌ Job did not complete within ${TIMEOUT}s (last status: ${status})"
  exit 1
fi

# Step 4: Verify audio files are accessible
echo ""
echo "🔍 Verifying audio files..."

wav_status=$(curl -sf -o /dev/null -w "%{http_code}" "${API_URL}/api/audio/${job_id}/wav" 2>/dev/null || echo "000")
mp3_status=$(curl -sf -o /dev/null -w "%{http_code}" "${API_URL}/api/audio/${job_id}/mp3" 2>/dev/null || echo "000")

if [ "$wav_status" = "200" ]; then
  echo "✅ WAV file accessible (HTTP ${wav_status})"
else
  echo "❌ WAV file not accessible (HTTP ${wav_status})"
  exit 1
fi

if [ "$mp3_status" = "200" ]; then
  echo "✅ MP3 file accessible (HTTP ${mp3_status})"
else
  echo "❌ MP3 file not accessible (HTTP ${mp3_status})"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ✅ Pipeline integration test PASSED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Job ID: ${job_id}"
echo "WAV: ${API_URL}/api/audio/${job_id}/wav"
echo "MP3: ${API_URL}/api/audio/${job_id}/mp3"
