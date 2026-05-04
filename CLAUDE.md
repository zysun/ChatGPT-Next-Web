# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (runs mask build + Next.js dev server with watch)
yarn dev

# Build standalone (server-side rendering, default)
yarn build

# Build static export (PWA / desktop app)
yarn export

# Lint
yarn lint

# Tests (watch mode and CI)
yarn test
yarn test:ci

# Tauri desktop app (dev and production build)
yarn app:dev
yarn app:build

# Mask/prompt JSON files are built/generated from app/masks/
yarn mask
```

## Architecture

This is **NextChat (ChatGPT-Next-Web)** — a Next.js 14 App Router chat application supporting multiple LLM providers (OpenAI, Anthropic, Google Gemini, DeepSeek, xAI, and many others). It ships as a web app (SSR or static export), a PWA, and a Tauri desktop app.

### Two runtime modes

- **`BUILD_MODE=standalone`** (default): Server-side Next.js. API routes under `app/api/` proxy requests to upstream LLM providers, injecting server-configured API keys via `app/config/server.ts`. Environment variables control auth (CODE, per-provider API keys, model allow/block lists).
- **`BUILD_MODE=export`**: Static export (PWA/desktop app). API calls go directly from the browser to provider endpoints; no server-side proxy. Detected via `getClientConfig()?.isApp`.

### Request flow

1. **Client-side**: `ClientApi` (`app/client/api.ts`) is a factory that instantiates a provider-specific `LLMApi` subclass (`app/client/platforms/*.ts`) based on `ModelProvider` enum.
2. **Streaming**: `ChatControllerPool` (`app/client/controller.ts`) manages `AbortController` instances keyed by `sessionId,messageId` so individual message streams can be cancelled.
3. **Server-side** (standalone mode only): API routes at `app/api/[provider]/[...path]/route.ts` dispatch to provider handlers (`app/api/openai.ts`, `app/api/anthropic.ts`, etc.). The `auth()` function in `app/api/auth.ts` validates access codes (hashed with spark-md5) and injects the configured system API key when the user doesn't provide their own.

### State management (Zustand + IndexedDB)

All persistent state uses Zustand with `createPersistStore` (`app/utils/store.ts`) which wraps `zustand/middleware/persist` with IndexedDB storage (via `idb-keyval`). Store keys are in `StoreKey` enum (`app/constant.ts`).

Key stores:
- **`useChatStore`** (`app/store/chat.ts`): Chat sessions, messages, streaming logic, context summarization, MCP tool integration. The `onUserInput` method orchestrates the full chat flow.
- **`useAccessStore`** (`app/store/access.ts`): Per-provider API keys, base URLs, and model enable/disable state entered by the user in Settings.
- **`useAppConfig`** (`app/store/config.ts`): UI preferences (theme, font size, submit key, model config per session, TTS settings).

### Model system

- **`DEFAULT_MODELS`** (`app/constant.ts`): A const array of all built-in models, each with `name`, `provider` (id/providerName/providerType/sorted), and `sorted` fields. Models are organized by provider.
- **Custom models**: Server admins set `CUSTOM_MODELS` env var; users set custom models in Settings. Both are parsed together. Format: `+model@Provider` to add, `-model@Provider` to hide, `name=displayName` for display names.
- **Model resolution**: `collectModelsWithDefaultModel` in `app/utils/model.ts` merges built-in, server custom, and user custom models, resolving availability and sorting.
- **`ModelProvider`** enum maps to `LLMApi` subclasses; `ServiceProvider` enum is used for UI display/grouping. Each client-side platform (`app/client/platforms/*.ts`) handles provider-specific API format differences.

### Chat flow (key logic in `app/store/chat.ts`)

- `onUserInput` is the main entry point: it builds the message list, handles context summarization (compresses history when token count exceeds model context window), injects MCP system prompts if enabled, fills template variables, calls `getClientApi(provider).llm.chat()`, and processes streaming chunks.
- Tool calls (function calling / MCP) are parsed from the stream and dispatched via `app/mcp/actions.ts`.
- Context summarization uses a separate "summarize model" (gpt-4o-mini for GPT, gemini-pro for Gemini, deepseek-chat for DeepSeek) to compress older messages.

### MCP (Model Context Protocol)

Enabled via `ENABLE_MCP=true` env var. MCP client/config/actions live in `app/mcp/`. MCP tools are injected into the system prompt using templates from `MCP_SYSTEM_TEMPLATE` / `MCP_TOOLS_TEMPLATE` in `app/constant.ts`. Tool calls flow through special markdown code blocks (`json:mcp:{clientId}` / `json:mcp-response:{clientId}`) parsed by `app/mcp/utils.ts`.

### Routing

Single-page app with client-side routing (`react-router-dom`). Routes defined in `Path` enum: `/` (home/chat), `/settings`, `/masks`, `/plugins`, `/auth`, `/mcp-market`, `/sd`, `/artifacts`, `/search-chat`. The `Home` component (`app/components/home.tsx`) is the root that renders all routes.

### Internationalization

Locale files in `app/locales/*.ts`. The `cn.ts` file defines the `LocaleType` interface (all other locales must match its shape). Fallback mechanism: if a locale is missing keys, values from English are merged in. Language is persisted to localStorage and auto-detected from `navigator.language`.

### Masks

Predefined chat personas ("masks") built at dev/build time by `app/masks/build.ts`, which compiles locale-specific mask definitions from `app/masks/cn.ts`, `en.ts`, `tw.ts` into `public/masks.json`. Builtin masks are loaded at runtime and merged with user-created masks in `useMaskStore`.

### Key files by role

| File | Purpose |
|------|---------|
| `app/constant.ts` | All enums (ServiceProvider, ModelProvider, StoreKey, ApiPath, Path), DEFAULT_MODELS, API endpoint paths, default templates |
| `app/config/server.ts` | Server-side env var parsing, access code hashing, provider enable/disable flags |
| `app/config/client.ts` | Reads build config from HTML meta tag (client) or build config (server) |
| `app/client/api.ts` | `ClientApi` factory + `LLMApi` abstract class + `getClientApi()` helper |
| `app/client/controller.ts` | `ChatControllerPool` for aborting in-flight streams |
| `app/utils/store.ts` | `createPersistStore` — Zustand wrapper with IndexedDB persistence |
| `app/api/auth.ts` | Server-side auth: access code validation + system API key injection |
| `app/api/common.ts` | `requestOpenai()` — shared proxy logic for OpenAI-compatible providers |
| `app/api/[provider]/[...path]/route.ts` | Catch-all API route dispatching to provider handlers |

### Edge runtime

API routes run on Vercel Edge Runtime (`export const runtime = "edge"`). No Node.js-specific APIs in API route files.
