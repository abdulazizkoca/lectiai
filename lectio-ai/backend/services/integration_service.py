import json
import asyncio
import requests
import csv
from io import BytesIO, StringIO
from typing import List, Dict, Any
from fastapi import WebSocket

# Hisobotlar (Excel, PDF) yaratish uchun qo'shimcha kutubxonalar (agar serverda o'rnatilgan bo'lsa)
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


class WebSocketManager:
    """
    Real-time Integratsiya (1): Frontend Dashboard (React/Next.js) ga 
    WebSocket orqali soniyasiga ma'lumot uzatish.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Barcha ochiq Frontend panellariga (O'qituvchilar/Adminlar) JSON uzatish"""
        data_str = json.dumps(message)
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(data_str)
            except Exception:
                dead_connections.append(connection)
                
        # Uzilgan ulanishlarni tozalash
        for dead in dead_connections:
            self.disconnect(dead)


class TelegramNotifier:
    """
    Integratsiya (3): Telegram Bot orqali O'qituvchiga yoki masofadagi Ota-onaga
    diqqat keskin pasayganda avtomatik xabar (Alert) yuborish.
    """
    def __init__(self, bot_token: str = None, default_chat_id: str = None):
        # Aslida .env dan olinadi
        self.bot_token = bot_token or "YOUR_TELEGRAM_BOT_TOKEN"
        self.default_chat_id = default_chat_id or "PROFESSOR_CHAT_ID"
        self.api_url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"

    def send_low_attention_alert(self, student_name: str, score: int, room: str, chat_id: str = None):
        target_chat = chat_id if chat_id else self.default_chat_id
        
        message = (
            f"🚨 <b>Diqqat Pasayishi!</b>\n"
            f"👤 O'quvchi: {student_name}\n"
            f"📉 Diqqat: {score}%\n"
            f"📍 Xona: {room}\n\n"
            f"<i>Iltimos, dars jarayonida o'quvchiga e'tibor qarating!</i>"
        )
        payload = {
            "chat_id": target_chat, 
            "text": message, 
            "parse_mode": "HTML"
        }
        
        # Requests bloklanmasligi uchun asinxron task orqali yuborish tavsiya etiladi, 
        # hozircha tezkor requests.post timeout bilan ishlatamiz.
        try:
            requests.post(self.api_url, json=payload, timeout=2)
        except Exception as e:
            print(f"[Telegram Integratsiya Xatosi] Xabar yuborilmadi: {e}")


class WebhookDispatcher:
    """
    Integratsiya (4): Webhook orqali boshqa tizimlarga (Moodle, Canvas, Universitet CRM) 
    dars ma'lumotlarini POST formatida otish.
    """
    def __init__(self):
        # Baza yoki config fayldan o'qiladigan webhook URL lar
        self.registered_urls = []

    def register_webhook(self, url: str):
        if url not in self.registered_urls:
            self.registered_urls.append(url)

    def dispatch_event(self, event_name: str, data: dict):
        """Voqea sodir bo'lsa (Masalan: 'lesson_finished', 'critical_warning'), Webhook yuborish"""
        if not self.registered_urls:
            return
            
        payload = {
            "event": event_name,
            "timestamp": datetime.now().isoformat() if "time" not in data else data["time"],
            "payload": data
        }
        
        for url in self.registered_urls:
            try:
                requests.post(url, json=payload, timeout=3)
            except Exception as e:
                print(f"[Webhook Error] {url} manziliga ma'lumot yetib bormadi: {e}")


class ExportService:
    """
    Integratsiya (5): Export PDF va Excel.
    Dars yakunidagi summary (xulosa) ma'lumotlarini rasmiy faylga o'tkazib API orqali berish.
    """
    @staticmethod
    def generate_excel_csv(summary_data: dict) -> StringIO:
        """Pandas bo'lmasa oddiy CSV qilib chiqarish, bo'lsa Excel (XLSX) bytes qilib yuborish"""
        output = StringIO()
        writer = csv.writer(output)
        
        writer.writerow(["Student ID", "Average Attention (%)", "Status"])
        performance = summary_data.get("student_performance", {})
        
        for sid, stats in performance.items():
            writer.writerow([sid, stats.get("average_attention"), stats.get("performance_status")])
            
        output.seek(0)
        return output

    @staticmethod
    def generate_pdf(summary_data: dict) -> BytesIO:
        """Darsning umumiy ko'rsatkichlarini rasmiy PDF fayl qilib yuklash"""
        output = BytesIO()
        if REPORTLAB_AVAILABLE:
            c = canvas.Canvas(output, pagesize=letter)
            
            # PDF Header
            c.setFont("Helvetica-Bold", 16)
            c.drawString(50, 750, f"Dars Hisoboti - Session ID: {summary_data.get('session_id')}")
            
            # PDF Body
            c.setFont("Helvetica", 12)
            c.drawString(50, 720, f"Boshlanish vaqti: {summary_data.get('start_time')}")
            c.drawString(50, 700, f"Davomiyligi: {summary_data.get('duration_minutes')} daqiqa")
            c.drawString(50, 680, f"Umumiy Diqqat: {summary_data.get('overall_attention_percentage')}%")
            
            c.drawString(50, 640, "O'quvchilar Statistikasi:")
            y = 620
            for sid, stats in summary_data.get("student_performance", {}).items():
                c.drawString(70, y, f"ID: {sid} | O'rtacha diqqat: {stats.get('average_attention')}% | Holati: {stats.get('performance_status')}")
                y -= 20
                if y < 50: # Yangi varaq
                    c.showPage()
                    y = 750
            
            c.save()
            output.seek(0)
            return output
        else:
            print("PDF yaratish uchun 'reportlab' kutubxonasi o'rnatilmagan.")
            return None


# Butun dastur bo'ylab bitta marta ishga tushuvchi (Singleton) Integratsiya Obyektlari
ws_manager = WebSocketManager()
telegram_notifier = TelegramNotifier()
webhook_dispatcher = WebhookDispatcher()
export_service = ExportService()
