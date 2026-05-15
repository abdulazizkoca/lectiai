# Lectio AI

Lectio AI is a modern, AI-powered educational platform designed specifically for Uzbekistan universities. It features real-time gamified quizzes (Kahoot-style), smart flashcards, computer vision attention tracking, and comprehensive professor analytics.

## Tech Stack
- **Backend**: FastAPI, PostgreSQL, Redis, Celery, Socket.IO, Claude 3.5 Sonnet
- **Frontend**: Next.js, React, Tailwind CSS, Framer Motion, Socket.IO Client
- **Mobile/Bot**: Aiogram 3.x (Telegram)
- **Infrastructure**: Docker, Nginx

## Setup Instructions

### 1. Prerequisites
- Docker and Docker Compose
- Python 3.11+
- Node.js 18+
- Anthropic API Key (Claude)

### 2. Environment Variables
Copy the example environment file and fill in your keys:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 3. Run Locally (Development)

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Celery Workers & Bot
```bash
cd backend
celery -A celery_app worker --loglevel=info
python bot/bot.py
```

### 4. Run Production (Docker)
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
This will start Nginx, PostgreSQL, Redis, FastAPI backend replicas, Next.js frontend, and Celery workers.

## Features
- **Professor Dashboard**: Real-time analytics, AI recommendations, and live quiz control.
- **Student App**: Gamified dashboard, spaced repetition flashcards, visual novel scenarios.
- **Camera Module**: Local attention tracking via OpenCV and MediaPipe.
- **Telegram Bot**: Inline flashcards, daily reminders, and rich visual statistics.
