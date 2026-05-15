import os
import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.exceptions import TelegramAPIError
from dotenv import load_dotenv

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

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

@dp.message(Command("study"))
async def cmd_study(message: types.Message):
    try:
        # Bu yerda backend API bilan bog'lanib bugungi kartalarni olib kelamiz
        await message.answer(
            "📚 *Bugungi vazifa:*\n\n"
            "Sizda bugun 12 ta karta takrorlash uchun tayyor.\n\n"
            "Boshlash uchun tugmani bosing:",
            reply_markup=types.InlineKeyboardMarkup(
                inline_keyboard=[
                    [types.InlineKeyboardButton(text="🚀 Takrorlashni boshlash", url="https://lectioai.uz/student/study")]
                ]
            ),
            parse_mode="Markdown"
        )
    except TelegramAPIError as e:
        logger.error(f"Error sending study message: {e}")

@dp.message(Command("stats"))
async def cmd_stats(message: types.Message):
    try:
        await message.answer(
            "📊 *Sizning statistikangiz:*\n\n"
            "🔥 Streak: 5 kun\n"
            "🧠 O'zlashtirilgan: 34 ta karta\n"
            "📈 O'rtacha o'zlashtirish: 40%\n\n"
            "Davom eting! 💪",
            parse_mode="Markdown"
        )
    except TelegramAPIError as e:
        logger.error(f"Error sending stats message: {e}")

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
