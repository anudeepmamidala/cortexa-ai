# BackendForge AI Service 🚀

> AI-powered multi-agent backend service for software engineering assistance built with **FastAPI**, **LangGraph**, and **LangChain**.

BackendForge AI Service is the intelligence layer of the BackendForge platform. It uses a multi-agent architecture to analyze requests, retrieve relevant context using RAG, invoke tools when necessary, and generate high-quality responses through LLMs.

---

# Features

- 🤖 Multi-Agent Architecture
- 🧠 LangGraph Workflow Orchestration
- 📄 Retrieval-Augmented Generation (RAG)
- 🔍 Chroma Vector Database
- 📁 PDF Knowledge Base Support
- 🛠 Tool Calling
- 🔄 Provider Abstraction
- ⚡ FastAPI REST API
- 📂 File Upload API
- 📝 Structured Logging
- 🏗 Modular & Clean Architecture

---

# Tech Stack

| Category | Technology |
|----------|------------|
| Language | Python 3.11+ |
| API Framework | FastAPI |
| AI Framework | LangChain |
| Workflow | LangGraph |
| Vector Database | ChromaDB |
| Embeddings | Ollama Embeddings |
| LLM Provider | OpenAI Compatible APIs / Ollama |
| Validation | Pydantic |
| Server | Uvicorn |

---

# Architecture

```
                   +----------------------+
                   |      FastAPI API     |
                   +----------+-----------+
                              |
                              v
                    +--------------------+
                    |    LangGraph       |
                    |   Orchestrator     |
                    +---------+----------+
                              |
            +-----------------+------------------+
            |                                    |
            v                                    v
     Planner Agent                      Coding Agent
            |                                    |
            +-----------------+------------------+
                              |
                              v
                      Reviewer Agent
                              |
                              v
                     Tool Invocation Layer
                              |
          +-------------------+-------------------+
          |                                       |
          v                                       v
      Chroma RAG                           LLM Provider
```

---

# Project Structure

```
backendforge-ai-service/
│
├── agents/
│   ├── base_agent.py
│   ├── planner_agent.py
│   ├── coding_agent.py
│   └── reviewer_agent.py
│
├── graph/
│   ├── graph.py
│   ├── nodes/
│   └── state.py
│
├── rag/
│   ├── loader.py
│   ├── embeddings.py
│   └── retriever.py
│
├── providers/
│
├── tools/
│
├── routers/
│
├── uploads/
│
├── core/
│
├── exceptions/
│
├── config/
│
├── main.py
├── requirements.txt
└── README.md
```

---

# Workflow

```
Client Request
      │
      ▼
FastAPI Endpoint
      │
      ▼
LangGraph Orchestrator
      │
      ▼
Planner Agent
      │
      ▼
Coding Agent
      │
      ▼
Reviewer Agent
      │
      ▼
Tool Calls / RAG
      │
      ▼
Final Response
```

---

# API Endpoints

## Chat

```
POST /chat
```

Generate AI responses using the multi-agent workflow.

---

## Upload Knowledge Base

```
POST /upload
```

Upload documents for Retrieval-Augmented Generation.

---

## Health Check

```
GET /
```

Returns service status.

---

# RAG Pipeline

1. Upload PDF
2. Load document
3. Split into chunks
4. Generate embeddings
5. Store in ChromaDB
6. Retrieve relevant chunks
7. Inject context into prompt
8. Generate response

---

# Multi-Agent Pipeline

```
User Request
      │
      ▼
Planner
      │
      ▼
Coding Agent
      │
      ▼
Reviewer
      │
      ▼
Final Answer
```

Each agent has a single responsibility and communicates through LangGraph state.

---

# Running the Project

## Clone

```bash
git clone https://github.com/<your-username>/backendforge-ai-service.git
cd backendforge-ai-service
```

## Create Virtual Environment

```bash
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### Linux / macOS

```bash
source venv/bin/activate
```

## Install Dependencies

```bash
pip install -r requirements.txt
```

## Configure Environment

Create a `.env` file.

```env
MODEL=your-model
BASE_URL=your-provider-url
API_KEY=your-api-key
```

## Run

```bash
uvicorn main:app --reload
```

---

# Design Principles

- Clean Architecture
- Separation of Concerns
- Agent-Based Design
- Provider Agnostic
- Extensible Tool System
- Modular Components

---

# Future Improvements

- Streaming Responses
- Docker Support
- Conversation Memory
- Additional Tool Integrations
- Authentication
- Observability
- Rate Limiting
- CI/CD Pipeline

---

# BackendForge Platform

This repository contains the **AI Service**.

The complete BackendForge platform consists of:

```
Frontend
      │
      ▼
Spring Boot Backend
      │
      ▼
BackendForge AI Service
      │
      ▼
LLM + ChromaDB
```

The Spring Boot backend is responsible for authentication, project management, persistence, and communication with the AI Service.

---

# License

This project is licensed under the MIT License.