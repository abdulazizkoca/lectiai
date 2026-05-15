/**
 * Learning Chain API Client
 * =========================
 * Backend /api/chain/* endpointlari bilan ishlash uchun.
 * Barcha kartalar zanjiri shu modul orqali ishlaydi.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Flashcard {
  front: string;
  back: string;
  hint?: string;
}

export interface SavedFlashcard extends Flashcard {
  id: number;
  subject?: string;
  interval_days?: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface QuizResultItem {
  card_index: number;
  is_correct: boolean;
  time_ms: number;
}

export interface Achievement {
  code: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
}

export interface ChainCompleteResult {
  success: boolean;
  quiz_score: number;
  correct_answers: number;
  total_questions: number;
  progress: {
    mastery_level: number;
    sessions_count: number;
    weak_points: string[];
    strong_points: string[];
    improvement: number;
  };
  new_achievements: Achievement[];
  sm2_updates: Array<{ flashcard_id: number; interval_days: number; next_review: string }>;
  next_review_cards: Array<{ flashcard_id: number }>;
  next_step: "review" | "done";
  message: string;
}

// ─── QADAM 1 → 2: Flashcard generatsiya ──────────────────────────────────────

export async function generateFlashcards(params: {
  studentId: number;
  topic: string;
  subject?: string;
  count?: number;
  difficulty?: "easy" | "medium" | "hard";
  lessonId?: number;
  saveToDB?: boolean;
}): Promise<{ flashcards: Flashcard[]; savedIds: number[]; count: number }> {
  const res = await fetch(`${API_BASE}/api/chain/flashcards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_id: params.studentId,
      topic: params.topic,
      subject: params.subject || "",
      count: params.count || 5,
      difficulty: params.difficulty || "medium",
      lesson_id: params.lessonId || null,
      save_to_db: params.saveToDB !== false,
    }),
  });
  if (!res.ok) throw new Error("Flashcard generatsiya xatosi");
  const data = await res.json();
  return {
    flashcards: data.flashcards,
    savedIds: data.saved_ids || [],
    count: data.count,
  };
}

// ─── QADAM 2 → 3: Quiz generatsiya ───────────────────────────────────────────

export async function generateQuizFromCards(params: {
  topic: string;
  flashcards: Flashcard[];
  count?: number;
}): Promise<{ questions: QuizQuestion[]; count: number }> {
  const res = await fetch(`${API_BASE}/api/chain/quiz-from-cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: params.topic,
      flashcards: params.flashcards,
      count: params.count || 5,
    }),
  });
  if (!res.ok) throw new Error("Quiz generatsiya xatosi");
  const data = await res.json();
  return { questions: data.questions, count: data.count };
}

// ─── QADAM 3 → 4 → 5: Zanjirni yakunlash ────────────────────────────────────

export async function completeLearningChain(params: {
  studentId: number;
  topic: string;
  subject?: string;
  quizResults: QuizResultItem[];
  flashcardIds?: number[];
  lessonId?: number;
}): Promise<ChainCompleteResult> {
  const res = await fetch(`${API_BASE}/api/chain/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_id: params.studentId,
      topic: params.topic,
      subject: params.subject || "",
      quiz_results: params.quizResults,
      flashcard_ids: params.flashcardIds || [],
      lesson_id: params.lessonId || null,
    }),
  });
  if (!res.ok) throw new Error("Zanjir yakunlash xatosi");
  return res.json();
}

// ─── Progress ma'lumotlari ────────────────────────────────────────────────────

export async function getStudentProgress(studentId: number) {
  const res = await fetch(`${API_BASE}/api/chain/progress/${studentId}`);
  if (!res.ok) throw new Error("Progress olish xatosi");
  return res.json();
}

export async function getDueFlashcards(studentId: number, limit = 20) {
  const res = await fetch(
    `${API_BASE}/api/chain/due-flashcards/${studentId}?limit=${limit}`
  );
  if (!res.ok) throw new Error("Due flashcards xatosi");
  return res.json();
}

// ─── Mentor chat ──────────────────────────────────────────────────────────────

export async function sendMentorMessage(params: {
  studentId: number;
  message: string;
  conversationHistory: Array<{ role: string; content: string }>;
  topic?: string;
}): Promise<string> {
  const res = await fetch(`${API_BASE}/api/mentor/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_id: params.studentId,
      message: params.message,
      conversation_history: params.conversationHistory,
      student_profile: { current_topic: params.topic || "" },
    }),
  });
  if (!res.ok) throw new Error("Mentor chat xatosi");
  const data = await res.json();
  return data.reply || "Javob olishda xato yuz berdi";
}
