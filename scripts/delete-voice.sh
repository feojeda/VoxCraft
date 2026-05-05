#!/usr/bin/env bash
# delete-voice.sh — Force delete a cloned voice by ID from the database
#
# Usage:
#   cd backend && ../scripts/delete-voice.sh <voice_id>
#   cd backend && ../scripts/delete-voice.sh eaa699e1-c26b-4af1-a76f-94d442d19074

set -euo pipefail

VOICE_ID="${1:-}"

if [ -z "$VOICE_ID" ]; then
    echo "Usage: $0 <voice_id>"
    echo "Example: $0 eaa699e1-c26b-4af1-a76f-94d442d19074"
    exit 1
fi

python3 -c "
import sqlite3, sys
from pathlib import Path

db_path = Path('voxcraft.db')
if not db_path.exists():
    print('Database not found:', db_path)
    sys.exit(1)

conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

# Find the voice
cursor.execute('SELECT id, name, user_id, audio_path FROM cloned_voices WHERE id = ?', ('$VOICE_ID',))
voice = cursor.fetchone()

if not voice:
    print(f'Voice $VOICE_ID not found in database.')
    sys.exit(1)

vid, name, user_id, audio_path = voice
print(f'Found voice:')
print(f'  ID: {vid}')
print(f'  Name: {name}')
print(f'  User: {user_id}')
print(f'  Audio path: {audio_path}')

# Check if audio file exists
if audio_path:
    path = Path(audio_path)
    if path.exists():
        print(f'  Audio file exists: {path}')
        # Remove audio directory
        try:
            import shutil
            voice_dir = path.parent
            shutil.rmtree(voice_dir, ignore_errors=True)
            print(f'  Removed directory: {voice_dir}')
        except Exception as e:
            print(f'  Warning: could not remove directory: {e}')
    else:
        print(f'  Audio file NOT found: {path}')

# Delete from database
cursor.execute('DELETE FROM cloned_voices WHERE id = ?', ('$VOICE_ID',))
conn.commit()
conn.close()

print(f'Voice {vid} deleted successfully.')
"