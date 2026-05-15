# Lectio AI - Professional Edition

## 🎓 Production-Ready AI-Powered Education Platform

Bu professional darajadagi to'liq ta'lim platformasi - backend, frontend, AI, va deployment bilan.

---

## 📁 Project Structure (Professional Architecture)

```
lectio-ai/
├── 📁 backend/                    # FastAPI Backend API
│   ├── 📁 app/
│   │   ├── 📁 api/v1/            # API endpoints
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py       # JWT authentication
│   │   │   │   ├── lessons.py    # Lesson CRUD + WebSocket
│   │   │   │   ├── users.py      # User management
│   │   │   │   ├── analytics.py  # Analytics endpoints
│   │   │   │   └── snapshots.py  # Snapshot management
│   │   │   └── router.py
│   │   ├── 📁 core/              # Core modules
│   │   │   ├── config.py         # Environment configuration
│   │   │   ├── database.py       # PostgreSQL + SQLAlchemy
│   │   │   ├── security.py       # JWT + password hashing
│   │   │   ├── logging_config.py   # Structured logging
│   │   │   └── exceptions.py     # Custom exceptions
│   │   ├── 📁 models/            # Database models
│   │   │   ├── user.py           # User model
│   │   │   ├── lesson.py         # Lesson model
│   │   │   ├── student_analytics.py
│   │   │   ├── snapshot.py
│   │   │   ├── attention_session.py
│   │   │   └── reaction.py
│   │   ├── 📁 schemas/           # Pydantic schemas
│   │   ├── 📁 services/          # Business logic
│   │   │   ├── auth_service.py
│   │   │   ├── lesson_service.py
│   │   │   ├── analytics_service.py
│   │   │   ├── camera_processor.py
│   │   │   └── websocket_manager.py
│   │   └── main.py               # FastAPI app entry
│   ├── 📁 tests/                 # Comprehensive tests
│   ├── 📁 alembic/               # Database migrations
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── 📁 frontend/                   # Next.js Frontend
│   ├── 📁 app/                    # Next.js App Router
│   │   ├── 📁 (auth)/            # Auth routes
│   │   ├── 📁 (dashboard)/        # Dashboard routes
│   │   ├── 📁 api/                # API routes
│   │   ├── 📁 professor/          # Professor pages
│   │   ├── 📁 student/            # Student pages
│   │   └── layout.tsx
│   ├── 📁 components/
│   │   ├── 📁 ui/                 # UI components
│   │   ├── 📁 professor/          # Professor components
│   │   │   ├── StudentAttentionDashboard.tsx
│   │   │   ├── LessonControl.tsx
│   │   │   ├── AnalyticsPanel.tsx
│   │   │   └── SnapshotGallery.tsx
│   │   ├── 📁 student/            # Student components
│   │   └── 📁 shared/             # Shared components
│   ├── 📁 hooks/                  # Custom React hooks
│   ├── 📁 lib/                    # Utilities
│   ├── 📁 store/                  # Zustand state management
│   ├── 📁 types/                  # TypeScript types
│   ├── Dockerfile
│   └── next.config.js
│
├── 📁 camera/                     # Python Camera System
│   ├── 📁 core/                   # Core modules
│   │   ├── multi_face_tracker.py  # 50 face detection
│   │   ├── camera_worker.py       # Async processing
│   │   └── complete_camera_system.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── 📁 infrastructure/             # DevOps & Infrastructure
│   ├── 📁 docker/                 # Docker configs
│   ├── 📁 k8s/                    # Kubernetes manifests
│   ├── 📁 terraform/              # Infrastructure as Code
│   ├── 📁 github-actions/         # CI/CD pipelines
│   └── 📁 monitoring/             # Prometheus + Grafana
│
├── 📁 docs/                       # Documentation
│   ├── API.md                     # API documentation
│   ├── ARCHITECTURE.md            # System architecture
│   ├── DEPLOYMENT.md              # Deployment guide
│   └── DEVELOPMENT.md             # Development guide
│
├── 📁 scripts/                    # Utility scripts
├── docker-compose.yml             # Local development
├── docker-compose.prod.yml        # Production deployment
├── Makefile                       # Build automation
└── README.md                      # This file
```

---

## 🚀 Quick Start (Professional Setup)

### Prerequisites

- Docker & Docker Compose
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### 1. Clone and Setup

```bash
git clone <repository>
cd lectio-ai

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit environment variables
nano backend/.env
nano frontend/.env
```

### 2. Start with Docker (Recommended)

```bash
# Full stack with all services
docker-compose -f docker-compose.yml up -d

# Or production mode
docker-compose -f docker-compose.prod.yml up -d
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/docs
- **Database**: localhost:5432
- **Redis**: localhost:6379

### 3. Manual Development Setup

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start backend
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## 🔐 Authentication & Authorization

### JWT Token Flow

```
1. User Login → POST /api/v1/auth/login
2. Receive Access Token (15 min) + Refresh Token (7 days)
3. Use Access Token in Authorization header
4. Auto-refresh when Access Token expires
5. Logout → Blacklist Refresh Token
```

### Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access |
| **Professor** | Create lessons, view analytics, manage students |
| **Student** | Join lessons, view own analytics |
| **Guest** | View public content only |

---

## 📡 API Documentation

### REST API Endpoints

#### Authentication
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
```

#### Users
```
GET    /api/v1/users/me              # Current user profile
PATCH  /api/v1/users/me              # Update profile
GET    /api/v1/users/{id}            # Get user by ID
GET    /api/v1/users                 # List users (admin)
```

#### Lessons
```
POST   /api/v1/lessons               # Create lesson
GET    /api/v1/lessons               # List lessons
GET    /api/v1/lessons/active        # Active lessons
GET    /api/v1/lessons/{id}          # Get lesson
PATCH  /api/v1/lessons/{id}          # Update lesson
POST   /api/v1/lessons/{id}/start    # Start lesson
POST   /api/v1/lessons/{id}/pause    # Pause lesson
POST   /api/v1/lessons/{id}/resume   # Resume lesson
POST   /api/v1/lessons/{id}/complete  # Complete lesson
DELETE /api/v1/lessons/{id}          # Delete lesson (admin)
```

#### Analytics
```
GET    /api/v1/lessons/{id}/analytics              # Lesson analytics
GET    /api/v1/lessons/{id}/students               # Students in lesson
GET    /api/v1/lessons/{id}/attention-history       # Attention over time
GET    /api/v1/lessons/{id}/snapshots               # Student snapshots
POST   /api/v1/lessons/{id}/export                  # Export analytics
```

### WebSocket Endpoints

```
WS /ws/camera/{lesson_id}       # Camera data stream
WS /ws/professor/{lesson_id}    # Professor dashboard
WS /ws/student/{lesson_id}/{id} # Individual student
```

### Request/Response Examples

#### Create Lesson
```bash
curl -X POST http://localhost:8000/api/v1/lessons \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Python Dasturlash",
    "description": "OOP asoslari",
    "subject": "Computer Science",
    "max_students": 30,
    "ai_config": {
      "max_faces": 30,
      "target_fps": 20,
      "snapshot_threshold": 40
    }
  }'
```

#### Response
```json
{
  "id": 1,
  "lesson_code": "LECT-7X9K2M",
  "title": "Python Dasturlash",
  "status": "scheduled",
  "created_at": "2024-01-15T10:30:00Z",
  "analytics": {
    "total_students": 0,
    "avg_attention": 0
  }
}
```

---

## 🧠 AI Camera System

### Multi-Face Detection Features

- **50 Face Detection**: MediaPipe FaceMesh with 50 face capacity
- **Individual Tracking**: Persistent ID for each student
- **Attention Scoring**: Per-student attention (0-100%)
- **Auto Snapshots**: Captures inattentive students
- **Real-time**: 15+ FPS with 50 students
- **Robust Detection**: Handles glasses, poor lighting, occlusion

### Configuration

```python
# camera/config.py
CAMERA_CONFIG = {
    "max_faces": 50,
    "target_fps": 15,
    "resolution": (640, 480),
    "attention_weights": {
        "eye_contact": 0.35,
        "head_pose": 0.25,
        "gaze_direction": 0.25,
        "movement": 0.10,
        "posture": 0.05
    },
    "status_thresholds": {
        "green": 70,   # >= 70% attention
        "yellow": 40,  # 40-69% attention
        "red": 0       # < 40% attention
    }
}
```

### Run Camera

```bash
# Development
cd camera
python complete_camera_system.py --lesson-id "LESSON123"

# Production with Docker
docker-compose up camera-processor
```

---

## 🗄️ Database Schema

### Core Tables

```sql
-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password BYTEA NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Lessons
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    lesson_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'scheduled',
    scheduled_start TIMESTAMP,
    total_students INTEGER DEFAULT 0,
    avg_attention FLOAT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Student Analytics
CREATE TABLE student_analytics (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES lessons(id),
    student_id INTEGER,
    track_id INTEGER NOT NULL,
    attention_score FLOAT,
    status VARCHAR(10),
    eye_openness FLOAT,
    gaze_direction_x FLOAT,
    gaze_direction_y FLOAT,
    head_pose_yaw FLOAT,
    head_pose_pitch FLOAT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Snapshots
CREATE TABLE snapshots (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES lessons(id),
    student_id INTEGER,
    track_id INTEGER NOT NULL,
    image_data TEXT,  -- Base64 encoded
    attention_score FLOAT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Reactions
CREATE TABLE reactions (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES lessons(id),
    student_id INTEGER,
    reaction_type VARCHAR(50),
    timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## 🧪 Testing

### Run Tests

```bash
# Backend tests
cd backend
pytest -v
pytest tests/test_api.py -v
pytest tests/test_camera.py -v

# Frontend tests
cd frontend
npm test
npm run test:e2e

# Load testing
locust -f tests/load_test.py
```

### Test Coverage

```bash
# Generate coverage report
pytest --cov=app --cov-report=html
open htmlcov/index.html
```

---

## 🚀 Deployment

### Docker Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Kubernetes

```bash
# Apply manifests
kubectl apply -f infrastructure/k8s/namespace.yaml
kubectl apply -f infrastructure/k8s/configmap.yaml
kubectl apply -f infrastructure/k8s/secrets.yaml
kubectl apply -f infrastructure/k8s/postgres.yaml
kubectl apply -f infrastructure/k8s/redis.yaml
kubectl apply -f infrastructure/k8s/backend.yaml
kubectl apply -f infrastructure/k8s/frontend.yaml
kubectl apply -f infrastructure/k8s/ingress.yaml

# Check status
kubectl get pods -n lectio-ai
kubectl get svc -n lectio-ai
```

### Cloud Deployment (AWS/GCP/Azure)

```bash
# Terraform
cd infrastructure/terraform
terraform init
terraform plan
terraform apply

# Deploy app
cd ../k8s
kubectl apply -f .
```

---

## 📊 Monitoring & Logging

### Prometheus Metrics

```python
# Backend metrics exposed at /metrics
from prometheus_client import Counter, Histogram, Gauge

# Request metrics
request_count = Counter('http_requests_total', 'Total requests', ['method', 'endpoint'])
request_duration = Histogram('http_request_duration_seconds', 'Request duration')

# Camera metrics
faces_detected = Gauge('camera_faces_detected', 'Currently detected faces')
attention_score = Gauge('student_attention_score', 'Student attention', ['student_id'])
processing_fps = Gauge('camera_processing_fps', 'Processing FPS')
```

### Grafana Dashboards

Access at `http://localhost:3001`

Default dashboards:
- System Overview
- API Performance
- Camera Processing
- Student Analytics

### Logging

```python
# Structured JSON logging
{
    "timestamp": "2024-01-15T10:30:00Z",
    "level": "INFO",
    "logger": "app.services.camera",
    "message": "Camera started",
    "context": {
        "lesson_id": "123",
        "faces_detected": 25,
        "avg_attention": 78.5
    }
}
```

View logs:
```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f camera

# K8s logs
kubectl logs -f deployment/backend -n lectio-ai
```

---

## 🔒 Security Checklist

- [ ] JWT tokens with short expiration
- [ ] Password hashing with bcrypt
- [ ] Rate limiting on all endpoints
- [ ] CORS properly configured
- [ ] SQL injection prevention (SQLAlchemy)
- [ ] XSS protection (React automatic)
- [ ] HTTPS in production
- [ ] Secrets in environment variables
- [ ] No sensitive data in logs
- [ ] Regular dependency updates

---

## 📈 Performance Optimization

### Backend
- Async database queries
- Connection pooling
- Redis caching
- Query optimization
- Pagination

### Frontend
- Next.js SSR/SSG
- Image optimization
- Code splitting
- Lazy loading
- Service Worker

### Camera
- Multi-threading
- Adaptive quality
- Frame skipping
- GPU acceleration
- Memory management

---

## 🤝 Contributing

### Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes
git add .
git commit -m "feat: add new feature"

# 3. Run tests
make test

# 4. Push and create PR
git push origin feature/new-feature
```

### Code Standards

- **Python**: PEP8, Black formatter, mypy type hints
- **TypeScript**: ESLint, Prettier, strict mode
- **Commits**: Conventional commits
- **Tests**: 80%+ coverage required
- **Docs**: Update documentation

---

## 📞 Support

- **Documentation**: http://localhost:8000/api/docs
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@lectio.ai

---

## 📄 License

MIT License - see LICENSE file

---

## 🎉 Acknowledgments

- FastAPI team for excellent framework
- MediaPipe for face detection
- Next.js team for frontend framework
- All contributors

---

**Built with ❤️ for education**
