# PR Quest: Gamified Hierarchical Code Reviewer for Agentic PRs

PR Quest is a local-first, gamified code review web application designed to transform reviewing agentic PRs into an interactive, level-based mission.

## Features
- **Gamified Level-Based Review Progression**: Split into 4 structured levels with XP, badges, and progress milestones.
- **Spec-Filtered Sliced Diffs**: Filter diff chunks directly by JIRA acceptance criteria.
- **Hierarchical 3-Panel Review Workspace**:
  - **Left Panel**: Mission Control & Spec Navigator.
  - **Center Panel**: Hierarchical Diff Viewer sorted by architectural importance.
  - **Right Panel**: Blast Radius & Reference Graph.
- **Architecture & Spec Ingestion**: Upload or paste `ARCHITECTURE.md` to correlate diffs with architectural layers.
- **Local-First & Demo-Ready**: Persists comments, checklist status, and XP in browser `localStorage`.

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
1. Navigate to the project directory:
   ```bash
   cd apps/web_app_pr_quest_gamified_hier
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser to the local URL provided by Vite (usually `http://localhost:5173`).