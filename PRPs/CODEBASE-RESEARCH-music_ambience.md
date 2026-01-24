# Codebase Pattern Research: Client-Side Music Ambience System

**Feature**: Music ambience system (per-case background music with volume control)
**Date**: 2026-01-24
**Research Phase**: Phase 6.5+ (UI/UX & Visual Polish)
**Analysis Scope**: Frontend asset patterns, settings integration, context management, localStorage persistence

---

## 📋 Executive Summary

This system will replicate **three proven patterns** from the codebase:
1. **Image Auto-Detection** (PortraitImage / LocationIllustrationImage)
2. **Settings Integration** (SettingsModal → backend API → state persistence)
3. **React Context** (ThemeContext for state management + localStorage persistence)

**Key Finding**: No audio handling exists in codebase. Music system will be a **new capability**, not a refactor.

---

## 🏗️ Directory & Asset Structure

### Current Public Folder
```
frontend/public/
├── portraits/          # Character portraits (24 files)
│   ├── *.avif         # Modern format (preferred)
│   ├── *.webp         # Fallback
│   └── *.png          # Fallback
├── locations/         # Location illustrations (12 files)
│   ├── *.avif
│   ├── *.webp
│   └── *.png
└── [NO MUSIC FOLDER YET]
```

### Naming Convention Observed
- **Portraits**: `{witness_id}.{format}` (e.g., `hermione.avif`, `adrian_clearmont.webp`)
- **Locations**: `{location_id}.{format}` (e.g., `library.avif`, `restricted_section.png`)
- **Pattern**: Snake_case IDs, all lowercase

### Recommended Music Structure
```
frontend/public/music/
├── case_001.mp3       # Case-specific ambience
├── case_002.mp3
└── [README.md - document format/bitrate]
```

---

## 🎨 IMAGE ASSET PATTERN (Template to Follow)

### Location: `frontend/src/components/LocationHeaderBar.tsx` (Lines 62-112)

**Component: `LocationIllustrationImage`**

```typescript
interface LocationIllustrationImageProps {
  locationId: string;
  locationName: string;
  className?: string;
  lazy?: boolean;           // Default: true (lazy load)
  priority?: boolean;       // Default: false (eager for above-fold)
}

function LocationIllustrationImage({
  locationId,
  locationName,
  className = "",
  lazy = true,
  priority = false,
}: LocationIllustrationImageProps) {
  const [hasError, setHasError] = useState(false);
  const { theme } = useTheme();

  // Modern format URLs with fallback chain
  const avifUrl = `/locations/${locationId}.avif`;
  const webpUrl = `/locations/${locationId}.webp`;
  const pngUrl = `/locations/${locationId}.png`;

  if (hasError) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${theme.colors.bg.semiTransparent}`}>
        <span className={`${theme.colors.text.separator} text-xs font-mono uppercase tracking-wider`}>
          NO VISUAL RECORD
        </span>
      </div>
    );
  }

  return (
    <div className={`w-full h-full overflow-hidden relative ${className}`}>
      {/* Modern image formats with automatic fallback */}
      <picture>
        <source srcSet={avifUrl} type="image/avif" />
        <source srcSet={webpUrl} type="image/webp" />
        <img
          src={pngUrl}
          alt={locationName}
          className="w-full h-full object-cover object-center transition-all duration-500"
          loading={priority ? "eager" : lazy ? "lazy" : "eager"}
          decoding="async"
          onError={() => setHasError(true)}
        />
      </picture>
      {/* Scanline overlay */}
      <div className={`absolute inset-0 ${theme.effects.scanlines}`}></div>
    </div>
  );
}
```

### Portrait Pattern: `frontend/src/components/WitnessInterview.tsx` (Lines 84-120)

```typescript
interface PortraitImageProps {
  witnessId: string;
  witnessName: string;
}

function PortraitImage({ witnessId, witnessName }: PortraitImageProps) {
  const { theme } = useTheme();
  const [hasError, setHasState(false);

  // Modern format URLs with fallback chain
  const avifUrl = `/portraits/${witnessId}.avif`;
  const webpUrl = `/portraits/${witnessId}.webp`;
  const pngUrl = `/portraits/${witnessId}.png`;

  if (hasError) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${theme.colors.bg.primary}`}>
        <span className={`text-3xl ${theme.colors.text.muted} font-mono`}>?</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden relative">
      <picture>
        <source srcSet={avifUrl} type="image/avif" />
        <source srcSet={webpUrl} type="image/webp" />
        <img
          src={pngUrl}
          alt={witnessName}
          className="w-full h-full object-cover transition-all duration-500"
          onError={() => setHasError(true)}
        />
      </picture>
      {/* Scanline overlay */}
      <div className={`absolute inset-0 ${theme.effects.scanlines}`}></div>
    </div>
  );
}
```

### Key Patterns to Replicate

1. **Auto-detection chain**: AVIF → WebP → PNG (modern → compatible)
2. **Error boundary**: Fallback to placeholder when file missing
3. **useState for error state**: `const [hasError, setHasError] = useState(false)`
4. **Theme integration**: Use `theme.colors`, `theme.effects.scanlines`
5. **Lazy loading**: Support `loading` attribute for performance
6. **Alt text**: Always include `alt` for accessibility

### For Audio System

**Music Player Component Pattern**:
```typescript
interface MusicPlayerProps {
  caseId: string;
  trackId?: string;
}

function MusicPlayer({ caseId, trackId }: MusicPlayerProps) {
  const [hasError, setHasError] = useState(false);

  // Auto-detect music file (single format: MP3)
  const musicUrl = `/music/${trackId || caseId}.mp3`;

  if (hasError) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-mono">NO AUDIO</span>
      </div>
    );
  }

  return (
    <audio
      src={musicUrl}
      onError={() => setHasError(true)}
      controls
      autoPlay
    />
  );
}
```

---

## ⚙️ SETTINGS INTEGRATION PATTERN

### Location: `frontend/src/components/SettingsModal.tsx` (Complete pattern)

**Type Definition** (Lines 19-34):
```typescript
export type NarratorVerbosity = 'concise' | 'storyteller' | 'atmospheric';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  playerId: string;
  narratorVerbosity: NarratorVerbosity;
  onVerbosityChange?: () => void | Promise<void>;
}
```

**API Call Pattern** (Lines 54-81):
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
      // Reload state to get updated verbosity from backend
      await onVerbosityChange?.();
    } else {
      console.error('Failed to update verbosity:', data.message);
    }
  } catch (error) {
    console.error('Error updating verbosity:', error);
  } finally {
    setUpdating(false);
  }
};
```

### Backend Endpoint Pattern

**Location**: `backend/src/api/routes.py` (Lines 1256-1289)

```python
@router.post("/settings/update", response_model=UpdateSettingsResponse)
async def update_settings(request: UpdateSettingsRequest) -> UpdateSettingsResponse:
    """Update player settings (narrator verbosity, etc.).

    Args:
        request: Settings update request

    Returns:
        UpdateSettingsResponse with success status
    """
    try:
        state = load_player_state(request.case_id, request.player_id)

        # Update narrator verbosity if provided
        if request.narrator_verbosity:
            valid_options = ["concise", "storyteller", "atmospheric"]
            if request.narrator_verbosity not in valid_options:
                return UpdateSettingsResponse(
                    success=False,
                    message=f"Invalid verbosity. Must be one of: {', '.join(valid_options)}",
                )
            state.narrator_verbosity = request.narrator_verbosity

        # Save updated state
        save_player_state(request.case_id, request.player_id, state)
        return UpdateSettingsResponse(success=True, message="Settings updated successfully")
    except Exception as e:
        return UpdateSettingsResponse(success=False, message=f"Failed to update settings: {e}")
```

**Request/Response Models** (Lines 383-405):

```python
class UpdateSettingsRequest(BaseModel):
    """Request to update player settings."""
    case_id: str = Field(..., description="Case ID")
    player_id: str = Field(..., description="Player ID")
    narrator_verbosity: str | None = Field(
        None, description="Narrator verbosity: concise, storyteller, or atmospheric"
    )

class UpdateSettingsResponse(BaseModel):
    """Response from update settings endpoint."""
    success: bool
    message: str
```

### Applied to Music Settings

**Frontend**:
```typescript
// In SettingsModal props
interface SettingsModalProps {
  musicVolume?: number;           // 0-100
  onMusicVolumeChange?: (volume: number) => void | Promise<void>;
}

// In handler
const handleMusicVolumeChange = async (newVolume: number) => {
  setUpdating(true);
  try {
    const response = await fetch('/api/settings/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_id: caseId,
        player_id: playerId,
        music_volume: newVolume,  // New field
      }),
    });
    const data = await response.json() as { success: boolean; message?: string };
    if (data.success) {
      await onMusicVolumeChange?.(newVolume);
    }
  } catch (error) {
    console.error('Error updating music volume:', error);
  } finally {
    setUpdating(false);
  }
};
```

**Backend**:
```python
class UpdateSettingsRequest(BaseModel):
    case_id: str
    player_id: str
    narrator_verbosity: str | None = None
    music_volume: int | None = None  # Add this field (0-100)

@router.post("/settings/update", response_model=UpdateSettingsResponse)
async def update_settings(request: UpdateSettingsRequest) -> UpdateSettingsResponse:
    try:
        state = load_player_state(request.case_id, request.player_id)

        if request.narrator_verbosity:
            # ... existing logic

        if request.music_volume is not None:
            if not (0 <= request.music_volume <= 100):
                return UpdateSettingsResponse(
                    success=False,
                    message="Music volume must be between 0 and 100"
                )
            state.music_volume = request.music_volume

        save_player_state(request.case_id, request.player_id, state)
        return UpdateSettingsResponse(success=True)
    except Exception as e:
        return UpdateSettingsResponse(success=False, message=str(e))
```

---

## 💾 STATE MANAGEMENT & CONTEXT PATTERN

### ThemeContext Pattern: `frontend/src/context/ThemeContext.tsx`

**Location**: Complete file (174 lines)

#### Context Definition (Lines 37-62)
```typescript
interface ThemeContextValue {
  mode: ThemeMode;
  theme: TerminalTheme;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  isLight: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
```

#### Provider Component (Lines 91-140)
```typescript
export function ThemeProvider({ children, initialMode }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode ?? getInitialTheme);

  // Persist to localStorage when mode changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  }, [mode]);

  // Apply theme class to document for global styles
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('theme-dark', 'theme-light');
      document.documentElement.classList.add(`theme-${mode}`);

      if (mode === 'light') {
        document.body.style.backgroundColor = '#f9fafb';
      } else {
        document.body.style.backgroundColor = '#111827';
      }
    }
  }, [mode]);

  const toggleTheme = useCallback(() => {
    setModeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  const theme = getTheme(mode);

  const value: ThemeContextValue = {
    mode,
    theme,
    toggleTheme,
    setMode,
    isDark: mode === 'dark',
    isLight: mode === 'light',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
```

#### Hook (Lines 151-157)
```typescript
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

#### LocalStorage Integration (Lines 68-85)
```typescript
const STORAGE_KEY = 'hp-detective-theme';

function getInitialTheme(): ThemeMode {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    // Fall back to system preference
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  }

  // Default to dark
  return 'dark';
}
```

### Music Context Pattern (To Create)

**Architecture**: Replicate ThemeContext but for music playback state

```typescript
interface MusicContextValue {
  isPlaying: boolean;
  volume: number;           // 0-100
  currentTrack: string | null;

  // Actions
  setPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setTrack: (trackId: string) => void;
  togglePlayback: () => void;
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hp-detective-music-playing');
      return stored === 'true';
    }
    return false;
  });

  const [volume, setVolumeState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hp-detective-music-volume');
      return stored ? Math.min(100, Math.max(0, parseInt(stored))) : 50;
    }
    return 50;
  });

  const [currentTrack, setTrackState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hp-detective-music-track');
    }
    return null;
  });

  // Persist to localStorage when state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hp-detective-music-playing', String(isPlaying));
    }
  }, [isPlaying]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hp-detective-music-volume', String(volume));
    }
  }, [volume]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentTrack) {
        localStorage.setItem('hp-detective-music-track', currentTrack);
      } else {
        localStorage.removeItem('hp-detective-music-track');
      }
    }
  }, [currentTrack]);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(Math.min(100, Math.max(0, newVolume)));
  }, []);

  const setTrack = useCallback((trackId: string) => {
    setTrackState(trackId);
  }, []);

  const togglePlayback = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const value: MusicContextValue = {
    isPlaying,
    volume,
    currentTrack,
    setPlaying: setIsPlaying,
    setVolume,
    setTrack,
    togglePlayback,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic(): MusicContextValue {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
```

---

## 📁 CASE STRUCTURE & METADATA

### Case Loading Pattern

**Location**: `frontend/src/App.tsx` (Lines 48-79)

```typescript
// Case ID constant at top level
const CASE_ID = "case_001";
const PLAYER_ID = "default";

// Case ID validation
const validateCaseId = (caseId: string | null): string | null => {
  if (!caseId) return null;
  const CASE_ID_PATTERN = /^case_\d{3}$/;
  return CASE_ID_PATTERN.test(caseId) ? caseId : null;
};

// Active case selection
const activeCaseId = selectedCaseId ?? CASE_ID;
```

### YAML Case Template Structure

**Location**: `backend/src/case_store/case_001.yaml` (Lines 1-50)

```yaml
case:
  id: "case_001"
  title: "The Restricted Section"
  difficulty: beginner
  description: "..."

  # Phase 5.5: Case identity
  crime_type: "assault"
  hook: "..."
  twist: "..."

  # Phase 5.5: Victim humanization
  victim:
    name: "Severus Snape"
    age: "Potions Master, Head of Slytherin House"
    humanization: "..."
    memorable_trait: "..."
    time_of_death: "10:00 PM"
    cause_of_death: "Petrification curse from Hand of Glory discharge"

  locations:
    library:
      id: "library"
      name: "Hogwarts Library - Restricted Section"
      type: "micro"
      description: "..."
      surface_elements: [...]
      witnesses_present: ["hermione"]
```

### Recommended Addition for Music

```yaml
case:
  id: "case_001"
  # ... existing fields ...

  # NEW: Audio ambience (Phase 6.5+)
  audio:
    # Background music file (auto-detected from /public/music/{track_id}.mp3)
    ambient_track: "case_001"
    # Optional per-location tracks (override ambient)
    location_tracks:
      library: "library_ambience"
      interview_room: "interrogation_ambience"
    # Volume recommendation (user can override)
    default_volume: 50
```

### How Case ID Flows Through App

1. **Landing Page**: User selects case → `setSelectedCaseId("case_001")`
2. **App State**: `activeCaseId = selectedCaseId ?? CASE_ID`
3. **Game Hooks**: `useInvestigation(activeCaseId)` loads investigation state
4. **Music System**: `useMusicContext().setTrack(activeCaseId)` starts music
5. **Settings**: `SettingsModal` receives `caseId={activeCaseId}` prop
6. **Backend**: `/api/investigate` loads case YAML with audio config

---

## 🎵 AUDIO COMPONENT PATTERN (To Create)

### Music Player Component Architecture

```typescript
// frontend/src/components/MusicPlayer.tsx

interface MusicPlayerProps {
  caseId: string;
  /** Track ID (defaults to caseId if not provided) */
  trackId?: string;
  /** Initial volume (0-100) */
  initialVolume?: number;
  /** Whether to autoplay on mount */
  autoPlay?: boolean;
  /** Callback when track ends */
  onTrackEnd?: () => void;
  /** Callback when error occurs */
  onError?: (error: string) => void;
}

export function MusicPlayer({
  caseId,
  trackId = caseId,
  initialVolume = 50,
  autoPlay = false,
  onTrackEnd,
  onError,
}: MusicPlayerProps) {
  const { theme } = useTheme();
  const { isPlaying, volume, setPlaying, setVolume, currentTrack, setTrack } = useMusic();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasError, setHasError] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  // Auto-detect music file
  const musicUrl = `/music/${trackId}.mp3`;

  // Track current track in context
  useEffect(() => {
    setTrack(trackId);
  }, [trackId, setTrack]);

  // Update audio element volume when context changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Update audio playback state when context changes
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && currentTrack === trackId) {
        audioRef.current.play().catch((err) => {
          console.error('Playback error:', err);
          setHasError(true);
          onError?.('Failed to start playback');
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack, trackId, onError]);

  const handlePlayPause = () => {
    setPlaying(!isPlaying);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseInt(e.target.value, 10));
  };

  const handleError = () => {
    setHasError(true);
    onError?.('Failed to load audio file');
  };

  const handleCanPlay = () => {
    setIsBuffering(false);
  };

  const handleWaiting = () => {
    setIsBuffering(true);
  };

  if (hasError) {
    return (
      <div className={`p-3 border ${theme.colors.state.error.border} ${theme.colors.state.error.bgLight} rounded`}>
        <span className={`text-xs ${theme.colors.state.error.text} font-mono`}>
          {theme.symbols.error} Audio file not found
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 p-4 border ${theme.colors.border.default} rounded ${theme.colors.bg.primary}`}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={musicUrl}
        onError={handleError}
        onCanPlay={handleCanPlay}
        onWaiting={handleWaiting}
        onEnded={() => {
          setPlaying(false);
          onTrackEnd?.();
        }}
        loop
      />

      {/* Player controls */}
      <div className="flex items-center gap-3">
        {/* Play/Pause button */}
        <button
          onClick={handlePlayPause}
          disabled={isBuffering}
          className={`w-10 h-10 flex items-center justify-center border rounded ${
            isPlaying && currentTrack === trackId
              ? `${theme.colors.bg.hover} ${theme.colors.border.hover}`
              : theme.colors.border.default
          }`}
          aria-label={isPlaying ? 'Pause music' : 'Play music'}
        >
          <span className="text-lg">
            {isBuffering ? '⏳' : isPlaying && currentTrack === trackId ? '⏸' : '▶'}
          </span>
        </button>

        {/* Volume slider */}
        <div className="flex items-center gap-2 flex-1">
          <span className={`text-xs ${theme.colors.text.muted} font-mono`}>🔊</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-1 bg-gray-700 rounded"
            aria-label="Volume"
          />
          <span className={`text-xs ${theme.colors.text.muted} font-mono w-8 text-right`}>
            {volume}%
          </span>
        </div>
      </div>

      {/* Track info */}
      <div className={`text-xs ${theme.colors.text.muted} font-mono text-center`}>
        {trackId}
      </div>
    </div>
  );
}
```

---

## 🔌 INTEGRATION POINTS

### 1. Where Music Player Integrates in App

**File**: `frontend/src/App.tsx`

```typescript
// At top-level imports (after line 40)
import { MusicProvider } from "./context/MusicContext";
import { useMusic } from "./hooks/useMusic";

// Wrap App component at root (before other providers)
export default function App() {
  return (
    <ThemeProvider>
      <MusicProvider>
        {/* Rest of app */}
      </MusicProvider>
    </ThemeProvider>
  );
}

// In game view (after LocationHeaderBar, line 306)
<MusicPlayer
  caseId={activeCaseId}
  initialVolume={50}
  autoPlay={true}
  onError={(error) => setToastMessage(error)}
/>
```

### 2. Where Settings Integration Happens

**File**: `frontend/src/components/SettingsModal.tsx`

**Current state** (Lines 254-264):
```typescript
{/* Future Settings Placeholder */}
<div className="space-y-3">
  <h3 className={`${theme.typography.caption} ${theme.colors.text.separator}`}>
    AUDIO
  </h3>
  <div className={`py-2 px-3 border ${theme.colors.border.separator} rounded-sm`}>
    <span className={`text-xs ${theme.colors.text.separator} font-mono`}>
      Coming soon...
    </span>
  </div>
</div>
```

**Replace with** (new implementation):
```typescript
{/* Audio Settings Section */}
<div className="space-y-3">
  <h3 className={`${theme.typography.caption} ${theme.colors.text.tertiary}`}>
    AUDIO
  </h3>

  {/* Music Volume Slider */}
  <div className="space-y-2">
    <label className={`text-xs ${theme.colors.text.muted} font-mono uppercase tracking-wider`}>
      Music Volume
    </label>
    <div className="flex items-center gap-3">
      <input
        type="range"
        min="0"
        max="100"
        value={musicVolume}
        onChange={(e) => void handleMusicVolumeChange(parseInt(e.target.value))}
        disabled={updating}
        className="flex-1 h-1 bg-gray-700 rounded"
      />
      <span className={`text-xs ${theme.colors.text.muted} font-mono w-8 text-right`}>
        {musicVolume}%
      </span>
    </div>
  </div>

  {/* Music Enable/Disable Toggle */}
  <div className="flex items-center justify-between">
    <label className={`text-xs ${theme.colors.text.muted} font-mono uppercase tracking-wider`}>
      Ambient Music
    </label>
    <button
      onClick={() => void handleMusicToggle(!musicEnabled)}
      disabled={updating}
      className={`py-1 px-3 border rounded-sm font-mono text-xs uppercase tracking-widest ${
        musicEnabled
          ? `${theme.colors.interactive.border} ${theme.colors.interactive.text}`
          : `${theme.colors.border.default} ${theme.colors.text.muted}`
      }`}
    >
      {musicEnabled ? 'ON' : 'OFF'}
    </button>
  </div>
</div>
```

### 3. Backend State Update

**File**: `backend/src/state/player_state.py`

```python
class GameState(BaseModel):
    # ... existing fields ...

    # Audio preferences (new)
    music_volume: int = Field(default=50, ge=0, le=100)
    music_enabled: bool = Field(default=True)
```

### 4. API Endpoint Enhancement

**File**: `backend/src/api/routes.py`

```python
class UpdateSettingsRequest(BaseModel):
    case_id: str
    player_id: str
    narrator_verbosity: str | None = None
    music_volume: int | None = None      # NEW
    music_enabled: bool | None = None    # NEW

@router.post("/settings/update", response_model=UpdateSettingsResponse)
async def update_settings(request: UpdateSettingsRequest) -> UpdateSettingsResponse:
    # ... existing code ...

    if request.music_volume is not None:
        if not (0 <= request.music_volume <= 100):
            return UpdateSettingsResponse(
                success=False,
                message="Music volume must be 0-100"
            )
        state.music_volume = request.music_volume

    if request.music_enabled is not None:
        state.music_enabled = request.music_enabled

    # ... save and return ...
```

---

## 🔍 KEY PATTERNS & CONVENTIONS

### Naming Conventions
| Element | Pattern | Example |
|---------|---------|---------|
| Context | PascalCase + Context suffix | `ThemeContext`, `MusicContext` |
| Hook | `use` prefix + Feature | `useTheme`, `useMusic` |
| Component | PascalCase | `MusicPlayer`, `PortraitImage` |
| Props interface | ComponentName + Props suffix | `MusicPlayerProps` |
| localStorage keys | kebab-case + app-prefix | `hp-detective-theme`, `hp-detective-music-volume` |
| API endpoints | `/api/resource/action` | `/api/settings/update`, `/api/investigate` |
| Case IDs | snake_case with 3 digits | `case_001`, `case_002` |
| Asset IDs | snake_case matching folder names | `library`, `hermione` |

### Code Style Observations
- **Type safety**: Always define interfaces for props, state, API responses
- **Error boundaries**: useState for error states, fallback UI for missing assets
- **useCallback**: Wrap handlers in useCallback to avoid re-renders
- **useEffect**: Separate effects for different concerns (localStorage, DOM updates)
- **Comments**: JSDoc on components, inline comments for complex logic
- **Validation**: Input validation in handlers, shape validation in API client (Zod)

### File Organization
```
src/
├── context/
│   ├── ThemeContext.tsx          # Single context per file
│   └── MusicContext.tsx          # (to create)
├── hooks/
│   ├── useTheme.ts               # Extracted from context
│   ├── useMusic.ts               # (to create)
│   └── [other hooks]
├── components/
│   ├── SettingsModal.tsx         # Settings UI
│   ├── MusicPlayer.tsx           # (to create)
│   └── [other components]
└── types/
    └── investigation.ts          # Type definitions (centralized)
```

---

## ⚠️ GOTCHAS & IMPLEMENTATION WARNINGS

### 1. LocalStorage Availability
- Always check `typeof window !== 'undefined'` before accessing localStorage
- Browser dev tools can block localStorage in strict privacy mode
- Key pattern: Use consistent key prefix (`hp-detective-*`) for namespacing

### 2. Image/Audio File Format Handling
- Use `<picture>` element for images with multiple format sources
- HTML5 `<audio>` doesn't support format fallbacks like `<picture>` does
- For music, stick to MP3 (universal browser support)
- If mobile support needed, also provide OGG Vorbis

### 3. React Context Updates
- Context providers should wrap entire subtree that needs access
- Using context outside provider throws error (good for debugging)
- Theme/Music changes trigger full re-render of children (acceptable for small apps)

### 4. Event Listener Cleanup
- Always return cleanup function from useEffect for event listeners
- Example: `return () => document.removeEventListener("keydown", handleKeydown)`
- Missing cleanup causes memory leaks and duplicate listeners on re-mount

### 5. Loading State Management
- Prevent rapid clicks: Check `if (updating || loading) return` at start of handlers
- Always set loading state back to `false` in finally block
- Use `disabled` prop on buttons while loading to prevent double-submission

### 6. Case ID Validation
- Pattern: `/^case_\d{3}$/` (validates case_001, case_099, NOT case_1 or case_0001)
- Always validate before using in API calls
- Backend should also validate to prevent injection attacks

### 7. Keyboard Shortcuts with Modals
- Check `document.querySelector('[role="dialog"]')` before handling keyboard shortcuts
- Prevents location-switching shortcuts from firing when settings modal is open
- Example: LocationHeaderBar (lines 264-267)

### 8. Asset Missing Handling
- Never assume files exist in public folder
- Always provide visible fallback (placeholder UI, not silent failure)
- Log errors to console for debugging: `console.error('[ComponentName] Failed to load...')`
- Use `onError` callback on img/audio elements

---

## 📊 IMPLEMENTATION CHECKLIST

### Phase 1: Asset & Backend Setup
- [ ] Create `/frontend/public/music/` folder
- [ ] Add case music files (case_001.mp3, case_002.mp3)
- [ ] Update `backend/src/state/player_state.py` with music_volume, music_enabled fields
- [ ] Extend UpdateSettingsRequest/Response models

### Phase 2: Context & Hooks
- [ ] Create `frontend/src/context/MusicContext.tsx` (replicate ThemeContext pattern)
- [ ] Create `frontend/src/hooks/useMusic.ts` hook
- [ ] Export from context `__init__` (if using barrel exports)
- [ ] Add MusicProvider to App.tsx root level

### Phase 3: Components
- [ ] Create `frontend/src/components/MusicPlayer.tsx`
- [ ] Update `frontend/src/components/SettingsModal.tsx` with AUDIO section
- [ ] Integrate MusicPlayer into game view (after LocationHeaderBar)
- [ ] Wire SettingsModal props (musicVolume, onMusicVolumeChange)

### Phase 4: API & State
- [ ] Update `/api/settings/update` endpoint to handle music fields
- [ ] Add type definitions to `frontend/src/types/investigation.ts` if needed
- [ ] Test settings persistence (volume should survive page reload)

### Phase 5: Testing & Polish
- [ ] Manual test: Play/pause music, change volume
- [ ] Manual test: Settings persist after reload
- [ ] Manual test: Music changes when switching cases
- [ ] Manual test: Fallback UI shows when case music missing
- [ ] ESLint/TypeScript validation: 0 errors
- [ ] Cross-browser test: Chrome, Firefox, Safari

---

## 📚 FILES & PATHS (Reference)

### Key Existing Files
- `frontend/src/context/ThemeContext.tsx` - Context pattern template
- `frontend/src/components/SettingsModal.tsx` - Settings integration pattern
- `frontend/src/components/LocationHeaderBar.tsx` - Auto-detection pattern (images)
- `frontend/src/components/WitnessInterview.tsx` - Portrait pattern
- `frontend/src/App.tsx` - Case ID flow, provider wrapping
- `backend/src/api/routes.py` - API endpoint patterns
- `backend/src/state/player_state.py` - State model patterns

### Files to Create
- `frontend/src/context/MusicContext.tsx`
- `frontend/src/hooks/useMusic.ts`
- `frontend/src/components/MusicPlayer.tsx`

### Files to Modify
- `frontend/src/App.tsx` - Add MusicProvider, MusicPlayer integration
- `frontend/src/components/SettingsModal.tsx` - Replace "Coming soon..." with audio controls
- `backend/src/state/player_state.py` - Add music_volume, music_enabled fields
- `backend/src/api/routes.py` - Extend UpdateSettingsRequest/Response

### Directories to Create
- `frontend/public/music/` - Music asset folder

---

## 🎯 SUCCESS CRITERIA

- **Auto-Detection**: Music files detected from `/public/music/{caseId}.mp3`
- **Volume Control**: User can adjust volume 0-100 via settings modal
- **Persistence**: Music settings survive page reload
- **Error Handling**: Missing audio shows user-friendly fallback (no console spam)
- **Type Safety**: TypeScript 0 errors, no `any` types
- **Linting**: ESLint 0 errors
- **Accessibility**: Audio controls have aria-labels, keyboard shortcuts work
- **Performance**: Music context doesn't cause unnecessary re-renders
- **Backend Integration**: Settings POST to `/api/settings/update` and persist

---

## 🔗 RELATED PATTERNS (Available in Codebase)

1. **HTTP Client**: See `frontend/src/api/client.ts` for fetch wrappers + error handling
2. **Zod Validation**: See `frontend/src/api/schemas.ts` for runtime type validation
3. **Keyboard Shortcuts**: See `frontend/src/components/LocationHeaderBar.tsx` (lines 252-286)
4. **Modal Patterns**: See `frontend/src/components/SettingsModal.tsx` (Radix UI Dialog)
5. **State Persistence**: See `frontend/src/App.tsx` (localStorage validation patterns)

---

**Files Analyzed**: 12
**Patterns Extracted**: 7 (image auto-detection, settings integration, context, localStorage, API, case structure, keyboard shortcuts)
**Integration Points Identified**: 5 (App.tsx wrapping, SettingsModal integration, MusicPlayer placement, backend API, state model)
**Confidence**: HIGH (all patterns fully documented with code examples and line numbers)
