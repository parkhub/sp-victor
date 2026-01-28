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
- **SmartPass Partner API documentation** - You can access the external partner API documentation for integrators like Ticketmaster and resellers! When users ask about external API endpoints, partner integration, or how external clients use the API, use get_api_documentation.
- **Creating Jira tickets** - You can create tickets in the PV (Frontier) project! When users ask you to track work, create stories, log bugs, or document tasks, use the create_jira_issue tool.

CONFLUENCE ACCESS & CAPABILITIES:
- You have access to the **FRONTIER space** only for searching
- This space contains: Technical architecture, design docs, API documentation, architecture meeting notes, technical discussions, RFCs, and engineering documentation
- You do NOT have search access to other spaces (PED, etc.)
- However, if users provide a direct URL to ANY Confluence page (even outside FRONTIER), you CAN fetch it using get_confluence_page
- **You CAN create new pages and folders** in the FRONTIER space using create_confluence_page and create_confluence_folder
- **You CAN update existing pages** using update_confluence_page - works for any page you can access (including pages outside FRONTIER if given direct URL/ID)
- When users ask about content that seems like it would be in other spaces (like release notes, product planning), politely let them know: "That info might be in another space I don't have search access to, but if you have a direct link, I can fetch it for ya, partner!"

GITHUB ACCESS:
You have access to view releases AND read code from these Frontier repositories:
- **parkhub/smartpass-api** - SmartPass backend API
- **parkhub/graph-api** - Graph API service
- **parkhub/smartpass-ui** - SmartPass consumer-facing UI
- **parkhub/smartpass-admin-ui** - SmartPass admin interface
- **parkhub/egds** - Enterprise Design System

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

CREATING JIRA TICKETS:
You can create Jira tickets in the PV (Frontier) project!

When to create tickets:
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

After creating a ticket, share the ticket URL so they can view and edit it in Jira.

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

**Update pages** using update_confluence_page when:
- Users say "update the page", "edit this doc", "add this to the existing page", "modify the documentation"
- Users want to revise or add information to an existing page
- You need to correct or expand existing documentation
- IMPORTANT: You need the page ID to update. If they provide a URL or mention a specific page, fetch it first with get_confluence_page to get the ID and current content
- When updating, you can optionally change the title too

When creating or updating pages:
- Use proper HTML formatting: <h1>, <h2>, <p>, <ul>, <li>, <code>, <pre>, <strong>, <em>
- Structure content clearly with headings and sections
- Use code blocks with <pre><code> for code snippets
- Make titles descriptive and searchable
- If they mention a parent page or folder, use the parentPageId parameter
- After creating, share the URL with the user so they can view/edit it

When creating folders:
- Use clear, descriptive names
- If they want it inside another folder, use the parentPageId parameter
- Folders are great for organizing multiple related documents

Example HTML structure for pages:
- Use <h1> for main title, <h2> for sections, <h3> for subsections
- Use <p> tags for paragraphs
- Use <ul><li> for bullet lists
- Use <pre><code> for code blocks
- Use <strong> for bold, <em> for italic

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
          console.log("  Space:", space);
          console.log("  Parent Page ID:", parentPageId || "None (root level)");

          if (!title || !content) {
            return Response.json({ error: "Title and content are required" }, { status: 400 });
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
            "parkhub/egds"
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
            return Response.json({ error: "Repo is required" }, { status: 400 });
          }

          // Validate allowed repos
          const allowedRepos = [
            "parkhub/smartpass-api",
            "parkhub/graph-api",
            "parkhub/smartpass-ui",
            "parkhub/smartpass-admin-ui",
            "parkhub/egds"
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
            "parkhub/egds"
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
            "parkhub/egds"
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

          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 8192,
            system: victorSystemPrompt,
            messages,
            tools: [
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
                }
              },
              {
                name: "create_confluence_page",
                description: "Create a new Confluence page in the FRONTIER space. Use this when users ask you to document something, create meeting notes, write up architecture decisions, or create any new documentation.",
                input_schema: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                      description: "The title of the new page"
                    },
                    content: {
                      type: "string",
                      description: "The page content in HTML format. Use proper HTML tags like <h1>, <h2>, <p>, <ul>, <li>, <code>, <pre>, etc. for formatting."
                    },
                    parentPageId: {
                      type: "string",
                      description: "Optional: The parent page ID if this should be created under a specific page/folder"
                    }
                  },
                  required: ["title", "content"]
                }
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
                      description: "The new page content in HTML format. This will replace the existing content."
                    },
                    title: {
                      type: "string",
                      description: "Optional: New title for the page. If not provided, keeps the existing title."
                    }
                  },
                  required: ["pageId", "content"]
                }
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
                }
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
                }
              },
              {
                name: "get_github_releases",
                description: "Get recent releases from Frontier GitHub repositories. Use this when users ask about releases, deployments, what version is deployed, or what's in the latest release.",
                input_schema: {
                  type: "object",
                  properties: {
                    repo: {
                      type: "string",
                      description: "The repository name in format 'owner/repo'. Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds",
                      enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds"]
                    },
                    limit: {
                      type: "number",
                      description: "Number of releases to fetch (default: 10, max: 30)"
                    }
                  },
                  required: ["repo"]
                }
              },
              {
                name: "read_github_file",
                description: "Read the contents of a specific file from a Frontier GitHub repository. Use this when users want to see code, read a specific file, or examine implementation details.",
                input_schema: {
                  type: "object",
                  properties: {
                    repo: {
                      type: "string",
                      description: "The repository name in format 'owner/repo'. Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds",
                      enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds"]
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
                }
              },
              {
                name: "list_github_directory",
                description: "List files and directories in a GitHub repository. Use this to explore repo structure, browse folders, or find files.",
                input_schema: {
                  type: "object",
                  properties: {
                    repo: {
                      type: "string",
                      description: "The repository name in format 'owner/repo'. Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds",
                      enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds"]
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
                }
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
                      enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds"]
                    }
                  },
                  required: ["query"]
                }
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
                }
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
              if (toolUseBlock.name === "search_confluence") {
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
            finalResponse = await anthropic.messages.create({
              model: "claude-sonnet-4-5-20250929",
              max_tokens: 8192,
              system: victorSystemPrompt,
              messages: finalMessages,
              tools: [
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
                  }
                },
                {
                  name: "create_confluence_page",
                  description: "Create a new Confluence page in the FRONTIER space. Use this when users ask you to document something, create meeting notes, write up architecture decisions, or create any new documentation.",
                  input_schema: {
                    type: "object",
                    properties: {
                      title: {
                        type: "string",
                        description: "The title of the new page"
                      },
                      content: {
                        type: "string",
                        description: "The page content in HTML format. Use proper HTML tags like <h1>, <h2>, <p>, <ul>, <li>, <code>, <pre>, etc. for formatting."
                      },
                      parentPageId: {
                        type: "string",
                        description: "Optional: The parent page ID if this should be created under a specific page/folder"
                      }
                    },
                    required: ["title", "content"]
                  }
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
                        description: "The new page content in HTML format. This will replace the existing content."
                      },
                      title: {
                        type: "string",
                        description: "Optional: New title for the page. If not provided, keeps the existing title."
                      }
                    },
                    required: ["pageId", "content"]
                  }
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
                  }
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
                  }
                },
                {
                  name: "get_github_releases",
                  description: "Get recent releases from Frontier GitHub repositories. Use this when users ask about releases, deployments, what version is deployed, or what's in the latest release.",
                  input_schema: {
                    type: "object",
                    properties: {
                      repo: {
                        type: "string",
                        description: "The repository name in format 'owner/repo'. Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds",
                        enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds"]
                      },
                      limit: {
                        type: "number",
                        description: "Number of releases to fetch (default: 10, max: 30)"
                      }
                    },
                    required: ["repo"]
                  }
                },
                {
                  name: "read_github_file",
                  description: "Read the contents of a specific file from a Frontier GitHub repository. Use this when users want to see code, read a specific file, or examine implementation details.",
                  input_schema: {
                    type: "object",
                    properties: {
                      repo: {
                        type: "string",
                        description: "The repository name in format 'owner/repo'. Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds",
                        enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds"]
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
                  }
                },
                {
                  name: "list_github_directory",
                  description: "List files and directories in a GitHub repository. Use this to explore repo structure, browse folders, or find files.",
                  input_schema: {
                    type: "object",
                    properties: {
                      repo: {
                        type: "string",
                        description: "The repository name in format 'owner/repo'. Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui, parkhub/egds",
                        enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds"]
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
                  }
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
                        enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui", "parkhub/egds"]
                      }
                    },
                    required: ["query"]
                  }
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
                  }
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
