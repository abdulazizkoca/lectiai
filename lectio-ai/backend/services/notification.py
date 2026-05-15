"""
Notification xizmati — kelajakda kengaytirish uchun
Telegram, email va push notification yuborish
"""
from typing import Optional


class NotificationService:
    """Xabarnomalar xizmati"""

    async def send_telegram(self, telegram_id: str, message: str) -> bool:
        """Telegram orqali xabar yuborish"""
        # Telegram bot orqali amalga oshiriladi
        # Bu yerda placeholder
        print(f"[Telegram] -> {telegram_id}: {message}")
        return True

    async def send_email(self, email: str, subject: str, body: str) -> bool:
        """Email orqali xabar yuborish"""
        # SMTP integration placeholder
        print(f"[Email] -> {email}: {subject}")
        return True

    async def send_study_reminder(
        self, 
        telegram_id: Optional[str], 
        email: Optional[str],
        cards_count: int
    ):
        """Takrorlash eslatmasi yuborish"""
        message = f"📚 Bugun {cards_count} ta karta takrorlash vaqti! /study buyrug'ini bosing"
        
        if telegram_id:
            await self.send_telegram(telegram_id, message)
        if email:
            await self.send_email(email, "Lectio AI — Takrorlash vaqti!", message)


notification_service = NotificationService()
