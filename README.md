<div align="center">

# cue

**An open-source AI copilot that floats over your screen — sees what you see, hears your meetings, and stays hidden from screen shares.**

A free, self-hosted alternative to Cluely. Bring your own AI key (OpenAI · Anthropic · Google Gemini · OpenAI-compatible endpoints).

<img src="docs/tutorial.png" width="620" alt="cue first-run tutorial" />

</div>

---

> [!IMPORTANT]
> **Please read this first.** cue tries to stay out of screen recordings/shares, but this is **best-effort, not guaranteed** — on macOS 15.4+ Apple can let modern capture tools see it anyway, on Windows 10 builds older than 2004 it degrades to a black box instead of true exclusion, and a phone camera always can. Using a hidden assistant during a **proctored exam, job interview, or recorded meeting** may break that platform's rules and, in some places, consent laws. cue is built for legitimate uses — your own notes, studying, accessibility, and practice. **You are responsible for how you use it.**

---

## What it does

cue floats a small glass panel on top of everything. It takes **three separate inputs** — your **screen**, your **microphone**, and your **meeting audio** (what the other person says) — and uses an AI model to help you in real time.

| Feature | How to trigger | What it uses |
|---|---|---|
| **Screenshot** | `⌘` `Shift` `↵` (macOS) or `Ctrl` `Shift` `Enter` (Windows) | your screen + rolling conversation memory |
| **What should I say?** | `⌘` `↵` (macOS) or `Ctrl` `Enter` (Windows) | meeting audio + your mic |
| **Follow-up questions** | button | rolling conversation memory |
| **Recap** | button | rolling conversation memory |
| **Ask anything** | type + `↵` | your screen + conversation |
| **Solve a coding problem** | `⌘` `H` (macOS) or `Ctrl` `H` (Windows) | your screen only |
| **Smart** toggle | pill in the box | switches to a smarter (slower) model |

It's a copilot for **live meetings** ("what do I say to that?") and **coding problems** (screenshot → full solution), and it's designed to be **invisible in screen shares** so it stays your private assistant.

### Platform support

|  | macOS | Windows 11 / 10 2004+ |
|---|---|---|
| Screen + coding help | ✅ | ✅ |
| Your mic (the **You** channel) | ✅ | ✅ |
| Meeting audio (the **Them** channel) | ✅ macOS 14.4+ | ✅ |
| Hidden from screen shares | ⚠️ best-effort, weaker on macOS 15.4+ | ✅ `WDA_EXCLUDEFROMCAPTURE` |
| Permissions to grant | Microphone **and** Screen Recording | Microphone only |

> [!NOTE]
> **Meeting audio needs macOS 14.4+.** Capturing the *other* person — what powers **What should I say?**, **Follow-up questions**, and **Recap** — uses system-audio loopback. On Windows that works out of the box. On macOS it relies on ScreenCaptureKit, which cue enables through Chromium's `MacLoopbackAudioForScreenShare` and `MacSckSystemAudioLoopbackOverride` switches; on older macOS the *Them* channel stays silent while your screen and the **You** channel keep working.

---

## Install

Option A is the easiest on both platforms. Use Option B if you'd rather run from source.

### Option A — Download the app (easiest)

Go to the [**Releases**](../../releases) page, then choose your platform:

- **Windows 10/11 (x64):** download **`cue-win-x64.exe`**, run it, and launch cue from the Start menu. The installer is unsigned, so Windows SmartScreen may show an **Unknown publisher** warning.
- **macOS (Apple silicon):** download **`cue-…-arm64-mac.zip`**, unzip it, drag **`cue.app`** into **Applications**, and open it.

### Option B — Run from source (macOS or Windows)

You need [Node.js](https://nodejs.org) 22.12+ installed (required by dev dependencies). No Xcode and no Visual Studio build tools required — cue deliberately avoids native modules.

```bash
git clone https://github.com/Blueturboguy07/cue.git
cd cue
npm install
npm start
```

That's the whole setup on Windows. There's no permission dance — grant the mic when Windows asks and you're done.

To build a standalone app:
```bash
npm run pack        # unpacked app in dist/ (either OS)
npm run pack:win    # unpacked Windows app -> dist/win-unpacked/cue.exe
npm run dist:mac    # macOS zip            -> dist/
npm run dist:win    # Windows installer    -> dist/cue-win-x64.exe
```
For a local macOS installation that preserves permission identity across updates, prepare the Whisper runtime below, then run `npm run install:mac`. This requires a valid Apple Development or Developer ID Application certificate in your keychain. The installer remembers the selected certificate, verifies that subsequent builds satisfy the same signing requirement, installs `/Applications/cue.app`, and relaunches it. If multiple certificates are available on the first run, set `CUE_SIGN_IDENTITY` to the desired fingerprint from `security find-identity -v -p codesigning`.

Switching from an ad hoc build to certificate signing requires one permission refresh. Future installs through this command retain the signing identity; macOS can still revoke or re-confirm access. Plain unsigned/ad hoc builds have no such continuity. Private signing keys remain in Keychain; the installer saves only certificate metadata in `~/Library/Application Support/cue/local-signing.json`.
To build a packaged app:
```bash
npm run dist:mac    # macOS build
npm run dist:win    # Windows build
npm run dist:linux  # Linux x64 AppImage
```

Packaged builds include a pinned `whisper.cpp` runtime. When running from source, prepare the matching runtime once:

```bash
npm run prepare:whisper
```

Windows x64 and Linux x64/arm64 use checksum-verified binaries from the pinned upstream release. macOS x64/arm64 builds `whisper-server` from the same pinned source tag and requires CMake plus Xcode command-line tools.

> Note: permission grants can reset after a rebuild, so you may need to re-enable microphone/screen access after packaging a fresh build.

---

## First launch — the 1-minute setup

When cue opens the first time, a **built-in tutorial** walks you through everything below. You can reopen it anytime by clicking the **cue logo** (top-left of the pill). Here's the same thing in writing.

### Step 1 — Grant permissions

cue can't help until your OS lets it see and hear. When you first use a feature you'll usually be prompted — click **Allow**. If no prompt appears, grant access manually.

**On macOS — two grants.** System Settings → **Privacy & Security** → **Microphone** and **Screen Recording** → turn on **cue**. macOS may ask you to **quit & reopen** cue — let it. Screen Recording covers both the screenshot features and meeting-audio capture.

**On Windows — one grant.** Only the microphone needs permission: Settings → **Privacy & security** → **Microphone** → turn on **Microphone access** *and* **Let desktop apps access your microphone**. Screenshots and meeting audio need no permission at all — they work immediately, using Windows loopback capture.

### Step 2 — Add your AI key (bring your own)

cue uses **your own** API key, so it's free to run (you only pay your AI provider for what you use). Click the **`...`** button in the input box (or press `⌘` `,` on macOS / `Ctrl` `,` on Windows) to open **Settings**, pick a provider, and paste your key:

| Provider | Get a key | Notes |
|---|---|---|
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | One key does everything — **but** for the *listening* features the key must have **Whisper / audio** access (a "restricted" project key that only allows chat will give a 403 on transcription). |
| **Anthropic (Claude)** | [console.anthropic.com](https://console.anthropic.com) | Great for screen & coding help. Claude has no speech-to-text, so add an OpenAI or Gemini key too if you want the listening features. |
| **Google Gemini** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | One key does chat + transcription. |
| **Azure AI Foundry** | [ai.azure.com](https://ai.azure.com) | Paste your **endpoint** plus your key in Settings. **Azure OpenAI:** `https://&lt;resource&gt;.openai.azure.com/openai` — **AI Foundry:** `https://&lt;host&gt;.cognitiveservices.azure.com` (cue appends `/openai/v1` itself). The **model** fields are your deployment names. No speech-to-text — add an OpenAI or Gemini key for listening. |
| **Custom** | Your endpoint or gateway | Any OpenAI-compatible Chat Completions endpoint. The API key is optional for unauthenticated local servers. |

To use an OpenAI-compatible endpoint, select **Custom** and configure its Base URL, API key, and Fast/Smart model IDs. Custom endpoints handle LLM requests only; listening continues to use Deepgram, OpenAI, or Gemini credentials.

| Example | Base URL | Model |
|---|---|---|
| OpenClaw local gateway | `http://127.0.0.1:18789/v1` | `openclaw/default` |
| Ollama | `http://127.0.0.1:11434/v1` | An installed Ollama model ID |

Your key is stored **only on your computer** (in `cue-data.json`) and is sent **only** to that provider. cue has no server and collects nothing.

### Optional — transcribe locally with whisper.cpp

Open **Settings → Audio**, choose **Local**, and download a model. `base.en` is the recommended English default; all 30 models supported by the official whisper.cpp download script are available, including multilingual, quantized, large, turbo, and TinyDiarize variants.

Local mode is independent from the chat provider, so you can use local speech-to-text with OpenAI, Anthropic, or Gemini chat. The selected model loads once when listening starts, serves both the **You** and **Them** channels, and unloads only after queued speech has been transcribed when listening stops.

- Audio inference stays on your computer and audio is never written to a temporary file.
- Model files are downloaded only when you ask, support cancel/resume, and are checked against pinned byte counts and SHA-256 hashes.
- Local mode never silently sends audio to a cloud fallback. A local failure is reported without sending the audio elsewhere.
- Models are stored under Cue's Electron user-data directory and can be imported or deleted from Settings.

### Optional — tailor answers to your background

In **Settings**, paste your résumé or professional background into **Résumé / professional background**. cue uses it as the factual reference for career-related answers and says when the résumé does not provide a detail. You can clear it anytime.

### Step 3 — The Zoom setting (only needed for Zoom)

cue is hidden from most screen-share tools automatically — **Google Meet, Microsoft Teams, and QuickTime need nothing.** **Zoom** has a specific setting that decides whether it respects cue's "don't capture me" flag:

> **Zoom → Settings → Share Screen → Advanced → Screen capture mode → choose "Advanced capture with window filtering."**

<div align="center"><img src="docs/zoom-setting.png" width="560" alt="Zoom screen capture mode setting" /></div>

**Why:** the *"...with window filtering"* modes tell Zoom to leave out windows that mark themselves as private — which is exactly what cue does. The **"Advanced capture without window filtering"** mode grabs the raw screen and **will show cue**, so avoid it.

---

## How to use it

### Move, resize, and expand the overlay

The **Expand** button in the top bar enlarges the panel; **Restore** returns to its previous size and position. You can also drag the grip at the bottom-right of the panel to resize it. The response area grows with the window, and position and size survive an app restart.

A compact control strip at the bottom of the overlay shows the movement chord and provides clickable arrow buttons. The same key handling also works while Cue itself is focused, in addition to the global shortcuts used while another app has focus.

These shortcuts work while another application has focus:

| Action | macOS | Windows / Linux |
|---|---|---|
| Move in 40-pixel steps | `⌃⌥` and an arrow key | `Ctrl Alt` and an arrow key |
| Adjust width / height | `⌃⌥⇧` and an arrow key | `Ctrl Alt Shift` and an arrow key |
| Expand / restore | `⌃⌥Return` | `Ctrl Alt Enter` |
| Center on the current screen | `⌃⌥C` | `Ctrl Alt C` |

For resizing, Left narrows, Right widens, Up shortens, and Down makes the panel taller. Window controls keep the overlay inside the current display's usable area. Drag it to another display to move between monitors.

**Settings → Window** lists each shortcut and shows whether registration succeeded. A shortcut reserved by macOS or another application may be unavailable; change the conflicting binding and restart Cue. These are ordinary OS-registered global shortcuts, not an undetectability feature: modifier events and system-level monitoring can still reveal key activity. Browser behavior must be tested on the actual system.

> On Windows, press **`Ctrl`** wherever **`⌘`** appears below. cue's own UI relabels the keys to match your OS.

- **`⌘` `↵` — What should I say?** Suggests what to say next from the conversation.
- **`⌘` `⇧` `↵` — Screenshot.** The do-the-smart-thing key. It uses your screen and rolling conversation memory; on a coding problem it solves it, and in a conversation it tells you what to say. Works from anywhere.
- **`⌘` `H` — Solve what's on screen.** Screenshots a coding problem and returns the approach, code, and time/space complexity.
- **The `▢` button** (top bar) — start/stop **listening** to a meeting. The green dot means it's live.
- **Type a question** in the box and press `↵` to ask about your screen or conversation.
- **Smart** — flip it on for a smarter, more thorough model; off for fast and cheap.
- **Hide** collapses the panel to just the top bar. Drag cue around by the **top pill**. Quit with `⌘` `⇧` `X` on macOS or `Ctrl` `Shift` `X` on Windows.

The panel is see-through and click-through — the empty space around it never blocks the app behind it.

---

## How it works (under the hood)

cue is an [Electron](https://www.electronjs.org/) app. Everything runs locally except the calls to your chosen AI provider.

**The three inputs are kept completely separate:**
- **Screen** — captured with Electron's `desktopCapturer` (full-resolution screenshots, taken only when a feature needs one).
- **Your mic ("You")** — `getUserMedia` → downsampled to 16 kHz audio → transcribed.
- **Meeting audio ("Them")** — `getDisplayMedia` loopback capture of your system's output audio, kept on its own channel so cue knows *who* said what. **Windows only** — Chromium doesn't implement loopback capture elsewhere, so on macOS this stream comes back video-only and the channel stays silent.

Both audio streams are transcribed by the independently selected speech provider (local whisper.cpp, Deepgram, OpenAI, or Gemini) and fed, with an optional screenshot, to your chat model. Responses **stream** into the panel word-by-word.

Long conversations use rolling memory instead of attaching an ever-growing raw transcript to every request. After 24 captured turns, Cue summarizes the older portion in the background and keeps the newest 10 turns verbatim. Live requests never wait for that maintenance call: they use the latest completed summary plus at most 24 recent turns, with a hard transcript ceiling of roughly 12,000 characters. Clearing the transcript also clears its rolling summary.

When Local transcription is selected, Cue runs one persistent `whisper-server` sidecar bound to `127.0.0.1` on a temporary port with a random request path. Voice activity detection creates bounded in-memory utterances with pre-roll, and both channels share a serialized inference queue because one Whisper context must not process concurrent requests. Stop immediately ends new audio capture, drains the current queue for a bounded period, then terminates the sidecar.

**The invisibility** is a single window flag — `setContentProtection(true)` — which the OS enforces:

- **macOS:** sets `NSWindowSharingNone`, asking the window server to exclude cue from capture streams. On macOS 15.4+ Apple lets some capture tools ignore it, which is why it's best-effort (see the disclaimer at the top).
- **Windows:** sets `WDA_EXCLUDEFROMCAPTURE` via `SetWindowDisplayAffinity`, and the compositor drops the window from every capture path. Windows 10 builds before 2004 fall back to `WDA_MONITOR`, which renders a black box rather than truly excluding.

It's the same mechanism DRM apps and Zoom's own toolbar use. It is **not** a GPU trick or a special overlay layer. Set `CUE_NO_PROTECT=1` to disable it while debugging.

```
main process ──┬─ overlay window (frameless, transparent, always-on-top, content-protected)
               ├─ screenshot capture (desktopCapturer)
               ├─ speech-to-text (Whisper / Gemini)      ── "You" + "Them" channels
               └─ LLM streaming (OpenAI / Anthropic / Gemini / Custom)
renderer ──────┴─ the glass UI + mic capture + system-audio loopback
```

---

## Troubleshooting

**Local transcription says the runtime is not prepared.**
Packaged releases include the runtime. If you are running from source, run `npm run prepare:whisper` once and restart Cue. On macOS, install CMake and Xcode command-line tools first.

**Local transcription says the model is missing or invalid.**
Open **Settings → Audio**, select the model, and choose **Download**. A cancelled download can be resumed. If verification fails repeatedly, delete the partial/model file from the same screen and download it again.

**A large local model is slow or runs out of memory.**
Try `base.en`, `tiny.en`, or a quantized `q5`/`q8` model. Model size in Settings is the download size, not a guarantee of runtime RAM use; larger models require substantially more memory and CPU/GPU time.

**"It says give access, but I already gave access."**
If the switch is already enabled, use **Restart Cue** on the permission screen to fully relaunch the process. An ad hoc rebuild can also leave the switch attached to an older code signature. Refresh Cue's entry once for the new build and accept any macOS confirmation. Use `npm run install:mac` for subsequent local updates so the signing identity stays stable. macOS remains in control of consent; this does not make access irrevocable.

**"What should I say?", "Follow-up questions", or "Recap" never hear the other person (macOS).**
Expected — meeting audio is Windows-only (see [Platform support](#platform-support)). Your own mic still transcribes, so those features see the *You* side of the conversation but never the *Them* side.

**cue has no dock or taskbar icon — how do I quit it?**
That's deliberate; it stays out of your way. Press **`Ctrl` `Shift` `X`** (**`⌘` `⇧` `X`** on macOS). If the shortcut didn't register because another app claimed it, end the **cue** (or **electron**) process in Task Manager / Activity Monitor.

**`npm start` crashes with `Cannot read properties of undefined (reading 'getPath')`.**
Something in your environment set **`ELECTRON_RUN_AS_NODE=1`** — some editors and terminals do, notably VS Code's integrated terminal. That makes Electron boot as plain Node, so `require('electron')` returns a path string instead of the real module. Clear it and relaunch: `unset ELECTRON_RUN_AS_NODE` (PowerShell: `Remove-Item Env:\ELECTRON_RUN_AS_NODE`).

**A feature returns "403" / "no access to model."**
Your API key is restricted. Most often it's an OpenAI **project key that only allows chat models** — it works for screen/coding help but 403s on transcription (Whisper). Fix: enable audio/Whisper on the key, use an unrestricted key, or add a Gemini key (cue falls back to it for transcription).

**Listening does nothing / no transcript.**
Check Settings shows a transcription-capable key (OpenAI with Whisper, or Gemini). On macOS, also make sure Screen Recording is granted (meeting audio needs it). On Windows, make sure **Let desktop apps access your microphone** is on — the top-level Microphone toggle alone isn't enough.

**A Custom provider request cannot connect.**
Confirm the Base URL includes the endpoint's `/v1` path when required, the selected model ID exists on that endpoint, and the local gateway is running. Custom provider credentials are intentionally not reused for speech-to-text.

**cue shows up in my Zoom share.**
Set Zoom's **Screen capture mode** to *"Advanced capture with window filtering"* (see Step 3). And remember: on macOS 15.4+ this can still fail — it's best-effort.

**"cue is damaged and can't be opened."**
Run `xattr -cr /Applications/cue.app` in Terminal once (see Install → Option A).

---

## Privacy

- No Cue accounts, hosted service, or telemetry. cue collects nothing.
- Your API keys live in a local file (`cue-data.json`) and are sent only to the provider you chose.
- When Custom is selected, its API key and LLM request data are sent to the Base URL you configured.
- Your optional résumé text also lives in `cue-data.json` and is sent with each model request to your selected AI provider. It is stored as plain text; clear it in Settings to remove it.
- In Local transcription mode, microphone and meeting audio stay on your computer. In cloud transcription modes, audio is sent only to the selected speech provider.
- Audio utterances and the current transcript stay in memory; Cue does not write captured audio to disk. Downloaded local model files remain on disk until you delete them.
- Screenshots are sent to your selected chat provider only when a feature needs the screen.

## Contributing

Issues and PRs welcome. cue is intentionally small and readable — `main.js` (app + capture + AI), `renderer/` (the UI), `src/` (providers). No build step for the source (plain HTML/CSS/JS).

## Credits & license

Built as an open-source study of how tools like **Cluely** and **Interview Coder** work. Modeled on the open-source clones `pickle-com/glass` and `sohzm/cheating-daddy`.

Local transcription uses [whisper.cpp](https://github.com/ggml-org/whisper.cpp), distributed under the MIT License. Its license notice is included in packaged runtimes.

**License: [GPL-3.0-or-later](LICENSE).**

### Resumes and transcription

Choose a resume in the overlay's **Resume** dropdown. Settings → Profile imports multiple PDF, DOCX, Markdown, or text resumes and supporting references. Cue includes the full selected resume and all supporting references in personal-assistance prompts; it does not combine unselected resume variants. Personal documents stay in your local application settings.

Use **Transcribe** to start audio transcription and **Pause** to stop. OpenAI transcription defaults to `gpt-4o-mini-transcribe`; replies use GPT Sol in Fast mode by default. Both require your OpenAI API key. Smart mode enables additional reasoning.

For a source-only local update when disk space is limited, `npm run install:mac -- --resources-only` reuses the verified installed runtime and refuses changes to production dependencies. Use the full installer for dependency updates.
