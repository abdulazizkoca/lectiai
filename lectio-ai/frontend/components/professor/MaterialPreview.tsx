"use client";

import { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, CheckCircle2, Circle, Brain, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface LessonPlanItem {
  id: string;
  lesson_number: number;
  title: string;
  duration_minutes: number;
}

export function MaterialPreview({ data, onGenerate }: { data: any; onGenerate: (plan: LessonPlanItem[]) => void }) {
  const [lessons, setLessons] = useState<LessonPlanItem[]>(
    data.suggested_lesson_plan.map((l: any, i: number) => ({ ...l, id: `lesson-${i}` }))
  );
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over.id) {
      setLessons((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        // Re-number lessons
        return newItems.map((item, index) => ({ ...item, lesson_number: index + 1 }));
      });
    }
  }

  return (
    <div className="p-6 bg-slate-900 rounded-xl text-white space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-display text-[#F5A623]">{data.title}</h2>
          <p className="text-slate-400">{data.subject} • {data.level}</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="bg-slate-800 px-4 py-2 rounded-lg text-center">
            <span className="block text-emerald-400 font-bold">{data.difficulty_distribution.easy}%</span>
            <span className="text-slate-500">Oson</span>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded-lg text-center">
            <span className="block text-amber-400 font-bold">{data.difficulty_distribution.medium}%</span>
            <span className="text-slate-500">O'rta</span>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded-lg text-center">
            <span className="block text-rose-400 font-bold">{data.difficulty_distribution.hard}%</span>
            <span className="text-slate-500">Qiyin</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Left Column: Topics & Extraction Data */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-200">Asosiy mavzular</h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {data.main_topics.map((topic: any, idx: number) => (
              <div key={idx} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={20} />
                  <div>
                    <h4 className="font-bold text-slate-200">{topic.title}</h4>
                    <ul className="text-sm text-slate-400 mt-2 space-y-1 list-disc list-inside">
                      {topic.key_concepts.map((concept: string, cIdx: number) => (
                        <li key={cIdx}>{concept}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-900/20 border border-amber-900/50 p-4 rounded-lg">
            <h4 className="flex items-center gap-2 font-bold text-amber-400 mb-2">
              <AlertTriangle size={18} /> Imtihonga tushishi ehtimoli yuqori
            </h4>
            <ul className="text-sm text-amber-200/70 list-disc list-inside">
              {data.exam_likely_topics.map((t: string, i: number) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        </div>

        {/* Right Column: Drag & Drop Lesson Plan */}
        <div>
          <h3 className="text-xl font-bold text-slate-200 mb-6">Darslar rejasi</h3>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={lessons} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {lessons.map((lesson) => (
                  <SortableLessonItem key={lesson.id} lesson={lesson} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button 
            onClick={() => onGenerate(lessons)}
            className="w-full mt-8 py-4 bg-gradient-to-r from-[#F5A623] to-[#e8941a] text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-[#F5A623]/20"
          >
            <Brain size={20} /> Kurs va Testlarni Generatsiya Qilish
          </button>
        </div>
      </div>
    </div>
  );
}

function SortableLessonItem({ lesson }: { lesson: LessonPlanItem }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lesson.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center gap-4 hover:border-slate-500 transition-colors">
      <button {...attributes} {...listeners} className="text-slate-500 cursor-grab active:cursor-grabbing hover:text-slate-300">
        <GripVertical size={20} />
      </button>
      <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center font-bold text-[#F5A623] text-sm shrink-0 border border-slate-700">
        {lesson.lesson_number}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-slate-200">{lesson.title}</h4>
      </div>
      <div className="text-sm text-slate-400 bg-slate-900 px-3 py-1 rounded-lg">
        {lesson.duration_minutes} min
      </div>
    </div>
  );
}
