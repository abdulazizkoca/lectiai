from celery import shared_task
from celery.schedules import crontab
from celery_app import celery_app
from bot.bot import bot
import asyncio

# Configure Celery Beat Schedule
celery_app.conf.beat_schedule = {
    'daily-morning-reminder': {
        'task': 'services.notifications.send_daily_reminders',
        'schedule': crontab(hour=8, minute=0), # 8:00 AM
    },
    'streak-risk-notification': {
        'task': 'services.notifications.send_streak_warnings',
        'schedule': crontab(hour=21, minute=0), # 21:00 PM
    },
    'weekly-report': {
        'task': 'services.notifications.send_weekly_reports',
        'schedule': crontab(day_of_week=0, hour=18, minute=0), # Sunday 18:00
    },
}

@shared_task(name="services.notifications.send_daily_reminders")
def send_daily_reminders():
    # Production da DB dan due_cards > 0 bo'lgan o'quvchilarni olib, aylanib chiqamiz
    users_to_remind = [
        {"telegram_id": 123456789, "name": "Jasur", "cards": 42}
    ]
    
    for user in users_to_remind:
        msg = f"📚 Salom {user['name']}! Bugun {user['cards']} ta karta kutmoqda ⏰\nDavom etish uchun: /study"
        # asyncio.run() ishlatamiz chunki celery sinxron, bot esa asinxron
        try:
            asyncio.run(bot.send_message(user['telegram_id'], msg))
        except Exception as e:
            print(f"Failed to send to {user['telegram_id']}: {e}")

@shared_task(name="services.notifications.send_lesson_reminder")
def send_lesson_reminder(telegram_id: int, lesson_title: str, room_code: str):
    msg = f"📡 <b>{lesson_title}</b> 30 daqiqadan keyin boshlanadi\n\nKirish: https://lectioai.uz/join/{room_code}"
    try:
        asyncio.run(bot.send_message(telegram_id, msg, parse_mode="HTML"))
    except Exception as e:
        pass

@shared_task(name="services.notifications.send_streak_warnings")
def send_streak_warnings():
    users_in_danger = [
        {"telegram_id": 123456789, "streak": 14}
    ]
    for user in users_in_danger:
        msg = f"🔥 {user['streak']} kunlik seriyaniz xavfda! 10 daqiqa o'qing: /study"
        try:
            asyncio.run(bot.send_message(user['telegram_id'], msg))
        except Exception as e:
            pass
