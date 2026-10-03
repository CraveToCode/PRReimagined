# Issue 3: [Blast Radius] Actionable Dependency Verification Quests

This web application transforms the traditional passive Blast Radius file list into interactive dependency verification quests with side-by-side call-site diff previews, risk analysis, and actionable checkboxes (+50 XP per verified interface contract).

## Features

1. **Modified Source Files & Downstream Consumers**: Left panel listing modified source files and their respective impact count.
2. **Side-by-Side Call-site Diffs**: Inspect exact original call-sites versus expected updated code states in clean diff panels.
3. **Impact Severity Badges**: Clear badges for *Breaking Change Risk*, *Type Only*, and *Untouched Consumer*.
4. **Actionable Verification Quests**: Checkable verification sub-tasks that reward users with XP upon successful contract validation.
5. **Persistent Progress**: Local storage sync so your verified quests and XP level are saved across browser sessions.

## How to Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser at `http://localhost:3000`.
