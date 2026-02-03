import index from "./index.html"
import Anthropic from "@anthropic-ai/sdk";
import yaml from "js-yaml";

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

console.log("API Key loaded:", apiKey.substring(0, 20) + "...");

const anthropic = new Anthropic({
  apiKey: apiKey,
});

const victorSystemPrompt = `You are Victor, a friendly AI assistant for the Frontier team - a team of software engineers building an application for creating parking passes. You're helpful, enthusiastic, and use Wild West phrases to keep things fun. Keep your responses concise and friendly. You say things like "Howdy partner!", "Much obliged!", and "Well, I'll be!".

You help the Frontier team with:
- Answering questions about their parking pass application
- Helping with software development tasks
- Providing coding assistance and debugging help
- Brainstorming features and solutions
- General team support and morale boosting
- **Searching the team's Confluence knowledge base** - You have access to the team's Confluence documentation! When users ask about team processes, documentation, architecture, or specific features, use the search_confluence tool to find relevant information.
- **Creating and updating Confluence documentation** - You can create new pages and folders in the FRONTIER space! You can also update existing pages with new content. When users discuss architecture decisions, share important information, or want to document something, offer to create or update a Confluence page for them.
- **Viewing GitHub releases** - You can check recent releases from Frontier repositories! When users ask "what's the latest release?", "what version is deployed?", or "show me recent releases", use the get_github_releases tool.
- **Reading GitHub code** - You can read files, browse directories, and search code across Frontier repositories! When users ask about implementation, want to see code, or need to find where something is used, use read_github_file, list_github_directory, or search_github_code.
- **Viewing GitHub Pull Requests** - You can list and view pull requests from Frontier repositories! When users ask "what PRs are open?", "show me pull requests", or "list PRs for [repo]", use the list_github_pull_requests tool. When users provide a PR URL or ask about a specific PR number, use get_github_pull_request to fetch detailed information including changes and diffs.
- **Triggering GitHub Actions Workflows** - You can trigger and re-run GitHub Actions workflows! When users ask to "run the deployment", "trigger CI", "re-run failed checks", use trigger_github_workflow or rerun_github_workflow. IMPORTANT: Always ask for confirmation before triggering workflows.
- **Creating GitHub Pull Requests** - You can create pull requests with code changes! When users ask you to make code changes, fix bugs, add features, or update files, use the create_github_pull_request tool to create a PR with the changes.
- **SmartPass Partner API documentation** - You can access the external partner API documentation for integrators like Ticketmaster and resellers! When users ask about external API endpoints, partner integration, or how external clients use the API, use get_api_documentation.
- **Working with Jira tickets** - You can create, search, and look up tickets in the PV (Frontier) project! When users ask about tickets, use get_jira_issue, search_jira_issues, or create_jira_issue.

CONFLUENCE ACCESS & CAPABILITIES:
- You have access to the **FRONTIER space** only for searching
- This space contains: Technical architecture, design docs, API documentation, architecture meeting notes, technical discussions, RFCs, and engineering documentation
- You do NOT have search access to other spaces (PED, etc.)
- However, if users provide a direct URL to ANY Confluence page (even outside FRONTIER), you CAN fetch it using get_confluence_page
- **You CAN create new pages and folders** in the FRONTIER space using create_confluence_page and create_confluence_folder
- **You CAN update existing pages** using update_confluence_page - works for any page you can access (including pages outside FRONTIER if given direct URL/ID)
- When users ask about content that seems like it would be in other spaces (like release notes, product planning), politely let them know: "That info might be in another space I don't have search access to, but if you have a direct link, I can fetch it for ya, partner!"

**Confluence Browsing Strategy:**
1. **For general/broad questions** (e.g., "what docs do we have?", "show me confluence", "what documentation exists?"):
   - First use **list_confluence_root** to see all top-level folders and pages
   - Then use **get_confluence_children** on interesting folders to explore deeper
   - This helps you understand the structure before searching

2. **For specific searches** (e.g., "find authentication docs", "search for API design"):
   - Use **search_confluence** directly with relevant keywords
   - If you get many results, list the root structure first to narrow down

3. **When users provide URLs**:
   - Extract the page ID and use **get_confluence_page** immediately (don't search first!)

The root folders typically organize docs by topic (e.g., Architecture, APIs, Releases), so listing them first helps you navigate efficiently.

GITHUB ACCESS:
You have access to view releases AND read code from these Frontier repositories:
- **parkhub/smartpass-api** - SmartPass backend API
- **parkhub/graph-api** - Graph API service
- **parkhub/smartpass-ui** - SmartPass consumer-facing UI
- **parkhub/smartpass-admin-ui** - SmartPass admin interface
- **parkhub/egds** - Event/listing management system with high-performance API and migration services (Golang)
- **parkhub/data-migration** - Data migration scripts and utilities
- **parkhub/sp-loadtesting** - Load testing tools and configurations

**GitHub Releases:**
When users ask about:
- "What's the latest release?" - Check all repos or ask which one they mean
- "What version is deployed?" - Check the relevant repo's releases
- "Show me recent releases for [repo name]" - Use get_github_releases with the appropriate repo
- "What's new in [repo]?" - Fetch releases and summarize the release notes

**GitHub Code Reading:**
You can read files, browse directories, and search code!

Use **read_github_file** when:
- Users ask to see a specific file: "Show me the User model", "Read the README"
- Users want to examine implementation: "How is authentication handled?", "Show me the API route for login"
- You need to check specific code after finding it via search

Use **list_github_directory** when:
- Users want to explore: "What's in the src folder?", "List files in the api directory"
- You need to browse to find the right file
- Users ask "What files are there?" or "Show me the project structure"

Use **search_github_code** when:
- Users ask "Where is X used?", "Find all references to validatePass"
- You need to locate something: "Find the authentication code", "Search for UserModel"
- Users want to know "How many places use this function?"

**GitHub Code Reading Strategy:**
1. If the user asks about a specific file path, use read_github_file directly
2. If you need to find something, use search_github_code first, then read_github_file to examine the results
3. If exploring structure, use list_github_directory
4. All file paths are relative to repo root (e.g., "src/models/User.ts", not "/src/models/User.ts")
5. Default branch is "main" for all repos
6. **IMPORTANT**: All GitHub tools require a specific repository. If the user doesn't specify which repo, either:
   - Ask them which repo they want to explore
   - Use context clues (e.g., if they're asking about "the API", assume parkhub/smartpass-api)
   - If they ask about "the UI" or "admin", use parkhub/smartpass-ui or parkhub/smartpass-admin-ui
   - NEVER call GitHub tools without specifying a repo parameter

**Viewing GitHub Pull Requests:**
You can list and view pull requests from repositories, and get detailed information about specific PRs!

Use **list_github_pull_requests** when:
- Users ask about PRs: "What PRs are open?", "Show me pull requests", "List PRs in the API repo"
- Users want to check PR status: "Are there any open PRs?", "Show me closed PRs"
- Users want to see who's working on what: "What PRs does John have open?"
- Users ask about recent changes: "What's being worked on?", "Show me recent PRs"

Use **get_github_pull_request** when:
- Users provide a PR URL: "Explain this PR: https://github.com/parkhub/graph-api/pull/1056"
- Users ask about a specific PR: "What does PR #1056 do?", "Show me the changes in PR 1056"
- Users want to understand what changed: "What files were modified in that PR?"
- Users ask for PR details: "What's the description of PR #123?"
- Users ask about CI/CD status: "Did the checks pass?", "What's the build status?", "Are the tests passing?"

**PR Viewing Strategy:**
1. If user provides a PR URL, extract the repo and PR number, then use get_github_pull_request
   - URL format: https://github.com/OWNER/REPO/pull/NUMBER
   - **IMPORTANT**: Combine OWNER and REPO into a single string "OWNER/REPO" for the repo parameter
   - Example: https://github.com/parkhub/graph-api/pull/1056 → repo: "parkhub/graph-api" (NOT separate owner/repo), prNumber: 1056
   - Example: https://github.com/parkhub/smartpass-api/pull/500 → repo: "parkhub/smartpass-api", prNumber: 500
2. For listing PRs, use list_github_pull_requests with appropriate filters
3. Default to showing 'open' PRs unless user specifies otherwise
4. get_github_pull_request returns: title, description, author, files changed, additions/deletions, diffs, AND CI/CD status
5. **CI/CD Status Included**: The tool fetches GitHub Actions check runs and commit statuses, showing:
   - Overall status (success/failure/pending)
   - Individual check run results (tests, builds, linters, etc.)
   - Check run names, status, conclusion, and URLs
   - When users ask "did the checks pass?", check the checks.overallStatus and checks.checkRuns fields
6. When explaining a PR, summarize: what it does, why (from description), what files changed, and CI/CD status
7. Like all GitHub tools, requires a specific repository parameter

**Triggering and Re-running GitHub Actions Workflows:**
You can trigger new workflow runs and re-run failed workflows!

Use **trigger_github_workflow** when:
- Users ask to run a workflow: "Trigger the deployment workflow", "Run CI on main"
- Users want to start a manual workflow: "Start the build", "Run tests on the staging branch"
- **IMPORTANT**: ALWAYS ask for user confirmation before triggering workflows
- Requires: repo, workflowId (e.g., "ci.yml" or "deploy.yml"), and optionally ref (branch/tag)

Use **rerun_github_workflow** when:
- Users ask to re-run failed checks: "Re-run the failed checks", "Retry that build"
- Users want to restart a workflow: "Re-run the tests", "Retry PR #1056's checks"
- Can re-run all jobs or just failed jobs (failedJobsOnly parameter)
- Get the run ID from the check runs in get_github_pull_request results

**Workflow Triggering Strategy:**
1. **ALWAYS** ask for user confirmation before triggering any workflow
2. For re-running failed checks on a PR:
   - First, fetch the PR details with get_github_pull_request
   - Extract the run ID from the failed check runs
   - Use rerun_github_workflow with the run ID
3. For manually triggering workflows:
   - Need the workflow file name (e.g., "ci.yml", "deploy.yml")
   - Default to 'main' branch unless user specifies
   - Can pass inputs if the workflow accepts them
4. After triggering, let the user know it was successful and provide them with the repo URL to check status

**Creating GitHub Pull Requests:**
Use the **create_github_pull_request** tool when users ask you to make code changes, fix bugs, add features, or update files.

**When to Create a PR:**
- "Fix the auth bug in the API"
- "Add a dark mode toggle to the UI"
- "Update the README with setup instructions"
- "Create a PR that adds logging to the login function"

**PR Creation Strategy:**
1. Understand what changes are needed (read existing code if necessary)
2. Create descriptive commit message
3. Use create_github_pull_request with:
   - Repository (e.g., "parkhub/smartpass-api")
   - Branch name (e.g., "fix/auth-bug", "feature/dark-mode")
   - Files to change (array of {path, content})
   - PR title (clear, concise description)
   - PR body (detailed description with context and testing instructions)
   - Commit message (explains what and why)

**Updating Existing GitHub Pull Requests:**
Use the **update_github_pull_request** tool when you need to push additional commits to an existing PR!

**When to Update a PR:**
- "Add better validation to that PR I just created"
- "Update PR #1182 with additional changes"
- "Push a fix to the existing auth PR"
- User says there's already a PR for this and wants you to update it instead of creating a new one

**PR Update Strategy:**
1. You MUST know the branch name - if the user mentions a PR number but not the branch:
   - Use get_github_pull_request to fetch the PR details and get the branch name
   - Example: "Let me fetch that PR first to see what branch it's on, partner!"
2. Read existing code if needed to understand what's there
3. Use update_github_pull_request with:
   - Repository (same as create)
   - Branch name (the existing PR's branch)
   - PR number (optional, helps with logging)
   - Files to update (array of {path, content})
   - Commit message (explains what additional changes you're making)

**IMPORTANT:**
- update_github_pull_request pushes commits to an EXISTING branch
- If the branch doesn't exist, it will error - use create_github_pull_request instead
- When in doubt, ask the user: "Should I update the existing PR or create a new one?"
- **Best Practice**: When you create a PR and then realize you need to make more changes, use update_github_pull_request to update that same PR instead of creating a second one!

**Best Practices:**
- Always create PRs from feature branches (tool handles this automatically)
- Write clear commit messages that explain the "why", not just the "what"
- Include testing instructions in PR body
- Link related Jira tickets in PR body when applicable
- For small changes, use concise titles like "Fix typo in README"
- For larger changes, use descriptive titles like "Add user authentication with JWT"
- When you create a PR and need to add more changes, UPDATE that PR instead of creating a new one

**Available Repositories:**
- parkhub/smartpass-api - SmartPass backend API
- parkhub/graph-api - Graph API service
- parkhub/smartpass-ui - SmartPass consumer-facing UI
- parkhub/smartpass-admin-ui - SmartPass admin interface
- parkhub/egds - Event/listing management system with high-performance API and migration services (Golang)
- parkhub/data-migration - Data migration scripts and utilities
- parkhub/sp-loadtesting - Load testing tools and configurations

SMARTPASS PARTNER API DOCUMENTATION (EXTERNAL):
You have access to the **external** SmartPass Partner API documentation (Swagger/OpenAPI spec)!

**IMPORTANT**: This is the **public partner API** for **external integrators** like Ticketmaster and external resellers. This is NOT the internal API that the team uses internally.

Use **get_api_documentation** when:
- Users ask about the **external/partner** API: "What endpoints do we expose to Ticketmaster?", "How do external partners create passes?"
- Users need help with **partner integration**: "How does Ticketmaster integrate with us?", "What's the external API authentication flow?"
- Users want to know **partner-facing** request/response formats: "What fields do partners send when creating a pass?"
- Users ask about **external API capabilities**: "What can our partners do via the API?", "What operations do we expose externally?"

The tool can:
- Return the full external API spec (all partner-facing endpoints, schemas, etc.)
- Filter to specific endpoints by path (e.g., endpoint="/passes" to see only pass-related endpoints)

When users ask about the partner API:
1. Fetch the relevant documentation using get_api_documentation
2. Explain that this is the **external/partner API** used by integrators like Ticketmaster
3. Explain the endpoint, parameters, request body, and response format clearly
4. Provide example usage if helpful
5. Point out authentication requirements if needed

WORKING WITH JIRA TICKETS:
You can create, search, and look up Jira tickets in the PV (Frontier) project!

**Getting the current sprint** - Use **get_current_sprint**:
- When users reference "my team's current sprint", "current sprint", "this sprint", or "active sprint"
- When users ask "find all items in my team's current sprint", "what's in the current sprint?", "show me the current sprint"
- This returns the sprint name, ID, dates, and goal for the Frontier team's active sprint
- After getting the sprint info, use **search_jira_issues** with the sprintId parameter to find tickets in that sprint
- Example workflow:
  1. User says "find all items in my team's current sprint"
  2. Call get_current_sprint to get the sprint ID
  3. Call search_jira_issues with sprintId (no query needed) to get all tickets in the sprint

**Looking up specific tickets** - Use **get_jira_issue**:
- When users mention a ticket number: "What's PV-123 about?", "Check PV-456", "Show me ticket PV-789"
- When users ask about status: "Is PV-123 done?", "Who's assigned to PV-456?"
- Returns: summary, description, status, assignee, priority, story points, dates, URL

**Searching for tickets** - Use **search_jira_issues**:
- When users want to find tickets: "Find tickets about authentication", "Search for API bugs"
- When users ask "what tickets exist about X?", "show me tickets related to Y"
- Searches both summary and description fields
- Returns up to 10 results by default (can specify more)

**Creating new tickets** - Use **create_jira_issue**:
- Users say "create a ticket", "track this", "log a bug", "make a story"
- Users describe work that needs to be done
- Users want to document a task or feature request

When creating tickets:
- **Summary**: Keep it concise and descriptive (one line)
- **Description**: Include details, context, acceptance criteria, technical notes
- **Issue Type**: Choose Story (new feature), Task (work item), Bug (defect), or Epic (large initiative)
- **Priority**: Choose Highest, High, Medium, Low, or Lowest based on urgency
- **Story Points**: Estimate complexity on a 1-3 scale:
  - **1 point**: Small, straightforward task (quick fix, minor change, simple feature)
  - **2 points**: Medium complexity (requires some design, multiple files, moderate effort)
  - **3 points**: Large or complex (significant architecture, multiple components, high complexity)

After looking up or creating a ticket, always share the ticket URL so they can view it in Jira.

CREATING, UPDATING CONFLUENCE PAGES & FOLDERS:
You can create, update both pages and folders in the FRONTIER space!

**Create folders** using create_confluence_folder when:
- Users say "create a folder for...", "organize docs under...", "make a new folder"
- Users want to organize related documentation together
- Starting a new project or feature that will have multiple docs
- Examples: "Create a folder for the new API docs", "Make a folder for meeting notes"

**Create pages** using create_confluence_page when:
- Users say "can you document this?", "write this up", "create a page for...", "add this to Confluence"
- Users want to capture meeting notes, architecture decisions, or technical discussions
- Users share information that should be preserved in documentation
- **CRITICAL**: You MUST ALWAYS provide BOTH title AND content when creating a page. NEVER call create_confluence_page with only a title. If you don't have content yet, ask the user what should be in the page first, or write appropriate content based on the context.

**Update pages** using update_confluence_page when:
- Users say "update the page", "edit this doc", "add this to the existing page", "modify the documentation"
- Users want to revise or add information to an existing page
- You need to correct or expand existing documentation
- IMPORTANT: You need the page ID to update. If they provide a URL or mention a specific page, fetch it first with get_confluence_page to get the ID and current content
- When updating, you can optionally change the title too

When creating or updating pages:
- **ALWAYS use Confluence storage format (XHTML-based), NOT standard HTML or markdown**
- Structure content clearly with headings and sections
- Make titles descriptive and searchable
- If they mention a parent page or folder, use the parentPageId parameter
- After creating, share the URL with the user so they can view/edit it

When creating folders:
- Use clear, descriptive names
- If they want it inside another folder, use the parentPageId parameter
- Folders are great for organizing multiple related documents

**RELEASE DOCUMENTS - SPECIAL HANDLING:**
When users ask to create or look up release documents:
- **ALWAYS** create release documents under the "Release Documents" folder in Confluence
- **ALWAYS** search for existing release documents in the "Release Documents" folder
- **CRITICAL**: When creating a new release document, you MUST use the template:
  1. First use **get_confluence_children** to find the "Release Documents" folder and get its page ID
  2. Use **get_confluence_children** on the "Release Documents" folder to list its pages
  3. Find the page with "[TEMPLATE]" in its title
  4. Use **get_confluence_page** to fetch the template page's content
  5. Use that template content as the basis for the new release document (customize it with specific release info)
  6. Create the new page with **create_confluence_page** using the template content as a starting point and the "Release Documents" folder as the parent
- To lookup: Use **search_confluence** with query like "Release Documents [version/sprint/date]" or use **get_confluence_children** on the "Release Documents" folder to browse releases

**Populating Release Documents with Sprint PRs:**
When users ask to add PRs from the current sprint to a release document (or when creating a new release document for a sprint):
1. **Get the current sprint** using **get_current_sprint** to get sprint details and ID
2. **Find sprint tickets** using **search_jira_issues** with the sprintId parameter to get all tickets in the sprint
3. **Check each repo for closed PRs** that relate to those tickets:
   - Use **list_github_pull_requests** with state="closed" for relevant repos (especially data-migration, smartpass-api, graph-api, smartpass-ui, smartpass-admin-ui, egds)
   - Match PRs to sprint tickets by looking for ticket keys (e.g., "PV-1234") in PR titles or bodies
   - When users say "look through my data migrations", focus on the **parkhub/data-migration** repo
4. **Extract PR details** for each matched PR:
   - PR number, title, author, merge date, description
   - For **database migration PRs** (from data-migration repo), also fetch the migration code:
     - Use **get_github_pull_request** to get the PR details and file changes
     - Look for migration files (typically in paths like migrations/ or with .sql extension)
     - Use **read_github_file** to get the actual migration SQL code (the "up" migration)
   - For code PRs, note the key changes but don't include full code unless requested
5. **Add to appropriate sections** in the release document:
   - Database migrations go in the "Database Migrations" section (include PR link, ticket, author, description, and SQL code)
   - API changes go in relevant API sections
   - UI changes go in relevant UI sections
   - Add ticket keys to the Jira tickets section
   - Add PR authors to the contributors list
6. **Update the document** using **update_confluence_page** with the enhanced content

When users ask to "add the code" or "add the migration code":
- They mean the SQL from the migration file (the "up" migration)
- Use **read_github_file** to fetch the migration file content
- Add it to the Database Migrations section formatted as code using Confluence code macro with language=sql and the SQL wrapped in CDATA

Examples:
  - "Create a release document for Sprint 23" → Get sprint, find tickets, find PRs, populate template
  - "Look through my data migrations closed PRs and see if there are any from items in my current sprint. If so add them to the relevant section." → Get current sprint, get sprint tickets, search data-migration PRs, match and add to document
  - "Add the code from the up migration to it" → Fetch the migration file, extract SQL, add to document with proper formatting

**Confluence Storage Format - Simple XHTML Tags:**
- Headings: \`<h1>Main Title</h1>\`, \`<h2>Section</h2>\`, \`<h3>Subsection</h3>\`
- Paragraphs: \`<p>Your text here</p>\`
- Bullet lists: \`<ul><li>Item 1</li><li>Item 2</li></ul>\`
- Numbered lists: \`<ol><li>First</li><li>Second</li></ol>\`
- Bold: \`<strong>bold text</strong>\`
- Italic: \`<em>italic text</em>\`
- Code inline: \`<code>code</code>\`
- Code blocks: \`<pre><code>your code here</code></pre>\` (can contain multiple lines of code, not just single lines)
- Links: \`<ac:link><ri:page ri:content-title="Page Name"/></ac:link>\` (for internal links) or use page URLs for external
- Line breaks: \`<br/>\`

**Example page structure:**
\`\`\`
<h1>Main Title</h1>
<p>Introduction paragraph.</p>
<h2>Section 1</h2>
<p>Some content here.</p>
<ul>
<li>Bullet point 1</li>
<li>Bullet point 2</li>
</ul>
<h2>Code Example</h2>
<pre><code>const example = "code";</code></pre>
\`\`\`

**CRITICAL**: Do NOT use markdown syntax like \`#\`, \`##\`, \`*\`, \`**\`, \`\`\` - these are plain text in Confluence. Always use proper XHTML tags like \`<h1>\`, \`<p>\`, \`<ul>\`, etc.

You're here to make their development work smoother and more enjoyable, partner!

BEING PERSISTENT WITH CONFLUENCE SEARCHES:
When searching for information (especially architecture, meetings, or technical documentation), be thorough:
1. **Always try at least 2-3 different search queries** with different keywords before concluding nothing exists in FRONTIER
2. For "architecture meeting" questions, search: "architecture", "architecture meeting", "technical design", "design review", "RFC", recent dates
3. For "meeting notes" questions, search: the meeting name, date ranges, topic names
4. For technical docs: search feature names, API names, architecture topics, design patterns
5. Look at the page titles and excerpts carefully - the info might be in related pages or under different names
6. If you find a folder or parent page, use get_confluence_children to browse its contents
7. **Never tell the user something doesn't exist after just one search** - be thorough and creative with search terms
8. **Remember**: You only search the FRONTIER space - if something isn't there, politely let the user know it might be in another space you don't have access to

When in doubt, try broader searches and narrow down, rather than starting too specific.

IMPORTANT: When users ask questions that might be documented in Confluence (like "How does X work?", "What's our process for Y?", "Where can I find info about Z?", "What's in the latest release?"), proactively use the search_confluence tool to look it up before responding.

CONFLUENCE SEARCH TIPS:
- If your first search doesn't find what you need, try different keywords or search terms
- Search broadly at first, then narrow down based on what you find
- **When you find a folder/parent page, use get_confluence_children to see what's inside it!** - Don't just say it's empty
- When users provide a Confluence URL, extract the page ID and use get_confluence_page directly:
  - URLs like "/wiki/spaces/ped/pages/506101762/..." contain the page ID (506101762)
  - Extract the number after "/pages/" and before the next "/"
  - Use get_confluence_page with that ID to fetch the content
- If initial searches fail, be proactive: try variations, check parent pages, or ask the user for more specific details
- Don't give up after one search - try at least 2-3 different search strategies

COMMON SEARCH SCENARIOS:

**Releases/Deployments:**
- Try: "release", "release notes", version numbers, "deployment", "changelog", date ranges like "2026.01"
- Release documents might be named "2026.01.R2", "Release 2026", "January Release", etc.
- Note: Detailed release notes might be in other spaces you don't have access to - the FRONTIER space typically contains technical architecture and design docs rather than release planning

**Meetings/Discussions:**
- Try: "meeting", "architecture", the meeting name, date ranges, "notes", "discussion", "review", "retro"
- Meeting notes might be titled with dates, topics, or feature names rather than "meeting"
- Architecture meetings might be documented as: "Architecture Review", "Tech Design", "RFC", "Design Doc", or even as pages about specific technical topics
- All searches are limited to the FRONTIER space only

**Documentation/Processes:**
- Try: the feature name, "guide", "how to", "process", "workflow", "architecture", "API", "integration"
- Technical docs often live in team spaces (FRONTIER, PED, etc.) or project-specific spaces

**Finding Recent Content:**
- Search with recent months/years: "2026", "January 2026", "Q1 2026"
- Sort by checking dates in results
- Look for "latest", "current", "updated"

Example workflow for finding architecture meetings in FRONTIER:
1. Search for "architecture meeting" or "architecture review"
2. Try "technical design" or "design discussion"
3. Search for specific topics if you know them (e.g., "API design", "database architecture")
4. Look for dated pages from recent weeks/months
5. Browse folders/parent pages using get_confluence_children

This helps you give accurate, up-to-date information based on the team's actual documentation.

IMPORTANT: Response Format

You can respond in two ways:

1. PLAIN TEXT (default): For most conversations, just respond naturally with text. Use markdown for formatting.

2. STRUCTURED JSON: When you need the user to choose from specific options, respond with ONLY JSON (no text before or after):

CRITICAL: When using select_card, respond with ONLY the JSON structure. Do NOT include any plain text before or after the JSON. The JSON itself should contain your friendly greeting in the "question" field.

{
  "type": "select_card",
  "data": {
    "question": "Your full question with friendly Victor greeting here",
    "options": [
      {
        "label": "Option 1 Label",
        "value": "option-1-value",
        "description": "Optional description"
      },
      {
        "label": "Option 2 Label",
        "value": "option-2-value",
        "description": "Optional description"
      }
    ],
    "context": "Optional additional context"
  }
}

Use select_card when:
- The user needs to pick from a predefined set of options
- You want to offer multiple approaches to solve a problem
- You're helping them choose between tools, frameworks, or patterns
- Any situation where discrete choices make more sense than free text

Examples:

User: "What framework should I use for the frontend?"
You (JSON response - ONLY JSON, no other text):
{
  "type": "select_card",
  "data": {
    "question": "Well howdy, partner! Which frontend framework suits your fancy? There's a whole bunch of great options out there!",
    "options": [
      { "label": "React", "value": "react", "description": "Component-based, great ecosystem" },
      { "label": "Vue", "value": "vue", "description": "Progressive, easy to learn" },
      { "label": "Svelte", "value": "svelte", "description": "Compiled, fast and lightweight" }
    ],
    "context": "All these are mighty fine choices for building web apps!"
  }
}

User: "Help me debug this code"
You (plain text): "Sure thing, partner! Show me what code you're wrangling with and I'll help you track down that bug!"

After a user selects an option, their next message will be the value they selected (e.g., "react"). Use this to continue the conversation naturally.

HANDLING CONFLUENCE URLS:
When a user provides a Confluence URL, you should IMMEDIATELY fetch it - don't search first!

URL format: "https://justpark.atlassian.net/wiki/spaces/{SPACE}/pages/{PAGE_ID}/{PAGE_TITLE}"

Steps:
1. Extract the page ID from the URL (the number after "/pages/" - e.g., 506101762 from "/pages/506101762/")
2. Note the space name (e.g., "FRONTIER", "PED") - this tells you which team's documentation it is
3. **Immediately use get_confluence_page with that page ID** to retrieve and show them the content
4. Don't search or ask questions - go directly to the page they're referencing

**IMPORTANT NOTES:**
- You can fetch ANY page by direct URL (even from spaces outside FRONTIER)
- Your SEARCHES are limited to FRONTIER space only
- When given a direct URL to a page in PED or another space, you CAN access it - just fetch it!

Examples:
User: "Can you check https://justpark.atlassian.net/wiki/spaces/FRONTIER/pages/220397572/SmartPasses+Public+API"
You: [Extract 220397572, call get_confluence_page("220397572")] ✅

User: "Do you have access to https://justpark.atlassian.net/wiki/spaces/ped/pages/123456789/Release-Notes"
You: [Extract 123456789, call get_confluence_page("123456789")] ✅ You can access direct URLs even if not in FRONTIER!

**When given a URL, NEVER say "I can't find it" - just fetch the page directly using the ID from the URL!**`;

Bun.serve({
  routes: {
    "/": index,
    "/victor-face.webp": Bun.file("./victor-face.webp"),

    "/api/confluence/search": {
      async POST(req) {
        try {
          const { query } = await req.json();
          console.log("\n🔍 Confluence Search Request (FRONTIER space only):");
          console.log("  Query:", query);

          if (!query) {
            return Response.json({ error: "Query is required" }, { status: 400 });
          }

          const confluenceUrl = process.env.ATLASSIAN_URL;
          const confluenceAuth = process.env.ATLASSIAN_AUTH;

          if (!confluenceUrl || !confluenceAuth) {
            console.error("❌ Confluence not configured!");
            return Response.json({ error: "Confluence not configured" }, { status: 500 });
          }

          // Remove trailing slash from URL if present
          const baseUrl = confluenceUrl.endsWith('/') ? confluenceUrl.slice(0, -1) : confluenceUrl;

          // Restrict search to FRONTIER space only
          const cqlQuery = `space = "FRONTIER" AND text ~ "${query}"`;
          const searchUrl = `${baseUrl}/wiki/rest/api/content/search?cql=${encodeURIComponent(cqlQuery)}&limit=10&expand=body.view`;
          console.log("  Search URL:", searchUrl);
          console.log("  CQL Query:", cqlQuery);

          const response = await fetch(searchUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + btoa(confluenceAuth),
            }
          });

          console.log("  Response Status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Confluence API Error:");
            console.error("  Status:", response.status);
            console.error("  Response:", errorText);
            return Response.json({
              error: `Confluence API error: ${response.status}`,
              details: errorText
            }, { status: response.status });
          }

          const data = await response.json();
          console.log("✅ Found", data.results.length, "pages");

          // Format results for Victor
          const results = data.results.map((page: any) => ({
            id: page.id,
            title: page.title,
            url: `${baseUrl}/wiki${page._links.webui}`,
            excerpt: page.body?.view?.value?.substring(0, 300) || ''
          }));

          results.forEach((result: any) => {
            console.log("  📄", result.title, `(ID: ${result.id})`);
          });

          return Response.json({ results });
        } catch (error) {
          console.error("❌ Confluence search error:", error);
          return Response.json({
            error: "Failed to search Confluence",
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    },

    "/api/confluence/children": {
      async POST(req) {
        try {
          const { pageId } = await req.json();
          console.log("\n👶 Confluence Children Request:");
          console.log("  Parent Page ID:", pageId);

          if (!pageId) {
            return Response.json({ error: "Page ID is required" }, { status: 400 });
          }

          const confluenceUrl = process.env.ATLASSIAN_URL;
          const confluenceAuth = process.env.ATLASSIAN_AUTH;

          if (!confluenceUrl || !confluenceAuth) {
            console.error("❌ Confluence not configured!");
            return Response.json({ error: "Confluence not configured" }, { status: 500 });
          }

          // Remove trailing slash from URL if present
          const baseUrl = confluenceUrl.endsWith('/') ? confluenceUrl.slice(0, -1) : confluenceUrl;
          const childrenUrl = `${baseUrl}/wiki/rest/api/content/${pageId}/child/page?limit=50`;
          console.log("  Children URL:", childrenUrl);

          const response = await fetch(childrenUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + btoa(confluenceAuth),
            }
          });

          console.log("  Response Status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Confluence API Error:");
            console.error("  Status:", response.status);
            console.error("  Response:", errorText);
            return Response.json({
              error: `Confluence API error: ${response.status}`,
              details: errorText
            }, { status: response.status });
          }

          const data = await response.json();
          console.log("✅ Found", data.results.length, "child pages");

          // Format results
          const children = data.results.map((page: any) => ({
            id: page.id,
            title: page.title,
            url: `${baseUrl}/wiki${page._links.webui}`
          }));

          children.forEach((child: any) => {
            console.log("  📄", child.title, `(ID: ${child.id})`);
          });

          return Response.json({ children });
        } catch (error) {
          console.error("❌ Confluence children fetch error:", error);
          return Response.json({
            error: "Failed to fetch child pages",
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    },

    "/api/confluence/list-root": {
      async POST(req) {
        try {
          console.log("\n📚 Confluence List Root Pages Request (FRONTIER space)");

          const confluenceUrl = process.env.ATLASSIAN_URL;
          const confluenceAuth = process.env.ATLASSIAN_AUTH;

          if (!confluenceUrl || !confluenceAuth) {
            console.error("❌ Confluence not configured!");
            return Response.json({ error: "Confluence not configured" }, { status: 500 });
          }

          const baseUrl = confluenceUrl.endsWith('/') ? confluenceUrl.slice(0, -1) : confluenceUrl;

          // Get root pages in FRONTIER space (pages with no parent)
          const cqlQuery = 'space = "FRONTIER" AND parent = null';
          const listUrl = `${baseUrl}/wiki/rest/api/content/search?cql=${encodeURIComponent(cqlQuery)}&limit=50&expand=children.page`;
          console.log("  List URL:", listUrl);

          const response = await fetch(listUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + btoa(confluenceAuth),
            }
          });

          console.log("  Response Status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Confluence API Error:");
            console.error("  Status:", response.status);
            console.error("  Response:", errorText);
            return Response.json({
              error: `Confluence API error: ${response.status}`,
              details: errorText
            }, { status: response.status });
          }

          const data = await response.json();
          console.log("✅ Found", data.results.length, "root pages/folders");

          // Format results
          const rootPages = data.results.map((page: any) => ({
            id: page.id,
            title: page.title,
            type: page.type,
            url: `${baseUrl}/wiki${page._links.webui}`,
            hasChildren: page.children?.page?.size > 0
          }));

          rootPages.forEach((page: any) => {
            const icon = page.hasChildren ? "📁" : "📄";
            console.log(`  ${icon}`, page.title, `(ID: ${page.id})`);
          });

          return Response.json({ rootPages });
        } catch (error) {
          console.error("❌ Confluence list root pages error:", error);
          return Response.json({
            error: "Failed to list root pages",
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    },

    "/api/confluence/create-folder": {
      async POST(req) {
        try {
          const { title, space = "FRONTIER", parentPageId } = await req.json();
          console.log("\n📁 Confluence Create Folder Request:");
          console.log("  Title:", title);
          console.log("  Space:", space);
          console.log("  Parent Page ID:", parentPageId || "None (root level)");

          if (!title) {
            return Response.json({ error: "Title is required" }, { status: 400 });
          }

          const confluenceUrl = process.env.ATLASSIAN_URL;
          const confluenceAuth = process.env.ATLASSIAN_AUTH;

          if (!confluenceUrl || !confluenceAuth) {
            console.error("❌ Confluence not configured!");
            return Response.json({ error: "Confluence not configured" }, { status: 500 });
          }

          const baseUrl = confluenceUrl.endsWith('/') ? confluenceUrl.slice(0, -1) : confluenceUrl;

          // Try using the v2 API for folders first
          const folderUrl = `${baseUrl}/wiki/api/v2/folders`;
          console.log("  Folder URL (v2 API):", folderUrl);

          const folderData: any = {
            title: title,
            spaceId: space, // Note: v2 API might need space ID instead of key
          };

          if (parentPageId) {
            folderData.parentId = parentPageId;
          }

          console.log("  Folder data:", JSON.stringify(folderData, null, 2));

          // Try v2 API first
          let response = await fetch(folderUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + btoa(confluenceAuth),
            },
            body: JSON.stringify(folderData)
          });

          // If v2 API fails, fall back to creating a page as a folder container
          if (!response.ok) {
            console.log("  ⚠️  v2 API failed, falling back to page-as-folder approach");
            const createUrl = `${baseUrl}/wiki/rest/api/content`;

            const pageData: any = {
              type: "page",
              title: title,
              space: {
                key: space
              },
              body: {
                storage: {
                  value: `<p><em>This is a folder for organizing documentation.</em></p>`,
                  representation: "storage"
                }
              }
            };

            if (parentPageId) {
              pageData.ancestors = [{ id: parentPageId }];
            }

            response = await fetch(createUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(confluenceAuth),
              },
              body: JSON.stringify(pageData)
            });
          }

          console.log("  Response Status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Confluence API Error:");
            console.error("  Status:", response.status);
            console.error("  Response:", errorText);
            return Response.json({
              error: `Confluence API error: ${response.status}`,
              details: errorText
            }, { status: response.status });
          }

          const data = await response.json();
          console.log("✅ Folder created successfully!");
          console.log("  Folder/Page ID:", data.id);
          console.log("  Folder URL:", `${baseUrl}/wiki${data._links?.webui || `/spaces/${space}/pages/${data.id}`}`);

          return Response.json({
            success: true,
            id: data.id,
            title: data.title,
            url: `${baseUrl}/wiki${data._links?.webui || `/spaces/${space}/pages/${data.id}`}`,
            space: data.space?.key || space
          });
        } catch (error) {
          console.error("❌ Confluence create folder error:", error);
          return Response.json({
            error: "Failed to create Confluence folder",
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    },

    "/api/confluence/update-page": {
      async POST(req) {
        try {
          const { pageId, title, content } = await req.json();
          console.log("\n✏️  Confluence Update Page Request:");
          console.log("  Page ID:", pageId);
          console.log("  New Title:", title || "(keeping existing)");

          if (!pageId || !content) {
            return Response.json({ error: "Page ID and content are required" }, { status: 400 });
          }

          const confluenceUrl = process.env.ATLASSIAN_URL;
          const confluenceAuth = process.env.ATLASSIAN_AUTH;

          if (!confluenceUrl || !confluenceAuth) {
            console.error("❌ Confluence not configured!");
            return Response.json({ error: "Confluence not configured" }, { status: 500 });
          }

          const baseUrl = confluenceUrl.endsWith('/') ? confluenceUrl.slice(0, -1) : confluenceUrl;

          // First, fetch the current page to get version number and existing data
          const getUrl = `${baseUrl}/wiki/rest/api/content/${pageId}?expand=version,space`;
          console.log("  Fetching current page:", getUrl);

          const getResponse = await fetch(getUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + btoa(confluenceAuth),
            }
          });

          if (!getResponse.ok) {
            const errorText = await getResponse.text();
            console.error("❌ Failed to fetch current page:");
            console.error("  Status:", getResponse.status);
            console.error("  Response:", errorText);
            return Response.json({
              error: `Failed to fetch page: ${getResponse.status}`,
              details: errorText
            }, { status: getResponse.status });
          }

          const currentPage = await getResponse.json();
          console.log("  Current version:", currentPage.version.number);

          // Update the page
          const updateUrl = `${baseUrl}/wiki/rest/api/content/${pageId}`;
          console.log("  Update URL:", updateUrl);

          const updateData = {
            version: {
              number: currentPage.version.number + 1
            },
            title: title || currentPage.title,
            type: "page",
            body: {
              storage: {
                value: content,
                representation: "storage"
              }
            }
          };

          console.log("  New version:", updateData.version.number);

          const updateResponse = await fetch(updateUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + btoa(confluenceAuth),
            },
            body: JSON.stringify(updateData)
          });

          console.log("  Response Status:", updateResponse.status);

          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error("❌ Confluence API Error:");
            console.error("  Status:", updateResponse.status);
            console.error("  Response:", errorText);
            return Response.json({
              error: `Confluence API error: ${updateResponse.status}`,
              details: errorText
            }, { status: updateResponse.status });
          }

          const data = await updateResponse.json();
          console.log("✅ Page updated successfully!");
          console.log("  Page ID:", data.id);
          console.log("  New Version:", data.version.number);
          console.log("  Page URL:", `${baseUrl}/wiki${data._links.webui}`);

          return Response.json({
            success: true,
            id: data.id,
            title: data.title,
            version: data.version.number,
            url: `${baseUrl}/wiki${data._links.webui}`,
            space: data.space.key
          });
        } catch (error) {
          console.error("❌ Confluence update page error:", error);
          return Response.json({
            error: "Failed to update Confluence page",
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    },

    "/api/confluence/create-page": {
      async POST(req) {
        try {
          const { title, content, space = "FRONTIER", parentPageId } = await req.json();
          console.log("\n📝 Confluence Create Page Request:");
          console.log("  Title:", title);
          console.log("  Content length:", content?.length || 0);
          console.log("  Space:", space);
          console.log("  Parent Page ID:", parentPageId || "None (root level)");

          if (!title || !content) {
            console.error("❌ Missing required fields:");
            console.error("  - Title provided:", !!title);
            console.error("  - Content provided:", !!content);
            return Response.json({
              error: "Title and content are required. You cannot create an empty Confluence page. Both title and content must be provided.",
              missing: {
                title: !title,
                content: !content
              }
            }, { status: 400 });
          }

          const confluenceUrl = process.env.ATLASSIAN_URL;
          const confluenceAuth = process.env.ATLASSIAN_AUTH;

          if (!confluenceUrl || !confluenceAuth) {
            console.error("❌ Confluence not configured!");
            return Response.json({ error: "Confluence not configured" }, { status: 500 });
          }

          const baseUrl = confluenceUrl.endsWith('/') ? confluenceUrl.slice(0, -1) : confluenceUrl;
          const createUrl = `${baseUrl}/wiki/rest/api/content`;
          console.log("  Create URL:", createUrl);

          // Build the page data
          const pageData: any = {
            type: "page",
            title: title,
            space: {
              key: space
            },
            body: {
              storage: {
                value: content,
                representation: "storage"
              }
            }
          };

          // Add parent page if specified
          if (parentPageId) {
            pageData.ancestors = [{ id: parentPageId }];
          }

          console.log("  Page data:", JSON.stringify(pageData, null, 2));

          const response = await fetch(createUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + btoa(confluenceAuth),
            },
            body: JSON.stringify(pageData)
          });

          console.log("  Response Status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Confluence API Error:");
            console.error("  Status:", response.status);
            console.error("  Response:", errorText);
            return Response.json({
              error: `Confluence API error: ${response.status}`,
              details: errorText
            }, { status: response.status });
          }

          const data = await response.json();
          console.log("✅ Page created successfully!");
          console.log("  Page ID:", data.id);
          console.log("  Page URL:", `${baseUrl}/wiki${data._links.webui}`);

          return Response.json({
            success: true,
            id: data.id,
            title: data.title,
            url: `${baseUrl}/wiki${data._links.webui}`,
            space: data.space.key
          });
        } catch (error) {
          console.error("❌ Confluence create page error:", error);
          return Response.json({
            error: "Failed to create Confluence page",
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    },

    "/api/confluence/page": {
      async POST(req) {
        try {
          const { pageId } = await req.json();
          console.log("\n📄 Confluence Page Request:");
          console.log("  Page ID:", pageId);

          if (!pageId) {
            return Response.json({ error: "Page ID is required" }, { status: 400 });
          }

          const confluenceUrl = process.env.ATLASSIAN_URL;
          const confluenceAuth = process.env.ATLASSIAN_AUTH;

          if (!confluenceUrl || !confluenceAuth) {
            console.error("❌ Confluence not configured!");
            return Response.json({ error: "Confluence not configured" }, { status: 500 });
          }

          // Remove trailing slash from URL if present
          const baseUrl = confluenceUrl.endsWith('/') ? confluenceUrl.slice(0, -1) : confluenceUrl;
          const pageUrl = `${baseUrl}/wiki/rest/api/content/${pageId}?expand=body.storage,version`;
          console.log("  Page URL:", pageUrl);

          const response = await fetch(pageUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + btoa(confluenceAuth),
            }
          });

          console.log("  Response Status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Confluence API Error:");
            console.error("  Status:", response.status);
            console.error("  Response:", errorText);
            return Response.json({
              error: `Confluence API error: ${response.status}`,
              details: errorText
            }, { status: response.status });
          }

          const data = await response.json();
          console.log("✅ Retrieved page:", data.title);

          return Response.json({
            id: data.id,
            title: data.title,
            content: data.body.storage.value,
            version: data.version.number,
            url: `${baseUrl}/wiki/pages/viewpage.action?pageId=${data.id}`
          });
        } catch (error) {
          console.error("❌ Confluence page fetch error:", error);
          return Response.json({
            error: "Failed to fetch Confluence page",
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    },

    "/api/jira/get-issue": {
      async POST(req) {
        try {
          const { issueKey } = await req.json();
          console.log("\n🎫 Jira Get Issue Request:");
          console.log("  Issue Key:", issueKey);

          if (!issueKey) {
            return Response.json({ error: "Issue key is required" }, { status: 400 });
          }

          const atlassianUrl = process.env.ATLASSIAN_URL;
          const atlassianAuth = process.env.ATLASSIAN_AUTH;

          if (!atlassianUrl || !atlassianAuth) {
            console.error("❌ Jira not configured!");
            return Response.json({ error: "Jira not configured" }, { status: 500 });
          }

          const baseUrl = atlassianUrl.endsWith('/') ? atlassianUrl.slice(0, -1) : atlassianUrl;
          const issueUrl = `${baseUrl}/rest/api/3/issue/${issueKey}?fields=summary,description,status,assignee,priority,issuetype,created,updated,customfield_10016`;
          console.log("  Issue URL:", issueUrl);

          const response = await fetch(issueUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + btoa(atlassianAuth),
            }
          });

          console.log("  Response Status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Jira API Error:");
            console.error("  Status:", response.status);
            console.error("  Response:", errorText);
            return Response.json({
              error: `Jira API error: ${response.status}`,
              details: response.status === 404 ? `Issue ${issueKey} not found` : errorText
            }, { status: response.status });
          }

          const issue = await response.json();
          console.log("✅ Retrieved issue:", issue.key);

          return Response.json({
            key: issue.key,
            summary: issue.fields.summary,
            description: issue.fields.description || "No description",
            status: issue.fields.status.name,
            assignee: issue.fields.assignee?.displayName || "Unassigned",
            priority: issue.fields.priority?.name || "None",
            issueType: issue.fields.issuetype.name,
            storyPoints: issue.fields.customfield_10016 || null,
            created: issue.fields.created,
            updated: issue.fields.updated,
            url: `${baseUrl}/browse/${issue.key}`
          });
        } catch (error) {
          console.error("❌ Jira get issue error:", error);
          return Response.json({
            error: "Failed to get Jira issue",
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    },

    "/api/jira/search-issues": {
      async POST(req) {
        try {
          const { query, maxResults = 10, sprintId } = await req.json();
          console.log("\n🔍 Jira Search Issues Request:");
          console.log("  Query:", query);
          console.log("  Sprint ID:", sprintId || "None");
          console.log("  Max Results:", maxResults);

          const atlassianUrl = process.env.ATLASSIAN_URL;
          const atlassianAuth = process.env.ATLASSIAN_AUTH;

          if (!atlassianUrl || !atlassianAuth) {
            console.error("❌ Jira not configured!");
            return Response.json({ error: "Jira not configured" }, { status: 500 });
          }

          const baseUrl = atlassianUrl.endsWith('/') ? atlassianUrl.slice(0, -1) : atlassianUrl;

          // Build JQL query - search in PV project by default
          let jql = `project = PV`;

          // Add sprint filter if provided
          if (sprintId) {
            jql += ` AND sprint = ${sprintId}`;
          }

          // Add text search if query provided
          if (query) {
            jql += ` AND (summary ~ "${query}" OR description ~ "${query}")`;
          }

          jql += ` ORDER BY updated DESC`;
          const searchUrl = `${baseUrl}/rest/api/3/search/jql`;
          console.log("  Search URL:", searchUrl);
          console.log("  JQL:", jql);

          const response = await fetch(searchUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + btoa(atlassianAuth),
            },
            body: JSON.stringify({
              jql: jql,
              maxResults: maxResults,
              fields: ['summary', 'status', 'assignee', 'priority', 'issuetype', 'updated', 'customfield_10016']
            })
          });

          console.log("  Response Status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Jira API Error:");
            console.error("  Status:", response.status);
            console.error("  Response:", errorText);
            return Response.json({
              error: `Jira API error: ${response.status}`,
              details: errorText
            }, { status: response.status });
          }

          const data = await response.json();
          console.log("✅ Found", data.issues.length, "issues");

          const issues = data.issues.map((issue: any) => ({
            key: issue.key,
            summary: issue.fields.summary,
            status: issue.fields.status.name,
            assignee: issue.fields.assignee?.displayName || "Unassigned",
            priority: issue.fields.priority?.name || "None",
            issueType: issue.fields.issuetype.name,
            storyPoints: issue.fields.customfield_10016 || null,
            updated: issue.fields.updated,
            url: `${baseUrl}/browse/${issue.key}`
          }));

          return Response.json({
            total: data.total,
            issues
          });
        } catch (error) {
          console.error("❌ Jira search issues error:", error);
          return Response.json({
            error: "Failed to search Jira issues",
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    },

    "/api/jira/create-issue": {
      async POST(req) {
        try {
          const { summary, description, issueType = "Story", priority = "Medium", storyPoints } = await req.json();
          console.log("\n📋 Jira Create Issue Request:");
          console.log("  Summary:", summary);
          console.log("  Issue Type:", issueType);
          console.log("  Priority:", priority);
          console.log("  Story Points:", storyPoints || "Not set");

          if (!summary) {
            return Response.json({ error: "Summary is required" }, { status: 400 });
          }

          const atlassianUrl = process.env.ATLASSIAN_URL;
          const atlassianAuth = process.env.ATLASSIAN_AUTH;

          if (!atlassianUrl || !atlassianAuth) {
            console.error("❌ Jira not configured!");
            return Response.json({ error: "Jira not configured" }, { status: 500 });
          }

          const baseUrl = atlassianUrl.endsWith('/') ? atlassianUrl.slice(0, -1) : atlassianUrl;
          const createUrl = `${baseUrl}/rest/api/3/issue`;
          console.log("  Create URL:", createUrl);

          // Map priority to Jira priority IDs
          const priorityMap: { [key: string]: string } = {
            "Highest": "1",
            "High": "2",
            "Medium": "3",
            "Low": "4",
            "Lowest": "5"
          };

          // Map issue type to Jira issue type IDs
          const issueTypeMap: { [key: string]: string } = {
            "Story": "10001",
            "Task": "10002",
            "Bug": "10003",
            "Epic": "10000"
          };

          const issueData: any = {
            fields: {
              project: {
                key: "PV" // Frontier project key
              },
              summary: summary,
              description: {
                type: "doc",
                version: 1,
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: description || ""
                      }
                    ]
                  }
                ]
              },
              issuetype: {
                id: issueTypeMap[issueType] || issueTypeMap["Story"]
              },
              priority: {
                id: priorityMap[priority] || priorityMap["Medium"]
              }
            }
          };

          // Add story points if provided (customfield_10016 is the typical Story Points field in Jira)
          if (storyPoints !== undefined && storyPoints !== null) {
            issueData.fields.customfield_10016 = storyPoints;
          }

          console.log("  Issue data:", JSON.stringify(issueData, null, 2));

          const response = await fetch(createUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + btoa(atlassianAuth),
            },
            body: JSON.stringify(issueData)
          });

          console.log("  Response Status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Jira API Error:");
            console.error("  Status:", response.status);
            console.error("  Response:", errorText);
            return Response.json({
              error: `Jira API error: ${response.status}`,
              details: errorText
            }, { status: response.status });
          }

          const data = await response.json();
          console.log("✅ Issue created successfully!");
          console.log("  Issue Key:", data.key);
          console.log("  Issue URL:", `${baseUrl}/browse/${data.key}`);

          return Response.json({
            success: true,
            key: data.key,
            id: data.id,
            url: `${baseUrl}/browse/${data.key}`
          });
        } catch (error) {
          console.error("❌ Jira create issue error:", error);
          return Response.json({
            error: "Failed to create Jira issue",
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    },

    "/api/jira/get-current-sprint": {
      async POST(req) {
        try {
          console.log("\n🏃 Jira Get Current Sprint Request");

          const atlassianUrl = process.env.ATLASSIAN_URL;
          const atlassianAuth = process.env.ATLASSIAN_AUTH;

          if (!atlassianUrl || !atlassianAuth) {
            console.error("❌ Jira not configured!");
            return Response.json({ error: "Jira not configured" }, { status: 500 });
          }

          const baseUrl = atlassianUrl.endsWith('/') ? atlassianUrl.slice(0, -1) : atlassianUrl;

          // Get the board ID from environment or use default
          const boardId = process.env.JIRA_BOARD_ID ? parseInt(process.env.JIRA_BOARD_ID) : 193;
          const sprintUrl = `${baseUrl}/rest/agile/1.0/board/${boardId}/sprint?state=active`;
          console.log("  Sprint URL:", sprintUrl);

          const response = await fetch(sprintUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${Buffer.from(atlassianAuth).toString('base64')}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Jira API Error:");
            console.error("  Status:", response.status);
            console.error("  Response:", errorText);
            return Response.json({
              error: `Jira API error: ${response.status}`,
              details: errorText
            }, { status: response.status });
          }

          const data = await response.json();
          console.log("  ✅ Found sprints:", data.values?.length || 0);

          // Return the first active sprint
          const activeSprint = data.values?.[0];

          if (!activeSprint) {
            return Response.json({
              sprint: null,
              message: "No active sprint found for the Frontier team"
            });
          }

          return Response.json({
            sprint: {
              id: activeSprint.id,
              name: activeSprint.name,
              state: activeSprint.state,
              startDate: activeSprint.startDate,
              endDate: activeSprint.endDate,
              goal: activeSprint.goal,
              boardId: boardId
            }
          });
        } catch (error) {
          console.error("❌ Jira get current sprint error:", error);
          return Response.json({
            error: "Failed to get current sprint",
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    },

    "/api/swagger/fetch": {
      async POST(req) {
        try {
          const { endpoint } = await req.json();
          console.log("\n📚 Swagger API Documentation Request:");
          console.log("  Endpoint filter:", endpoint || "all");

          const swaggerUrl = "https://smartpass-partner-docs.justpark.me/swagger.yaml";
          console.log("  Fetching from:", swaggerUrl);

          const response = await fetch(swaggerUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/yaml, text/yaml',
            }
          });

          console.log("  Response Status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Swagger fetch error:");
            console.error("  Status:", response.status);
            console.error("  Response:", errorText);
            return Response.json({
              error: `Failed to fetch Swagger docs: ${response.status}`,
              details: errorText
            }, { status: response.status });
          }

          // Parse YAML response
          const yamlText = await response.text();
          const swaggerSpec: any = yaml.load(yamlText);

          // If specific endpoint requested, filter to that
          if (endpoint) {
            const filteredPaths: any = {};
            for (const [path, methods] of Object.entries(swaggerSpec.paths || {})) {
              if (path.includes(endpoint)) {
                filteredPaths[path] = methods;
              }
            }

            console.log("✅ Found", Object.keys(filteredPaths).length, "matching endpoints");

            return Response.json({
              info: swaggerSpec.info,
              servers: swaggerSpec.servers,
              paths: filteredPaths,
              components: swaggerSpec.components
            });
          }

          // Return full spec
          console.log("✅ Swagger spec retrieved");
          console.log("  Title:", swaggerSpec.info?.title);
          console.log("  Version:", swaggerSpec.info?.version);
          console.log("  Endpoints:", Object.keys(swaggerSpec.paths || {}).length);

          return Response.json(swaggerSpec);
        } catch (error) {
          console.error("❌ Swagger fetch error:", error);
          return Response.json({
            error: "Failed to fetch Swagger documentation",
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    },

    "/api/github/read-file": {
      async POST(req) {
        try {
          const { repo, path, branch = "main" } = await req.json();
          console.log("\n📖 GitHub Read File Request:");
          console.log("  Repo:", repo);
          console.log("  Path:", path);
          console.log("  Branch:", branch);

          if (!repo || !path) {
            return Response.json({ error: "Repo and path are required" }, { status: 400 });
          }

          // Validate allowed repos
          const allowedRepos = [
            "parkhub/smartpass-api",
            "parkhub/graph-api",
            "parkhub/smartpass-ui",
            "parkhub/smartpass-admin-ui",
            "parkhub/egds",
            "parkhub/data-migration",
            "parkhub/sp-loadtesting"
          ];

          if (!allowedRepos.includes(repo)) {
            console.error("❌ Unauthorized repo:", repo);
            return Response.json({
              error: "Unauthorized repository",
              allowedRepos
            }, { status: 403 });
          }

          const githubToken = process.env.GITHUB_TOKEN;

          if (!githubToken) {
            console.error("❌ GitHub token not configured!");
            return Response.json({ error: "GitHub not configured" }, { status: 500 });
          }

          const fileUrl = `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`;
          console.log("  File URL:", fileUrl);

          const response = await fetch(fileUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
              'Authorization': `Bearer ${githubToken}`
            }
          });

          console.log("  Response Status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ GitHub API Error:");
            console.error("  Status:", response.status);
            console.error("  Response:", errorText);
            return Response.json({
              error: `GitHub API error: ${response.status}`,
              details: errorText
            }, { status: response.status });
          }

          const data = await response.json();

          // Decode base64 content
          const content = Buffer.from(data.content, 'base64').toString('utf-8');

          console.log("✅ File retrieved successfully");
          console.log("  Size:", data.size, "bytes");

          return Response.json({
            path: data.path,
            name: data.name,
            content: content,
            size: data.size,
            sha: data.sha,
            url: data.html_url
          });
        } catch (error) {
          console.error("❌ GitHub read file error:", error);
          return Response.json({
            error: "Failed to read GitHub file",
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    },

    "/api/github/list-directory": {
      async POST(req) {
        try {
          const { repo, path = "", branch = "main" } = await req.json();
          console.log("\n📁 GitHub List Directory Request:");
          console.log("  Repo:", repo);
          console.log("  Path:", path || "(root)");
          console.log("  Branch:", branch);

          if (!repo) {
            return Response.json({
              error: "Repository parameter is required. You must specify which repository to list. Valid options are: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds, parkhub/data-migration, or parkhub/sp-loadtesting. If the user didn't specify a repo, ask them which one they want to explore."
            }, { status: 400 });
          }

          // Validate allowed repos
          const allowedRepos = [
            "parkhub/smartpass-api",
            "parkhub/graph-api",
            "parkhub/smartpass-ui",
            "parkhub/smartpass-admin-ui",
            "parkhub/egds",
            "parkhub/data-migration",
            "parkhub/sp-loadtesting"
          ];

          if (!allowedRepos.includes(repo)) {
            console.error("❌ Unauthorized repo:", repo);
            return Response.json({
              error: "Unauthorized repository",
              allowedRepos
            }, { status: 403 });
          }

          const githubToken = process.env.GITHUB_TOKEN;

          if (!githubToken) {
            console.error("❌ GitHub token not configured!");
            return Response.json({ error: "GitHub not configured" }, { status: 500 });
          }

          const dirUrl = `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`;
          console.log("  Directory URL:", dirUrl);

          const response = await fetch(dirUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
              'Authorization': `Bearer ${githubToken}`
            }
          });

          console.log("  Response Status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ GitHub API Error:");
            console.error("  Status:", response.status);
            console.error("  Response:", errorText);
            return Response.json({
              error: `GitHub API error: ${response.status}`,
              details: errorText
            }, { status: response.status });
          }

          const data = await response.json();

          // Format directory listing
          const items = data.map((item: any) => ({
            name: item.name,
            path: item.path,
            type: item.type, // "file" or "dir"
            size: item.size,
            url: item.html_url
          }));

          console.log("✅ Found", items.length, "items");
          console.log("  Files:", items.filter((i: any) => i.type === "file").length);
          console.log("  Directories:", items.filter((i: any) => i.type === "dir").length);

          return Response.json({ items });
        } catch (error) {
          console.error("❌ GitHub list directory error:", error);
          return Response.json({
            error: "Failed to list GitHub directory",
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    },

    "/api/github/search-code": {
      async POST(req) {
        try {
          const { query, repo } = await req.json();
          console.log("\n🔍 GitHub Search Code Request:");
          console.log("  Query:", query);
          console.log("  Repo:", repo || "all Frontier repos");

          if (!query) {
            return Response.json({ error: "Query is required" }, { status: 400 });
          }

          // Validate allowed repos
          const allowedRepos = [
            "parkhub/smartpass-api",
            "parkhub/graph-api",
            "parkhub/smartpass-ui",
            "parkhub/smartpass-admin-ui",
            "parkhub/egds",
            "parkhub/data-migration",
            "parkhub/sp-loadtesting"
          ];

          if (repo && !allowedRepos.includes(repo)) {
            console.error("❌ Unauthorized repo:", repo);
            return Response.json({
              error: "Unauthorized repository",
              allowedRepos
            }, { status: 403 });
          }

          const githubToken = process.env.GITHUB_TOKEN;

          if (!githubToken) {
            console.error("❌ GitHub token not configured!");
            return Response.json({ error: "GitHub not configured" }, { status: 500 });
          }

          // Build search query
          let searchQuery = query;
          if (repo) {
            searchQuery += ` repo:${repo}`;
          } else {
            // Search across all Frontier repos
            searchQuery += ` ${allowedRepos.map(r => `repo:${r}`).join(" OR ")}`;
          }

          const searchUrl = `https://api.github.com/search/code?q=${encodeURIComponent(searchQuery)}&per_page=20`;
          console.log("  Search URL:", searchUrl);

          const response = await fetch(searchUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
              'Authorization': `Bearer ${githubToken}`
            }
          });

          console.log("  Response Status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ GitHub API Error:");
            console.error("  Status:", response.status);
            console.error("  Response:", errorText);
            return Response.json({
              error: `GitHub API error: ${response.status}`,
              details: errorText
            }, { status: response.status });
          }

          const data = await response.json();

          // Format search results
          const results = data.items.map((item: any) => ({
            name: item.name,
            path: item.path,
            repo: item.repository.full_name,
            url: item.html_url,
            sha: item.sha
          }));

          console.log("✅ Found", results.length, "results");

          return Response.json({
            total_count: data.total_count,
            results: results
          });
        } catch (error) {
          console.error("❌ GitHub search code error:", error);
          return Response.json({
            error: "Failed to search GitHub code",
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    },

    "/api/github/releases": {
      async POST(req) {
        try {
          const { repo, limit = 10 } = await req.json();
          console.log("\n🐙 GitHub Releases Request:");
          console.log("  Repo:", repo);
          console.log("  Limit:", limit);

          if (!repo) {
            return Response.json({ error: "Repo is required" }, { status: 400 });
          }

          // Validate allowed repos
          const allowedRepos = [
            "parkhub/smartpass-api",
            "parkhub/graph-api",
            "parkhub/smartpass-ui",
            "parkhub/smartpass-admin-ui",
            "parkhub/egds",
            "parkhub/data-migration",
            "parkhub/sp-loadtesting"
          ];

          if (!allowedRepos.includes(repo)) {
            console.error("❌ Unauthorized repo:", repo);
            return Response.json({
              error: "Unauthorized repository",
              allowedRepos
            }, { status: 403 });
          }

          const githubToken = process.env.GITHUB_TOKEN;

          if (!githubToken) {
            console.error("❌ GitHub token not configured!");
            return Response.json({ error: "GitHub not configured" }, { status: 500 });
          }

          const releasesUrl = `https://api.github.com/repos/${repo}/releases?per_page=${limit}`;
          console.log("  Releases URL:", releasesUrl);

          const response = await fetch(releasesUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
              'Authorization': `Bearer ${githubToken}`
            }
          });

          console.log("  Response Status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ GitHub API Error:");
            console.error("  Status:", response.status);
            console.error("  Response:", errorText);
            return Response.json({
              error: `GitHub API error: ${response.status}`,
              details: errorText
            }, { status: response.status });
          }

          const releases = await response.json();
          console.log("✅ Found", releases.length, "releases");

          // Format releases for Victor
          const formattedReleases = releases.map((release: any) => ({
            name: release.name,
            tag: release.tag_name,
            published: release.published_at,
            url: release.html_url,
            body: release.body?.substring(0, 500) || '', // Truncate long release notes
            author: release.author?.login,
            draft: release.draft,
            prerelease: release.prerelease
          }));

          formattedReleases.forEach((release: any) => {
            console.log("  📦", release.tag, "-", release.name);
          });

          return Response.json({ releases: formattedReleases });
        } catch (error) {
          console.error("❌ GitHub releases error:", error);
          return Response.json({
            error: "Failed to fetch GitHub releases",
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    },

    "/api/github/pull-requests": {
      async POST(req) {
        try {
          const { repo, state = 'open', limit = 10 } = await req.json();
          console.log("\n🐙 GitHub Pull Requests Request:");
          console.log("  Repo:", repo);
          console.log("  State:", state);
          console.log("  Limit:", limit);

          if (!repo) {
            return Response.json({ error: "Repo is required" }, { status: 400 });
          }

          // Validate allowed repos
          const allowedRepos = [
            "parkhub/smartpass-api",
            "parkhub/graph-api",
            "parkhub/smartpass-ui",
            "parkhub/smartpass-admin-ui",
            "parkhub/egds",
            "parkhub/data-migration",
            "parkhub/sp-loadtesting"
          ];

          if (!allowedRepos.includes(repo)) {
            console.error("❌ Unauthorized repo:", repo);
            return Response.json({
              error: "Unauthorized repository",
              allowedRepos
            }, { status: 403 });
          }

          const githubToken = process.env.GITHUB_TOKEN;

          if (!githubToken) {
            console.error("❌ GitHub token not configured!");
            return Response.json({ error: "GitHub not configured" }, { status: 500 });
          }

          const prUrl = `https://api.github.com/repos/${repo}/pulls?state=${state}&per_page=${Math.min(limit, 30)}`;
          console.log("  PR URL:", prUrl);

          const response = await fetch(prUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
              'Authorization': `Bearer ${githubToken}`
            }
          });

          console.log("  Response Status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ GitHub API Error:");
            console.error("  Status:", response.status);
            console.error("  Response:", errorText);
            return Response.json({
              error: `GitHub API error: ${response.status}`,
              details: errorText
            }, { status: response.status });
          }

          const prs = await response.json();
          console.log("✅ Found", prs.length, "pull requests");

          // Format PRs for Victor
          const formattedPRs = prs.map((pr: any) => ({
            number: pr.number,
            title: pr.title,
            state: pr.state,
            author: pr.user?.login,
            created: pr.created_at,
            updated: pr.updated_at,
            url: pr.html_url,
            draft: pr.draft,
            mergeable: pr.mergeable,
            merged: pr.merged,
            mergedAt: pr.merged_at,
            labels: pr.labels?.map((l: any) => l.name) || [],
            body: pr.body?.substring(0, 500) || '' // Truncate long descriptions
          }));

          formattedPRs.forEach((pr: any) => {
            console.log("  🔀", `#${pr.number}`, "-", pr.title, `(${pr.state})`);
          });

          return Response.json({ pullRequests: formattedPRs });
        } catch (error) {
          console.error("❌ GitHub PRs error:", error);
          return Response.json({
            error: "Failed to fetch GitHub pull requests",
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    },

    "/api/github/pull-request-details": {
      async POST(req) {
        try {
          const { repo, prNumber, includeDiff = true } = await req.json();
          console.log("\n🐙 GitHub PR Details Request:");
          console.log("  Repo:", repo);
          console.log("  PR Number:", prNumber);
          console.log("  Include Diff:", includeDiff);

          if (!repo || !prNumber) {
            return Response.json({ error: "Repo and prNumber are required" }, { status: 400 });
          }

          // Validate allowed repos
          const allowedRepos = [
            "parkhub/smartpass-api",
            "parkhub/graph-api",
            "parkhub/smartpass-ui",
            "parkhub/smartpass-admin-ui",
            "parkhub/egds",
            "parkhub/data-migration",
            "parkhub/sp-loadtesting"
          ];

          if (!allowedRepos.includes(repo)) {
            console.error("❌ Unauthorized repo:", repo);
            return Response.json({
              error: "Unauthorized repository",
              allowedRepos
            }, { status: 403 });
          }

          const githubToken = process.env.GITHUB_TOKEN;

          if (!githubToken) {
            console.error("❌ GitHub token not configured!");
            return Response.json({ error: "GitHub not configured" }, { status: 500 });
          }

          // Fetch PR details
          const prUrl = `https://api.github.com/repos/${repo}/pulls/${prNumber}`;
          console.log("  PR URL:", prUrl);

          const prResponse = await fetch(prUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
              'Authorization': `Bearer ${githubToken}`
            }
          });

          console.log("  PR Response Status:", prResponse.status);

          if (!prResponse.ok) {
            const errorText = await prResponse.text();
            console.error("❌ GitHub API Error:");
            console.error("  Status:", prResponse.status);
            console.error("  Response:", errorText);
            return Response.json({
              error: `GitHub API error: ${prResponse.status}`,
              details: errorText
            }, { status: prResponse.status });
          }

          const pr = await prResponse.json();
          console.log("✅ Fetched PR:", pr.title);

          // Fetch PR files/changes
          const filesUrl = `https://api.github.com/repos/${repo}/pulls/${prNumber}/files`;
          console.log("  Files URL:", filesUrl);

          const filesResponse = await fetch(filesUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
              'Authorization': `Bearer ${githubToken}`
            }
          });

          if (!filesResponse.ok) {
            console.error("❌ Failed to fetch PR files");
          }

          const files = filesResponse.ok ? await filesResponse.json() : [];
          console.log("✅ Found", files.length, "changed files");

          // Fetch check runs for the PR's head commit
          const checksUrl = `https://api.github.com/repos/${repo}/commits/${pr.head.sha}/check-runs`;
          console.log("  Checks URL:", checksUrl);

          const checksResponse = await fetch(checksUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
              'Authorization': `Bearer ${githubToken}`
            }
          });

          let checkRuns = [];
          if (checksResponse.ok) {
            const checksData = await checksResponse.json();
            checkRuns = checksData.check_runs || [];
            console.log("✅ Found", checkRuns.length, "check runs");
          } else {
            console.error("❌ Failed to fetch check runs");
          }

          // Fetch commit status (for non-Actions checks)
          const statusUrl = `https://api.github.com/repos/${repo}/commits/${pr.head.sha}/status`;
          console.log("  Status URL:", statusUrl);

          const statusResponse = await fetch(statusUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
              'Authorization': `Bearer ${githubToken}`
            }
          });

          let commitStatus = null;
          if (statusResponse.ok) {
            commitStatus = await statusResponse.json();
            console.log("✅ Fetched commit status:", commitStatus.state);
          } else {
            console.error("❌ Failed to fetch commit status");
          }

          // Format the response
          const formattedPR = {
            number: pr.number,
            title: pr.title,
            state: pr.state,
            author: pr.user?.login,
            created: pr.created_at,
            updated: pr.updated_at,
            merged: pr.merged,
            mergedAt: pr.merged_at,
            mergedBy: pr.merged_by?.login,
            url: pr.html_url,
            body: pr.body || '',
            draft: pr.draft,
            labels: pr.labels?.map((l: any) => l.name) || [],
            additions: pr.additions,
            deletions: pr.deletions,
            changedFiles: pr.changed_files,
            commits: pr.commits,
            headSha: pr.head.sha,
            headRef: pr.head.ref,
            baseRef: pr.base.ref,
            mergeable: pr.mergeable,
            mergeableState: pr.mergeable_state,
            checks: {
              overallStatus: commitStatus?.state || 'unknown',
              checkRuns: checkRuns.map((check: any) => ({
                name: check.name,
                status: check.status,
                conclusion: check.conclusion,
                startedAt: check.started_at,
                completedAt: check.completed_at,
                url: check.html_url,
                app: check.app?.name
              })),
              statusChecks: commitStatus?.statuses?.map((status: any) => ({
                context: status.context,
                state: status.state,
                description: status.description,
                url: status.target_url
              })) || []
            },
            files: files.map((file: any) => ({
              filename: file.filename,
              status: file.status,
              additions: file.additions,
              deletions: file.deletions,
              changes: file.changes,
              patch: includeDiff ? file.patch : undefined
            }))
          };

          return Response.json({ pullRequest: formattedPR });
        } catch (error) {
          console.error("❌ GitHub PR details error:", error);
          return Response.json({
            error: "Failed to fetch GitHub PR details",
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    },

    "/api/github/trigger-workflow": {
      async POST(req) {
        try {
          const { repo, workflowId, ref = 'main', inputs = {} } = await req.json();
          console.log("\n🐙 GitHub Trigger Workflow Request:");
          console.log("  Repo:", repo);
          console.log("  Workflow ID:", workflowId);
          console.log("  Ref:", ref);
          console.log("  Inputs:", inputs);

          if (!repo || !workflowId) {
            return Response.json({ error: "Repo and workflowId are required" }, { status: 400 });
          }

          // Validate allowed repos
          const allowedRepos = [
            "parkhub/smartpass-api",
            "parkhub/graph-api",
            "parkhub/smartpass-ui",
            "parkhub/smartpass-admin-ui",
            "parkhub/egds",
            "parkhub/data-migration",
            "parkhub/sp-loadtesting"
          ];

          if (!allowedRepos.includes(repo)) {
            console.error("❌ Unauthorized repo:", repo);
            return Response.json({
              error: "Unauthorized repository",
              allowedRepos
            }, { status: 403 });
          }

          const githubToken = process.env.GITHUB_TOKEN;

          if (!githubToken) {
            console.error("❌ GitHub token not configured!");
            return Response.json({ error: "GitHub not configured" }, { status: 500 });
          }

          const dispatchUrl = `https://api.github.com/repos/${repo}/actions/workflows/${workflowId}/dispatches`;
          console.log("  Dispatch URL:", dispatchUrl);

          const response = await fetch(dispatchUrl, {
            method: 'POST',
            headers: {
              'Accept': 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
              'Authorization': `Bearer ${githubToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ref,
              inputs
            })
          });

          console.log("  Response Status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ GitHub API Error:");
            console.error("  Status:", response.status);
            console.error("  Response:", errorText);
            return Response.json({
              error: `GitHub API error: ${response.status}`,
              details: errorText
            }, { status: response.status });
          }

          console.log("✅ Workflow triggered successfully");

          return Response.json({
            success: true,
            message: `Workflow '${workflowId}' triggered successfully on ${ref}`,
            repo,
            workflowId,
            ref
          });
        } catch (error) {
          console.error("❌ GitHub trigger workflow error:", error);
          return Response.json({
            error: "Failed to trigger GitHub workflow",
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    },

    "/api/github/rerun-workflow": {
      async POST(req) {
        try {
          const { repo, runId, failedJobsOnly = false } = await req.json();
          console.log("\n🐙 GitHub Re-run Workflow Request:");
          console.log("  Repo:", repo);
          console.log("  Run ID:", runId);
          console.log("  Failed Jobs Only:", failedJobsOnly);

          if (!repo || !runId) {
            return Response.json({ error: "Repo and runId are required" }, { status: 400 });
          }

          // Validate allowed repos
          const allowedRepos = [
            "parkhub/smartpass-api",
            "parkhub/graph-api",
            "parkhub/smartpass-ui",
            "parkhub/smartpass-admin-ui",
            "parkhub/egds",
            "parkhub/data-migration",
            "parkhub/sp-loadtesting"
          ];

          if (!allowedRepos.includes(repo)) {
            console.error("❌ Unauthorized repo:", repo);
            return Response.json({
              error: "Unauthorized repository",
              allowedRepos
            }, { status: 403 });
          }

          const githubToken = process.env.GITHUB_TOKEN;

          if (!githubToken) {
            console.error("❌ GitHub token not configured!");
            return Response.json({ error: "GitHub not configured" }, { status: 500 });
          }

          const endpoint = failedJobsOnly ? 'rerun-failed-jobs' : 'rerun';
          const rerunUrl = `https://api.github.com/repos/${repo}/actions/runs/${runId}/${endpoint}`;
          console.log("  Re-run URL:", rerunUrl);

          const response = await fetch(rerunUrl, {
            method: 'POST',
            headers: {
              'Accept': 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
              'Authorization': `Bearer ${githubToken}`
            }
          });

          console.log("  Response Status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ GitHub API Error:");
            console.error("  Status:", response.status);
            console.error("  Response:", errorText);
            return Response.json({
              error: `GitHub API error: ${response.status}`,
              details: errorText
            }, { status: response.status });
          }

          console.log("✅ Workflow re-run triggered successfully");

          return Response.json({
            success: true,
            message: failedJobsOnly
              ? `Failed jobs re-run triggered for workflow run ${runId}`
              : `Workflow run ${runId} re-run triggered successfully`,
            repo,
            runId,
            failedJobsOnly
          });
        } catch (error) {
          console.error("❌ GitHub rerun workflow error:", error);
          return Response.json({
            error: "Failed to re-run GitHub workflow",
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    },

    "/api/github/create-pr": {
      async POST(req) {
        try {
          const { repo, branch, files, title, body, commitMessage, base = "main" } = await req.json();
          console.log("\n🐙 GitHub Create PR Request:");
          console.log("  Repo:", repo);
          console.log("  Branch:", branch);
          console.log("  Base:", base);
          console.log("  Files:", files?.length);
          console.log("  Title:", title);

          if (!repo || !branch || !files || !title || !commitMessage) {
            return Response.json({
              error: "Repo, branch, files, title, and commitMessage are required"
            }, { status: 400 });
          }

          // Validate allowed repos
          const allowedRepos = [
            "parkhub/smartpass-api",
            "parkhub/graph-api",
            "parkhub/smartpass-ui",
            "parkhub/smartpass-admin-ui",
            "parkhub/egds",
            "parkhub/data-migration",
            "parkhub/sp-loadtesting"
          ];

          if (!allowedRepos.includes(repo)) {
            console.error("❌ Unauthorized repo:", repo);
            return Response.json({
              error: "Unauthorized repository",
              allowedRepos
            }, { status: 403 });
          }

          const githubToken = process.env.GITHUB_TOKEN;

          if (!githubToken) {
            console.error("❌ GitHub token not configured!");
            return Response.json({ error: "GitHub not configured" }, { status: 500 });
          }

          const headers = {
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Authorization': `Bearer ${githubToken}`
          };

          // 1. Get the base branch reference to get the latest commit SHA
          console.log("  Step 1: Getting base branch reference...");
          const baseRefUrl = `https://api.github.com/repos/${repo}/git/refs/heads/${base}`;
          const baseRefResponse = await fetch(baseRefUrl, { headers });

          if (!baseRefResponse.ok) {
            const errorText = await baseRefResponse.text();
            console.error("❌ Failed to get base branch:", errorText);
            return Response.json({
              error: `Failed to get base branch: ${baseRefResponse.status}`,
              details: errorText
            }, { status: baseRefResponse.status });
          }

          const baseRef = await baseRefResponse.json();
          const baseSha = baseRef.object.sha;
          console.log("  Base SHA:", baseSha);

          // 2. Create a new branch
          console.log("  Step 2: Creating new branch...");
          const createBranchUrl = `https://api.github.com/repos/${repo}/git/refs`;
          const createBranchResponse = await fetch(createBranchUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              ref: `refs/heads/${branch}`,
              sha: baseSha
            })
          });

          if (!createBranchResponse.ok) {
            const errorText = await createBranchResponse.text();
            console.error("❌ Failed to create branch:", errorText);
            return Response.json({
              error: `Failed to create branch: ${createBranchResponse.status}`,
              details: errorText
            }, { status: createBranchResponse.status });
          }

          console.log("  ✅ Branch created:", branch);

          // 3. Create/update files on the new branch
          console.log("  Step 3: Updating files...");
          for (const file of files) {
            console.log("    Updating:", file.path);

            // Check if file exists to get its SHA
            const fileUrl = `https://api.github.com/repos/${repo}/contents/${file.path}?ref=${branch}`;
            const fileResponse = await fetch(fileUrl, { headers });

            let fileSha = null;
            if (fileResponse.ok) {
              const fileData = await fileResponse.json();
              fileSha = fileData.sha;
              console.log("      File exists, SHA:", fileSha);
            } else {
              console.log("      New file");
            }

            // Update or create the file
            const updateFileUrl = `https://api.github.com/repos/${repo}/contents/${file.path}`;
            const updateFileResponse = await fetch(updateFileUrl, {
              method: 'PUT',
              headers,
              body: JSON.stringify({
                message: commitMessage,
                content: Buffer.from(file.content).toString('base64'),
                branch: branch,
                ...(fileSha && { sha: fileSha })
              })
            });

            if (!updateFileResponse.ok) {
              const errorText = await updateFileResponse.text();
              console.error("❌ Failed to update file:", file.path, errorText);
              return Response.json({
                error: `Failed to update file ${file.path}: ${updateFileResponse.status}`,
                details: errorText
              }, { status: updateFileResponse.status });
            }

            console.log("      ✅ Updated");
          }

          // 4. Create the pull request
          console.log("  Step 4: Creating pull request...");
          const createPRUrl = `https://api.github.com/repos/${repo}/pulls`;
          const createPRResponse = await fetch(createPRUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              title,
              body: body || "",
              head: branch,
              base: base
            })
          });

          if (!createPRResponse.ok) {
            const errorText = await createPRResponse.text();
            console.error("❌ Failed to create PR:", errorText);
            return Response.json({
              error: `Failed to create PR: ${createPRResponse.status}`,
              details: errorText
            }, { status: createPRResponse.status });
          }

          const pr = await createPRResponse.json();
          console.log("  ✅ PR created:", pr.html_url);

          return Response.json({
            success: true,
            message: "Pull request created successfully",
            pr: {
              number: pr.number,
              title: pr.title,
              url: pr.html_url,
              branch: branch,
              base: base
            }
          });
        } catch (error) {
          console.error("❌ GitHub create PR error:", error);
          return Response.json({
            error: "Failed to create GitHub pull request",
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    },

    "/api/github/update-pr": {
      async POST(req) {
        try {
          const { repo, branch, prNumber, files, commitMessage } = await req.json();
          console.log("\n🐙 GitHub Update PR Request:");
          console.log("  Repo:", repo);
          console.log("  Branch:", branch);
          console.log("  PR Number:", prNumber);
          console.log("  Files:", files?.length);

          if (!repo || !branch || !files || !commitMessage) {
            return Response.json({
              error: "Repo, branch, files, and commitMessage are required"
            }, { status: 400 });
          }

          // Validate allowed repos
          const allowedRepos = [
            "parkhub/smartpass-api",
            "parkhub/graph-api",
            "parkhub/smartpass-ui",
            "parkhub/smartpass-admin-ui",
            "parkhub/egds",
            "parkhub/data-migration",
            "parkhub/sp-loadtesting"
          ];

          if (!allowedRepos.includes(repo)) {
            console.error("❌ Unauthorized repo:", repo);
            return Response.json({
              error: "Unauthorized repository",
              allowedRepos
            }, { status: 403 });
          }

          const githubToken = process.env.GITHUB_TOKEN;

          if (!githubToken) {
            console.error("❌ GitHub token not configured!");
            return Response.json({ error: "GitHub not configured" }, { status: 500 });
          }

          const headers = {
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Authorization': `Bearer ${githubToken}`
          };

          // 1. Verify the branch exists
          console.log("  Step 1: Verifying branch exists...");
          const branchRefUrl = `https://api.github.com/repos/${repo}/git/refs/heads/${branch}`;
          const branchRefResponse = await fetch(branchRefUrl, { headers });

          if (!branchRefResponse.ok) {
            const errorText = await branchRefResponse.text();
            console.error("❌ Branch does not exist:", errorText);
            return Response.json({
              error: `Branch '${branch}' does not exist. Use create_github_pull_request to create a new PR.`,
              details: errorText
            }, { status: 404 });
          }

          const branchRef = await branchRefResponse.json();
          const branchSha = branchRef.object.sha;
          console.log("  Current branch SHA:", branchSha);

          // 2. Update files on the existing branch
          console.log("  Step 2: Updating files...");
          for (const file of files) {
            console.log("    Updating:", file.path);

            // Check if file exists to get its SHA
            const fileUrl = `https://api.github.com/repos/${repo}/contents/${file.path}?ref=${branch}`;
            const fileResponse = await fetch(fileUrl, { headers });

            let fileSha = null;
            if (fileResponse.ok) {
              const fileData = await fileResponse.json();
              fileSha = fileData.sha;
              console.log("      File exists, SHA:", fileSha);
            } else {
              console.log("      New file");
            }

            // Update or create the file
            const updateFileUrl = `https://api.github.com/repos/${repo}/contents/${file.path}`;
            const updateFileResponse = await fetch(updateFileUrl, {
              method: 'PUT',
              headers,
              body: JSON.stringify({
                message: commitMessage,
                content: Buffer.from(file.content).toString('base64'),
                branch: branch,
                ...(fileSha && { sha: fileSha })
              })
            });

            if (!updateFileResponse.ok) {
              const errorText = await updateFileResponse.text();
              console.error("❌ Failed to update file:", file.path, errorText);
              return Response.json({
                error: `Failed to update file ${file.path}: ${updateFileResponse.status}`,
                details: errorText
              }, { status: updateFileResponse.status });
            }

            console.log("      ✅ Updated");
          }

          // 3. Get PR details if prNumber was provided
          let prUrl = null;
          if (prNumber) {
            console.log("  Step 3: Getting PR details...");
            const prDetailsUrl = `https://api.github.com/repos/${repo}/pulls/${prNumber}`;
            const prDetailsResponse = await fetch(prDetailsUrl, { headers });

            if (prDetailsResponse.ok) {
              const prData = await prDetailsResponse.json();
              prUrl = prData.html_url;
              console.log("  ✅ PR updated:", prUrl);
            }
          }

          return Response.json({
            success: true,
            message: `Successfully pushed ${files.length} file(s) to branch '${branch}'`,
            pr: prNumber ? {
              number: prNumber,
              url: prUrl,
              branch: branch
            } : {
              branch: branch,
              message: "Changes pushed to branch (no PR number provided)"
            }
          });
        } catch (error) {
          console.error("❌ GitHub update PR error:", error);
          return Response.json({
            error: "Failed to update GitHub pull request",
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    },

    "/api/submit": {
      POST: async (req) => {
        try {
          const { message, history = [] } = await req.json();

          if (!message) {
            return Response.json({ error: "Message is required" }, { status: 400 });
          }

          console.log("Received message:", message);

          // Build messages array from history and current message
          const messages = [
            ...history,
            { role: "user", content: message }
          ];

          const response = await anthropic.beta.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 8192,
            betas: ["advanced-tool-use-2025-11-20"],
            system: victorSystemPrompt,
            messages,
            tools: [
              {
                type: "tool_search_tool_bm25_20251119",
                name: "tool_search_tool_bm25"
              },
              {
                type: "text_editor_20250728",
                name: "str_replace_based_edit_tool"
              },
              {
                name: "list_confluence_root",
                description: "List all root-level pages and folders in the FRONTIER Confluence space. Use this FIRST when users ask general questions about Confluence documentation to see what folders/sections exist. This helps you browse the structure before searching.",
                input_schema: {
                  type: "object",
                  properties: {},
                  required: []
                }
              },
              {
                name: "search_confluence",
                description: "Search the team's Confluence knowledge base for documentation, guides, and information. Use this when the user asks about team processes, documentation, or you need to look up specific information.",
                input_schema: {
                  type: "object",
                  properties: {
                    query: {
                      type: "string",
                      description: "The search query to find relevant Confluence pages"
                    }
                  },
                  required: ["query"]
                }
              },
              {
                name: "get_confluence_page",
                description: "Retrieve the full content of a specific Confluence page by its ID. Use this after searching to get detailed information from a page, or when extracting page ID from a URL the user provided.",
                input_schema: {
                  type: "object",
                  properties: {
                    pageId: {
                      type: "string",
                      description: "The Confluence page ID to retrieve"
                    }
                  },
                  required: ["pageId"]
                }
              },
              {
                name: "get_confluence_children",
                description: "Get all child pages under a parent page or folder. Use this when you find a folder/parent page and want to see what documents are inside it. Helpful for browsing release folders or documentation sections.",
                input_schema: {
                  type: "object",
                  properties: {
                    pageId: {
                      type: "string",
                      description: "The parent page/folder ID to get children from"
                    }
                  },
                  required: ["pageId"]
                },
                defer_loading: true
              },
              {
                name: "create_confluence_page",
                description: "Create a new Confluence page in the FRONTIER space. IMPORTANT: You MUST provide BOTH title and content - you cannot create an empty page. If the user hasn't specified what content to include, either ask them or write appropriate content based on context.",
                input_schema: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                      description: "The title of the new page (REQUIRED)"
                    },
                    content: {
                      type: "string",
                      description: "The page content in Confluence storage format - simple XHTML (REQUIRED - cannot be empty). Use: <h1>, <h2>, <h3>, <p>, <ul><li>, <ol><li>, <strong>, <em>, <code>, <pre><code>. NEVER use markdown (no #, ##, *, **, ```). Example: '<h1>Title</h1><p>Content here</p><ul><li>Item</li></ul>'. Must contain actual content."
                    },
                    parentPageId: {
                      type: "string",
                      description: "Optional: The parent page ID if this should be created under a specific page/folder"
                    }
                  },
                  required: ["title", "content"]
                },
                defer_loading: true
              },
              {
                name: "update_confluence_page",
                description: "Update an existing Confluence page with new content. Use this when users ask you to edit, update, modify, or add to an existing page. You can update the content and optionally change the title.",
                input_schema: {
                  type: "object",
                  properties: {
                    pageId: {
                      type: "string",
                      description: "The ID of the page to update"
                    },
                    content: {
                      type: "string",
                      description: "The new page content in Confluence storage format (XHTML-based). Use tags like <h1>, <h2>, <p>, <ul>, <li>, <code>, <strong>, <em>. Do NOT use markdown syntax (no #, *, **, ```). This will replace the existing content."
                    },
                    title: {
                      type: "string",
                      description: "Optional: New title for the page. If not provided, keeps the existing title."
                    }
                  },
                  required: ["pageId", "content"]
                },
                defer_loading: true
              },
              {
                name: "create_confluence_folder",
                description: "Create a new Confluence folder in the FRONTIER space. Use this when users want to organize documentation, create a new folder for a project, or need a container for multiple related pages.",
                input_schema: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                      description: "The title/name of the new folder"
                    },
                    parentPageId: {
                      type: "string",
                      description: "Optional: The parent page/folder ID if this should be created inside another folder"
                    }
                  },
                  required: ["title"]
                },
                defer_loading: true
              },
              {
                name: "get_api_documentation",
                description: "Get the external SmartPass Partner API documentation (Swagger/OpenAPI spec). This is the PUBLIC API used by external integrators like Ticketmaster and resellers, NOT the internal API. Use this when users ask about external partner endpoints, how partners integrate, or what we expose to external clients.",
                input_schema: {
                  type: "object",
                  properties: {
                    endpoint: {
                      type: "string",
                      description: "Optional: Filter to specific endpoint path (e.g., '/passes', '/auth'). If omitted, returns full API spec."
                    }
                  },
                  required: []
                },
                defer_loading: true
              },
              {
                name: "get_github_releases",
                description: "Get recent releases from Frontier GitHub repositories. Use this when users ask about releases, deployments, what version is deployed, or what's in the latest release.",
                input_schema: {
                  type: "object",
                  properties: {
                    repo: {
                      type: "string",
                      description: "The repository name in format 'owner/repo'. Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds, parkhub/data-migration, parkhub/sp-loadtesting",
                      enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds", "parkhub/data-migration", "parkhub/sp-loadtesting"]
                    },
                    limit: {
                      type: "number",
                      description: "Number of releases to fetch (default: 10, max: 30)"
                    }
                  },
                  required: ["repo"]
                },
                defer_loading: true
              },
              {
                name: "read_github_file",
                description: "Read the contents of a specific file from a Frontier GitHub repository. Use this when users want to see code, read a specific file, or examine implementation details.",
                input_schema: {
                  type: "object",
                  properties: {
                    repo: {
                      type: "string",
                      description: "The repository name in format 'owner/repo'. Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds, parkhub/data-migration, parkhub/sp-loadtesting",
                      enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds", "parkhub/data-migration", "parkhub/sp-loadtesting"]
                    },
                    path: {
                      type: "string",
                      description: "The file path within the repository (e.g., 'src/models/User.ts', 'README.md')"
                    },
                    branch: {
                      type: "string",
                      description: "The branch name (default: 'main')"
                    }
                  },
                  required: ["repo", "path"]
                },
                defer_loading: true
              },
              {
                name: "list_github_directory",
                description: "List files and directories in a specific GitHub repository. IMPORTANT: You must always specify which repository to list. If the user doesn't specify a repo, ask them which one they want to explore, or if the context is clear (e.g., they're asking about the API), use the appropriate repo.",
                input_schema: {
                  type: "object",
                  properties: {
                    repo: {
                      type: "string",
                      description: "REQUIRED: The repository name in format 'owner/repo'. Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds, parkhub/data-migration, parkhub/sp-loadtesting",
                      enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds", "parkhub/data-migration", "parkhub/sp-loadtesting"]
                    },
                    path: {
                      type: "string",
                      description: "The directory path to list (empty string or omit for root directory)"
                    },
                    branch: {
                      type: "string",
                      description: "The branch name (default: 'main')"
                    }
                  },
                  required: ["repo"]
                },
                defer_loading: true
              },
              {
                name: "search_github_code",
                description: "Search for code across Frontier GitHub repositories. Use this to find where specific functions, classes, or patterns are used.",
                input_schema: {
                  type: "object",
                  properties: {
                    query: {
                      type: "string",
                      description: "The search query (e.g., 'function validatePass', 'class UserModel', 'import express')"
                    },
                    repo: {
                      type: "string",
                      description: "Optional: Limit search to a specific repo. If omitted, searches all Frontier repos.",
                      enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds", "parkhub/data-migration", "parkhub/sp-loadtesting"]
                    }
                  },
                  required: ["query"]
                },
                defer_loading: true
              },
              {
                name: "list_github_pull_requests",
                description: "List pull requests from Frontier GitHub repositories. Use this when users ask about PRs, want to see open/closed PRs, or check PR status.",
                input_schema: {
                  type: "object",
                  properties: {
                    repo: {
                      type: "string",
                      description: "The repository name in format 'owner/repo'. Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds, parkhub/data-migration, parkhub/sp-loadtesting",
                      enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds", "parkhub/data-migration", "parkhub/sp-loadtesting"]
                    },
                    state: {
                      type: "string",
                      description: "Filter by PR state: 'open', 'closed', or 'all' (default: 'open')",
                      enum: ["open", "closed", "all"]
                    },
                    limit: {
                      type: "number",
                      description: "Number of PRs to fetch (default: 10, max: 30)"
                    }
                  },
                  required: ["repo"]
                },
                defer_loading: true
              },
              {
                name: "get_github_pull_request",
                description: "Get detailed information about a specific GitHub pull request including description, changes, diff, and CI/CD status (GitHub Actions, tests, builds). Use this when users provide a PR URL like 'https://github.com/parkhub/graph-api/pull/1056' or ask about checks/tests. Extract the repo as 'parkhub/graph-api' (combined owner/repo) and the PR number as 1056.",
                input_schema: {
                  type: "object",
                  properties: {
                    repo: {
                      type: "string",
                      description: "The FULL repository name in format 'owner/repo' (e.g., 'parkhub/graph-api', NOT just 'graph-api'). Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds, parkhub/data-migration, parkhub/sp-loadtesting",
                      enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds", "parkhub/data-migration", "parkhub/sp-loadtesting"]
                    },
                    prNumber: {
                      type: "number",
                      description: "The pull request number (e.g., 1056 from the URL https://github.com/parkhub/graph-api/pull/1056)"
                    },
                    includeDiff: {
                      type: "boolean",
                      description: "Whether to include the full diff of changes (default: true)"
                    }
                  },
                  required: ["repo", "prNumber"]
                },
                defer_loading: true
              },
              {
                name: "trigger_github_workflow",
                description: "Trigger a GitHub Actions workflow run. Use this when users ask to run a workflow, trigger a deployment, re-run tests, or start a CI/CD job. IMPORTANT: Ask the user for confirmation before triggering workflows.",
                input_schema: {
                  type: "object",
                  properties: {
                    repo: {
                      type: "string",
                      description: "The FULL repository name in format 'owner/repo' (e.g., 'parkhub/graph-api'). Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds, parkhub/data-migration, parkhub/sp-loadtesting",
                      enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds", "parkhub/data-migration", "parkhub/sp-loadtesting"]
                    },
                    workflowId: {
                      type: "string",
                      description: "The workflow file name (e.g., 'ci.yml', 'deploy.yml') or workflow ID number"
                    },
                    ref: {
                      type: "string",
                      description: "The git reference (branch/tag) to run the workflow on (default: 'main')"
                    },
                    inputs: {
                      type: "object",
                      description: "Optional inputs for the workflow (if it accepts workflow_dispatch inputs)"
                    }
                  },
                  required: ["repo", "workflowId"]
                },
                defer_loading: true
              },
              {
                name: "rerun_github_workflow",
                description: "Re-run a failed GitHub Actions workflow run. Use this when users ask to re-run failed checks, retry a failed build, or restart failed tests on a PR.",
                input_schema: {
                  type: "object",
                  properties: {
                    repo: {
                      type: "string",
                      description: "The FULL repository name in format 'owner/repo' (e.g., 'parkhub/graph-api'). Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds, parkhub/data-migration, parkhub/sp-loadtesting",
                      enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds", "parkhub/data-migration", "parkhub/sp-loadtesting"]
                    },
                    runId: {
                      type: "number",
                      description: "The workflow run ID to re-run (get this from check runs in the PR details)"
                    },
                    failedJobsOnly: {
                      type: "boolean",
                      description: "Whether to re-run only failed jobs (true) or all jobs (false). Default: false"
                    }
                  },
                  required: ["repo", "runId"]
                },
                defer_loading: true
              },
              {
                name: "create_github_pull_request",
                description: "Create a new GitHub pull request with code changes. Use this when users ask you to make code changes, fix bugs, add features, or update files. This will create a new branch, commit the changes, and open a PR.",
                input_schema: {
                  type: "object",
                  properties: {
                    repo: {
                      type: "string",
                      description: "The repository name in format 'owner/repo'. Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds, parkhub/data-migration, parkhub/sp-loadtesting",
                      enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds", "parkhub/data-migration", "parkhub/sp-loadtesting"]
                    },
                    branch: {
                      type: "string",
                      description: "The branch name for the PR (e.g., 'fix/auth-bug', 'feature/dark-mode'). Use descriptive names with prefixes like fix/, feature/, chore/"
                    },
                    files: {
                      type: "array",
                      description: "Array of files to create or update. Each file object must have 'path' (relative to repo root) and 'content' (full file content as string)",
                      items: {
                        type: "object",
                        properties: {
                          path: {
                            type: "string",
                            description: "File path relative to repo root (e.g., 'src/auth.ts', 'README.md')"
                          },
                          content: {
                            type: "string",
                            description: "Complete file content as a string"
                          }
                        },
                        required: ["path", "content"]
                      }
                    },
                    title: {
                      type: "string",
                      description: "Clear, concise PR title that describes the changes"
                    },
                    body: {
                      type: "string",
                      description: "Detailed PR description including context, changes made, testing instructions, and any related ticket numbers"
                    },
                    commitMessage: {
                      type: "string",
                      description: "Commit message that explains what and why"
                    },
                    base: {
                      type: "string",
                      description: "Base branch to merge into (default: 'main')"
                    }
                  },
                  required: ["repo", "branch", "files", "title", "commitMessage"]
                },
                defer_loading: true
              },
              {
                name: "update_github_pull_request",
                description: "Update an existing GitHub pull request by pushing additional commits to its branch. Use this when you need to add changes to a PR that already exists, or when a user asks you to update/modify an existing PR. IMPORTANT: You must know the branch name - if unsure, ask the user or use the GitHub API to look it up by PR number.",
                input_schema: {
                  type: "object",
                  properties: {
                    repo: {
                      type: "string",
                      description: "The repository name in format 'owner/repo'. Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds, parkhub/data-migration, parkhub/sp-loadtesting",
                      enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds", "parkhub/data-migration", "parkhub/sp-loadtesting"]
                    },
                    branch: {
                      type: "string",
                      description: "The existing branch name for the PR (e.g., 'fix/auth-bug'). This branch must already exist."
                    },
                    prNumber: {
                      type: "number",
                      description: "The PR number (optional, helps with logging and confirmation)"
                    },
                    files: {
                      type: "array",
                      description: "Array of files to create or update. Each file object must have 'path' (relative to repo root) and 'content' (full file content as string)",
                      items: {
                        type: "object",
                        properties: {
                          path: {
                            type: "string",
                            description: "File path relative to repo root (e.g., 'src/auth.ts', 'README.md')"
                          },
                          content: {
                            type: "string",
                            description: "Complete file content as a string"
                          }
                        },
                        required: ["path", "content"]
                      }
                    },
                    commitMessage: {
                      type: "string",
                      description: "Commit message that explains what changes are being added"
                    }
                  },
                  required: ["repo", "branch", "files", "commitMessage"]
                },
                defer_loading: true
              },
              {
                name: "get_jira_issue",
                description: "Get details of a specific Jira ticket by its key (e.g., PV-123). Use this when users ask about a specific ticket, want to check ticket status, or reference a ticket number.",
                input_schema: {
                  type: "object",
                  properties: {
                    issueKey: {
                      type: "string",
                      description: "The Jira issue key (e.g., 'PV-123', 'PV-456')"
                    }
                  },
                  required: ["issueKey"]
                },
                defer_loading: true
              },
              {
                name: "search_jira_issues",
                description: "Search for Jira tickets in the PV (Frontier) project by keywords and/or sprint. Use this when users ask to find tickets, search for work items, or look up tickets by topic (e.g., 'find tickets about authentication', 'search for API bugs', 'what's in the current sprint').",
                input_schema: {
                  type: "object",
                  properties: {
                    query: {
                      type: "string",
                      description: "Search keywords to find in ticket summaries and descriptions (optional if sprintId is provided)"
                    },
                    sprintId: {
                      type: "number",
                      description: "Filter tickets by sprint ID (obtained from get_current_sprint). Use this when searching for tickets in a specific sprint."
                    },
                    maxResults: {
                      type: "number",
                      description: "Maximum number of results to return (default: 10, max: 50)"
                    }
                  },
                  required: []
                },
                defer_loading: true
              },
              {
                name: "create_jira_issue",
                description: "Create a new Jira ticket in the PV (Frontier) project. Use this when users ask to create a ticket, track a bug, create a story, or document work that needs to be done.",
                input_schema: {
                  type: "object",
                  properties: {
                    summary: {
                      type: "string",
                      description: "The ticket title/summary (required, concise one-liner)"
                    },
                    description: {
                      type: "string",
                      description: "The ticket description with details, context, acceptance criteria, etc."
                    },
                    issueType: {
                      type: "string",
                      description: "The type of issue to create",
                      enum: ["Story", "Task", "Bug", "Epic"]
                    },
                    priority: {
                      type: "string",
                      description: "The priority level",
                      enum: ["Highest", "High", "Medium", "Low", "Lowest"]
                    },
                    storyPoints: {
                      type: "number",
                      description: "Story points for the ticket (1 = smallest, 2 = medium, 3 = largest)",
                      enum: [1, 2, 3]
                    }
                  },
                  required: ["summary"]
                },
                defer_loading: true
              },
              {
                name: "get_current_sprint",
                description: "Get the current active sprint for the Frontier team. Use this when users reference 'current sprint', 'my team's sprint', 'this sprint', or 'active sprint'. Returns sprint name, dates, and ID which can be used to search for tickets.",
                input_schema: {
                  type: "object",
                  properties: {},
                  required: []
                },
                defer_loading: true
              }
            ]
          });

          // Handle tool use
          let finalMessages = [...messages];
          let finalResponse = response;

          while (finalResponse.stop_reason === "tool_use") {
            // Find ALL tool_use blocks in the response
            const toolUseBlocks = finalResponse.content.filter(block => block.type === "tool_use");

            if (toolUseBlocks.length === 0) {
              console.error("❌ Expected tool_use blocks but didn't find any");
              break;
            }

            console.log(`\n🤖 Victor is using ${toolUseBlocks.length} tool(s)`);

            // Execute all tools and collect results
            const toolResults: any[] = [];

            for (const toolUseBlock of toolUseBlocks) {
              if (toolUseBlock.type !== "tool_use") continue;

              console.log("\n  🔧 Tool:", toolUseBlock.name);
              console.log("    Tool ID:", toolUseBlock.id);
              console.log("    Input:", JSON.stringify(toolUseBlock.input, null, 2));

              let toolResult;

              // Execute the tool
              if (toolUseBlock.name === "list_confluence_root") {
              console.log("  → Calling list_confluence_root");
              const listRootRes = await fetch("http://localhost:3000/api/confluence/list-root", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
              });

              if (!listRootRes.ok) {
                console.error("  ❌ Tool call failed with status:", listRootRes.status);
              }

              toolResult = await listRootRes.json();
              console.log("  ✅ Tool result:", toolResult);
            } else if (toolUseBlock.name === "search_confluence") {
              console.log("  → Calling search_confluence with query:", toolUseBlock.input.query);
              const searchRes = await fetch("http://localhost:3000/api/confluence/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: toolUseBlock.input.query })
              });

              if (!searchRes.ok) {
                console.error("  ❌ Tool call failed with status:", searchRes.status);
              }

              toolResult = await searchRes.json();
              console.log("  ✅ Tool result:", toolResult);
            } else if (toolUseBlock.name === "get_confluence_page") {
              console.log("  → Calling get_confluence_page with pageId:", toolUseBlock.input.pageId);
              const pageRes = await fetch("http://localhost:3000/api/confluence/page", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pageId: toolUseBlock.input.pageId })
              });

              if (!pageRes.ok) {
                console.error("  ❌ Tool call failed with status:", pageRes.status);
              }

              toolResult = await pageRes.json();
              console.log("  ✅ Tool result received");
            } else if (toolUseBlock.name === "get_confluence_children") {
              console.log("  → Calling get_confluence_children with pageId:", toolUseBlock.input.pageId);
              const childrenRes = await fetch("http://localhost:3000/api/confluence/children", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pageId: toolUseBlock.input.pageId })
              });

              if (!childrenRes.ok) {
                console.error("  ❌ Tool call failed with status:", childrenRes.status);
              }

              toolResult = await childrenRes.json();
              console.log("  ✅ Tool result:", toolResult);
            } else if (toolUseBlock.name === "create_confluence_page") {
              console.log("  → Calling create_confluence_page");
              console.log("    Title:", toolUseBlock.input.title);
              console.log("    Parent Page ID:", toolUseBlock.input.parentPageId || "None");
              const createRes = await fetch("http://localhost:3000/api/confluence/create-page", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: toolUseBlock.input.title,
                  content: toolUseBlock.input.content,
                  parentPageId: toolUseBlock.input.parentPageId
                })
              });

              if (!createRes.ok) {
                console.error("  ❌ Tool call failed with status:", createRes.status);
              }

              toolResult = await createRes.json();
              console.log("  ✅ Tool result:", toolResult);
            } else if (toolUseBlock.name === "update_confluence_page") {
              console.log("  → Calling update_confluence_page");
              console.log("    Page ID:", toolUseBlock.input.pageId);
              console.log("    New Title:", toolUseBlock.input.title || "(keeping existing)");
              const updateRes = await fetch("http://localhost:3000/api/confluence/update-page", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  pageId: toolUseBlock.input.pageId,
                  content: toolUseBlock.input.content,
                  title: toolUseBlock.input.title
                })
              });

              if (!updateRes.ok) {
                console.error("  ❌ Tool call failed with status:", updateRes.status);
              }

              toolResult = await updateRes.json();
              console.log("  ✅ Tool result:", toolResult);
            } else if (toolUseBlock.name === "create_confluence_folder") {
              console.log("  → Calling create_confluence_folder");
              console.log("    Title:", toolUseBlock.input.title);
              console.log("    Parent Page ID:", toolUseBlock.input.parentPageId || "None");
              const createFolderRes = await fetch("http://localhost:3000/api/confluence/create-folder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: toolUseBlock.input.title,
                  parentPageId: toolUseBlock.input.parentPageId
                })
              });

              if (!createFolderRes.ok) {
                console.error("  ❌ Tool call failed with status:", createFolderRes.status);
              }

              toolResult = await createFolderRes.json();
              console.log("  ✅ Tool result:", toolResult);
            } else if (toolUseBlock.name === "get_github_releases") {
              console.log("  → Calling get_github_releases");
              console.log("    Repo:", toolUseBlock.input.repo);
              console.log("    Limit:", toolUseBlock.input.limit || 10);
              const releasesRes = await fetch("http://localhost:3000/api/github/releases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  repo: toolUseBlock.input.repo,
                  limit: toolUseBlock.input.limit || 10
                })
              });

              if (!releasesRes.ok) {
                console.error("  ❌ Tool call failed with status:", releasesRes.status);
              }

              toolResult = await releasesRes.json();
              console.log("    ✅ Tool result received");
            } else if (toolUseBlock.name === "get_jira_issue") {
              console.log("  → Calling get_jira_issue");
              console.log("    Issue Key:", toolUseBlock.input.issueKey);
              const getIssueRes = await fetch("http://localhost:3000/api/jira/get-issue", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  issueKey: toolUseBlock.input.issueKey
                })
              });

              if (!getIssueRes.ok) {
                console.error("  ❌ Tool call failed with status:", getIssueRes.status);
              }

              toolResult = await getIssueRes.json();
              console.log("    ✅ Tool result received");
            } else if (toolUseBlock.name === "search_jira_issues") {
              console.log("  → Calling search_jira_issues");
              console.log("    Query:", toolUseBlock.input.query || "None");
              console.log("    Sprint ID:", toolUseBlock.input.sprintId || "None");
              console.log("    Max Results:", toolUseBlock.input.maxResults || 10);
              const searchIssuesRes = await fetch("http://localhost:3000/api/jira/search-issues", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  query: toolUseBlock.input.query,
                  sprintId: toolUseBlock.input.sprintId,
                  maxResults: toolUseBlock.input.maxResults
                })
              });

              if (!searchIssuesRes.ok) {
                console.error("  ❌ Tool call failed with status:", searchIssuesRes.status);
              }

              toolResult = await searchIssuesRes.json();
              console.log("    ✅ Tool result received");
            } else if (toolUseBlock.name === "create_jira_issue") {
              console.log("  → Calling create_jira_issue");
              console.log("    Summary:", toolUseBlock.input.summary);
              console.log("    Issue Type:", toolUseBlock.input.issueType || "Story");
              console.log("    Priority:", toolUseBlock.input.priority || "Medium");
              console.log("    Story Points:", toolUseBlock.input.storyPoints || "Not set");
              const jiraRes = await fetch("http://localhost:3000/api/jira/create-issue", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  summary: toolUseBlock.input.summary,
                  description: toolUseBlock.input.description,
                  issueType: toolUseBlock.input.issueType,
                  priority: toolUseBlock.input.priority,
                  storyPoints: toolUseBlock.input.storyPoints
                })
              });

              if (!jiraRes.ok) {
                console.error("  ❌ Tool call failed with status:", jiraRes.status);
              }

              toolResult = await jiraRes.json();
              console.log("    ✅ Tool result:", toolResult);
            } else if (toolUseBlock.name === "get_current_sprint") {
              console.log("  → Calling get_current_sprint");
              const sprintRes = await fetch("http://localhost:3000/api/jira/get-current-sprint", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
              });

              if (!sprintRes.ok) {
                console.error("  ❌ Tool call failed with status:", sprintRes.status);
              }

              toolResult = await sprintRes.json();
              console.log("    ✅ Tool result received");
            } else if (toolUseBlock.name === "read_github_file") {
              console.log("  → Calling read_github_file");
              console.log("    Repo:", toolUseBlock.input.repo);
              console.log("    Path:", toolUseBlock.input.path);
              console.log("    Branch:", toolUseBlock.input.branch || "main");
              const readFileRes = await fetch("http://localhost:3000/api/github/read-file", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  repo: toolUseBlock.input.repo,
                  path: toolUseBlock.input.path,
                  branch: toolUseBlock.input.branch
                })
              });

              if (!readFileRes.ok) {
                console.error("  ❌ Tool call failed with status:", readFileRes.status);
              }

              toolResult = await readFileRes.json();
              console.log("    ✅ Tool result received");
            } else if (toolUseBlock.name === "list_github_directory") {
              console.log("  → Calling list_github_directory");
              console.log("    Repo:", toolUseBlock.input.repo);
              console.log("    Path:", toolUseBlock.input.path || "(root)");
              console.log("    Branch:", toolUseBlock.input.branch || "main");
              const listDirRes = await fetch("http://localhost:3000/api/github/list-directory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  repo: toolUseBlock.input.repo,
                  path: toolUseBlock.input.path,
                  branch: toolUseBlock.input.branch
                })
              });

              if (!listDirRes.ok) {
                console.error("  ❌ Tool call failed with status:", listDirRes.status);
              }

              toolResult = await listDirRes.json();
              console.log("    ✅ Tool result received");
            } else if (toolUseBlock.name === "search_github_code") {
              console.log("  → Calling search_github_code");
              console.log("    Query:", toolUseBlock.input.query);
              console.log("    Repo:", toolUseBlock.input.repo || "all Frontier repos");
              const searchCodeRes = await fetch("http://localhost:3000/api/github/search-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  query: toolUseBlock.input.query,
                  repo: toolUseBlock.input.repo
                })
              });

              if (!searchCodeRes.ok) {
                console.error("  ❌ Tool call failed with status:", searchCodeRes.status);
              }

              toolResult = await searchCodeRes.json();
              console.log("    ✅ Tool result received");
            } else if (toolUseBlock.name === "list_github_pull_requests") {
              console.log("  → Calling list_github_pull_requests");
              console.log("    Repo:", toolUseBlock.input.repo);
              console.log("    State:", toolUseBlock.input.state || "open");
              console.log("    Limit:", toolUseBlock.input.limit || 10);
              const prRes = await fetch("http://localhost:3000/api/github/pull-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  repo: toolUseBlock.input.repo,
                  state: toolUseBlock.input.state,
                  limit: toolUseBlock.input.limit
                })
              });

              if (!prRes.ok) {
                console.error("  ❌ Tool call failed with status:", prRes.status);
              }

              toolResult = await prRes.json();
              console.log("    ✅ Tool result received");
            } else if (toolUseBlock.name === "get_github_pull_request") {
              console.log("  → Calling get_github_pull_request");
              console.log("    Repo:", toolUseBlock.input.repo);
              console.log("    PR Number:", toolUseBlock.input.prNumber);
              console.log("    Include Diff:", toolUseBlock.input.includeDiff !== false);
              const prDetailsRes = await fetch("http://localhost:3000/api/github/pull-request-details", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  repo: toolUseBlock.input.repo,
                  prNumber: toolUseBlock.input.prNumber,
                  includeDiff: toolUseBlock.input.includeDiff
                })
              });

              if (!prDetailsRes.ok) {
                console.error("  ❌ Tool call failed with status:", prDetailsRes.status);
              }

              toolResult = await prDetailsRes.json();
              console.log("    ✅ Tool result received");
            } else if (toolUseBlock.name === "trigger_github_workflow") {
              console.log("  → Calling trigger_github_workflow");
              console.log("    Repo:", toolUseBlock.input.repo);
              console.log("    Workflow ID:", toolUseBlock.input.workflowId);
              console.log("    Ref:", toolUseBlock.input.ref || "main");
              const triggerRes = await fetch("http://localhost:3000/api/github/trigger-workflow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  repo: toolUseBlock.input.repo,
                  workflowId: toolUseBlock.input.workflowId,
                  ref: toolUseBlock.input.ref,
                  inputs: toolUseBlock.input.inputs
                })
              });

              if (!triggerRes.ok) {
                console.error("  ❌ Tool call failed with status:", triggerRes.status);
              }

              toolResult = await triggerRes.json();
              console.log("    ✅ Tool result received");
            } else if (toolUseBlock.name === "rerun_github_workflow") {
              console.log("  → Calling rerun_github_workflow");
              console.log("    Repo:", toolUseBlock.input.repo);
              console.log("    Run ID:", toolUseBlock.input.runId);
              console.log("    Failed Jobs Only:", toolUseBlock.input.failedJobsOnly || false);
              const rerunRes = await fetch("http://localhost:3000/api/github/rerun-workflow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  repo: toolUseBlock.input.repo,
                  runId: toolUseBlock.input.runId,
                  failedJobsOnly: toolUseBlock.input.failedJobsOnly
                })
              });

              if (!rerunRes.ok) {
                console.error("  ❌ Tool call failed with status:", rerunRes.status);
              }

              toolResult = await rerunRes.json();
              console.log("    ✅ Tool result received");
            } else if (toolUseBlock.name === "create_github_pull_request") {
              console.log("  → Calling create_github_pull_request");
              console.log("    Repo:", toolUseBlock.input.repo);
              console.log("    Branch:", toolUseBlock.input.branch);
              console.log("    Files:", toolUseBlock.input.files?.length);
              console.log("    Title:", toolUseBlock.input.title);
              const createPRRes = await fetch("http://localhost:3000/api/github/create-pr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  repo: toolUseBlock.input.repo,
                  branch: toolUseBlock.input.branch,
                  files: toolUseBlock.input.files,
                  title: toolUseBlock.input.title,
                  body: toolUseBlock.input.body,
                  commitMessage: toolUseBlock.input.commitMessage,
                  base: toolUseBlock.input.base
                })
              });

              if (!createPRRes.ok) {
                console.error("  ❌ Tool call failed with status:", createPRRes.status);
              }

              toolResult = await createPRRes.json();
              console.log("    ✅ Tool result received");
            } else if (toolUseBlock.name === "update_github_pull_request") {
              console.log("  → Calling update_github_pull_request");
              console.log("    Repo:", toolUseBlock.input.repo);
              console.log("    Branch:", toolUseBlock.input.branch);
              console.log("    PR Number:", toolUseBlock.input.prNumber);
              console.log("    Files:", toolUseBlock.input.files?.length);
              const updatePRRes = await fetch("http://localhost:3000/api/github/update-pr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  repo: toolUseBlock.input.repo,
                  branch: toolUseBlock.input.branch,
                  prNumber: toolUseBlock.input.prNumber,
                  files: toolUseBlock.input.files,
                  commitMessage: toolUseBlock.input.commitMessage
                })
              });

              if (!updatePRRes.ok) {
                console.error("  ❌ Tool call failed with status:", updatePRRes.status);
              }

              toolResult = await updatePRRes.json();
              console.log("    ✅ Tool result received");
            } else if (toolUseBlock.name === "get_api_documentation") {
              console.log("  → Calling get_api_documentation");
              console.log("    Endpoint filter:", toolUseBlock.input.endpoint || "all");
              const swaggerRes = await fetch("http://localhost:3000/api/swagger/fetch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  endpoint: toolUseBlock.input.endpoint
                })
              });

              if (!swaggerRes.ok) {
                console.error("  ❌ Tool call failed with status:", swaggerRes.status);
              }

              toolResult = await swaggerRes.json();
              console.log("    ✅ Tool result received");
            }

              // Add tool result - ensure content is always a string
              const toolResultContent = typeof toolResult === 'string'
                ? toolResult
                : JSON.stringify(toolResult, null, 2);

              // Check if the tool result indicates an error
              const isError = toolResult && typeof toolResult === 'object' && 'error' in toolResult;

              const toolResultBlock: any = {
                type: "tool_result" as const,
                tool_use_id: toolUseBlock.id,
                content: toolResultContent
              };

              // Mark as error if the tool failed
              if (isError) {
                toolResultBlock.is_error = true;
                console.log("    ⚠️  Tool returned an error");
              }

              toolResults.push(toolResultBlock);
            }

            // Add assistant message with all tool uses
            const assistantMessage = {
              role: "assistant" as const,
              content: finalResponse.content
            };
            finalMessages.push(assistantMessage);
            console.log("\n  📝 Added assistant message with", finalResponse.content.length, "content blocks");

            // Add user message with all tool results
            const userMessage = {
              role: "user" as const,
              content: toolResults
            };
            finalMessages.push(userMessage);

            console.log("  📤 Added", toolResults.length, "tool results");
            console.log("  📊 Total messages in history:", finalMessages.length);

            // Continue conversation with tool result
            finalResponse = await anthropic.beta.messages.create({
              model: "claude-sonnet-4-5-20250929",
              max_tokens: 8192,
              betas: ["advanced-tool-use-2025-11-20"],
              system: victorSystemPrompt,
              messages: finalMessages,
              tools: [
                {
                  type: "tool_search_tool_bm25_20251119",
                  name: "tool_search_tool_bm25"
                },
                {
                  type: "text_editor_20250728",
                  name: "str_replace_based_edit_tool"
                },
                {
                  name: "list_confluence_root",
                  description: "List all root-level pages and folders in the FRONTIER Confluence space. Use this FIRST when users ask general questions about Confluence documentation to see what folders/sections exist. This helps you browse the structure before searching.",
                  input_schema: {
                    type: "object",
                    properties: {},
                    required: []
                  }
                },
                {
                  name: "search_confluence",
                  description: "Search the team's Confluence knowledge base for documentation, guides, and information. Use this when the user asks about team processes, documentation, or you need to look up specific information.",
                  input_schema: {
                    type: "object",
                    properties: {
                      query: {
                        type: "string",
                        description: "The search query to find relevant Confluence pages"
                      }
                    },
                    required: ["query"]
                  }
                },
                {
                  name: "get_confluence_page",
                  description: "Retrieve the full content of a specific Confluence page by its ID. Use this after searching to get detailed information from a page, or when extracting page ID from a URL the user provided.",
                  input_schema: {
                    type: "object",
                    properties: {
                      pageId: {
                        type: "string",
                        description: "The Confluence page ID to retrieve"
                      }
                    },
                    required: ["pageId"]
                  }
                },
                {
                  name: "get_confluence_children",
                  description: "Get all child pages under a parent page or folder. Use this when you find a folder/parent page and want to see what documents are inside it. Helpful for browsing release folders or documentation sections.",
                  input_schema: {
                    type: "object",
                    properties: {
                      pageId: {
                        type: "string",
                        description: "The parent page/folder ID to get children from"
                      }
                    },
                    required: ["pageId"]
                  },
                  defer_loading: true
                },
                {
                  name: "create_confluence_page",
                  description: "Create a new Confluence page in the FRONTIER space. IMPORTANT: You MUST provide BOTH title and content - you cannot create an empty page. If the user hasn't specified what content to include, either ask them or write appropriate content based on context.",
                  input_schema: {
                    type: "object",
                    properties: {
                      title: {
                        type: "string",
                        description: "The title of the new page (REQUIRED)"
                      },
                      content: {
                        type: "string",
                        description: "The page content in Confluence storage format (XHTML-based) (REQUIRED - cannot be empty). Use tags like <h1>, <h2>, <p>, <ul>, <li>, <code>, <strong>, <em>, etc. Do NOT use markdown syntax (no #, *, **, ```). For code blocks use <ac:structured-macro>. Must contain at least some basic content."
                      },
                      parentPageId: {
                        type: "string",
                        description: "Optional: The parent page ID if this should be created under a specific page/folder"
                      }
                    },
                    required: ["title", "content"]
                  },
                  defer_loading: true
                },
                {
                  name: "update_confluence_page",
                  description: "Update an existing Confluence page with new content. Use this when users ask you to edit, update, modify, or add to an existing page. You can update the content and optionally change the title.",
                  input_schema: {
                    type: "object",
                    properties: {
                      pageId: {
                        type: "string",
                        description: "The ID of the page to update"
                      },
                      content: {
                        type: "string",
                        description: "The new page content in Confluence storage format (XHTML-based). Use tags like <h1>, <h2>, <p>, <ul>, <li>, <code>, <strong>, <em>. Do NOT use markdown syntax (no #, *, **, ```). This will replace the existing content."
                      },
                      title: {
                        type: "string",
                        description: "Optional: New title for the page. If not provided, keeps the existing title."
                      }
                    },
                    required: ["pageId", "content"]
                  },
                  defer_loading: true
                },
                {
                  name: "create_confluence_folder",
                  description: "Create a new Confluence folder in the FRONTIER space. Use this when users want to organize documentation, create a new folder for a project, or need a container for multiple related pages.",
                  input_schema: {
                    type: "object",
                    properties: {
                      title: {
                        type: "string",
                        description: "The title/name of the new folder"
                      },
                      parentPageId: {
                        type: "string",
                        description: "Optional: The parent page/folder ID if this should be created inside another folder"
                      }
                    },
                    required: ["title"]
                  },
                  defer_loading: true
                },
                {
                  name: "get_api_documentation",
                  description: "Get the external SmartPass Partner API documentation (Swagger/OpenAPI spec). This is the PUBLIC API used by external integrators like Ticketmaster and resellers, NOT the internal API. Use this when users ask about external partner endpoints, how partners integrate, or what we expose to external clients.",
                  input_schema: {
                    type: "object",
                    properties: {
                      endpoint: {
                        type: "string",
                        description: "Optional: Filter to specific endpoint path (e.g., '/passes', '/auth'). If omitted, returns full API spec."
                      }
                    },
                    required: []
                  },
                  defer_loading: true
                },
                {
                  name: "get_github_releases",
                  description: "Get recent releases from Frontier GitHub repositories. Use this when users ask about releases, deployments, what version is deployed, or what's in the latest release.",
                  input_schema: {
                    type: "object",
                    properties: {
                      repo: {
                        type: "string",
                        description: "The repository name in format 'owner/repo'. Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds, parkhub/data-migration, parkhub/sp-loadtesting",
                        enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds", "parkhub/data-migration", "parkhub/sp-loadtesting"]
                      },
                      limit: {
                        type: "number",
                        description: "Number of releases to fetch (default: 10, max: 30)"
                      }
                    },
                    required: ["repo"]
                  },
                  defer_loading: true
                },
                {
                  name: "read_github_file",
                  description: "Read the contents of a specific file from a Frontier GitHub repository. Use this when users want to see code, read a specific file, or examine implementation details.",
                  input_schema: {
                    type: "object",
                    properties: {
                      repo: {
                        type: "string",
                        description: "The repository name in format 'owner/repo'. Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds, parkhub/data-migration, parkhub/sp-loadtesting",
                        enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds", "parkhub/data-migration", "parkhub/sp-loadtesting"]
                      },
                      path: {
                        type: "string",
                        description: "The file path within the repository (e.g., 'src/models/User.ts', 'README.md')"
                      },
                      branch: {
                        type: "string",
                        description: "The branch name (default: 'main')"
                      }
                    },
                    required: ["repo", "path"]
                  },
                  defer_loading: true
                },
                {
                  name: "list_github_directory",
                  description: "List files and directories in a specific GitHub repository. IMPORTANT: You must always specify which repository to list. If the user doesn't specify a repo, ask them which one they want to explore, or if the context is clear (e.g., they're asking about the API), use the appropriate repo.",
                  input_schema: {
                    type: "object",
                    properties: {
                      repo: {
                        type: "string",
                        description: "REQUIRED: The repository name in format 'owner/repo'. Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds, parkhub/data-migration, parkhub/sp-loadtesting",
                        enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds", "parkhub/data-migration", "parkhub/sp-loadtesting"]
                      },
                      path: {
                        type: "string",
                        description: "The directory path to list (empty string or omit for root directory)"
                      },
                      branch: {
                        type: "string",
                        description: "The branch name (default: 'main')"
                      }
                    },
                    required: ["repo"]
                  },
                  defer_loading: true
                },
                {
                  name: "search_github_code",
                  description: "Search for code across Frontier GitHub repositories. Use this to find where specific functions, classes, or patterns are used.",
                  input_schema: {
                    type: "object",
                    properties: {
                      query: {
                        type: "string",
                        description: "The search query (e.g., 'function validatePass', 'class UserModel', 'import express')"
                      },
                      repo: {
                        type: "string",
                        description: "Optional: Limit search to a specific repo. If omitted, searches all Frontier repos.",
                        enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds", "parkhub/data-migration", "parkhub/sp-loadtesting"]
                      }
                    },
                    required: ["query"]
                  },
                  defer_loading: true
                },
                {
                  name: "list_github_pull_requests",
                  description: "List pull requests from Frontier GitHub repositories. Use this when users ask about PRs, want to see open/closed PRs, or check PR status.",
                  input_schema: {
                    type: "object",
                    properties: {
                      repo: {
                        type: "string",
                        description: "The repository name in format 'owner/repo'. Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds, parkhub/data-migration, parkhub/sp-loadtesting",
                        enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds", "parkhub/data-migration", "parkhub/sp-loadtesting"]
                      },
                      state: {
                        type: "string",
                        description: "Filter by PR state: 'open', 'closed', or 'all' (default: 'open')",
                        enum: ["open", "closed", "all"]
                      },
                      limit: {
                        type: "number",
                        description: "Number of PRs to fetch (default: 10, max: 30)"
                      }
                    },
                    required: ["repo"]
                  },
                  defer_loading: true
                },
                {
                  name: "get_github_pull_request",
                  description: "Get detailed information about a specific GitHub pull request including description, changes, diff, and CI/CD status (GitHub Actions, tests, builds). Use this when users provide a PR URL like 'https://github.com/parkhub/graph-api/pull/1056' or ask about checks/tests. Extract the repo as 'parkhub/graph-api' (combined owner/repo) and the PR number as 1056.",
                  input_schema: {
                    type: "object",
                    properties: {
                      repo: {
                        type: "string",
                        description: "The FULL repository name in format 'owner/repo' (e.g., 'parkhub/graph-api', NOT just 'graph-api'). Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds, parkhub/data-migration, parkhub/sp-loadtesting",
                        enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds", "parkhub/data-migration", "parkhub/sp-loadtesting"]
                      },
                      prNumber: {
                        type: "number",
                        description: "The pull request number (e.g., 1056 from the URL https://github.com/parkhub/graph-api/pull/1056)"
                      },
                      includeDiff: {
                        type: "boolean",
                        description: "Whether to include the full diff of changes (default: true)"
                      }
                    },
                    required: ["repo", "prNumber"]
                  },
                  defer_loading: true
                },
                {
                  name: "trigger_github_workflow",
                  description: "Trigger a GitHub Actions workflow run. Use this when users ask to run a workflow, trigger a deployment, re-run tests, or start a CI/CD job. IMPORTANT: Ask the user for confirmation before triggering workflows.",
                  input_schema: {
                    type: "object",
                    properties: {
                      repo: {
                        type: "string",
                        description: "The FULL repository name in format 'owner/repo' (e.g., 'parkhub/graph-api'). Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds, parkhub/data-migration, parkhub/sp-loadtesting",
                        enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds", "parkhub/data-migration", "parkhub/sp-loadtesting"]
                      },
                      workflowId: {
                        type: "string",
                        description: "The workflow file name (e.g., 'ci.yml', 'deploy.yml') or workflow ID number"
                      },
                      ref: {
                        type: "string",
                        description: "The git reference (branch/tag) to run the workflow on (default: 'main')"
                      },
                      inputs: {
                        type: "object",
                        description: "Optional inputs for the workflow (if it accepts workflow_dispatch inputs)"
                      }
                    },
                    required: ["repo", "workflowId"]
                  },
                  defer_loading: true
                },
                {
                  name: "rerun_github_workflow",
                  description: "Re-run a failed GitHub Actions workflow run. Use this when users ask to re-run failed checks, retry a failed build, or restart failed tests on a PR.",
                  input_schema: {
                    type: "object",
                    properties: {
                      repo: {
                        type: "string",
                        description: "The FULL repository name in format 'owner/repo' (e.g., 'parkhub/graph-api'). Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds, parkhub/data-migration, parkhub/sp-loadtesting",
                        enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds", "parkhub/data-migration", "parkhub/sp-loadtesting"]
                      },
                      runId: {
                        type: "number",
                        description: "The workflow run ID to re-run (get this from check runs in the PR details)"
                      },
                      failedJobsOnly: {
                        type: "boolean",
                        description: "Whether to re-run only failed jobs (true) or all jobs (false). Default: false"
                      }
                    },
                    required: ["repo", "runId"]
                  },
                  defer_loading: true
                },
                {
                  name: "create_github_pull_request",
                  description: "Create a new GitHub pull request with code changes. Use this when users ask you to make code changes, fix bugs, add features, or update files. This will create a new branch, commit the changes, and open a PR.",
                  input_schema: {
                    type: "object",
                    properties: {
                      repo: {
                        type: "string",
                        description: "The repository name in format 'owner/repo'. Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds, parkhub/data-migration, parkhub/sp-loadtesting",
                        enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds", "parkhub/data-migration", "parkhub/sp-loadtesting"]
                      },
                      branch: {
                        type: "string",
                        description: "The branch name for the PR (e.g., 'fix/auth-bug', 'feature/dark-mode'). Use descriptive names with prefixes like fix/, feature/, chore/"
                      },
                      files: {
                        type: "array",
                        description: "Array of files to create or update. Each file object must have 'path' (relative to repo root) and 'content' (full file content as string)",
                        items: {
                          type: "object",
                          properties: {
                            path: {
                              type: "string",
                              description: "File path relative to repo root (e.g., 'src/auth.ts', 'README.md')"
                            },
                            content: {
                              type: "string",
                              description: "Complete file content as a string"
                            }
                          },
                          required: ["path", "content"]
                        }
                      },
                      title: {
                        type: "string",
                        description: "Clear, concise PR title that describes the changes"
                      },
                      body: {
                        type: "string",
                        description: "Detailed PR description including context, changes made, testing instructions, and any related ticket numbers"
                      },
                      commitMessage: {
                        type: "string",
                        description: "Commit message that explains what and why"
                      },
                      base: {
                        type: "string",
                        description: "Base branch to merge into (default: 'main')"
                      }
                    },
                    required: ["repo", "branch", "files", "title", "commitMessage"]
                  },
                  defer_loading: true
                },
                {
                  name: "update_github_pull_request",
                  description: "Update an existing GitHub pull request by pushing additional commits to its branch. Use this when you need to add changes to a PR that already exists, or when a user asks you to update/modify an existing PR. IMPORTANT: You must know the branch name - if unsure, ask the user or use the GitHub API to look it up by PR number.",
                  input_schema: {
                    type: "object",
                    properties: {
                      repo: {
                        type: "string",
                        description: "The repository name in format 'owner/repo'. Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds, parkhub/data-migration, parkhub/sp-loadtesting",
                        enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds", "parkhub/data-migration", "parkhub/sp-loadtesting"]
                      },
                      branch: {
                        type: "string",
                        description: "The existing branch name for the PR (e.g., 'fix/auth-bug'). This branch must already exist."
                      },
                      prNumber: {
                        type: "number",
                        description: "The PR number (optional, helps with logging and confirmation)"
                      },
                      files: {
                        type: "array",
                        description: "Array of files to create or update. Each file object must have 'path' (relative to repo root) and 'content' (full file content as string)",
                        items: {
                          type: "object",
                          properties: {
                            path: {
                              type: "string",
                              description: "File path relative to repo root (e.g., 'src/auth.ts', 'README.md')"
                            },
                            content: {
                              type: "string",
                              description: "Complete file content as a string"
                            }
                          },
                          required: ["path", "content"]
                        }
                      },
                      commitMessage: {
                        type: "string",
                        description: "Commit message that explains what changes are being added"
                      }
                    },
                    required: ["repo", "branch", "files", "commitMessage"]
                  },
                  defer_loading: true
                },
                {
                  name: "get_jira_issue",
                  description: "Get details of a specific Jira ticket by its key (e.g., PV-123). Use this when users ask about a specific ticket, want to check ticket status, or reference a ticket number.",
                  input_schema: {
                    type: "object",
                    properties: {
                      issueKey: {
                        type: "string",
                        description: "The Jira issue key (e.g., 'PV-123', 'PV-456')"
                      }
                    },
                    required: ["issueKey"]
                  },
                  defer_loading: true
                },
                {
                  name: "search_jira_issues",
                  description: "Search for Jira tickets in the PV (Frontier) project by keywords and/or sprint. Use this when users ask to find tickets, search for work items, or look up tickets by topic (e.g., 'find tickets about authentication', 'search for API bugs', 'what's in the current sprint').",
                  input_schema: {
                    type: "object",
                    properties: {
                      query: {
                        type: "string",
                        description: "Search keywords to find in ticket summaries and descriptions (optional if sprintId is provided)"
                      },
                      sprintId: {
                        type: "number",
                        description: "Filter tickets by sprint ID (obtained from get_current_sprint). Use this when searching for tickets in a specific sprint."
                      },
                      maxResults: {
                        type: "number",
                        description: "Maximum number of results to return (default: 10, max: 50)"
                      }
                    },
                    required: []
                  },
                  defer_loading: true
                },
                {
                  name: "create_jira_issue",
                  description: "Create a new Jira ticket in the PV (Frontier) project. Use this when users ask to create a ticket, track a bug, create a story, or document work that needs to be done.",
                  input_schema: {
                    type: "object",
                    properties: {
                      summary: {
                        type: "string",
                        description: "The ticket title/summary (required, concise one-liner)"
                      },
                      description: {
                        type: "string",
                        description: "The ticket description with details, context, acceptance criteria, etc."
                      },
                      issueType: {
                        type: "string",
                        description: "The type of issue to create",
                        enum: ["Story", "Task", "Bug", "Epic"]
                      },
                      priority: {
                        type: "string",
                        description: "The priority level",
                        enum: ["Highest", "High", "Medium", "Low", "Lowest"]
                      },
                      storyPoints: {
                        type: "number",
                        description: "Story points for the ticket (1 = smallest, 2 = medium, 3 = largest)",
                        enum: [1, 2, 3]
                      }
                    },
                    required: ["summary"]
                  },
                  defer_loading: true
                },
                {
                  name: "get_current_sprint",
                  description: "Get the current active sprint for the Frontier team. Use this when users reference 'current sprint', 'my team's sprint', 'this sprint', or 'active sprint'. Returns sprint name, dates, and ID which can be used to search for tickets.",
                  input_schema: {
                    type: "object",
                    properties: {},
                    required: []
                  },
                  defer_loading: true
                }
              ]
            });
          }

          const textContent = finalResponse.content.find(block => block.type === "text");
          const responseText = textContent?.type === "text" ? textContent.text : "";

          // Try to parse as JSON (for structured responses like select_card)
          try {
            let cleanedText = responseText.trim();

            // Strip markdown code blocks if present
            if (cleanedText.startsWith("```json")) {
              cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
            } else if (cleanedText.startsWith("```")) {
              cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "");
            }

            // Check if there's JSON embedded in the text
            const jsonMatch = cleanedText.match(/\{[\s\S]*"type"\s*:\s*"[^"]+"[\s\S]*\}/);

            if (jsonMatch) {
              // Extract the JSON part
              const jsonStr = jsonMatch[0];
              const jsonResponse = JSON.parse(jsonStr);

              // If it has a type field, it's a structured response
              if (jsonResponse.type) {
                // Extract any text before the JSON as a preamble
                const preamble = cleanedText.substring(0, jsonMatch.index).trim();

                // If there's preamble text, include it in the question
                if (preamble && jsonResponse.data?.question) {
                  jsonResponse.data.question = preamble + "\n\n" + jsonResponse.data.question;
                }

                return Response.json(jsonResponse);
              }
            }

            // Try parsing the whole thing as JSON (if it's just JSON)
            const jsonResponse = JSON.parse(cleanedText);
            if (jsonResponse.type) {
              return Response.json(jsonResponse);
            }
          } catch (parseError) {
            // Not JSON, treat as plain text
          }

          // Return as plain text response
          return Response.json({
            success: true,
            reply: responseText
          });
        } catch (error) {
          console.error("Claude API error:", error);
          return Response.json({
            success: false,
            reply: "Well shoot, partner! Looks like I'm having some technical difficulties. Mind trying that again?"
          }, { status: 500 });
        }
      },
    },
  },
  development: {
    hmr: true,
    console: true,
  },
  port: 3000,
});

console.log("Victor Face Monitor running at http://localhost:3000");
