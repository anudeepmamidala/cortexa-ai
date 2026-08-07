# 🚀 Cortexa AI / BackendForge — Architectural Explanation & Interview Guide

---

## 📌 1. Project Overview (In Simple Words)

**Cortexa AI** is an **AI-Powered Multi-Agent Software Engineering IDE** (like Cursor or Google Antigravity).

It allows developers to:
* 📂 Browse and edit project code files in a 3-column workspace.
* 🤖 Chat with specialized AI Agents (*Planner*, *Coding Agent*, *Reviewer*).
* ⚡ Watch the AI stream responses token-by-token in real time.
* 🔍 Use RAG (Retrieval-Augmented Generation) to query documentation.

---

## 🍃 2. Spring Boot Backend Explanation

### Core Responsibilities
* **Security & Auth**: User registration/login with stateless **JWT tokens** and **BCrypt** password hashing.
* **Tenant & Project Isolation**: Enforces database-level checks (`findByIdAndOwner`) so users only access their own projects.
* **Workspace File Management**: Serves file trees, reads code, saves edits (`Ctrl+S`), and creates files with strict **Path Traversal Security** (`..` attack prevention).
* **Unified Custom Exceptions**: Handles errors cleanly via `@RestControllerAdvice` returning standard `ErrorResponse` DTOs (`404 NOT_FOUND`, `409 CONFLICT`, `400 BAD_REQUEST`, etc.).
* **AI Service Gateway & SSE Proxy**: Uses reactive `WebClient` to proxy standard JSON and **Server-Sent Events (`text/event-stream`)** from the Python AI microservice to the frontend.

### Key Backend Technologies
* **Java 21 & Spring Boot 3.5**
* **Spring Security & JWT**
* **Spring Data JPA & MySQL**
* **Spring WebFlux WebClient** (for non-blocking AI microservice streaming)

---

## 🐍 3. FastAPI AI Service Explanation

### Core Responsibilities
* **LangGraph Multi-Agent Engine**: Orchestrates 4 specialized agents:
  1. 🎯 **Orchestrator Agent**: Classifies user intent and routes the prompt.
  2. 📝 **Planner Agent**: Generates step-by-step implementation plans.
  3. 💻 **Coding Agent**: Writes/refactors code and executes workspace file tools.
  4. 🔍 **Reviewer Agent**: Performs code reviews, checks for bugs and best practices.
* **Real-Time Token Streaming**: `POST /chat/stream` streams live tokens, agent state changes (`[Planner]`, `[Coding Agent]`), and tool execution logs via Server-Sent Events (SSE).
* **Direct Workspace File Tools**:
  * `read_file`, `write_file`, `list_directory`, `read_multiple_files` — allow agents to inspect and modify project source code directly on disk.
* **Multi-Format RAG Engine**:
  * Ingests `.java`, `.py`, `.ts`, `.js`, `.md`, `.pdf`, `.json` files into **ChromaDB**.
  * Uses **Ollama Embeddings** (`nomic-embed-text`) and collection namespacing per workspace.

---

## 🎯 4. Top Technical Interview & Viva Questions

### Q1: Why did you separate Spring Boot and FastAPI instead of building everything in Java or Python?
* **Answer**:
  * **Spring Boot** excels at robust enterprise backend capabilities: multi-tenant authentication, relational database transactions, security, and file management.
  * **FastAPI + Python** is the industry standard for LLM orchestration, LangGraph state machines, ChromaDB vector stores, and AI tools.
  * Separating them follows **Microservices Clean Architecture**, allowing each service to scale independently.

### Q2: How does real-time streaming work from Python all the way to the user's browser?
* **Answer**:
  1. Frontend makes an HTTP request to Spring Boot: `POST /api/chats/{chatId}/messages/stream`.
  2. Spring Boot uses reactive **Spring WebFlux `WebClient`** to call FastAPI's `POST /chat/stream`.
  3. FastAPI runs LangGraph `agent.stream()`, generating **Server-Sent Event (SSE)** frames (`event: token`, `event: agent`, `event: tool_start`).
  4. Spring Boot proxies these SSE frames to the browser without blocking Tomcat server threads.

### Q3: How do you prevent Directory Traversal Attacks in your File Management module?
* **Answer**:
  * Every relative file path requested by the client is resolved against the project's root folder (`storage/workspaces/project_{id}/`) and normalized using Java's `Path.normalize()`.
  * The system checks `resolvedPath.startsWith(projectRoot)`. If a user attempts `../etc/passwd`, it is rejected with an `Access Denied` exception.

### Q4: What is the difference between RAG and Direct Workspace File Access in your app?
* **Answer**:
  * **Direct Workspace File Access**: The agent uses filesystem tools (`read_file`, `write_file`) to directly inspect and edit project code on disk. No uploading required.
  * **RAG (Retrieval-Augmented Generation)**: Ingests external reference manuals or PDFs into ChromaDB vector embeddings (`search_documents`). Used for semantic background search over large documentation.

---

## ⏩ 5. Follow-Up Next Steps (Transitioning to Frontend)

Now that both backend services are 100% complete and verified:

1. **Create Frontend Workspace**:
   * Initialize React + Vite project in `/home/anudeep/Desktop/capstone-project/frontend`.
2. **Build 3-Column Cursor/Antigravity IDE Layout**:
   * 👈 **Left**: Project File Explorer Tree (`/api/projects/{id}/files/tree`).
   * 💻 **Middle**: Monaco Code Editor (`@monaco-editor/react`) for viewing & saving code (`/api/projects/{id}/files/content`).
   * 👉 **Right**: AI Copilot Chat Panel with live SSE token typing & agent badges (`/api/chats/{id}/messages/stream`).
