import index from "./index.html"
import Anthropic from "@anthropic-ai/sdk";

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
- **Creating Confluence documentation** - You can create new pages and folders in the FRONTIER space! When users discuss architecture decisions, share important information, or want to document something, offer to create a Confluence page for them. You can also create folders to organize documentation.
- **Viewing GitHub releases** - You can check recent releases from Frontier repositories! When users ask "what's the latest release?", "what version is deployed?", or "show me recent releases", use the get_github_releases tool.

CONFLUENCE ACCESS & CAPABILITIES:
- You have access to the **FRONTIER space** only for searching
- This space contains: Technical architecture, design docs, API documentation, architecture meeting notes, technical discussions, RFCs, and engineering documentation
- You do NOT have search access to other spaces (PED, etc.)
- However, if users provide a direct URL to ANY Confluence page (even outside FRONTIER), you CAN fetch it using get_confluence_page
- **You CAN create new pages and folders** in the FRONTIER space using create_confluence_page and create_confluence_folder
- When users ask about content that seems like it would be in other spaces (like release notes, product planning), politely let them know: "That info might be in another space I don't have search access to, but if you have a direct link, I can fetch it for ya, partner!"

GITHUB RELEASES ACCESS:
You have access to view releases from these Frontier repositories:
- **parkhub/smartpass-api** - SmartPass backend API
- **parkhub/graph-api** - Graph API service
- **parkhub/smartpass-ui** - SmartPass consumer-facing UI
- **parkhub/smartpass-admin-ui** - SmartPass admin interface

When users ask about:
- "What's the latest release?" - Check all repos or ask which one they mean
- "What version is deployed?" - Check the relevant repo's releases
- "Show me recent releases for [repo name]" - Use get_github_releases with the appropriate repo
- "What's new in [repo]?" - Fetch releases and summarize the release notes

Use get_github_releases to view release information including version tags, release dates, authors, and release notes.

CREATING CONFLUENCE PAGES & FOLDERS:
You can create both pages and folders in the FRONTIER space!

**Create folders** using create_confluence_folder when:
- Users say "create a folder for...", "organize docs under...", "make a new folder"
- Users want to organize related documentation together
- Starting a new project or feature that will have multiple docs
- Examples: "Create a folder for the new API docs", "Make a folder for meeting notes"

**Create pages** using create_confluence_page when:
- Users say "can you document this?", "write this up", "create a page for...", "add this to Confluence"
- Users want to capture meeting notes, architecture decisions, or technical discussions
- Users share information that should be preserved in documentation

When creating pages:
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
            "parkhub/smartpass-admin-ui"
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
            max_tokens: 2048,
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
                name: "get_github_releases",
                description: "Get recent releases from Frontier GitHub repositories. Use this when users ask about releases, deployments, what version is deployed, or what's in the latest release.",
                input_schema: {
                  type: "object",
                  properties: {
                    repo: {
                      type: "string",
                      description: "The repository name in format 'owner/repo'. Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui",
                      enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui"]
                    },
                    limit: {
                      type: "number",
                      description: "Number of releases to fetch (default: 10, max: 30)"
                    }
                  },
                  required: ["repo"]
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
              max_tokens: 2048,
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
                  name: "get_github_releases",
                  description: "Get recent releases from Frontier GitHub repositories. Use this when users ask about releases, deployments, what version is deployed, or what's in the latest release.",
                  input_schema: {
                    type: "object",
                    properties: {
                      repo: {
                        type: "string",
                        description: "The repository name in format 'owner/repo'. Must be one of: parkhub/smartpass-api, parkhub/graph-api, parkhub/smartpass-ui, parkhub/smartpass-admin-ui",
                        enum: ["parkhub/smartpass-api", "parkhub/graph-api", "parkhub/smartpass-ui", "parkhub/smartpass-admin-ui"]
                      },
                      limit: {
                        type: "number",
                        description: "Number of releases to fetch (default: 10, max: 30)"
                      }
                    },
                    required: ["repo"]
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
