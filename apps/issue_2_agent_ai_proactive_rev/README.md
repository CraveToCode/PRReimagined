# Agent AI Proactive Review Co-Pilot

This is a modern, self-contained React application designed to assist human code reviewers by providing active agent intelligence. It addresses the limitation of static diff viewers by introducing **Agent Intent Annotations** and **Ambient Blindspot Alerts**.

## Key Features

1. **"What the LLM Thinks It Did" Banners**:
   - Collapsible 2-line AI commentary for each major diff block.
   - Explains **Intent** (e.g., "Created useSession hook to satisfy AC-2") and **Assumptions** (e.g., "Assumed localStorage token is validated by server on 401").
   - Allows reviewers to **Agree / Flag as Bug / Dismiss** each annotation.

2. **Blindspot & Regression Detector (Active Nudges)**:
   - Ambient AI inspector highlighting discrepancies between the JIRA spec and the actual diff.
   - Flags potential gaps (e.g., "⚠️ JIRA AC-3 requires handling offline network drops, but no offline error handler was detected").
   - Interactive feedback loop to track addressed alerts.

3. **Interactive Dashboard**:
   - Real-time **PR Health Score** calculation based on reviewer feedback.
   - Ability to switch between multiple mock PRs.
   - Exportable JSON review reports.

## Running Locally

1. Navigate to the application directory:
   ```bash
   cd apps/issue_2_agent_ai_proactive_rev/
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to the URL provided by Vite (usually `http://localhost:5173`).
