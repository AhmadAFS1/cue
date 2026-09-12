# Cue desktop progress

This is the working handoff and progress log. Read it before resuming changes and update it after each meaningful change, test, or blocker. Do not store API keys, screenshots containing unrelated private data, or credentials here.

## Requested outcome

- Install AhmadAFS1/cue on this Mac and validate it.
- Fix the overlay's expansion/resizing behavior.
- Add global keyboard controls for moving, resizing, expanding/restoring, and centering the overlay.
- Check what a foreground browser keyboard detector receives. OS-level invisibility cannot be guaranteed: macOS handles global shortcuts and system monitors may observe them.
- Keep this document current while making changes.
- Keep permissions persistent across local updates using a stable signing identity, while preserving the user's ability to revoke them in macOS Settings.
- Latest additions before committing everything: visible transcription play/pause using OpenAI, GPT-5.6 Sol replies in the cheaper fast configuration, and a selectable resume library with full selected-resume context. User identified a folder named “Resumes 2026”; locating it.

## Current state

- Primary action swap is installed and its labels verified in the running app: **What should I say? = Command+Return; Screenshot = Command+Shift+Return** (Control replaces Command on Windows). All 145 tests passed. Full packaging hit low disk space, so the final source was installed with a cloned, signature-verified existing runtime, unchanged production dependencies, and the saved Apple certificate. More user-requested work was added before commit; all source changes still need committing and pushing `codex/window-controls`. GitHub CLI is not logged in; Git has the macOS credential helper, so attempt the authorized push before assuming authentication is blocked.

- Repository: `/Users/ahmadsmacair/Documents/ChatGPT/cue`.
- Branch: `codex/window-controls`, based on upstream commit `30499c0bea8fd5277b9e07b7b7b51ca4860c58e9`.
- App: `/Applications/cue.app`; Desktop shortcut: `/Users/ahmadsmacair/Desktop/cue.app`.
- Cue 0.2.2 / Electron 33.2.1, built for Apple silicon and now signed with the existing valid Apple Development certificate on this Mac. `npm run install:mac` completed successfully.
- Window controls and permission UX fixes are installed. Cue is open on its main overlay. Native Expand/Restore and saved state across an update are verified; physical shortcuts and corner dragging have not yet been confirmed.
- After the user re-added the exact installed app, Cue successfully reopened to its main overlay, establishing that its startup checks recognize both required permissions. A subsequent full `npm run install:mac` preserved both permissions without another prompt and restored expanded-window state. Restore then returned exactly to x=619, y=128, 700 × 600. Evidence: `/tmp/cue-stable-update-validation.log` and `.cache/window-update-validation.json`.
- `AGENTS.md` directs future work to read and update this log and use the stable local installer.
- Permission cause confirmed by macOS TCC logs: “Failed to match existing code requirement for subject com.cue.overlay and service kTCCServiceScreenCapture.” The locally signed rebuild changes the code hash, while the visible enabled entry retains the previous hash. A refreshed grant plus full restart worked for the first window-controls build; the final permission-UX build needs its own refresh.
- Source changes committed and pushed on `codex/window-controls` (implementation commit `d726580`).

## Completed installation and baseline validation

- Installed dependencies with `npm ci`; original 135 tests passed.
- Built and installed the application; code signature verification passed.
- Built the bundled whisper-server from official whisper.cpp v1.9.1 commit `f049fff95a089aa9969deb009cdd4892b3e74916` because the repository's generated archive checksum was stale.
- Imported the checksum-verified base.en model. Packaged local transcription successfully transcribed the upstream JFK sample twice and shut down cleanly.
- User configured the AI provider and personally enabled microphone and screen access. Never print the saved API key.
- A live AI request returned the expected “Cue is working.” response before the window-controls rebuild.
- Hide/restore worked. Live meeting audio capture has not been validated.
- Initial installation notes: `dist/INSTALLATION.md`; local transcription evidence: `.cache/local-transcription-validation.json`.

## Window controls implemented

- `src/window-controls.js`: bounded display geometry, persistent position/size, minimum 500 × 480, 40-pixel movement/resizing, expand/restore, center, pointer resizing.
- `src/window-shortcuts.js`: ten global registrations with visible conflict reporting.
- `main.js` and `preload.js`: native window controls and renderer IPC.
- Renderer: Expand/Restore toolbar button, corner resize grip, flexible layout, Settings → Window controls and shortcut status, and restored panel visibility when expanding.
- Saved window geometry is protected from stale settings form values.
- README documents shortcuts and practical limits.

| Action | macOS shortcut |
| --- | --- |
| Move | Command + Option + arrow |
| Resize | Command + Option + Shift + arrow |
| Expand / restore | Command + Option + Return |
| Center | Command + Option + C |

## Validation so far

- 145 automated tests passed, including ten new geometry/restore/resize/registration tests; log: `/tmp/cue-window-tests.log`.
- `git diff --check` passed.
- Build succeeded; log: `/tmp/cue-window-build.log`.
- Browser renderer preview validated at 700 × 600, 1100 × 765, and 500 × 480 with no renderer errors or horizontal overflow. Minimum height was raised to 480 after a smaller layout hid too much content.
- Preview and keyboard detector are local test fixtures under `.cache/ui-validation`, served at `http://127.0.0.1:8876/`.
- Native Expand/Restore round-trip passed, including exact original position and size. Native shortcut key events, corner drag, persistence after relaunch, and detector behavior still need live validation. Browser preview is not evidence that native global shortcuts work.

## Permission investigation

- After replacing the locally signed app, Cue's gate reports microphone granted and screen access unavailable, while System Settings shows Cue enabled.
- Restarting and refreshing the Cue entry did not establish a fix. The latest user screenshot again confirms the enabled switch.
- Inspecting the code found a screen-access check with a capture fallback, a permissions gate that blocks the entire app, and duplicated `window-all-closed` handlers. The Continue flow closes the permission window before creating the main window, which can cause an unintended quit.
- Full process termination followed by LaunchServices relaunch cleared the gate. No further macOS permission toggles were needed. Validate capture behavior separately before calling screen capture fully verified.
- Added Restart Cue to the permission screen, changed the screen status to “Not available to Cue yet,” and re-check on focus. These respect the existing macOS grant and do not bypass consent.
- Corrected Continue to create the overlay before closing the gate; removed duplicate lifecycle handlers and guarded against duplicate launches and activation during initial permission checks. Final source tests: 145 passed. Packaged app signature verification passed.
- Native Expand button expanded 700 × 600 to 1100 × 736 and Restore returned the exact original position and size. Settings → Window shows all ten shortcuts active. Automated native key events do not reliably invoke OS global shortcuts; physical-key confirmation has been requested.
- Found an existing valid Apple Development signing identity in the user's login keychain. Signing succeeded without exporting private keys or creating trust exceptions. The resulting designated requirement uses the app identifier and Apple certificate identity, rather than the changing code hash.
- Added `npm run install:mac`: packages the app, includes local Whisper, signs with the saved identity, verifies continuity against the previous designated requirement, backs up/replaces the installed app, and relaunches. Signing metadata (no private key) is stored in `~/Library/Application Support/cue/local-signing.json`. It refuses to fall back to ad hoc signing.
- Low disk space interrupted the first full-copy install. Restored from the verified staged app and changed both backup and installation staging to APFS clones. Re-ran the full installer successfully; it verifies the staged and installed signatures. Removed the redundant, agent-created first backup; current rollback copy is `.cache/cue-before-install.app`. No unrelated user files were removed.
- Refreshed Cue's existing screen-recording and microphone toggles for the certificate-signed app and clicked macOS Quit & Reopen. TCC still showed the previous microphone requirement and issued a fresh microphone confirmation. Cue is awaiting that confirmation before creating its main window.
- Computer-use access to `com.apple.UserNotificationCenter` was explicitly blocked by the tool. Do not try another automation route into that system permission dialog. Asked the user to click Allow once; awaiting response. This is an OS consent click, not an API key or application-password request.
- User suggested explicitly removing and re-adding the installed build through the plus button. Removed only Cue's Screen & System Audio Recording entry and opened Add → Applications. Automated selection was unreliable; user completed selecting `/Applications/cue.app` and clicking Open. Confirmed Cue is back in the list with its switch on. Relaunching to verify app recognition.
- Controlled signing test passed: cloned the installed app, changed a resource, re-signed with the same certificate, and verified the modified build against the previously saved designated requirement. Content hash changed while identity verification still passed. Evidence: `.cache/identity-validation.json`. This verifies identity continuity; it does not substitute for confirming macOS grants in the running app.
- The identity test exposed a `codesign -R` argument syntax issue in the installer; corrected it to `-R=<requirement>` and verified the corrected invocation against the modified clone.

## Remaining work

1. No permission action is pending. Stable signing, actual update continuity, and native Expand/Restore persistence passed.
2. Physical global-shortcut, corner-drag, and browser-detector behavior remain unconfirmed: automated per-app key injection did not reliably reach macOS's global shortcut handler, and content protection prevented native visual pointer testing. All ten shortcuts registered successfully; report this limitation accurately.
3. Source tests are currently 145/145 passing; installed signature and bundled Whisper are verified. Re-run checks only if code changes again.

## Build notes for resuming

- Normal local build/install: `npm run install:mac`. It signs with the saved stable certificate and verifies the previous designated requirement before replacement. Use this for future updates.
- Raw staging-only build: `npm run pack -- --mac --arm64`. Do not directly install its unsigned output.
- Copy `.cache/whisper-runtime/darwin-arm64` into the packaged app's `Contents/Resources/whisper-runtime` before signing; the existing opt-in afterPack hook uses an incorrect macOS path.
- Sign using `build-resources/entitlements.mac.plist`, then verify with `codesign --verify --deep --strict`.
- Previous installed build backup: `.cache/cue-before-install.app` (APFS clone).
- User settings are in `~/Library/Application Support/cue/cue-data.json`; read only narrowly selected non-secret fields when diagnosing.

## Resume library, supporting references, and OpenAI transcription

- Swapped Say to Command+Return and Screenshot to Command+Shift+Return; labels and shortcut tests updated.
- Added a persistent resume library with a main-window dropdown, full selected-resume context, multi-document import, and editable selected resume. Imported 15 portfolio variants into local user settings; selected Master Career Resume.
- Saved the user's complete pasted architecture as `JPMorgan Chase Entitlements Chatbot.md` in the local resume portfolio and uploaded a copy to the existing Drive portfolio. Fetched the exact full `Ahmad Sarwar Cover Letter` from Drive, saved a readable local Markdown copy, and copied the original Google Doc into the Drive portfolio.
- Both supporting references are stored locally in Cue settings and included in full alongside the selected resume. Source documents are treated as reference data; proposed architecture and fictional examples must not become claims of completed personal experience. No personal documents or credentials are added to Git.
- Added visible Transcribe/Pause control. Defaults: OpenAI gpt-4o-mini-transcribe for audio and gpt-5.6-sol Fast for replies. OpenAI realtime disconnect cancels pending reconnect and ignores late transcript events.
- 148 automated tests passed, including full-context tail preservation, resume migration/selection, and reconnect cancellation.
- Disk space is ~195 MB. Added explicit `npm run install:mac -- --resources-only` mode: verifies installed signature, checks unchanged production dependencies, APFS clones installed runtime, copies app source, signs with the same identity, and uses normal verified replacement. Running this installation now.
- Live OpenAI validation passed: mini-transcribe transcribed the official Whisper sample, and the realtime endpoint accepted its session configuration; explicit disconnect completed.
- Installed update retained stable signing and opened normally with Master Career Resume, two references, Sol Fast, and the swapped shortcuts visible.
- Native button validation found system-audio permission selection could hold the button disabled. Changed system-audio startup to run independently and added generation checks to discard streams arriving after Pause. Microphone transcription and Pause no longer wait on that picker. Tests remain 148/148 passing.

- Final installed-app validation passed: Transcribe changed to Pause with STREAMING status; Pause returned to Transcribe and OFF. Left transcription paused. Live meeting-audio content and physical global-key detector behavior remain unverified.
- All source changes pushed successfully to `origin/codex/window-controls`. Personal resume/reference files and API credentials remain outside Git.

## Spoken-answer format

- Updated the answer-generating modes (Screenshot, What should I say?, Ask, and Answer This) to produce a **Say this** section first: an informal first-person answer of 2–3 sentences that can be read verbatim. A **Details** section follows with concise non-repetitive bullets.
- Follow-up Questions, Recap, and LeetCode retain their specialized formats. Automated tests: 149/149 pass.

## Speaker roles, response detail, and movement controls

- Transcript presentation and all prompt builders now use explicit `Interviewer` and `You` labels. The existing source routing remains automatic: system/desktop PCM is the interviewer channel and microphone PCM is the candidate channel.
- Answer prompts now request a 3–5 sentence spoken response followed by 6–10 substantive detail bullets covering mechanics, reasoning, examples, and tradeoffs. Follow-up and recap prompts also request more specific detail.
- Added a focused-window keyboard fallback for Command/Control + Option/Alt movement, resize, center, and expand shortcuts while preserving the global shortcut registrations for use over other applications.
- Added a compact bottom movement strip that displays the modifier chord and provides accessible, clickable 40-pixel arrow controls.
- Source validation passed: 151/151 tests, JavaScript syntax checks, and `git diff --check`.
- Restored the certificate-signed runtime after an earlier ad-hoc local replacement and installed this update with `npm run install:mac -- --resources-only`. Signature continuity verification passed and Cue relaunched. Native physical-key validation over another foreground app remains distinct from automated key-mapping coverage.
- Per the user's simplified macOS binding request, all window controls now use Control + Option rather than Command + Option. Movement is exactly Control + Option + Arrow; the bottom strip displays `⌃⌥` without a plus sign. The focused-key tests and full suite pass (151/151), the stable-signing resource install completed, the installed sources were verified, and Cue was relaunched successfully. Installed-app validation confirmed the footer and Control/Option tooltip are visible; an automated focused `Control+Option+Left` moved the saved x-position from 530 to 490 (one 40-pixel step). This validates the focused fallback, not a physical global keypress over another foreground app.

## Rolling transcript memory and timeout protection

- Replaced unbounded full-transcript prompt injection with rolling conversation memory. After 24 captured turns, Cue asynchronously merges the older 14 turns into a compact summary and retains the newest 10 turns verbatim; later compactions fold the prior summary forward.
- Every live request is independently bounded to the latest completed summary (maximum 6,000 characters) plus at most 24 unsummarized recent turns and roughly 12,000 transcript characters. The answer path never waits for background summarization, so summary-provider latency cannot freeze the live request.
- Background summary calls have a 20-second maintenance timeout, use a 700-token response ceiling, preserve `Interviewer`/`You` roles, and treat transcript content as untrusted reference data. Failure leaves the live prompt capped and is retried on a later turn/request without logging transcript content.
- Clearing the transcript resets the rolling summary, sequence tracking, and invalidates any in-flight summary result. Automated coverage includes the compaction threshold, retained tail, sequence filtering, speaker roles, summary prompt safety, and strict character ceiling. Source validation passes: 157/157 tests, JavaScript syntax checks, and `git diff --check`.
- Installed the rolling-memory build with `npm run install:mac -- --resources-only`; stable Apple Development signature verification passed and the installed app contains `src/conversation-memory.js`. The automation shell exports `ELECTRON_RUN_AS_NODE=1`, which made its first relaunch checks exit as a Node process; relaunching with that automation-only variable removed started the installed bundle normally. Cue main and helper processes are running from `/Applications/cue.app`.

## Commit handoff

- Prepared all current source, test, and documentation changes for the user's requested commit and push on `codex/window-controls`. Revalidated 157/157 automated tests, changed JavaScript syntax, and diff whitespace; the changed-file credential-pattern scan found no matches.
- The subsequent API-latency investigation was analysis-only; additional latency optimizations have not been implemented in this changeset.
## Transcript bubbles

- Live transcript bubbles now close after a 1.8-second pause. A later utterance from the same speaker starts a new bubble; switching speakers always closes the prior speaker's bubble.
- A transcript bubble is also capped at 720 characters, so continuous receiver speech stays scannable even when endpointing produces several nearby final chunks. OpenAI realtime transcription now waits 1.2 seconds of silence before finalizing a turn, reducing sentence-fragment bubbles.
- Automated tests: 150/150 pass. Installed the signed update with `npm run install:mac -- --resources-only`; Cue reopened normally. Live audio is not injected for a transcript visual check, so the pause behavior is validated by the renderer logic and STT configuration rather than a fabricated conversation.

## Docked conversation history

- Moved Conversation History inside the panel's two-column layout. On ordinary window sizes it is docked beside the assistant response; below 620px it stacks beneath it. It no longer uses a fixed overlay or shifts the response panel underneath itself.
- Added layout regression tests; 152/152 tests pass. Installed the signed update and confirmed Conversation History appears as a docked panel while the response controls remain visible.

## Transcript source labels

- Fixed a shared-interim-row bug that could show system-audio text under the microphone label. The transcript now maintains independent live rows for both sources and labels finalized bubbles as **Me · microphone** and **Other person · system audio**.
- The labels identify capture source, not voice-print diarization: if a call routes the user's own audio back through the system-audio device, that echoed copy is still correctly marked as system audio. Tests: 153/153 pass.

## Factual technical interview answers

- Answer-generating modes now answer technical, conceptual, and factual interview questions from general knowledge even without resume context. They must not say “I do not know” simply because the candidate's materials do not cover the topic, while still not inventing personal experience.
- Validated with the configured GPT Sol Fast model using “What is the difference between JDK and JRE?”; it returned a direct JDK/JRE explanation. Tests: 154/154 pass. The stable signed build is installed and changes are pushed in commit `53f24b6`.

- Push preparation found three newer remote commits. Merge resolution preserves their docked history, pause-delimited bubbles, independent audio-source interim rows, and factual-answer instructions alongside local rolling memory, detailed output, and movement controls. Current viewer labels retain the requested `Interviewer`/`You` roles with explicit system-audio/microphone suffixes. This merge is source-only; the installed app has not been updated during the Git handoff.
- Combined-source validation passes: 162/162 automated tests, merge-resolved JavaScript syntax checks, and `git diff --check`.
