<div align="center">
  <img src="./victor-face.webp" alt="Victor" width="200" />
  <h1>Victor - The Frontier Team AI Assistant</h1>
  <p><em>Howdy, partner! Your friendly Wild West AI companion for the Frontier team.</em></p>
</div>

---

## What is Victor?

Victor is a friendly AI assistant chatbot built for the Frontier software engineering team. With a Wild West personality and powerful integrations, Victor helps the team manage their parking pass application development workflow - from answering questions to managing documentation, code, and project tracking.

## Features

Victor integrates with your entire development workflow:

### 🤖 AI-Powered Chat Interface
- Powered by Anthropic's Claude API
- Conversational interface with markdown support
- Maintains conversation history for context-aware responses
- Wild West themed personality for team morale

### 📚 Confluence Integration
- **Search** the FRONTIER space documentation
- **Read** any Confluence page (direct URL access)
- **Create** new pages and folders
- **Update** existing documentation
- Browse documentation structure with root listing and navigation

### 🐙 GitHub Integration
- **View releases** from Frontier repositories
- **Read code** - browse files, directories, and search across repos
- **Manage Pull Requests** - list, view, and create PRs
- **Trigger workflows** - run and re-run GitHub Actions
- **Code search** - find references and implementations

### 🎫 Jira Integration
- **Search tickets** in the PV (Frontier) project
- **View issue details** with full context
- **Create new issues** programmatically

### 📡 SmartPass Partner API
- Access external partner API documentation
- Help with API integration questions for partners like Ticketmaster

## Tech Stack

Built with modern, high-performance tools:

- **[Bun](https://bun.sh)** - Fast all-in-one JavaScript runtime
- **React** - Frontend UI with hooks
- **TypeScript** - Type-safe development
- **Anthropic SDK** - Claude AI integration
- **Octokit** - GitHub API integration
- **React Markdown** - Rich message formatting
- **Tailwind CSS** - Styling (via bun-plugin-tailwind)

## Prerequisites

- [Bun](https://bun.sh) v1.3.6 or higher
- API keys and credentials (see Configuration)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-victor

# Install dependencies
bun install
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```bash
# Anthropic API Key (required)
ANTHROPIC_API_KEY=sk-ant-...

# Atlassian/Confluence credentials (required for Confluence/Jira features)
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_AUTH=your-email@example.com:your-api-token

# GitHub Personal Access Token (required for GitHub features)
GITHUB_TOKEN=ghp_...

# Jira Board ID (optional, defaults to 193)
JIRA_BOARD_ID=193
```

### Getting API Keys

- **Anthropic API Key**: Get from [console.anthropic.com](https://console.anthropic.com)
- **Atlassian Auth**: Create an API token at [id.atlassian.com](https://id.atlassian.com/manage-profile/security/api-tokens)
- **GitHub Token**: Generate at [github.com/settings/tokens](https://github.com/settings/tokens) with repo and workflow permissions

> **Note**: Bun automatically loads `.env` files, so no additional dotenv package is needed.

## Usage

### Development Mode

Start the development server with hot module reloading:

```bash
bun --hot index.ts
```

Or use the npm script:

```bash
bun dev
```

The app will be available at `http://localhost:3000`

### Production Mode

Run the production server:

```bash
bun start
```

Or run directly:

```bash
bun index.ts
```

### Building for Production

Build optimized static assets:

```bash
bun run build.ts
```

Build with custom options:

```bash
bun run build.ts --outdir=dist --minify --sourcemap=linked
```

For build options help:

```bash
bun run build.ts --help
```

## Project Structure

```
ai-victor/
├── index.ts              # Main server with API routes and tool integrations
├── index.html            # HTML entry point
├── frontend.tsx          # React frontend application
├── build.ts              # Production build script
├── victor-face.webp      # Victor's avatar image
├── public/               # Public assets
│   ├── frontend.tsx      # Alternative frontend location
│   └── victor-face.webp  # Public avatar
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .env                  # Environment variables (create this)
└── README.md             # This file
```

## How Victor Works

1. **Frontend**: React app provides a chat interface where users type messages
2. **API Server**: Bun.serve handles HTTP routes and WebSocket connections
3. **Claude Integration**: Messages are sent to Claude with conversation history and tool definitions
4. **Tool Execution**: Victor can call various tools (Confluence, GitHub, Jira) based on user requests
5. **Response**: Claude's responses (including tool results) are displayed in the chat with markdown formatting

## Available Scripts

```bash
# Development server with hot reload
bun dev

# Production server
bun start

# Build for production
bun run build.ts

# Run tests (if configured)
bun test
```

## Supported Repositories

Victor has access to these Frontier repositories:

- `parkhub/smartpass-api` - SmartPass backend API
- `parkhub/graph-api` - Graph API service
- `parkhub/smartpass-ui` - SmartPass consumer UI
- `parkhub/smartpass-admin-ui` - SmartPass admin interface
- `parkhub/egds` - Event/listing management (Golang)
- `parkhub/data-migration` - Migration scripts
- `parkhub/sp-loadtesting` - Load testing tools

## Example Interactions

**Asking about documentation:**
> "What documentation do we have in Confluence?"

**Checking releases:**
> "What's the latest release for smartpass-api?"

**Reading code:**
> "Show me the User model in smartpass-api"

**Managing PRs:**
> "List open pull requests for smartpass-ui"

**Creating tickets:**
> "Create a Jira ticket for fixing the login bug"

## Development Notes

- Uses Bun's native APIs (`Bun.serve`, `Bun.file`) instead of Node.js/Express
- No need for bundlers like Vite or Webpack - Bun handles bundling natively
- HTML imports directly support React and TypeScript transpilation
- WebSocket support is built into `Bun.serve`
- Environment variables are auto-loaded from `.env`

## License

MIT

---

<div align="center">
  <p><strong>Well, I'll be! That's all folks! 🤠</strong></p>
  <p><em>Built with ❤️ by the Frontier team</em></p>
</div>
