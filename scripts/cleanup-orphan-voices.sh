#!/usr/bin/env bash
# cleanup-orphan-voices.sh — Remove cloned voices that have missing audio files
#
# Usage:
#   cd backend && ../scripts/cleanup-orphan-voices.sh
#   cd backend && ../scripts/cleanup-orphan-voices.sh --dry-run

set -euo pipefail

DRY_RUN="${1:-}"

python3 -c "
import sqlite3, sys
from pathlib import Path

db_path = Path('voxcraft.db')
if not db_path.exists():
    print('Database not found:', db_path)
    sys.exit(1)

conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

cursor.execute('SELECT id, name, audio_path, user_id FROM cloned_voices')
voices = cursor.fetchall()

orphans = []
valid = []

for v in voices:
    vid, name, audio_path, user_id = v
    if not audio_path or not Path(audio_path).exists():
        orphans.append(v)
    else:
        valid.append(v)

print(f'Total voices: {len(voices)}')
print(f'Valid: {len(valid)}')
print(f'Orphans (missing audio file): {len(orphans)}')
print()

if orphans:
    print('Orphan voices:')
    for v in orphans:
        print(f'  {v[0]} - {v[1]} (user: {v[3]})')
    print()

    if '--dry-run' in sys.argv:
        print('Dry run — no changes made.')
    else:
        for v in orphans:
            cursor.execute('DELETE FROM cloned_voices WHERE id = ?', (v[0],))
            print(f'  Deleted: {v[0]} - {v[1]}')
        conn.commit()
        print(f'Removed {len(orphans)} orphan voice(s).')
else:
    print('No orphan voices found.')

conn.close()
" "$DRY_RUN"
