# ContentFlow AI

A full-stack AI content generation platform built with Java Spring Boot and React.

**Live Demo:** https://content-flow-frontend-lemon.vercel.app

---

## What it does

- **Generate** — produce blog posts, LinkedIn posts, emails, and product descriptions powered by Llama 3.3 70B
- **Refine** — chain a second AI call to improve, shorten, expand, or change the tone of any output
- **Bulk Generate** — run all 4 content formats simultaneously from a single topic
- **Summarize** — condense any long-form text into a clean summary
- **History** — every generation saved automatically to a database, browsable and filterable
- **AutoPost Scheduler** — schedule content to generate automatically at a future time via a background job

---

## Tech stack

| Layer     | Technology                            |
|-----------|---------------------------------------|
| Backend   | Java 17, Spring Boot 3, OkHttp        |
| Database  | H2 (in-memory), Spring Data JPA       |
| AI        | Groq API — Llama 3.3 70B              |
| Frontend  | React, custom CSS                     |
| Deploy    | Railway (backend) + Vercel (frontend) |

---

## Architecture

```
React Frontend (Vercel)
        ↓ HTTP
Spring Boot REST API (Railway)
        ↓ HTTP
Groq API — Llama 3.3 70B
        ↓
H2 In-Memory Database
```

**AI Chaining** — the Refine feature feeds the output of one AI call as the input of a second call with a transformation instruction. This is the core pattern behind agentic AI systems.

**Background Scheduling** — `@Scheduled(fixedRate = 60000)` runs a background thread every 60 seconds, queries for pending posts whose scheduled time has passed, fires the Groq API, and updates the database record automatically.

---

## API Endpoints

| Method | Endpoint                  | Description                        |
|--------|---------------------------|------------------------------------|
| POST   | /api/content/generate     | Generate content by type and topic |
| POST   | /api/content/refine       | Refine existing content            |
| POST   | /api/content/bulk         | Generate all 4 formats at once     |
| POST   | /api/content/summarize    | Summarize long-form text           |
| GET    | /api/content/history      | Retrieve all saved generations     |
| DELETE | /api/content/history/{id} | Delete a history item              |
| POST   | /api/autopost/schedule    | Schedule a future generation       |
| GET    | /api/autopost/queue       | View the scheduled post queue      |
| DELETE | /api/autopost/{id}        | Remove a scheduled post            |

---

## Local Setup

```bash
# Clone
git clone https://github.com/abdulrafay20069/contentflow
cd contentflow

# Add your key
# Create src/main/resources/application.properties and add:
# GROQ_API_KEY=your_key_here

# Run backend
mvn spring-boot:run

# Run frontend (separate terminal)
cd frontend
npm install
npm start
```

---

## What I learned building this

- Designing and consuming REST APIs end to end
- Spring Data JPA — mapping Java classes to database tables with zero SQL
- AI prompt engineering and chaining multiple LLM calls
- Background job scheduling with @Scheduled
- Deploying a split-stack app across two platforms (Railway + Vercel)