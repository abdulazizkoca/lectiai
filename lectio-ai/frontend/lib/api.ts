const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  token?: string;
}

async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const { token, ...fetchOpts } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
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
  create: (data: { title: string; topic: string; duration_minutes: number; professor_id: number }, token: string) =>
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

  start: (sessionId: number, token: string) =>
    fetchAPI(`/api/sessions/${sessionId}/start`, { method: "POST", token }),

  end: (sessionId: number, token: string) =>
    fetchAPI(`/api/sessions/${sessionId}/end`, { method: "POST", token }),

  getResults: (sessionId: number, token: string) =>
    fetchAPI(`/api/sessions/${sessionId}/results`, { token }),
};

