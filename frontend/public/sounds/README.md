# Quiz Sound Effects

## Required Sound Files

To enable sound effects for the quiz feedback, add the following sound files to this directory:

### 1. `correct.mp3`
- **Purpose**: Plays when user selects the correct answer
- **Suggested sound**: Success chime, ding, or positive notification sound
- **Duration**: 0.5 - 1 second
- **Volume**: Should be pleasant and not too loud

### 2. `wrong.mp3`
- **Purpose**: Plays when user selects the wrong answer
- **Suggested sound**: Error buzz, incorrect tone, or gentle negative sound
- **Duration**: 0.5 - 1 second
- **Volume**: Should be clear but not harsh

## Where to Get Free Sound Effects

You can download free sound effects from:

1. **Freesound.org** - https://freesound.org/
   - Search: "success sound" or "correct answer"
   - Search: "error sound" or "wrong answer"

2. **Mixkit** - https://mixkit.co/free-sound-effects/
   - Browse: UI sounds or notification sounds

3. **Zapsplat** - https://www.zapsplat.com/
   - Category: Game sounds > UI

4. **Pixabay** - https://pixabay.com/sound-effects/
   - Search: "correct" or "wrong"

## Suggested Sounds

### For Correct Answer (`correct.mp3`):
- "Success" or "Level Up" sounds
- Bell ding or chime
- Positive notification tone
- Examples: "ding", "ta-da", "success chime"

### For Wrong Answer (`wrong.mp3`):
- "Error" or "Incorrect" sounds
- Buzz or beep
- Gentle negative tone
- Examples: "buzz", "error beep", "wrong answer"

## File Format Requirements

- **Format**: MP3 (recommended) or OGG
- **Sample Rate**: 44.1 kHz or 48 kHz
- **Bit Rate**: 128 kbps or higher
- **Size**: Keep files small (< 100 KB each)

## Installation

1. Download your chosen sound files
2. Rename them to `correct.mp3` and `wrong.mp3`
3. Place them in this directory (`frontend/public/sounds/`)
4. Refresh your application

## Note

The quiz will work without sound files - sounds are optional and will fail gracefully if not found.
