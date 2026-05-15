"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit3, Save, X, Clock, FileText, Link } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

interface Note {
  id: string;
  content: string;
  timestamp: number;
  slideNumber?: number;
  topic?: string;
}

interface NotePanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlide?: number;
  currentTopic?: string;
}

export function NotePanel({ isOpen, onClose, currentSlide = 1, currentTopic = "" }: NotePanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem(`student_notes_${currentTopic}`);
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, [currentTopic]);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem(`student_notes_${currentTopic}`, JSON.stringify(notes));
    }
  }, [notes, currentTopic]);

  const addNote = () => {
    if (!currentNote.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      content: currentNote.trim(),
      timestamp: Date.now(),
      slideNumber: currentSlide,
      topic: currentTopic
    };

    setNotes(prev => [...prev, newNote]);
    setCurrentNote("");
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const startEdit = (note: Note) => {
    setIsEditing(true);
    setEditingId(note.id);
    setCurrentNote(note.content);
  };

  const saveEdit = () => {
    if (!editingId || !currentNote.trim()) return;

    setNotes(prev => prev.map(note => 
      note.id === editingId 
        ? { ...note, content: currentNote.trim() }
        : note
    ));

    setIsEditing(false);
    setEditingId(null);
    setCurrentNote("");
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setCurrentNote("");
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  };

  const filteredNotes = notes.filter(note => 
    note.slideNumber === currentSlide || !note.slideNumber
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 300 }}
          animate={{ x: 0 }}
          exit={{ x: 300 }}
          className="fixed right-0 top-0 h-full w-96 bg-[#18181F] border-l border-slate-800 z-50 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-[#F5A623]" />
              <h3 className="font-bold">Eslatmalar</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#0A0A0F] rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Current Slide Info */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <Clock size={14} />
              <span>Slayd {currentSlide}</span>
            </div>
            {currentTopic && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Link size={14} />
                <span>{currentTopic}</span>
              </div>
            )}
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredNotes.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>Hozircha eslatmalar yo'q</p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <Card key={note.id} className="p-3">
                  {isEditing && editingId === note.id ? (
                    <div className="space-y-2">
                      <Input
                        label="Eslatma"
                        value={currentNote}
                        onChange={(e) => setCurrentNote(e.target.value)}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm" onClick={saveEdit}>
                          <Save size={14} />
                        </Button>
                        <Button variant="secondary" size="sm" onClick={cancelEdit}>
                          <X size={14} />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-slate-300 mb-2">{note.content}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          {formatTime(note.timestamp)}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEdit(note)}
                            className="p-1 hover:bg-[#0A0A0F] rounded transition-colors"
                          >
                            <Edit3 size={12} className="text-slate-400" />
                          </button>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="p-1 hover:bg-[#0A0A0F] rounded transition-colors"
                          >
                            <X size={12} className="text-[#E84855]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>

          {/* Add Note */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex gap-2">
              <Input
                label="Eslatma qoldiring"
                placeholder="Yangi eslatma..."
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addNote()}
                className="flex-1"
              />
              <Button variant="primary" onClick={addNote} disabled={!currentNote.trim()}>
                <Save size={16} />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
