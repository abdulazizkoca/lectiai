"""
notification.py — In-code chaqirish uchun sinxron/asinxron xabarnoma xizmati.
Celery orqali rejalashtirilgan topshiriqlar uchun: services/notifications.py faylini ko'ring.
"""
import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

logger = logging.getLogger("lectio.notification")


class NotificationService:
    """Xabarnomalar xizmati — Telegram bot va SMTP email."""

    # ── Telegram ──────────────────────────────────────────────
    async def send_telegram(self, telegram_id: str, message: str) -> bool:
        """Telegram bot orqali xabar yuborish."""
        try:
            from bot.bot import bot
            import asyncio
            loop = asyncio.get_event_loop()
            if loop.is_running():
                await bot.send_message(telegram_id, message)
            else:
                asyncio.run(bot.send_message(telegram_id, message))
            return True
        except Exception as e:
            logger.warning(f"Telegram xabari yuborilmadi ({telegram_id}): {e}")
            return False

    # ── Email ─────────────────────────────────────────────────
    async def send_email(self, email: str, subject: str, body: str) -> bool:
        """SMTP orqali email yuborish. Env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD."""
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_pass = os.getenv("SMTP_PASSWORD", "")
        smtp_from = os.getenv("SMTP_FROM", smtp_user)

        if not smtp_user or not smtp_pass:
            logger.warning(f"SMTP sozlanmagan — email yuborilmadi: {email}")
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"Lectio AI <{smtp_from}>"
            msg["To"] = email
            msg.attach(MIMEText(body, "html", "utf-8"))

            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as srv:
                srv.ehlo()
                srv.starttls()
                srv.login(smtp_user, smtp_pass)
                srv.sendmail(smtp_from, [email], msg.as_string())
            return True
        except Exception as e:
            logger.warning(f"Email yuborilmadi ({email}): {e}")
            return False

    # ── Qo'shimcha yordamchilar ───────────────────────────────
    async def send_study_reminder(
        self,
        telegram_id: Optional[str],
        email: Optional[str],
        cards_count: int,
    ):
        """Takrorlash eslatmasi."""
        message = f"📚 Bugun {cards_count} ta karta takrorlash vaqti! /study buyrug'ini bosing"
        if telegram_id:
            await self.send_telegram(telegram_id, message)
        if email:
            html = f"<p>{message}</p><p><a href='https://lectioai.uz/student/flashcards'>Boshlash →</a></p>"
            await self.send_email(email, "Lectio AI — Takrorlash vaqti!", html)

    async def send_password_reset(self, email: str, reset_link: str) -> bool:
        """Parol tiklash emaili."""
        html = f"""
        <h2>Lectio AI — Parolni tiklash</h2>
        <p>Parolni tiklash so'rovi qabul qilindi.</p>
        <p><a href="{reset_link}" style="
            display:inline-block;padding:12px 24px;background:#F5A623;
            color:#000;border-radius:8px;text-decoration:none;font-weight:bold">
            Parolni tiklash →
        </a></p>
        <p style="color:#888;font-size:12px">Havola 15 daqiqa amal qiladi.<br>
        Agar so'rov siz tomondan bo'lmasa, bu xabarni e'tiborsiz qoldiring.</p>
        """
        return await self.send_email(email, "Lectio AI — Parolni tiklash", html)


notification_service = NotificationService()
