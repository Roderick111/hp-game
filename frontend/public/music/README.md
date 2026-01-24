# Music Assets

Background music files for case investigation ambience.

## File Naming Convention

```
case_{id}_default.mp3
```

### Examples

- `case_001_default.mp3` - Background music for Case 001
- `case_002_default.mp3` - Background music for Case 002

## File Format

- **Format**: MP3 (universal browser support)
- **Bitrate**: 128-192 kbps (balance of quality and file size)
- **Length**: 30-120 seconds (will loop seamlessly)
- **Style**: Ambient, atmospheric, non-distracting

## Adding Music

1. Create or obtain MP3 file
2. Name it following the convention: `case_{caseId}_default.mp3`
3. Place in this directory (`frontend/public/music/`)
4. Music will auto-load when that case is played

## Missing Files

If a music file is missing for a case, the system silently falls back to no music.
No errors will be shown to the user.

## User Controls

Users can control music playback via Settings modal:
- Volume slider (0-100%)
- Play/Pause toggle
- Mute toggle

Preferences are saved to localStorage and persist across sessions.
