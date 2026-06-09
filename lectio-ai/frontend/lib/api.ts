const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  token?: string;
}

/** localStorage dan token oladi (faqat client-side da) */
export function getStoredToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("lectio_token") || "";
}

/** localStorage dan foydalanuvchi ID ini oladi */
export function getStoredUserId(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const user = JSON.parse(localStorage.getItem("lectio_user") || "{}");
    return user.id ?? null;
  } catch {
    return null;
  }
}

async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const { token, ...fetchOpts } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Token: berilgan yoki localStorage dan
  const activeToken = token || getStoredToken();
  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOpts,
      headers,
    });

    if (!res.ok) {
      let errorMessage = "Xatolik yuz berdi";
      try {
        const error = await res.json();
        errorMessage = error.detail || error.message || `HTTP ${res.status}`;
      } catch {
        errorMessage = `HTTP ${res.status}`;
      }
      // Token muddati o'tgan bo'lsa — logout
      if (res.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("lectio_token");
        localStorage.removeItem("lectio_user");
      }
      throw new Error(errorMessage);
    }

    return res.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Tarmoq xatoligi yuz berdi");
  }
}

// Auth
export const authAPI = {
  register: (data: { email: string; full_name: string; password: string; role: string }) =>
    fetchAPI("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (email: string, password: string) =>
    fetchAPI("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: email, password }),
    }),

  getMe: (token: string) => fetchAPI("/api/auth/me", { token }),
};

// Lessons
export const lessonsAPI = {
  create: (data: { title: string; topic: string; duration_minutes: number }, token: string) =>
    fetchAPI("/api/lessons/create", { method: "POST", body: JSON.stringify(data), token }),

  getById: (id: number, token?: string) => fetchAPI(`/api/lessons/${id}`, { token }),

  getByProfessor: (professorId: number, token?: string) => fetchAPI(`/api/lessons/professor/${professorId}`, { token }),

  getAll: (token?: string) => fetchAPI("/api/lessons/", { token }),
};

// Spaced Repetition
export const srAPI = {
  getDueCards: (studentId: number, token?: string) => fetchAPI(`/api/sr/due-cards/${studentId}`, { token }),

  reviewCard: (cardId: number, quality: number, token?: string) =>
    fetchAPI("/api/sr/review", { method: "POST", body: JSON.stringify({ card_id: cardId, quality }), token }),

  getCard: (cardId: number, token?: string) => fetchAPI(`/api/sr/cards/${cardId}`, { token }),
};

// Analytics
export const analyticsAPI = {
  getStudentStats: (studentId: number, token?: string) => fetchAPI(`/api/analytics/student/${studentId}`, { token }),

  getLessonStats: (lessonId: number, token?: string) => fetchAPI(`/api/analytics/lesson/${lessonId}`, { token }),

  getOverview: (token?: string) => fetchAPI("/api/analytics/overview", { token }),
};

// Sessions (Live Quiz)
export const sessionsAPI = {
  create: (lessonId: number, token: string) =>
    fetchAPI(`/api/sessions/create?lesson_id=${lessonId}`, { method: "POST", token }),

  get: (roomCode: string) => fetchAPI(`/api/sessions/${roomCode}`),

  join: (roomCode: string, nickname: string, studentId?: number) =>
    fetchAPI(`/api/sessions/${roomCode}/join`, {
      method: "POST",
      body: JSON.stringify({ nickname, student_id: studentId ?? null }),
    }),

  start: (sessionId: number, token: string) =>
    fetchAPI(`/api/sessions/${sessionId}/start`, { method: "POST", token }),

  end: (sessionId: number, token: string) =>
    fetchAPI(`/api/sessions/${sessionId}/end`, { method: "POST", token }),

  getResults: (sessionId: number, token: string) =>
    fetchAPI(`/api/sessions/${sessionId}/results`, { token }),

  submitAnswer: (
    sessionId: number,
    data: { question_id: number; student_answer: string; participant_id: number; time_taken?: number }
  ) =>
    fetchAPI(`/api/sessions/${sessionId}/answer`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Materials (metodichka upload)
export const materialsAPI = {
  upload: (file: File, token: string) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${API_BASE}/api/materials/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      return res.json();
    });
  },

  /** SSE orqali progress kuzatish — EventSource qaytaradi */
  openProgressStream: (materialId: string): EventSource =>
    new EventSource(`${API_BASE}/api/materials/${materialId}/progress`),

  /** SSE orqali dars yaratish progressi — EventSource qaytaradi */
  openLessonProgressStream: (materialId: string): EventSource =>
    new EventSource(`${API_BASE}/api/materials/${materialId}/lesson-progress`),

  getTopics: (materialId: string) =>
    fetchAPI(`/api/materials/${materialId}/topics`),

  generateLesson: (data: { material_id: string; professor_id: number; topic_name: string }, token?: string) =>
    fetchAPI("/api/materials/generate-topic-lesson", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  getLessonResult: (materialId: string) =>
    fetchAPI(`/api/materials/${materialId}/lesson-result`),
};

// Learning Chain (mustaqil o'qish zanjiri)
export const chainAPI = {
  generateFlashcards: (
    data: { student_id: number; topic: string; subject?: string; count?: number; difficulty?: string; lesson_id?: number },
    token: string
  ) => fetchAPI("/api/chain/flashcards", { method: "POST", body: JSON.stringify(data), token }),

  generateQuiz: (
    data: { topic: string; flashcards: { front: string; back: string; hint?: string }[]; count?: number },
    token: string
  ) => fetchAPI("/api/chain/quiz-from-cards", { method: "POST", body: JSON.stringify(data), token }),

  complete: (
    data: {
      student_id: number;
      topic: string;
      subject?: string;
      quiz_results: { card_index: number; is_correct: boolean; time_ms?: number }[];
      flashcard_ids?: number[];
      lesson_id?: number;
    },
    token: string
  ) => fetchAPI("/api/chain/complete", { method: "POST", body: JSON.stringify(data), token }),

  getProgress: (studentId: number, token: string) =>
    fetchAPI(`/api/chain/progress/${studentId}`, { token }),

  getDueFlashcards: (studentId: number, token: string) =>
    fetchAPI(`/api/chain/due-flashcards/${studentId}`, { token }),
};

// AI Mentor
export const mentorAPI = {
  chat: (
    data: {
      student_id: number;
      message: string;
      conversation_history?: { role: string; content: string }[];
      student_profile?: Record<string, unknown>;
    },
    token: string
  ) => fetchAPI("/api/mentor/chat", { method: "POST", body: JSON.stringify(data), token }),

  generateStudyPlan: (
    data: { student_id: number; goal: string; available_hours_per_day: number; deadline_days: number; weak_topics: string[] },
    token: string
  ) => fetchAPI("/api/mentor/study-plan", { method: "POST", body: JSON.stringify(data), token }),
};

// Student Hub
export const studentAPI = {
  getDashboard: (studentId: number, token?: string) =>
    fetchAPI(`/api/student/${studentId}/dashboard`, { token }),

  getKnowledgeMap: (studentId: number, token?: string) =>
    fetchAPI(`/api/student/${studentId}/knowledge-map`, { token }),

  completeQuest: (studentId: number, questId: string, token?: string) =>
    fetchAPI(`/api/student/${studentId}/daily-quest/complete?quest_id=${questId}`, { method: "POST", token }),
};

