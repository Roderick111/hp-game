# Client-Side Music Ambience System - PRP

## Goal
Implement per-case background music playback with user-controllable volume, play/pause/stop controls, auto-detection from static assets, and localStorage persistence. Pure client-side implementation (no backend music serving).

## Why
- **User value**: Immersive audio atmosphere enhances case investigation experience
- **Aligns with**: Phase 6.5 UI/UX & Visual Polish (PLANNING.md, lines 13-24)
- **Design fit**: Replicate proven patterns (PortraitImage auto-detection, ThemeContext state management, SettingsModal integration)

## What

**User-Visible Behavior:**
- Background music auto-plays when case loads (if enabled, respecting browser autoplay policy)
- Settings modal shows AUDIO section (replace "Coming soon..." placeholder)
- Volume slider (0-100%), play/pause button, mute toggle
- Music loops seamlessly, auto-restarts on case change
- Fallback: Silent if music file missing (no errors)

**Technical Requirements:**
- **Frontend only**: React Context (MusicContext), hidden `<audio>` element, localStorage persistence
- **File structure**: `/frontend/public/music/case_{id}_default.mp3` (matches case ID pattern)
- **Settings integration**: Update SettingsModal AUDIO section (lines 255-264)
- **State**: Volume, playing/paused, muted, currentCaseId
- **Persistence**: localStorage for volume, muted, enabled preferences

**Success Criteria:**
- [ ] Music auto-plays on case load (if enabled)
- [ ] Volume slider works, persists across sessions
- [ ] Play/pause/mute buttons functional
- [ ] No errors if music file missing
- [ ] Settings modal shows current music state
- [ ] Music changes when switching cases
- [ ] TypeScript 0 errors, ESLint 0 errors

**Explicitly OUT OF SCOPE:**
- ❌ Alternative/multiple tracks per case
- ❌ Backend API for music serving
- ❌ Server-side playlists
- ❌ Track switching UI
- ❌ Fade on location change (future enhancement)

---

## Quick Reference

### Code Patterns

**Image Auto-Detection** (`frontend/src/components/LocationHeaderBar.tsx`, L62-112):
```typescript
interface LocationIllustrationImageProps {
  locationId: string;
  locationName: string;
  lazy?: boolean;
}

function LocationIllustrationImage({ locationId, locationName, lazy = true }: LocationIllustrationImageProps) {
  const [hasError, setHasError] = useState(false);
  const avifUrl = `/locations/${locationId}.avif`;
  const webpUrl = `/locations/${locationId}.webp`;
  const pngUrl = `/locations/${locationId}.png`;

  if (hasError) {
    return <div>NO VISUAL RECORD</div>;
  }

  return (
    <picture>
      <source srcSet={avifUrl} type="image/avif" />
      <source srcSet={webpUrl} type="image/webp" />
      <img src={pngUrl} alt={locationName} onError={() => setHasError(true)} />
    </picture>
  );
}
```

**Settings Integration** (`frontend/src/components/SettingsModal.tsx`, L54-81):
```typescript
const handleVerbosityChange = async (newVerbosity: NarratorVerbosity) => {
  if (newVerbosity === selectedVerbosity || updating) return;
  setUpdating(true);
  try {
    const response = await fetch('/api/settings/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_id: caseId,
        player_id: playerId,
        narrator_verbosity: newVerbosity,
      }),
    });
    const data = await response.json() as { success: boolean; message?: string };
    if (data.success) {
      await onVerbosityChange?.();
    }
  } catch (error) {
    console.error('Error updating verbosity:', error);
  } finally {
    setUpdating(false);
  }
};
```

**React Context** (`frontend/src/context/ThemeContext.tsx`, L91-140):
```typescript
export function ThemeProvider({ children, initialMode }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode ?? getInitialTheme);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  }, [mode]);

  const toggleTheme = useCallback(() => {
    setModeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value: ThemeContextValue = { mode, theme: getTheme(mode), toggleTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
```

### Integration Points

**MusicContext state** (to create):
```typescript
interface MusicContextValue {
  isPlaying: boolean;
  volume: number;           // 0-100
  muted: boolean;
  currentTrack: string | null;
  setPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setTrack: (trackId: string) => void;
  togglePlayback: () => void;
}
```

**Audio element** (`frontend/src/components/MusicPlayer.tsx`):
```typescript
<audio
  ref={audioRef}
  src={`/music/${trackId}.mp3`}
  loop
  onError={() => setHasError(true)}
  onCanPlay={() => setIsBuffering(false)}
/>
```

**SettingsModal AUDIO section** (`frontend/src/components/SettingsModal.tsx`, L255-264):
```typescript
{/* Replace "Coming soon..." with: */}
<div className="space-y-3">
  <h3 className={`${theme.typography.caption} ${theme.colors.text.tertiary}`}>AUDIO</h3>
  <div className="space-y-2">
    <label className={`text-xs ${theme.colors.text.muted} font-mono`}>Music Volume</label>
    <input type="range" min="0" max="100" value={musicVolume} onChange={(e) => handleVolumeChange(parseInt(e.target.value))} />
    <span className={`text-xs ${theme.colors.text.muted}`}>{musicVolume}%</span>
  </div>
  <button onClick={() => handleMusicToggle()}>
    {musicEnabled ? 'ON' : 'OFF'}
  </button>
</div>
```

### Essential APIs (HTML5 Audio)

**Basic playback** (from DOCS-RESEARCH-AUDIO.md, L19-49):
```typescript
const audioRef = useRef<HTMLAudioElement>(null);

// Play/pause
audioRef.current?.play().catch(err => console.log('Autoplay blocked:', err));
audioRef.current?.pause();

// Volume (0-1 range)
audioRef.current.volume = 0.5;

// Mute
audioRef.current.muted = true;

// Restart
audioRef.current.currentTime = 0;
```

**React hooks integration** (from DOCS-RESEARCH-AUDIO.md, L132-174):
```typescript
useEffect(() => {
  const audio = audioRef.current;
  if (!audio || !isPlaying) return;

  audio.play().catch(err => console.log('Playback error:', err));

  return () => {
    audio.pause();
  };
}, [isPlaying]);

useEffect(() => {
  if (audioRef.current) {
    audioRef.current.volume = volume / 100;
  }
}, [volume]);
```

### Critical Gotchas

1. **Browser autoplay policy** - Cannot autoplay on mount without user interaction. Handle Promise rejection.
2. **localStorage availability** - Always check `typeof window !== 'undefined'` before accessing.
3. **Audio format** - Use MP3 (universal support). No fallback chain like `<picture>` element.
4. **Volume range** - HTML5 audio uses 0-1, UI uses 0-100. Convert: `audioRef.current.volume = volume / 100`.
5. **Event listener cleanup** - Always return cleanup function from useEffect.
6. **Missing files** - Never assume files exist. Show fallback UI, log error, don't crash.
7. **Keyboard shortcuts during modal** - Check `document.querySelector('[role="dialog"]')` before handling shortcuts.
8. **React Context re-renders** - Context updates trigger re-render of all children. Acceptable for small apps.

### localStorage Schema

```json
{
  "hp-detective-music-volume": "50",
  "hp-detective-music-muted": "false",
  "hp-detective-music-enabled": "true"
}
```

---

## Files to Create/Modify

| File | Action | Purpose | Follow Pattern From |
|------|--------|---------|---------------------|
| `frontend/src/context/MusicContext.tsx` | CREATE | Music state management | `frontend/src/context/ThemeContext.tsx` (L91-140) |
| `frontend/src/hooks/useMusic.ts` | CREATE | Hook to access MusicContext | `frontend/src/context/ThemeContext.tsx` (L151-157) |
| `frontend/src/components/MusicPlayer.tsx` | CREATE | Hidden audio element + logic | `frontend/src/components/LocationHeaderBar.tsx` (L62-112) |
| `frontend/src/App.tsx` | MODIFY | Wrap with MusicProvider, add MusicPlayer | Existing ThemeProvider pattern (line ~40) |
| `frontend/src/components/SettingsModal.tsx` | MODIFY | Replace AUDIO placeholder | Lines 255-264 |
| `frontend/public/music/` | CREATE | Music asset folder | `frontend/public/portraits/` structure |

---

## Tasks

### 1. Create MusicContext
- **File**: `frontend/src/context/MusicContext.tsx`
- **Action**: CREATE
- **What**: React Context with state (isPlaying, volume, muted, currentTrack), localStorage persistence
- **Pattern**: Follow `frontend/src/context/ThemeContext.tsx` (lines 91-140)
- **Depends**: None

### 2. Create useMusic Hook
- **File**: `frontend/src/hooks/useMusic.ts`
- **Action**: CREATE
- **What**: Hook to access MusicContext (throws error if used outside provider)
- **Pattern**: Follow `frontend/src/context/ThemeContext.tsx` (lines 151-157)
- **Depends**: Task 1

### 3. Create MusicPlayer Component
- **File**: `frontend/src/components/MusicPlayer.tsx`
- **Action**: CREATE
- **What**: Hidden `<audio>` element, sync with MusicContext state, error handling
- **Pattern**: Follow `frontend/src/components/LocationHeaderBar.tsx` (lines 62-112) for auto-detection + error boundary
- **Depends**: Task 1, 2

### 4. Update App.tsx
- **File**: `frontend/src/App.tsx`
- **Action**: MODIFY
- **What**: Import MusicProvider, wrap root component, add MusicPlayer in game view
- **Pattern**: Existing ThemeProvider wrapping pattern (~line 40)
- **Depends**: Task 1, 3

### 5. Update SettingsModal
- **File**: `frontend/src/components/SettingsModal.tsx`
- **Action**: MODIFY
- **What**: Replace AUDIO "Coming soon..." (lines 255-264) with volume slider, play/pause, mute toggle
- **Pattern**: Follow existing verbosity handler (lines 54-81)
- **Depends**: Task 1

### 6. Create Music Asset Folder
- **File**: `frontend/public/music/`
- **Action**: CREATE
- **What**: Create directory, add placeholder MP3s (case_001_default.mp3, case_002_default.mp3)
- **Pattern**: `frontend/public/portraits/` structure
- **Depends**: None

---

## Agent Orchestration

**Execution:**
1. `react-vite-specialist` → Tasks 1-6 (sequential: 1-2 parallel, 3 depends on 1-2, 4-5 depend on 1-3, 6 independent)
2. `validation-gates` → Run tests, lint, type check
3. `documentation-manager` → Update STATUS.md completion (if needed)

---

**Confidence**: 9/10 | **Generated**: 2026-01-24 | **Validated**: ✅ Aligned with PLANNING.md Phase 6.5, research complete
