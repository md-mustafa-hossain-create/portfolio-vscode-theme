# Full-Stack Persistent Backend & Cloud Sync for MUSTAFA.dev VS Code Portfolio

Upgrade the `MUSTAFA.dev` Visual Studio Code portfolio workbench with a complete, zero-setup Node/Express persistent backend and live Server-Sent Events (SSE) synchronization for contact messages, inbox viewing, guestbook endorsements, project stars & visitor counters, custom Explorer files/folders, and VS Code Settings Sync.

## User Review & Critical Decisions

> [!IMPORTANT]
> All backend architecture and persistence choices below reflect your confirmed preferences from the clarification step and require zero external API keys or third-party cloud provisioning.

- **Confirmed Decision 1 (Storage Engine)**: Built-in Node Express server + persistent local disk store (`.data/portfolio-cloud-store.json` with atomic write-through and automatic initialization) running on port 3000 alongside the Vite application.
- **Confirmed Decision 2 (Persisted Features)**:
  1. **Contact Form Messages & Guestbook Endorsements**: Validated, timestamped, and broadcast in real time to all connected clients.
  2. **Project Star Ratings & Visitor Counters**: Persistent per-project star counts (`StreamPulse`, `DevDock`, `GeoLearn`) plus total portfolio visitor/session telemetry.
  3. **Explorer Custom Files, Folders & VS Code Settings Sync**: User-created files (`New File...`), custom folders (`New Folder...`), custom file edits, and workbench `settings.json` preferences (`theme`, `fontSize`, `minimapEnabled`, `wordWrap`, `lineNumbers`, `autoSave`) persisted on the backend and restored across sessions.
- **Confirmed Decision 3 (Inbox Access)**: Incoming contact messages are accessible directly inside the VS Code workbench via:
  - A live `messages-inbox.json` file in the Explorer (`config/messages-inbox.json`) that renders an interactive Inbox & Message Inspector view in the editor.
  - A built-in `inbox` / `messages` command in the Integrated Terminal (`Ctrl+\``) to list, inspect, or mark incoming contact inquiries as read.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms the VS Code portfolio into a full-stack persistent application where every visitor interaction—sending a contact message, signing the developer guestbook, starring a project, creating/editing custom files or folders in the Explorer, or changing VS Code workbench settings—is saved to the server and synchronized in real time across tabs.
- **Target Audience / Persona**: Recruiters, engineering managers, and fellow developers visiting MD Mustafa Hossain's portfolio (`MUSTAFA.dev`), as well as Mustafa himself inspecting incoming inquiries via the Explorer or Integrated Terminal.
- **Key Value**: Zero-configuration reliability with authentic IDE ergonomics—visitors experience a genuinely stateful developer environment, and Mustafa can read and manage contact submissions directly from the Explorer tree or Terminal CLI.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Contact Dispatch & Live Inbox Inspection**: When a visitor submits a message on `contact.tsx` or via `contact --send` in the Terminal, the backend validates and stores the inquiry, increments the unread badge, broadcasts an SSE event, and updates `config/messages-inbox.json` in the Explorer and the `inbox` Terminal command output.
  2. **Explorer File/Folder Persistence**: Creating a file (`New File...`), editing its code buffer in the editor, or creating a folder (`New Folder...`) automatically syncs to the Express backend (`PUT /api/workspace/files` and `POST /api/workspace/folders`) so custom workspace artifacts persist across page reloads.
  3. **VS Code Settings Sync**: Updating preferences in the graphical Settings UI (`Ctrl+,` or `config/settings.json`) persists to `PUT /api/settings` and logs the cloud sync revision in the Status Bar and Output panel.
  4. **Project Endorsements & Visitor Telemetry**: Starring `StreamPulse`, `DevDock`, or `GeoLearn` or visiting the portfolio increments persistent counters on the backend and updates all open sessions via SSE.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Authentic Visual Studio Code Dark Modern (`#181818` chrome, `#1F1F1F` editor canvas, `#252526` floating widgets, `#0078D4` focus borders) and Light Modern dual-theme support.
  - *Typography & Hierarchy*: Clean UI sans-serif for workbench chrome and editorial cards paired with monospace (`JetBrains Mono` / `Fira Code`) with `tabular-nums` for line numbers, timestamps, and metrics.
  - *Interactive Feedback*: Status bar sync spinner (`sync~spin` Codicon), toast notifications in the bottom-right notification center, and real-time Output channel logs.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Atomic JSON Disk Store with Real-Time SSE Broadcast**
  - *Chosen Approach*: Express REST endpoints paired with an atomic file store (`.data/portfolio-cloud-store.json`) and a live `/api/stream` Server-Sent Events channel.
  - *Why*: Requires zero external credentials, survives server restarts, works out-of-the-box in both development and production builds, and pushes instant delta updates to connected clients.
- **Decision 2: Dual Workbench Inbox (Explorer File + Terminal CLI)**
  - *Chosen Approach*: Expose stored contact messages both as a clickable `messages-inbox.json` file inside the Explorer's `config/` folder and via the `inbox` command in the Integrated Terminal.
  - *Why*: Fits naturally into the VS Code mental model—users can inspect inquiries visually in the editor or query them from the command line.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   VS Code Portfolio Workbench (React SPA)                  │
├──────────────────────┬───────────────────────────┬─────────────────────────┤
│   Activity & Side    │   Multi-Mode Editor       │   Integrated Terminal   │
│   Bar (Explorer)     │   Groups (Hybrid/Split)   │   & Output Panel        │
│  ┌────────────────┐  │  ┌─────────────────────┐  │  ┌───────────────────┐  │
│  │ src/pages/*    │  │  │ Contact & Guestbook │  │  │ `inbox` CLI cmd   │  │
│  │ Custom Files   │  │  │ Messages Inbox View │  │  │ `contact` CLI cmd │  │
│  │ Custom Folders │  │  │ Project Case Studies│  │  │ `sync` CLI cmd    │  │
│  │ messages-inbox │  │  │ Settings UI Editor  │  │  │ Live SSE Logs     │  │
│  └───────┬────────┘  └──┴──────────┬──────────┘  └──┴─────────┬─────────┘  │
└──────────┼─────────────────────────┼──────────────────────────┼────────────┘
           │ REST Mutations          │ Fetch / Sync             │ SSE Stream
           ▼                         ▼                          ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                     Express Backend Server (:3000)                         │
│  • GET  /api/portfolio         (Full state: stars, guestbook, files, etc.) │
│  • GET  /api/stream            (Live SSE broadcast to connected clients)   │
│  • POST /api/messages          (Validate & save contact inquiry)           │
│  • GET  /api/messages          (Retrieve contact inquiries for Inbox)      │
│  • DELETE /api/messages/:id    (Delete / archive an inquiry)               │
│  • POST /api/guestbook         (Save developer guestbook endorsement)      │
│  • POST /api/projects/:id/star (Increment persistent project star count)   │
│  • PUT  /api/workspace         (Persist custom files, folders & settings)  │
│  • POST /api/sync              (Manual cloud sync & visitor counter)       │
├────────────────────────────────────────────────────────────────────────────┤
│               Persistent Local Store (.data/portfolio-cloud-store.json)    │
└────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State

- **`CloudStoreData`**:
  - `projectStars`: `Record<string, number>` — star counts per project ID.
  - `visitorCount`: `number` — total portfolio sessions/visits tracked.
  - `messages`: `ContactMessage[]` — `{ id, name, email, message, createdAt, source, read }`.
  - `guestbook`: `GuestbookEntry[]` — `{ id, author, role, comment, createdAt }`.
  - `customFiles`: `Record<string, string>` — user-created Explorer file names mapped to their source code content.
  - `customFolders`: `string[]` — user-created Explorer folder paths under `src/`.
  - `settings`: `Partial<WorkbenchSettings>` — persisted VS Code workbench settings.
  - `syncCount`, `lastSyncedAt`, `totalCommandsExecuted`: cloud sync revision metadata.

### Interactive Component & State Mapping

- **Explorer (`src/App.tsx`)**:
  - Creating/deleting custom files or folders dispatches `PUT /api/workspace` to persist the updated tree on the backend.
  - Clicking `config/messages-inbox.json` opens the interactive Inbox view showing all stored `ContactMessage` items with search, read/unread toggle, and delete actions.
- **Editor Views (`src/components/WorkspaceViews.tsx`)**:
  - Renders the `messages-inbox.json` graphical + JSON inspector when `activeFile === 'messages-inbox.json'`, allowing one-click reply (`mailto:`), mark-as-read, or deletion synced with `/api/messages`.
- **Terminal Panel (`src/components/TerminalPanel.tsx`)**:
  - Adds the `inbox` (and `messages`) CLI command to display all persisted contact messages in a formatted table directly inside the VS Code terminal, plus `inbox clear` / `contact <name> | <email> | <msg>` support.
