import os
import sys
import asyncio
import logging
from pathlib import Path
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.exceptions import TelegramAPIError
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

# Add backend directory to sys.path to import DB and models
backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.append(str(backend_path))

try:
    from database import SessionLocal
    from models.user import User
    from models.flashcard import FlashCard
    DATABASE_AVAILABLE = True
    logger.info("Database connection successfully configured for Telegram Bot.")
except Exception as e:
    DATABASE_AVAILABLE = False
    logger.error(f"Could not load database models for Telegram Bot: {e}")

if not TOKEN or TOKEN == "your-telegram-bot-token-here":
    logger.error("TELEGRAM_BOT_TOKEN topilmadi. Bot ishga tushmaydi.")
    # Exit gracefully if token is not configured to avoid crashing when users test locally
    exit(0)

bot = Bot(token=TOKEN)
dp = Dispatcher()

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    try:
        await message.answer(
            "🎓 *Lectio AI* platformasiga xush kelibsiz!\n\n"
            "Men sizning shaxsiy ta'lim yordamchingizman. "
            "Mening yordamimda siz qiyin mavzularni oson takrorlab, o'zlashtirishingiz mumkin.\n\n"
            "Boshlash uchun profilingizni ulang: /connect",
            parse_mode="Markdown"
        )
    except TelegramAPIError as e:
        logger.error(f"Error sending start message: {e}")

@dp.message(Command("connect"))
async def cmd_connect(message: types.Message):
    if not DATABASE_AVAILABLE:
        await message.answer("❌ Hozirda tizim bazasi bilan aloqa mavjud emas. Birozdan so'ng urinib ko'ring.")
        return

    args = message.text.split()
    if len(args) < 2:
        await message.answer(
            "🔑 *Profilni ulash buyrug'i:*\n\n"
            "Tizimga ro'yxatdan o'tgan elektron pochtangizni kiriting:\n"
            "`/connect pochtangiz@example.com`",
            parse_mode="Markdown"
        )
        return

    email = args[1].strip().lower()
    tg_id = str(message.from_user.id)

    db = SessionLocal()
    try:
        # Avval bu telegram_id boshqa profilga ulanmaganligini tekshiramiz
        existing_user = db.query(User).filter(User.telegram_id == tg_id).first()
        if existing_user:
            await message.answer(
                f"⚠️ Sizning Telegram profilingiz allaqachon *{existing_user.full_name}* ({existing_user.email}) hisobiga ulangan.",
                parse_mode="Markdown"
            )
            return

        # Pochtani qidiramiz
        user = db.query(User).filter(User.email == email).first()
        if not user:
            await message.answer(
                "❌ Kechirasiz, ushbu elektron pochta manzili tizimda topilmadi. "
                "Pochtani to'g'ri yozganingizni yoki platformada ro'yxatdan o'tganingizni tekshiring.",
                parse_mode="Markdown"
            )
            return

        # Bog'laymiz
        user.telegram_id = tg_id
        db.commit()
        await message.answer(
            f"✅ *Muvaffaqiyatli ulandi!*\n\n"
            f"Foydalanuvchi: *{user.full_name}*\n"
            f"Roli: *{user.role.value.capitalize()}*\n\n"
            f"Endi siz o'z statistikangizni va darslaringizni kuzatib borishingiz mumkin.",
            parse_mode="Markdown"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error connecting telegram ID: {e}")
        await message.answer("❌ Profilni ulashda xatolik yuz berdi. Iltimos, keyinroq qayta urining.")
    finally:
        db.close()

@dp.message(Command("study"))
async def cmd_study(message: types.Message):
    if not DATABASE_AVAILABLE:
        await message.answer("❌ Tizim bazasiga ulanib bo'lmadi.")
        return

    tg_id = str(message.from_user.id)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.telegram_id == tg_id).first()
        if not user:
            await message.answer(
                "⚠️ Siz hali profilingizni ulamagansiz.\n"
                "Profilingizni ulash uchun `/connect email@example.com` buyrug'ini yuboring.",
                parse_mode="Markdown"
            )
            return

        # Bugun takrorlanishi kerak bo'lgan kartalarni sanaymiz
        now = datetime.utcnow()
        due_cards_count = db.query(FlashCard).filter(
            FlashCard.student_id == user.id,
            FlashCard.next_review <= now
        ).count()

        if due_cards_count > 0:
            await message.answer(
                f"📚 *Bugungi vazifa:*\n\n"
                f"Sizda bugun takrorlash uchun *{due_cards_count} ta* aqlli karta tayyor.\n\n"
                f"Boshlash uchun quyidagi tugmani bosing:",
                reply_markup=types.InlineKeyboardMarkup(
                    inline_keyboard=[
                        [types.InlineKeyboardButton(text="🚀 Takrorlashni boshlash", url="https://lectioai.uz/student/study")]
                    ]
                ),
                parse_mode="Markdown"
            )
        else:
            await message.answer(
                "🎉 *Ajoyib!* Bugun takrorlash uchun kartalar qolmadi. Hamma darslarni o'z vaqtida takrorladingiz!",
                parse_mode="Markdown"
            )
    except Exception as e:
        logger.error(f"Error checking study cards: {e}")
        await message.answer("❌ Ma'lumotlarni yuklashda xatolik yuz berdi.")
    finally:
        db.close()

@dp.message(Command("stats"))
async def cmd_stats(message: types.Message):
    if not DATABASE_AVAILABLE:
        await message.answer("❌ Tizim bazasiga ulanib bo'lmadi.")
        return

    tg_id = str(message.from_user.id)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.telegram_id == tg_id).first()
        if not user:
            await message.answer(
                "⚠️ Siz hali profilingizni ulamagansiz.\n"
                "Boshlash uchun `/connect email@example.com` buyrug'ini yuboring.",
                parse_mode="Markdown"
            )
            return

        streak = user.streak_days or 0
        xp = user.xp_points or 0

        # Agar talaba bo'lsa, jami kartalar soni va bugungi vazifalarni ko'rsatamiz
        card_info = ""
        if user.role.value == "student":
            total_cards = db.query(FlashCard).filter(FlashCard.student_id == user.id).count()
            card_info = f"🧠 Jami kartalaringiz: *{total_cards} ta*\n"

        await message.answer(
            f"📊 *{user.full_name}* ({user.role.value.capitalize()}) statistikasi:\n\n"
            f"🔥 Streak: *{streak} kun*\n"
            f"✨ Jamg'argan ballar: *{xp} XP*\n"
            f"{card_info}\n"
            f"Lectio AI bilan mukammallikka intiling! 🎓",
            parse_mode="Markdown"
        )
    except Exception as e:
        logger.error(f"Error loading student stats: {e}")
        await message.answer("❌ Statistikangizni yuklashda xatolik yuz berdi.")
    finally:
        db.close()

@dp.message()
async def handle_unknown_commands(message: types.Message):
    """Handle unknown commands and provide help"""
    try:
        await message.answer(
            "🤖 Noma'lum buyruq.\n\n"
            "Mavjud buyruqlar:\n"
            "/start - Botni ishga tushirish\n"
            "/study - Bugungi vazifalar\n"
            "/stats - Statistikangiz\n"
            "/connect - Profilingizni ulash",
            parse_mode="Markdown"
        )
    except TelegramAPIError as e:
        logger.error(f"Error sending help message: {e}")

async def main():
    logger.info("Bot ishga tushmoqda...")
    try:
        await dp.start_polling(bot)
    except Exception as e:
        logger.error(f"Bot polling error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
