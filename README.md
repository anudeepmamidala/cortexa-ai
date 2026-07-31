# Cortexa AI — Multi-Agent AI Software Engineering IDE

An AI-powered, web-based IDE that combines a live code editor, project workspace, and a multi-agent LangGraph backend to plan, generate, and review code in real time.

## Overview

Cortexa AI pairs a Monaco-based code editor and file explorer with a multi-agent AI backend. Requests are routed through specialized LangGraph agents that plan, write, and review code, with responses streamed token-by-token to the frontend over Server-Sent Events.

## Key Features

- **Multi-Agent Orchestration** — 4 specialized LangGraph agents: **Orchestrator** (routes requests), **Planner** (builds execution plans), **Coding** (writes/refactors code), and **Reviewer** (audits code quality and logic).
- **Real-Time SSE Streaming** — a reactive Spring Boot (WebFlux) gateway exposes a `Flux<String>` streaming endpoint (`/api/chats/{chatId}/messages/stream`) that relays live tokens from the FastAPI agent service to the React frontend.
- **RAG-Based Document Retrieval** — a full retrieval pipeline (embeddings, ingestion, vector store, retriever, search) grounds agent responses in uploaded project/documentation context via ChromaDB.
- **Tool-Calling Agents** — agents call registered tools for file read/write, live URL/web page analysis, and RAG lookups, scoped to the active project workspace.
- **Workspace & Project Management** — full CRUD for projects, files, and chat sessions, each isolated per authenticated user.
- **Secured End-to-End** — Spring Security JWT authentication (`JwtAuthenticationFilter`, `JwtService`), BCrypt password hashing (`PasswordEncoderConfig`), and workspace path containment.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite, Monaco Editor |
| Backend | Java, Spring Boot, Spring WebFlux, Spring Security |
| AI Service | Python, FastAPI, LangGraph, LangChain |
| RAG / Vector Store | ChromaDB |
| LLM Provider | Groq |
| Database | MySQL |
| Auth | JWT, BCrypt |

## Architecture
![Architecture]<img width="2816" height="1536" alt="Gemini_Generated_Image_vpc2ouvpc2ouvpc2" src="https://github.com/user-attachments/assets/5cbeff51-dd78-4802-a545-5dc07e196e98" />


## Repository Structure

```
cortexa-ai/
├── ai-service/     # FastAPI multi-agent service
│   ├── agents/     # orchestrator, planner, coding, reviewer
│   ├── graph/      # LangGraph builder, router, state, nodes
│   ├── services/rag/
│   └── tools/
└── backend/        # Spring Boot backend
    └── src/main/java/com/cortexa/backend/
        ├── auth/
        ├── chat/
        ├── file/
        ├── project/
        └── security/
```

## Roadmap

- Per-user rate limiting on AI chat endpoints
- Docker Compose setup for one-command local startup

## License

MIT
