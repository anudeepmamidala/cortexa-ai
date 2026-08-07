# ⚡ Cortexa AI — Multi-Agent AI Software Engineering Workspace IDE

<p align="center">
  <img src="https://img.shields.io/badge/Architecture-3--Tier%20Microservices-89b4fa?style=for-the-badge&logo=architecture" alt="Architecture" />
  <img src="https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%20%7C%20Monaco-cba6f7?style=for-the-badge&logo=react" alt="Frontend" />
  <img src="https://img.shields.io/badge/Backend-Java%2021%20%7C%20Spring%20Boot%203.5-a6e3a1?style=for-the-badge&logo=springboot" alt="Backend" />
  <img src="https://img.shields.io/badge/AI%20Service-Python%203.13%20%7C%20FastAPI%20%7C%20LangGraph-f9e2af?style=for-the-badge&logo=fastapi" alt="AI Service" />
  <img src="https://img.shields.io/badge/Database-MySQL%208.0-f38ba8?style=for-the-badge&logo=mysql" alt="Database" />
</p>

---

## 🚀 Overview

**Cortexa AI** is an advanced, production-grade **AI-Powered Autonomous Software Engineering Workspace & IDE** (inspired by Cursor and Google Antigravity). It combines a web-based code editor, real-time file tree workspace navigation, multi-agent orchestration, and intelligent tool calling (file editing, live web page/URL analysis, document RAG) to help developers build, debug, and manage code effortlessly.

---

## ✨ Key Features

- **🤖 Multi-Agent Orchestration System:**  
  Powered by **LangGraph** & **LangChain**, featuring specialized AI agents:
  - **Orchestrator Agent:** Analyzes developer requests and routes prompts to the best agent.
  - **Planner Agent:** Creates high-level architectural execution plans.
  - **Coding Agent:** Writes, refactors, and generates production-ready code.
  - **Reviewer Agent:** Audits code quality, security vulnerabilities, and logic flaws.

- **⚡ Real-Time SSE Token Streaming:**  
  Full server-sent events (SSE) pipeline (`FastAPI ➔ Spring WebFlux ➔ React`) for low-latency live token streaming, agent status badges, and uninterrupted conversation history.

- **🌐 Live Web Page & URL Analyzer (`analyze_url`):**  
  Scrapes, inspects, and synthesizes text content, GitHub repos, and live documentation links provided in user queries.

- **📁 Automated Workspace Code Generation (`write_file`):**  
  AI agents execute tool calls to create, modify, and persist files across active workspace directories in real time.

- **🎨 Modern Developer Studio UI:**  
  Built with **Monaco Editor** (VS Code engine), collapsible file explorer, syntax highlighting, dark mode glassmorphism, and responsive chat interface.

- **🔐 Enterprise Security & Auth:**  
  Spring Security JWT authentication, stateless session management, BCrypt password hashing, and containerized workspace path containment guards.

---

## 🛠️ Microservices Architecture

```
                                  ┌───────────────────────────┐
                                  │      React 19 Frontend    │
                                  │   (Vite + Monaco Editor)  │
                                  └─────────────┬─────────────┘
                                                │
                                       HTTP / SSE / REST
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │    Spring Boot Backend    │
                                  │   (Java 21 / WebFlux API) │
                                  └──────┬─────────────┬──────┘
                                         │             │
                                  MySQL 8.0            │ HTTP / SSE
                                  (Auth/Chats)         │
                                                       ▼
                                  ┌───────────────────────────┐
                                  │     FastAPI AI Service    │
                                  │ (LangGraph / Groq LLMs)   │
                                  └─────────────┬─────────────┘
                                                │
                                    ┌───────────┴───────────┐
                                    ▼                       ▼
                           ┌─────────────────┐     ┌──────────────────┐
                           │ Workspace Tools │     │ Web URL Analyzer │
                           │ (write_file/RAG)│     │  (analyze_url)   │
                           └─────────────────┘     └──────────────────┘
```

---

## 🧰 Tech Stack Matrix

| Layer | Technologies & Frameworks |
|---|---|
| **Frontend** | React 19, Vite, Monaco Editor (`@monaco-editor/react`), Lucide Icons, Vanilla CSS Design System |
| **Backend** | Java 21, Spring Boot 3.5, Spring Security, Spring WebFlux (`WebClient`), Spring Data JPA, Hibernate, HikariCP |
| **AI Service** | Python 3.13, FastAPI, LangGraph, LangChain, Groq LLM API, BeautifulSoup4, ChromaDB |
| **Database** | MySQL 8.0 (Chat sessions, user credentials, workspace metadata) |
| **Tools & APIs** | Server-Sent Events (SSE), RESTful APIs, JWT Authentication |

---

## 📁 Repository Structure

```
capstone-project/
├── ai-service/                   # FastAPI Multi-Agent Service
│   ├── agents/                   # LangGraph AI Agents (Orchestrator, Planner, Coding, Reviewer)
│   ├── api/                      # Chat streaming & REST endpoints
│   ├── config.py                 # LLM model & environment configurations
│   ├── graph/                    # LangGraph state graph definitions
│   ├── schemas/                  # Pydantic request/response schemas
│   ├── tools/                    # Tool definitions (file_tools, url_tools, rag_tools)
│   └── app.py                    # FastAPI service entrypoint
│
├── backend/                      # Spring Boot Enterprise Backend
│   ├── src/main/java/com/cortexa/backend/
│   │   ├── ai/                   # AI Gateway Service & Reactive WebClient
│   │   ├── chat/                 # Chat controllers, repositories & WebFlux streaming
│   │   ├── file/                 # File workspace management & tree services
│   │   ├── project/              # Project CRUD endpoints & storage services
│   │   ├── security/             # JWT authentication filters & SecurityConfig
│   │   └── user/                 # User management & authentication
│   └── src/main/resources/       # application.properties configuration
│
└── frontend/                     # React 19 Developer Web Studio
    ├── src/
    │   ├── components/           # Navbar, CodeEditor, FileExplorer, ChatPanel, AuthModal
    │   ├── App.jsx               # Main IDE layout & SSE stream reader
    │   └── index.css             # Theme design system & styling
    ├── package.json
    └── vite.config.js
```

---

## ⚙️ Environment Configuration

### 1. AI Service (`ai-service/.env`)

```env
GROQ_API_KEY=your_groq_api_key_here
MODEL=llama-3.3-70b-versatile
TEMPERATURE=0.2
MAX_TOKENS=4096
```

### 2. Backend (`backend/src/main/resources/application.properties`)

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/cortexa_db?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect

jwt.secret=your_jwt_secret_key_32_chars_min
ai.service.url=http://localhost:8000
```

### 3. Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:8080
```

---

## 🚦 Quickstart & Running Locally

### 1. Start the AI Service (FastAPI)

```bash
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

### 2. Start the Backend (Spring Boot)

```bash
cd backend
./mvnw spring-boot:run
```

### 3. Start the Frontend (Vite)

```bash
cd frontend
npm install
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 📡 Core API Endpoints

### Backend (`http://localhost:8080`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token |
| `GET` | `/api/projects` | List all user projects |
| `POST` | `/api/projects` | Create a new project workspace |
| `GET` | `/api/projects/{id}/files/tree` | Fetch workspace file directory tree |
| `POST` | `/api/chats/{chatId}/messages/stream` | Stream AI chat response (SSE) |

### AI Service (`http://localhost:8000`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/chat/stream` | LangGraph multi-agent streaming execution |
| `POST` | `/chat` | Direct non-streaming agent invocation |
| `GET` | `/health` | Service health status |

---

## 🛡️ License & Acknowledgments

This project is licensed under the **MIT License**. Built with ❤️ using Spring Boot, React, and LangGraph.