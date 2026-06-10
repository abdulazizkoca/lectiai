from celery import shared_task
from celery.schedules import crontab
from celery_app import celery_app
from bot.bot import bot
from datetime import datetime, timezone
from sqlalchemy import func
import asyncio
import logging

logger = logging.getLogger("lectio.notifications")

# Configure Celery Beat Schedule
celery_app.conf.beat_schedule = {
    'daily-morning-reminder': {
        'task': 'services.notifications.send_daily_reminders',
        'schedule': crontab(hour=8, minute=0),
    },
    'streak-risk-notification': {
        'task': 'services.notifications.send_streak_warnings',
        'schedule': crontab(hour=21, minute=0),
    },
    'weekly-report': {
        'task': 'services.notifications.send_weekly_reports',
        'schedule': crontab(day_of_week=0, hour=18, minute=0),
    },
}


def _get_db():
    from database import SessionLocal
    return SessionLocal()


@shared_task(name="services.notifications.send_daily_reminders")
def send_daily_reminders():
    from models.user import User, UserRole
    from models.card import Card

    db = _get_db()
    try:
        now = datetime.now(timezone.utc)
        rows = (
            db.query(User, func.count(Card.id).label("due_count"))
            .join(Card, Card.student_id == User.id)
            .filter(
                User.telegram_id.isnot(None),
                User.role == UserRole.student,
                Card.next_review <= now,
            )
            .group_by(User.id)
            .all()
        )
    finally:
        db.close()

    for user, due_count in rows:
        if due_count == 0:
            continue
        name = (user.full_name or "Talaba").split()[0]
        msg = f"📚 Salom {name}! Bugun {due_count} ta karta kutmoqda ⏰\nDavom etish uchun: /study"
        try:
            asyncio.run(bot.send_message(user.telegram_id, msg))
        except Exception as e:
            logger.warning(f"Bildirishnoma yuborishda xato {user.telegram_id}: {e}")


@shared_task(name="services.notifications.send_lesson_reminder")
def send_lesson_reminder(telegram_id: int, lesson_title: str, room_code: str):
    msg = f"📡 <b>{lesson_title}</b> 30 daqiqadan keyin boshlanadi\n\nKirish: https://lectioai.uz/join/{room_code}"
    try:
        asyncio.run(bot.send_message(telegram_id, msg, parse_mode="HTML"))
    except Exception:
        pass


@shared_task(name="services.notifications.send_streak_warnings")
def send_streak_warnings():
    from models.user import User, UserRole

    db = _get_db()
    try:
        at_risk = (
            db.query(User)
            .filter(
                User.telegram_id.isnot(None),
                User.role == UserRole.student,
                User.streak_days > 0,
            )
            .all()
        )
        users_in_danger = [
            {"telegram_id": u.telegram_id, "streak": u.streak_days}
            for u in at_risk
        ]
    finally:
        db.close()

    for user in users_in_danger:
        msg = f"🔥 {user['streak']} kunlik seriyaniz xavfda! 10 daqiqa o'qing: /study"
        try:
            asyncio.run(bot.send_message(user['telegram_id'], msg))
        except Exception as e:
            logger.warning(f"Streak ogohlantirish xatosi {user['telegram_id']}: {e}")
