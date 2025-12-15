# Gemini TTS Plus

Enhanced Gemini TTS extension for SillyTavern with voice styling support for Gemini 2.5 Pro.

## Features

- **Voice Styling Prompts** - Customize how each character sounds using Gemini 2.5 Pro's voice styling capabilities
- **Per-Character Configuration** - Individual voice and styling settings for each character
- **Group Chat Support** - Automatically detects and uses the correct voice for each character in group chats
- **27 Available Voices** - Full selection of Gemini 2.5 Pro voices with descriptions
- **Text Processing Options** - Control how narration, asterisks, quotes, and code blocks are handled

## Installation

Install directly in SillyTavern by pasting the GitHub repository URL in the extension installer.

## Setup

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Open Extensions > Gemini TTS Plus in SillyTavern
3. Enter your API key
4. Configure global or per-character voice styling prompts
5. Select voices for each character
6. Enable "TTS Enabled" checkbox

## Available Voices

- **Kore** — Firm
- **Orus** — Firm
- **Autonoe** — Bright
- **Umbriel** — Easy-going
- **Erinome** — Clear
- **Laomedeia** — Upbeat
- **Schedar** — Even
- **Achird** — Friendly
- **Sadachbia** — Lively
- **Fenrir** — Excitable
- **Aoede** — Breezy
- **Enceladus** — Breathy
- **Algieba** — Smooth
- **Algenib** — Gravelly
- **Achernar** — Soft
- **Gacrux** — Mature
- **Zubenelgenubi** — Casual
- **Sadaltager** — Knowledgeable
- **Leda** — Youthful
- **Callirrhoe** — Easy-going
- **Iapetus** — Clear
- **Despina** — Smooth
- **Rasalgethi** — Informative
- **Alnilam** — Firm
- **Pulcherrima** — Forward
- **Vindemiatrix** — Gentle
- **Sulafat** — Warm

## Voice Styling Examples

**Enthusiastic character:**
```
Speak with energy and excitement, using dynamic pitch variations and quick pacing.
```

**Calm character:**
```
Use a measured, soothing tone with gentle inflection and relaxed pacing.
```

**Mysterious character:**
```
Speak softly with deliberate pauses, maintaining an enigmatic and intriguing quality.
```

## Configuration Options

- **TTS Enabled** - Toggle the extension on/off
- **Include User Message Narration** - Narrate user messages as well as character responses
- **Pass Asterisks to TTS Engine** - Keep asterisks in narrated text
- **Only Narrate Quotes** - Only speak text within quotation marks
- **Skip Codeblocks** - Remove code blocks from narration
- **Skip <tagged> blocks** - Remove HTML-style tagged blocks from narration
- **Ignore text, even "quotes", inside of asterisks** - Skip all content between asterisks

## Testing

Use the slash command to test your configuration:

```
/gemini-tts-test Your test message here
```

## License

MIT License