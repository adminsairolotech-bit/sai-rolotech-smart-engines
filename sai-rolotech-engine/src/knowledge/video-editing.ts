/**
 * VIDEO EDITING KNOWLEDGE BASE (Filmora-Level)
 * Complete video editing knowledge
 */

export const VIDEO_KB = {
  category: "Video Editing",
  source: "Professional Video Editing Reference",
  entries: [
    {
      topic: "Filmora AI Features",
      content: `
FILMORA AI FEATURES
====================

AI-POWERED TOOLS:
- AI Smart Cut              - Auto remove silences
- AI Music Generator        - Generate background music
- AI Thumbnail Generator    - Create video thumbnails
- AI Voice Extractor        - Extract vocals from music
- AI Transcription          - Auto-generate subtitles
- AI Color Correction       - Automatic color grading
- AI Video Enhancer         - Upscale & denoise
- AI Style Transfer         - Apply artistic effects

EDITING FEATURES:
- 4K/8K video support
- 100+ tracks timeline
- 1000+ effects & templates
- Keyframe animation
- Green screen (Chromakey)
- Motion tracking
- Speed ramping
- Split screen
- Picture-in-Picture

AUDIO FEATURES:
- AI denoise
- Audio ducking
- Beat detection
- Audio spectrum
- Voiceover recording
- Audio synchronization

EXPORT FORMATS:
- MP4 (H.264, H.265)
- MOV, AVI, MKV
- WebM, WMV
- Audio: MP3, WAV, FLAC
      `,
    },
    {
      topic: "Cutting & Trimming",
      content: `
CUTTING & TRIMMING TECHNIQUES
==============================

BASIC CUTS:
- Razor Tool (C)      - Split clip at playhead
- Cut Tool            - Split all tracks
- Trim Start ( [ )   - Trim from start
- Trim End ( ] )     - Trim from end

ADVANCED CUTS:
- Jump Cut            - Remove middle section
- J-Cut              - Audio leads video
- L-Cut              - Video leads audio
- Split Edit          - Picture/audio cut separately

TRIMMING METHODS:
- Drag clip edges in timeline
- Use trim handles
- Ripple edit (moves subsequent clips)
- Roll edit (adjusts cut between clips)
- Slip edit (slides clip content)

SHORTCUTS:
C         - Razor tool
B         - Track forward
N         - Track back
V         - Selection tool
X         - Trim tool
Y         - Slip tool
Shift+Y   - Slide tool

RIPPLE vs ROLL:
- Ripple: Moves all clips after edit
- Roll: Adjusts edit point between clips
      `,
    },
    {
      topic: "Transitions",
      content: `
VIDEO TRANSITIONS
=================

CUT TRANSITIONS:
- Jump Cut          - Jump in time
- Smash Cut         - Abrupt change
- Match Cut         - Similar composition
- Cross Cut         - Parallel action

DISSOLVES:
- Cross Dissolve    - Fade to next
- Fade to Black     - End scene
- Fade to White     - Brighter ending
- Dip to Color      - Flash of color

MOTION TRANSITIONS:
- Slide             - Push/pulls
- Wipe             - Reveals/hides
- Zoom             - Scale transition
- Spin             - Rotation effect
- Cube Turn        - 3D rotation

DISTANCE:
- Near              - Fast transition
- Medium           - Normal speed
- Far              - Slow transition

TIPS:
- Use dissolves for emotional scenes
- Hard cuts for action/energy
- Match transitions to content
- Don't overuse flashy transitions
- 0.5-1.5 second duration typical
      `,
    },
    {
      topic: "Color Grading",
      content: `
COLOR GRADING ESSENTIALS
=========================

COLOR CORRECTION vs GRADING:
- Correction: Make footage "normal"
- Grading: Creative color style

BASIC ADJUSTMENTS:
- Exposure         - Brightness
- Contrast         - Light/dark range
- Highlights       - Bright areas
- Shadows          - Dark areas
- Whites           - White point
- Blacks           - Black point

COLOR WHEELS:
- Shadows/Midtone/Highlights control
- Saturation per range
- Tint (green/magenta)

PRESETS & LOOKS:
- Cinematic        - Teal shadows, warm highlights
- Vintage         - Desaturated, faded
- High Contrast   - Punchy blacks
- Bleach Bypass   - Flat, desaturated
- Orange & Teal   - Popular movie look

WHITE BALANCE:
- Temperature (warm/cool)
- Tint (green/magenta)

HSL ADJUSTMENTS:
- Hue              - Color shift
- Saturation       - Color intensity
- Luminance        - Color brightness

LOG FOOTAGE:
- LUT application
- Rec709 conversion
- HDR to SDR
      `,
    },
    {
      topic: "Audio Editing",
      content: `
AUDIO EDITING IN VIDEO
=======================

AUDIO CLEANUP:
- Noise Reduction   - Remove background noise
- DeHum            - Remove electrical hum
- DeReverb         - Reduce room echo
- EQ               - Frequency adjustment
- Compressor       - Dynamic range control

LEVELS & MIXING:
- Normalize        - Peak to 0dB
- Gain             - Volume adjustment
- Auto-duck        - Lower music during dialogue
- Keyframe volume  - Manual adjustment

AUDIO EFFECTS:
- Fade in/out      - Gradual volume change
- Echo             - Repeating reflection
- Reverb           - Room ambiance
- Pitch shift      - Speed without duration change
- Reverse          - Reverse audio clip

MUSIC SYNC:
- Beat detection   - Auto-marker to beats
- Beat editing     - Cut to rhythm
- Crossfade        - Smooth music transition
- Audio Spectrum   - Visual music display

EXPORT SETTINGS:
- Bitrate: 192-320kbps
- Sample rate: 44.1kHz (CD), 48kHz (video)
- Channels: Stereo/Mono/Surround
- Format: MP3/AAC/WAV/FLAC
      `,
    },
    {
      topic: "Motion Graphics",
      content: `
MOTION GRAPHICS & EFFECTS
=========================

TEXT ANIMATION:
- Title animations  - Pre-made effects
- Character animation - Letter by letter
- Path animation    - Text on path
- Typewriter       - Text appears gradually
- Text on screen    - Lower thirds, captions

KEYFRAME ANIMATION:
- Position         - Move across screen
- Scale            - Grow/shrink
- Rotation         - Spin
- Opacity          - Fade in/out
- Anchor point     - Rotation center

EASING FUNCTIONS:
- Linear           - Constant speed
- Ease In          - Starts slow
- Ease Out         - Ends slow
- Ease In/Out      - Slow start and end
- Custom bezier    - Manual curve

ANIMATION PRESETS:
- Bounce           - Elastic effect
- Elastic          - Spring back
- Overshoot        - Beyond target
- Pop              - Quick scale up/down

OVERLAY EFFECTS:
- Picture-in-Picture
- Green screen removal
- Blur background
- Vignette
- Light leaks
- Film grain
      `,
    },
    {
      topic: "Export & Render",
      content: `
EXPORT & RENDER SETTINGS
========================

RESOLUTION:
- 4K: 3840x2160 (Ultra HD)
- 1080p: 1920x1080 (Full HD)
- 720p: 1280x720 (HD)
- 480p: 854x480 (SD)

FRAME RATES:
- 24fps            - Cinema standard
- 25fps            - PAL standard
- 30fps            - NTSC standard
- 60fps            - Smooth motion
- 120fps           - Slow motion source

BITRATE SETTINGS:
- Constant (CBR)   - Consistent quality
- Variable (VBR)   - Efficient storage
- Target bitrate   - For VBR quality
- Max bitrate      - Ceiling for VBR

CODECS:
- H.264            - Most compatible
- H.265/HEVC       - Better compression (4K)
- VP9              - Web optimized
- ProRes           - Professional editing
- DNxHD            - Edit-quality intermediate

EXPORT PRESETS:
- YouTube (1080p, H.264)
- Vimeo (4K, ProRes)
- DVD (480p, MPEG-2)
- Web (optimized streaming)
- High Quality Archive

TIPS:
- Higher bitrate = larger file
- 8-bit vs 10-bit color
- Chroma subsampling: 4:2:0 vs 4:2:2
- Use hardware encoding if available
      `,
    },
  ],
};
