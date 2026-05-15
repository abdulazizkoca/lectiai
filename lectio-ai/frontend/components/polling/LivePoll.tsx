"use client";
import { useState, useEffect, useRef } from "react";
import { LectioWebSocket } from "@/lib/websocket";

interface PollData {
  question: string;
  options: string[];
  votes: Record<string, number>;
  total_votes: number;
}

export function ProfessorPoll({ lessonId }: { lessonId: string }) {
  const wsRef = useRef<LectioWebSocket | null>(null);
  const [poll, setPoll] = useState<PollData | null>(null);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);

  useEffect(() => {
    const socket = new LectioWebSocket(lessonId, (data) => {
      if (data.type === "poll_updated" || data.type === "poll_started") {
        setPoll(data.poll as PollData);
      }
    });
    socket.connect();
    wsRef.current = socket;
    return () => socket.disconnect();
  }, [lessonId]);

  const startPoll = () => {
    const validOptions = options.filter((o) => o.trim());
    if (question && validOptions.length >= 2) {
      wsRef.current?.sendPoll(question, validOptions);
    }
  };

  const endPoll = () => {
    wsRef.current?.endPoll();
    setPoll(null);
    setQuestion("");
    setOptions(["", "", "", ""]);
  };

  const maxVotes = poll
    ? Math.max(...Object.values(poll.votes), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* Poll Creator */}
      {!poll && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-2xl">📊</span> Yangi So&apos;rovnoma
          </h3>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Savol yozing..."
            className="input-field"
            id="poll-question-input"
          />
          <div className="grid grid-cols-2 gap-3">
            {options.map((opt, i) => (
              <input
                key={i}
                value={opt}
                onChange={(e) => {
                  const newOpts = [...options];
                  newOpts[i] = e.target.value;
                  setOptions(newOpts);
                }}
                placeholder={`${i + 1}-variant`}
                className="input-field"
                id={`poll-option-${i}`}
              />
            ))}
          </div>
          <button onClick={startPoll} className="btn-primary w-full" id="start-poll-btn">
            🚀 So&apos;rovnomani Boshlash
          </button>
        </div>
      )}

      {/* Live Results */}
      {poll && (
        <div className="glass-card p-6 space-y-4 slide-up">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">{poll.question}</h4>
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <span className="live-dot" />
              JONLI
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(poll.votes).map(([option, count]) => {
              const pct = poll.total_votes
                ? Math.round((count / poll.total_votes) * 100)
                : 0;
              return (
                <div key={option} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{option}</span>
                    <span className="text-slate-400">
                      {count} ovoz ({pct}%)
                    </span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="poll-bar-fill"
                      style={{ width: `${(count / maxVotes) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <p className="text-sm text-slate-400">
              Jami: <span className="text-white font-semibold">{poll.total_votes}</span> talaba
            </p>
            <button onClick={endPoll} className="btn-secondary text-sm" id="end-poll-btn">
              Yakunlash
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function StudentPoll({ lessonId }: { lessonId: string }) {
  const wsRef = useRef<LectioWebSocket | null>(null);
  const [poll, setPoll] = useState<PollData | null>(null);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    const socket = new LectioWebSocket(lessonId, (data) => {
      if (data.type === "poll_started") {
        setPoll(data.poll as PollData);
        setVoted(false);
      } else if (data.type === "poll_updated") {
        setPoll(data.poll as PollData);
      } else if (data.type === "poll_ended") {
        setPoll(data.final_results as PollData);
      }
    });
    socket.connect();
    wsRef.current = socket;
    return () => socket.disconnect();
  }, [lessonId]);

  const submitVote = (option: string) => {
    if (!voted) {
      wsRef.current?.vote(option);
      setVoted(true);
    }
  };

  if (!poll)
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-4xl mb-3 animate-bounce">📡</div>
        <p className="text-slate-400">So&apos;rovnoma boshlanishini kuting...</p>
      </div>
    );

  return (
    <div className="glass-card p-6 space-y-4 slide-up">
      <h3 className="text-lg font-semibold text-center">{poll.question}</h3>

      <div className="space-y-3">
        {poll.options.map((option, idx) => {
          const pct = poll.total_votes
            ? Math.round((poll.votes[option] / poll.total_votes) * 100)
            : 0;
          const colors = [
            "from-indigo-500 to-purple-500",
            "from-cyan-500 to-blue-500",
            "from-emerald-500 to-teal-500",
            "from-amber-500 to-orange-500",
          ];
          return (
            <button
              key={option}
              onClick={() => submitVote(option)}
              disabled={voted}
              className={`w-full p-4 rounded-xl text-left font-medium transition-all ${
                voted
                  ? "bg-white/5 cursor-default"
                  : `bg-gradient-to-r ${colors[idx % 4]} hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]`
              }`}
              id={`vote-btn-${idx}`}
            >
              <div className="flex justify-between items-center">
                <span>{option}</span>
                {voted && (
                  <span className="text-sm bg-white/10 px-3 py-1 rounded-full">
                    {pct}%
                  </span>
                )}
              </div>
              {voted && (
                <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/40 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {voted && (
        <p className="text-center text-emerald-400 font-medium slide-up">
          ✓ Ovozingiz qabul qilindi!
        </p>
      )}
    </div>
  );
}
