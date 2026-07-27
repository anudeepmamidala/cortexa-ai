# Implementation Status — BackendForge AI Service

## Project Summary

**BackendForge AI Service** is the intelligence layer of the **BackendForge** capstone platform — an AI-powered backend service for software engineering assistance. It sits between a planned Spring Boot backend (not yet implemented in this repo) and LLM / vector-store infrastructure.

The service accepts chat requests and document uploads over REST, routes each request through a **multi-agent LangGraph workflow**, and uses **Retrieval-Augmented Generation (RAG)** so agents can answer questions grounded in uploaded PDFs.

| Aspect | Details |
|--------|---------|
| **Project name** | BackendForge AI Service (FastAPI app title: "AI Workspace AI Service") |
| **Purpose** | Multi-agent AI assistant for planning, coding, and code review |
| **Platform context** | Part of `capstone-project`: Frontend → Spring Boot Backend → **AI Service** → LLM + ChromaDB |
| **Language** | Python 3.11+ |
| **Entry point** | `app.py` (run with `uvicorn app:app --reload`) |
| **Primary stack** | FastAPI, LangChain, LangGraph, ChromaDB, Ollama embeddings, Groq (OpenAI-compatible API) |

### High-Level Architecture

```
Client (Frontend / Spring Boot)
        │
        ▼
   FastAPI (app.py)
        │
        ├── POST /chat/          → LangGraph multi-agent workflow
        └── POST /documents/upload → PDF ingest → ChromaDB
        │
        ▼
   Orchestrator Agent (routes request)
        │
        ├── Planner Agent    (architecture & task breakdown)
        ├── Coding Agent     (code gen, debug, RAG Q&A)
        └── Reviewer Agent   (code review & feedback)
        │
        ▼
   Tool Layer (file I/O, document search)
        │
        ├── ChromaDB (persisted at data/chroma/)
        └── Groq LLM via OpenAI-compatible API
```

### Request Flow

1. Client sends `POST /chat/` with `message` and `thread_id`.
2. LangGraph starts at the **orchestrator** node, which classifies the intent.
3. The graph routes to **planner**, **coding**, or **reviewer** (one agent per request).
4. The selected agent may invoke tools (read/write files, search documents).
5. The final LLM response is returned as JSON.

---

## Implemented Features

### 1. FastAPI REST API

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/chat/` | POST | ✅ Implemented | Runs the multi-agent graph and returns the last message content |
| `/documents/upload` | POST | ✅ Implemented | Accepts PDF files, stores them in `uploads/`, indexes into ChromaDB |
| `/` (health check) | GET | ❌ Not implemented | Mentioned in `readme.md` but no route exists in code |

**Files:** `app.py`, `api/routes.py`, `api/chat.py`, `api/document.py`, `schemas/chat.py`

---

### 2. Multi-Agent Architecture

Four specialized agents, each with its own system prompt:

| Agent | Role | Tools | File |
|-------|------|-------|------|
| **Orchestrator** | Classifies user intent and picks a route | None | `agents/orchestrator/` |
| **Planner** | Breaks requests into numbered implementation plans (no code) | None | `agents/planner/` |
| **Coding** | Programming Q&A, debugging, code generation, RAG-backed answers | All tools | `agents/coding/` |
| **Reviewer** | Code review, bugs, performance, best practices | All tools | `agents/reviewer/` |

All task agents inherit from `BaseAgent` (`agents/base/base_agent.py`), which handles LLM binding, tool execution loops, and structured logging.

---

### 3. LangGraph Workflow Orchestration

- **State graph** defined in `graph/builder.py` with nodes: `orchestrator` → conditional route → `planner` | `coding` | `reviewer` → END.
- **Shared state** (`graph/state.py`): `messages` (with `add_messages` reducer) and `route`.
- **Router** (`graph/router.py`): reads `route` from state; defaults to `coding` if invalid.
- **Checkpointing**: `MemorySaver` enables per-`thread_id` conversation persistence across invocations.

---

### 4. LLM Provider Abstraction

- Abstract base: `providers/base.py`
- Concrete provider: `providers/groq_provider.py` (uses `ChatOpenAI` with configurable `BASE_URL`, `MODEL`, `API_KEY`)
- Factory: `providers/factory.py` → returns `GroqProvider`
- Config via environment variables in `config.py`: `MODEL`, `BASE_URL`, `API_KEY`, `TEMPERATURE`, `MAX_TOKENS`, `EMBEDDINGS_URL`

Provider is swappable behind the factory pattern, though only Groq is implemented today.

---

### 5. Tool Calling System

Registered in `tools/registry.py` and bound to coding/reviewer agents:

| Tool | Purpose | File |
|------|---------|------|
| `read_file` | Read a file by path | `tools/file_tools.py` |
| `write_file` | Write content to a file (creates dirs) | `tools/file_tools.py` |
| `list_directory` | List files/folders in a directory | `tools/file_tools.py` |
| `file_exists` | Check if a file exists | `tools/file_tools.py` |
| `read_multiple_files` | Read several files at once | `tools/file_tools.py` |
| `search_documents` | RAG search over indexed PDFs | `tools/rag_tools.py` |

`BaseAgent` runs a tool-call loop: invoke LLM → execute tools → re-invoke until no more tool calls.

---

### 6. Retrieval-Augmented Generation (RAG)

Full ingest-and-retrieve pipeline:

| Step | Implementation | File |
|------|----------------|------|
| PDF upload | FastAPI multipart endpoint | `api/document.py` |
| Document loading | `PyPDFLoader` | `services/rag/ingest.py` |
| Chunking | `RecursiveCharacterTextSplitter` (1000 chars, 200 overlap) | `services/rag/ingest.py` |
| Embeddings | Ollama `nomic-embed-text` | `services/rag/embeddings.py` |
| Vector store | ChromaDB persisted at `data/chroma/` | `services/rag/vector_store.py` |
| Retrieval | Top-4 similarity search | `services/rag/retriever.py`, `services/rag/search.py` |
| Agent integration | `search_documents` tool used by coding agent | `tools/rag_tools.py` |

A test document exists at `uploads/rag_test_document.pdf` and Chroma data is present under `data/chroma/`.

---

### 7. Cross-Cutting Concerns

| Feature | Status | File |
|---------|--------|------|
| Structured logging | ✅ | `core/logging.py`, logging in `BaseAgent` |
| Global exception handler | ✅ | `core/handler.py` — catches unhandled errors, returns 500 JSON |
| Pydantic request validation | ✅ | `schemas/chat.py` — `ChatRequest` with `thread_id` and `message` |
| Environment-based config | ✅ | `config.py` + `.env` |
| Dependency management | ✅ | `requirements.txt`, `requirement.txt` |

---

### 8. Project Structure (Modular Layout)

```
ai-service/
├── agents/          # Orchestrator, planner, coding, reviewer + prompts
├── api/             # FastAPI routers (chat, documents)
├── core/            # Logging, exception handlers
├── graph/           # LangGraph builder, state, nodes, router
├── providers/       # LLM provider abstraction
├── schemas/         # Pydantic models
├── services/rag/    # Ingest, embeddings, vector store, search
├── tools/           # File tools, RAG tools, registry
├── uploads/         # Uploaded PDFs
├── data/chroma/     # Persisted vector database
├── app.py           # FastAPI entry point
└── config.py        # Environment configuration
```

---

## Partially Implemented / Stub Code

These exist in the codebase but are not fully wired or functional:

| Item | Location | Notes |
|------|----------|-------|
| RAG graph node | `graph/nodes/rag_node.py` | Stub — returns state unchanged; not added to the graph |
| Basic chat node | `graph/nodes_basic.py` | Legacy single-LLM node; unused |
| Document loader module | `services/rag/loader.py` | Empty file |
| Chat response schema | `schemas/chat.py` | `ChatResponse` defined but endpoint returns a plain dict |
| Conversation memory folder | `memory/` | Empty directory |
| Utils folder | `utils/` | Empty directory |
| Tests folder | `tests/` | Empty — no automated tests |
| Spring Boot backend | `../backend/` | Empty directory in capstone project |
| LLM streaming | `providers/groq_provider.py` | `streaming=True` set, but no streaming endpoint exposed |
| Multi-agent pipeline | Graph design | Only one agent runs per request; no planner → coding → reviewer chain |

---

## Known Issues / Bugs

| Issue | Location | Impact |
|-------|----------|--------|
| Broken import `from logger import logger` | `graph/nodes/planner_node.py` | Planner node will fail at runtime |
| Missing `HTTPException` import | `api/document.py` | Upload validation error handling will crash |
| Missing dependencies in `requirements.txt` | `requirements.txt` | `langchain-community`, `langchain-text-splitters`, `pypdf` used but not pinned |
| Inconsistent naming | `app.py` vs `readme.md` | App title says "AI Workspace"; readme says "BackendForge" |
| Duplicate requirements files | `requirements.txt`, `requirement.txt` | Two similar files; `requirement.txt` has extra packages (`langchain-ollama`, `ollama`) |

---

## Recommended Future Implementations

### Priority 1 — Fix & Stabilize

- [ ] Fix broken imports in `planner_node.py` and `document.py`
- [ ] Pin all required dependencies (`langchain-community`, `langchain-text-splitters`, `pypdf`, `langchain-ollama`)
- [ ] Add `GET /` health-check endpoint
- [ ] Add unit and integration tests (`tests/`)
- [ ] Consolidate `requirements.txt` and `requirement.txt` into one file

### Priority 2 — Core Feature Completion

- [ ] **Streaming responses** — SSE or WebSocket endpoint for token-by-token chat output
- [ ] **Multi-step agent pipeline** — chain planner → coding → reviewer for complex tasks instead of single-route execution
- [ ] **Wire RAG node into graph** — automatic context injection before agent invocation
- [ ] **Document management API** — list, delete, and re-index uploaded documents
- [ ] **Multi-format support** — ingest Markdown, TXT, DOCX, not just PDF
- [ ] **Conversation history API** — retrieve past messages by `thread_id`

### Priority 3 — Platform Integration

- [ ] **Spring Boot backend** — auth, project management, persistence, proxy to AI service
- [ ] **Authentication & authorization** — API keys or JWT between frontend/backend and AI service
- [ ] **Frontend integration** — chat UI connected to `/chat/` and document upload

### Priority 4 — Production Readiness

- [ ] **Docker & docker-compose** — containerize AI service with ChromaDB and Ollama
- [ ] **Rate limiting** — protect LLM endpoints from abuse
- [ ] **Observability** — OpenTelemetry tracing, LangSmith integration, metrics dashboard
- [ ] **CI/CD pipeline** — lint, test, build, deploy on push
- [ ] **Configurable agent prompts** — load prompts from files or database per project
- [ ] **Additional LLM providers** — Ollama local, OpenAI, Anthropic via factory pattern
- [ ] **Sandboxed file tools** — restrict file read/write to a workspace directory for safety
- [ ] **Multi-tenant vector stores** — separate Chroma collections per user/project
- [ ] **Caching** — cache embeddings and frequent RAG queries
- [ ] **Background ingest jobs** — async PDF processing for large documents

### Priority 5 — Advanced AI Capabilities

- [ ] **Code execution sandbox** — run and test generated code safely
- [ ] **Git integration tools** — diff, commit, branch operations
- [ ] **Web search tool** — fetch live documentation and Stack Overflow answers
- [ ] **Agent memory** — long-term memory beyond per-thread checkpointing
- [ ] **Human-in-the-loop** — pause graph for user approval on file writes
- [ ] **Evaluation suite** — benchmark agent quality on coding/review tasks

---

## Quick Reference — How to Run

```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirement.txt   # includes langchain-ollama
# Configure .env with MODEL, BASE_URL, API_KEY, TEMPERATURE, MAX_TOKENS, EMBEDDINGS_URL
uvicorn app:app --reload
```

**Example chat request:**

```bash
curl -X POST http://localhost:8000/chat/ \
  -H "Content-Type: application/json" \
  -d '{"thread_id": "session-1", "message": "How do I implement JWT auth in Spring Boot?"}'
```

**Example document upload:**

```bash
curl -X POST http://localhost:8000/documents/upload \
  -F "file=@uploads/rag_test_document.pdf"
```

---

## Summary

BackendForge AI Service is a **capstone-project AI microservice** that delivers a working foundation: FastAPI API, LangGraph multi-agent routing, tool calling, and a RAG pipeline over PDFs with ChromaDB. The coding and reviewer agents can search documents and manipulate files; the planner produces structured plans; the orchestrator routes by intent.

The largest gaps are **production hardening** (tests, auth, Docker, streaming), **platform integration** (empty Spring Boot backend), **bug fixes** in planner and document modules, and **advanced workflow** features like multi-agent chaining and automatic RAG injection. The empty `backend/`, `tests/`, `memory/`, and `utils/` directories mark clear next steps for the capstone roadmap.

---

## Appendix A — Copy-Paste Prompt: Fix AI Service (6.5 → 8.5)

Use this prompt **one step at a time** with another AI. Complete each step, run the service, verify it works, then move to the next. Do not skip ahead.

```
You are helping me improve my BackendForge AI Service — a Python FastAPI + LangGraph + LangChain capstone project located at ai-service/ inside a monorepo. Spring Boot is in a separate folder and is OUT OF SCOPE for this task. Focus ONLY on ai-service.

## Context

- Entry point: app.py (run with uvicorn app:app --reload)
- Multi-agent graph: orchestrator → planner | coding | reviewer (single agent per request)
- RAG is intentionally implemented as a TOOL (search_documents), NOT a separate graph node or agent — do not add a RAG node
- nodes_basic.py and graph/nodes/rag_node.py are dead code and SHOULD BE DELETED
- Empty folders (memory/, utils/) are placeholders — do not fill them unless a step explicitly requires it

## Current rating: 6.5/10
## Target rating: 8.5/10

## Known bugs (fix first)

1. graph/nodes/planner_node.py
   - Broken import: `from logger import logger` — module does not exist
   - Fix: use `from core.logging import logger` (same pattern as agents/base/base_agent.py)

2. api/document.py
   - Uses HTTPException but never imports it
   - Fix: add `from fastapi import APIRouter, File, UploadFile, HTTPException`

## Work in this exact order (one PR/commit per step if possible)

### Step 1 — Fix runtime bugs
Files: graph/nodes/planner_node.py, api/document.py
- Fix both imports above
- Replace print() in graph/nodes/coding_node.py and graph/nodes/reviewer_node.py with logger from core.logging
- Verify: uvicorn starts, POST /chat/ with a planning message hits planner without ImportError, POST /documents/upload with a non-PDF returns 400 (not 500)

### Step 2 — Health endpoint
Files: api/routes.py or new api/health.py, app.py (if needed)
- Add GET /health returning {"status": "ok", "service": "ai-service"}
- Verify: curl GET /health returns 200

### Step 3 — Consolidate dependencies
Files: requirements.txt, requirement.txt (delete one after merge)
- Merge into a single requirements.txt
- Ensure these are pinned (used in code but may be missing): langchain-community, langchain-text-splitters, langchain-ollama, pypdf
- Verify: fresh venv + pip install -r requirements.txt + uvicorn starts

### Step 4 — Delete dead code
Files to DELETE: graph/nodes_basic.py, graph/nodes/rag_node.py
- Confirm nothing imports them (grep first)
- Do not delete empty services/rag/loader.py unless you implement it — leave as placeholder

### Step 5 — Use ChatResponse schema
Files: api/chat.py, schemas/chat.py
- Make POST /chat/ return ChatResponse (response_model=ChatResponse) instead of a raw dict
- Verify: OpenAPI docs show typed response

### Step 6 — Add streaming endpoint
Files: api/chat.py (or api/chat_stream.py), agents/base/base_agent.py (optional flag), schemas/chat.py
- Add POST /chat/stream returning text/event-stream (SSE)
- Stream phases: agent name → tool_start/tool_end (if tools run) → token chunks → done event
- Keep existing POST /chat/ as non-streaming fallback
- LLM already has streaming=True in providers/groq_provider.py — wire it up on the final LLM call after tools finish
- Verify: curl -N shows incremental SSE events

### Step 7 — Optional pipeline mode
Files: graph/builder.py, graph/router.py, graph/state.py, agents/orchestrator/prompt.py, schemas/chat.py, api/chat.py
- Add optional field on ChatRequest: mode: "single" | "pipeline" (default "single")
- When mode="pipeline": run planner → coding → reviewer sequentially (edges, not conditional single hop)
- When mode="single": keep current orchestrator routing behavior
- Do NOT auto-pipeline every request — only when mode="pipeline" or orchestrator explicitly returns "pipeline"
- Verify: pipeline request produces plan, then code, then review in one response thread

### Step 8 — Sandboxed file tools
Files: tools/file_tools.py, config.py
- Add WORKSPACE_ROOT env var (default: ./workspace/)
- All file tool paths must resolve inside WORKSPACE_ROOT — reject paths with .. or absolute paths outside root
- Verify: read_file("../../../etc/passwd") returns error, read_file("hello.txt") works inside workspace

### Step 9 — Document list endpoint
Files: api/document.py, services/rag/ (optional helper)
- Add GET /documents listing uploaded filenames from uploads/ and optionally chunk count from Chroma metadata
- Verify: after upload, GET /documents shows the file

### Step 10 — Basic tests
Files: tests/test_health.py, tests/test_chat.py, tests/test_documents.py, tests/conftest.py
- Use pytest + httpx TestClient (FastAPI)
- Minimum tests:
  - GET /health → 200
  - POST /chat/ → 200 with response string (mock LLM if needed, or mark as integration)
  - POST /documents/upload non-PDF → 400
  - tools/file_tools sandbox rejects path traversal
- Verify: pytest passes

## Rules for every step
- Minimize scope — only touch files needed for that step
- Match existing code style (logging, imports, naming)
- Do not add Spring Boot, auth, or Docker unless the step says so
- Do not add a RAG graph node — RAG stays as search_documents tool only
- Explain what you changed and why after each step so I can learn

## Start with Step 1 only. Wait for my confirmation before Step 2.
```

---

## Appendix B — Copy-Paste Prompt: Build Spring Boot Backend (AI Workspace)

Use this prompt with another AI when you start the Spring Boot backend in its **separate folder** (e.g. capstone-project/backend/). The AI service already exists in ai-service/ — the backend should integrate with it, not reimplement AI logic.

```
You are helping me build the Spring Boot backend for AI Workspace (also called BackendForge) — a capstone project. The AI intelligence layer already exists as a separate Python microservice in ai-service/. Your job is to design and implement the Spring Boot backend that sits between the frontend and the AI service.

## Platform architecture

Frontend (React or similar — may not exist yet)
        │
        ▼
Spring Boot Backend  ← YOU ARE BUILDING THIS
        │
        ├── PostgreSQL / H2 (users, projects, chat history metadata)
        └── HTTP calls to ai-service (Python FastAPI)
                │
                ▼
        ai-service (already built — do not rewrite in Java)
                ├── LangGraph multi-agent workflow
                ├── Groq LLM (OpenAI-compatible API)
                ├── ChromaDB + Ollama embeddings (RAG)
                └── File tools + document search

## What ai-service already provides (integrate, don't duplicate)

Base URL (local dev): http://localhost:8000

| AI Service Endpoint | Method | Request | Response |
|---------------------|--------|---------|----------|
| /health | GET | — | {"status": "ok"} (add if not yet present) |
| /chat/ | POST | {"thread_id": "string", "message": "string", "mode": "single\|pipeline" (optional)} | {"response": "string"} |
| /chat/stream | POST | same as /chat/ | SSE text/event-stream (add if not yet present) |
| /documents/upload | POST | multipart file (PDF only) | {"message", "filename", "chunks"} |
| /documents | GET | — | list of indexed documents (add if not yet present) |

### AI service capabilities (for your API design)
- Multi-agent routing: orchestrator picks planner, coding, or reviewer per request
- Optional pipeline mode: planner → coding → reviewer in one chain
- RAG: PDF upload indexed to ChromaDB; coding/reviewer agents call search_documents tool automatically when needed
- Thread memory: thread_id persists conversation via LangGraph MemorySaver — same thread_id = same conversation context
- Tools: agents can read/write files in a sandboxed workspace, list directories, search uploaded docs
- No auth on ai-service today — Spring Boot should gate access and optionally forward an internal API key later

## What Spring Boot should own

Spring Boot is the system of record for users, projects, and permissions. It proxies AI calls and stores metadata the AI service does not persist long-term.

### Phase 1 — Core (MVP)

1. **User authentication & authorization**
   - Register, login, JWT (access + refresh tokens)
   - Spring Security + BCrypt passwords
   - Roles: USER, ADMIN (optional for capstone)

2. **Project / workspace management**
   - CRUD projects (name, description, owner)
   - Each project maps to a logical workspace — store projectId and link to ai-service thread_id prefix or workspace path

3. **Chat proxy**
   - POST /api/projects/{projectId}/chat
   - Backend generates or reuses thread_id (e.g. "{userId}-{projectId}-{sessionId}")
   - Forwards message to ai-service POST /chat/
   - Saves chat message + response in DB (userId, projectId, threadId, role, content, timestamp)
   - GET /api/projects/{projectId}/chat/history — paginated history from DB

4. **Document proxy**
   - POST /api/projects/{projectId}/documents/upload
   - Forward multipart to ai-service /documents/upload
   - Save document metadata in DB (filename, uploadedBy, projectId, chunkCount, uploadedAt)
   - GET /api/projects/{projectId}/documents — list from DB (and optionally sync with ai-service)

5. **Health & config**
   - GET /actuator/health
   - application.yml: ai-service.base-url, jwt secret, datasource
   - RestTemplate or WebClient bean for ai-service calls with timeout and error handling

### Phase 2 — Better UX

6. **Streaming chat proxy**
   - POST /api/projects/{projectId}/chat/stream
   - Proxy SSE from ai-service /chat/stream to frontend
   - Save full assistant response to DB when stream completes

7. **Chat sessions**
   - Session entity per project (title auto-generated from first message)
   - List sessions, rename, delete
   - Each session has its own thread_id sent to ai-service

8. **User profile**
   - GET/PATCH /api/users/me
   - Change password

### Phase 3 — Production-ish (capstone stretch)

9. **Rate limiting** — per user chat requests per minute
10. **Async document processing** — return 202 immediately, poll status (if ai-service adds async ingest)
11. **Internal service auth** — API key header from Spring Boot to ai-service
12. **OpenAPI docs** — springdoc-openapi for frontend code generation

## Suggested Spring Boot stack

- Java 17+, Spring Boot 3.x
- Spring Web, Spring Security, Spring Data JPA
- PostgreSQL (prod) / H2 (dev)
- Lombok (optional), MapStruct (optional)
- WebClient for ai-service (better for SSE than RestTemplate)
- Flyway or Liquibase for migrations
- springdoc-openapi-starter-webmvc-ui

## Suggested package structure

backend/
├── src/main/java/com/aiworkspace/
│   ├── AiWorkspaceApplication.java
│   ├── config/          (Security, WebClient, CORS)
│   ├── controller/      (Auth, Project, Chat, Document, User)
│   ├── dto/             (request/response records)
│   ├── entity/          (User, Project, ChatMessage, Document, ChatSession)
│   ├── repository/
│   ├── service/         (AuthService, ProjectService, AiServiceClient, ChatService)
│   ├── security/        (JwtFilter, UserDetailsService)
│   └── exception/       (GlobalExceptionHandler)
└── src/main/resources/
    ├── application.yml
    └── db/migration/

## Database entities (minimum)

- User: id, email, passwordHash, role, createdAt
- Project: id, name, description, ownerId, createdAt
- ChatSession: id, projectId, userId, threadId, title, createdAt
- ChatMessage: id, sessionId, role (USER/ASSISTANT), content, createdAt
- Document: id, projectId, filename, uploadedBy, chunks, uploadedAt

## Integration pattern (ChatService example flow)

1. Frontend → POST /api/projects/{id}/chat { "message": "...", "sessionId": "..." }
2. Spring Boot validates JWT, checks user owns project
3. Load or create ChatSession, get threadId
4. Call ai-service: POST {baseUrl}/chat/ { "thread_id": threadId, "message": message }
5. Save user message + assistant response to ChatMessage
6. Return response to frontend

## What NOT to build in Spring Boot

- Do not reimplement LangGraph, agents, RAG, or ChromaDB in Java
- Do not call Groq directly from Spring Boot for chat — always go through ai-service
- Do not store vectors in PostgreSQL — ChromaDB stays in ai-service

## Deliverables I want from you

1. Project setup (pom.xml or build.gradle, application.yml)
2. Entity + repository + migration for User, Project, ChatSession, ChatMessage, Document
3. JWT auth (register, login)
4. AiServiceClient (WebClient wrapper for ai-service endpoints)
5. Chat proxy with history
6. Document upload proxy with metadata save
7. CORS config for local frontend (http://localhost:5173 or 3000)
8. README with how to run backend + ai-service together

## Start by asking me:
- Maven or Gradle?
- PostgreSQL or H2 for dev?
- Package name preference?

Then implement Phase 1 step by step. Explain each layer (entity → repo → service → controller) so I can learn sequentially. Wait for my confirmation between major steps.
```
