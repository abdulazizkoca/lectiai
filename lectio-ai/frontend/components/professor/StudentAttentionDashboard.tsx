"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Camera, 
  Maximize2,
  Info,
  Clock,
  Activity,
  User,
  Eye,
  Focus
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

// Types
interface StudentData {
  track_id: number;
  student_id?: number;
  student_name?: string;
  recognition_confidence?: number;
  attention_score: number;
  status: "green" | "yellow" | "red";
  position: [number, number];
  bbox: [number, number, number, number];
  eye_openness: number;
  gaze_direction: [number, number];
  head_pose: [number, number, number];
  is_calibrated: boolean;
  last_seen: number;
}

interface SnapshotData {
  track_id: number;
  timestamp: number;
  attention_score: number;
  image_data: string;
  position: [number, number];
}

interface ClassroomMetrics {
  total_students: number;
  green_count: number;
  yellow_count: number;
  red_count: number;
  average_attention: number;
  processing_time: number;
  fps: number;
}

interface StudentAttentionDashboardProps {
  isActive: boolean;
  lessonId: string;
  wsUrl: string;
}

// Individual Student Dot Component
const StudentDot: React.FC<{
  student: StudentData;
  onHover: (student: StudentData | null) => void;
  isHovered: boolean;
  containerWidth: number;
  containerHeight: number;
}> = ({ student, onHover, isHovered, containerWidth, containerHeight }) => {
  // Calculate position as percentage of container
  const left = (student.position[0] / containerWidth) * 100;
  const top = (student.position[1] / containerHeight) * 100;
  
  const getStatusColor = () => {
    switch (student.status) {
      case "green": return "#22c55e";
      case "yellow": return "#eab308";
      case "red": return "#ef4444";
      default: return "#6b7280";
    }
  };
  
  const getStatusGlow = () => {
    switch (student.status) {
      case "green": return "0 0 20px rgba(34, 197, 94, 0.6)";
      case "yellow": return "0 0 20px rgba(234, 179, 8, 0.6)";
      case "red": return "0 0 20px rgba(239, 68, 68, 0.6)";
      default: return "none";
    }
  };

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        transform: "translate(-50%, -50%)",
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.3 }}
      onMouseEnter={() => onHover(student)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Main dot */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
        style={{
          backgroundColor: getStatusColor(),
          boxShadow: getStatusGlow(),
          border: "2px solid white",
        }}
      >
        {student.student_name ? student.student_name.split(' ')[0] : student.track_id}
      </div>
      
      {/* Attention percentage label */}
      <div
        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-bold whitespace-nowrap px-2 py-1 rounded-full"
        style={{
          backgroundColor: getStatusColor(),
          color: "white",
        }}
      >
        {Math.round(student.attention_score)}%
      </div>
      
      {/* Hover detail card */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute z-50 w-64 bg-[#18181F] border border-slate-700 rounded-xl p-4 shadow-2xl"
            style={{
              top: "50px",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: getStatusColor() }}
              >
                {student.student_name ? student.student_name.split(' ')[0] : student.track_id}
              </div>
              <div>
                <h4 className="font-bold text-white">
                  {student.student_name || `Talaba #${student.track_id}`}
                </h4>
                <p className="text-xs text-slate-400">
                  {student.is_calibrated ? "Kalibrlangan" : "Kalibrlanmoqda..."}
                  {student.recognition_confidence && student.recognition_confidence > 0.8 && (
                    <span className="ml-2 text-green-400">
                      Tanildi ({(student.recognition_confidence * 100).toFixed(0)}%)
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Diqqat:</span>
                <span className="font-bold" style={{ color: getStatusColor() }}>
                  {student.attention_score.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ko'z ochiq:</span>
                <span className="text-white">{(student.eye_openness * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Qarash:</span>
                <span className="text-white">
                  X:{student.gaze_direction[0].toFixed(2)} Y:{student.gaze_direction[1].toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bosh pozitsiya:</span>
                <span className="text-white">
                  Y:{student.head_pose[0].toFixed(2)} P:{student.head_pose[1].toFixed(2)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Snapshot Panel Component
const SnapshotPanel: React.FC<{
  snapshots: SnapshotData[];
  onClose: () => void;
}> = ({ snapshots, onClose }) => {
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className="fixed right-0 top-0 h-full w-80 bg-[#18181F] border-l border-slate-700 z-40 overflow-y-auto"
    >
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Camera size={20} className="text-[#F5A623]" />
          Snapshotlar
        </h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
        >
          Г—
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        {snapshots.length === 0 ? (
          <p className="text-slate-400 text-center py-8">
            Hali snapshot'lar yo'q
          </p>
        ) : (
          snapshots.map((snapshot, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center gap-3 mb-2">
                <Badge 
                  color={snapshot.attention_score < 40 ? "coral" : "saffron"}
                  size="sm"
                >
                  ID: {snapshot.track_id}
                </Badge>
                <span className="text-xs text-slate-400">
                  {new Date(snapshot.timestamp * 1000).toLocaleTimeString()}
                </span>
              </div>
              <img
                src={`data:image/jpeg;base64,${snapshot.image_data}`}
                alt={`Student ${snapshot.track_id}`}
                className="w-full rounded-lg"
              />
              <p className="text-xs text-slate-400 mt-2">
                Diqqat: {snapshot.attention_score.toFixed(1)}%
              </p>
            </Card>
          ))
        )}
      </div>
    </motion.div>
  );
};

// Attention Trend Graph
const AttentionTrendGraph: React.FC<{
  history: number[];
}> = ({ history }) => {
  const maxValue = 100;
  const minValue = 0;
  
  return (
    <div className="h-24 w-full bg-[#0A0A0F] rounded-lg p-2">
      <svg className="w-full h-full" viewBox={`0 0 ${history.length} 100`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="attentionGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#eab308" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <path
          d={`M 0 100 ${history.map((v, i) => `L ${i} ${100 - v}`).join(" ")} L ${history.length} 100 Z`}
          fill="url(#attentionGradient)"
        />
        
        {/* Line */}
        <path
          d={`M 0 ${100 - history[0]} ${history.map((v, i) => `L ${i} ${100 - v}`).join(" ")}`}
          fill="none"
          stroke="#F5A623"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};

// Main Dashboard Component
export const StudentAttentionDashboard: React.FC<StudentAttentionDashboardProps> = ({
  isActive,
  lessonId,
  wsUrl,
}) => {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [metrics, setMetrics] = useState<ClassroomMetrics>({
    total_students: 0,
    green_count: 0,
    yellow_count: 0,
    red_count: 0,
    average_attention: 0,
    processing_time: 0,
    fps: 0,
  });
  const [snapshots, setSnapshots] = useState<SnapshotData[]>([]);
  const [hoveredStudent, setHoveredStudent] = useState<StudentData | null>(null);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [attentionHistory, setAttentionHistory] = useState<number[]>(Array(60).fill(50));
  const [isConnected, setIsConnected] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to WebSocket
  useEffect(() => {
    if (!isActive) return;

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(`${wsUrl}/ws/camera/${lessonId}`);
        
        ws.onopen = () => {
          setIsConnected(true);
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.individual_metrics) {
              const studentList: StudentData[] = Object.entries(data.individual_metrics).map(
                ([id, metrics]: [string, any]) => ({
                  track_id: parseInt(id),
                  attention_score: metrics.attention_score,
                  status: metrics.status,
                  position: metrics.position,
                  bbox: metrics.bbox,
                  eye_openness: metrics.eye_openness || 0,
                  gaze_direction: metrics.gaze_direction || [0, 0],
                  head_pose: metrics.head_pose || [0, 0, 0],
                  is_calibrated: metrics.is_calibrated || false,
                  last_seen: metrics.last_seen || Date.now() / 1000,
                })
              );
              setStudents(studentList);
            }
            
            if (data.room_metrics) {
              setMetrics(data.room_metrics);
              
              // Update attention history
              setAttentionHistory((prev) => {
                const newHistory = [...prev.slice(1), data.room_metrics.average_attention];
                return newHistory;
              });
            }
            
            if (data.snapshots) {
              setSnapshots((prev) => [...prev, ...data.snapshots]);
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };
        
        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        };
        
        ws.onerror = (error) => {
          console.error("вќЊ WebSocket error:", error);
        };
        
        wsRef.current = ws;
      } catch (error) {
        console.error("вќЊ Failed to connect WebSocket:", error);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isActive, lessonId, wsUrl]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-[#0A0A0F] z-30 flex">
      {/* Main visualization area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-[#18181F]">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users size={24} className="text-[#F5A623]" />
              Xonada {metrics.total_students} ta talaba aniqlandi
            </h2>
            
            {/* Status indicators */}
            <div className="flex items-center gap-2">
              <Badge color="jade" size="sm" className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                {metrics.green_count}
              </Badge>
              <Badge color="saffron" size="sm" className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#eab308]" />
                {metrics.yellow_count}
              </Badge>
              <Badge color="coral" size="sm" className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
                {metrics.red_count}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Connection status */}
            <div className="flex items-center gap-2 text-sm">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-[#22c55e]" : "bg-[#ef4444]"
                }`}
              />
              <span className={isConnected ? "text-[#22c55e]" : "text-[#ef4444]"}>
                {isConnected ? "Ulangan" : "Ulanmoqda..."}
              </span>
            </div>
            
            {/* FPS */}
            <div className="text-sm text-slate-400">
              FPS: {metrics.fps.toFixed(1)}
            </div>
            
            {/* Snapshot button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSnapshots(!showSnapshots)}
              className="relative"
            >
              <Camera size={16} className="mr-2" />
              Snapshot'lar
              {snapshots.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#F5A623] text-black text-xs rounded-full flex items-center justify-center font-bold">
                  {snapshots.length}
                </span>
              )}
            </Button>
          </div>
        </div>
        
        {/* Visualization container */}
        <div
          ref={containerRef}
          className="flex-1 relative bg-[#0A0A0F] overflow-hidden"
          style={{ minHeight: "400px" }}
        >
          {/* Background grid for reference */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #374151 1px, transparent 1px),
                  linear-gradient(to bottom, #374151 1px, transparent 1px)
                `,
                backgroundSize: "50px 50px",
              }}
            />
          </div>
          
          {/* Student dots */}
          <AnimatePresence>
            {students.map((student) => (
              <StudentDot
                key={student.track_id}
                student={student}
                onHover={setHoveredStudent}
                isHovered={hoveredStudent?.track_id === student.track_id}
                containerWidth={containerRef.current?.clientWidth || 640}
                containerHeight={containerRef.current?.clientHeight || 480}
              />
            ))}
          </AnimatePresence>
          
          {/* Empty state */}
          {students.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Users size={48} className="mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">Talabalar kutilmoqda...</p>
                <p className="text-sm text-slate-500 mt-2">
                  Kamera yoqilganini tekshiring
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Bottom stats panel */}
        <div className="p-4 border-t border-slate-700 bg-[#18181F]">
          <div className="grid grid-cols-4 gap-4">
            {/* Average attention */}
            <Card className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#F5A623]/20 flex items-center justify-center">
                  <TrendingUp size={20} className="text-[#F5A623]" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">O'rtacha diqqat</p>
                  <p className="text-xl font-bold text-white">
                    {metrics.average_attention.toFixed(1)}%
                  </p>
                </div>
              </div>
            </Card>
            
            {/* Attention trend graph */}
            <Card className="p-3 col-span-2">
              <p className="text-xs text-slate-400 mb-2">Diqqat dinamikasi (5 daqiqa)</p>
              <AttentionTrendGraph history={attentionHistory} />
            </Card>
            
            {/* Processing info */}
            <Card className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1B4FD8]/20 flex items-center justify-center">
                  <Activity size={20} className="text-[#1B4FD8]" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Qayta ishlash</p>
                  <p className="text-xl font-bold text-white">
                    {metrics.processing_time.toFixed(0)}ms
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Snapshot panel */}
      <AnimatePresence>
        {showSnapshots && (
          <SnapshotPanel
            snapshots={snapshots}
            onClose={() => setShowSnapshots(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentAttentionDashboard;
