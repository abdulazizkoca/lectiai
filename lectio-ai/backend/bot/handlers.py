from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton, FSInputFile
from aiogram.filters import CommandStart, Command
from aiogram.fsm.context import FSMContext
from states import StudySession
import json
import os
from visuals import generate_stats_card

router = Router()

# Mock user database check
def is_professor(user_id: int) -> bool:
    # Logic to check DB if user is a professor
    return user_id == 123456789 # Mock ID

@router.message(CommandStart())
async def cmd_start(message: Message):
    if is_professor(message.from_user.id):
        text = (
            "👋 Salom, Professor!\n"
            "Lectio AI boshqaruv paneliga xush kelibsiz.\n\n"
            "Buyruqlar:\n"
            "/lesson - Yangi dars yaratish\n"
            "/quiz_results - Natijalarni ko'rish\n"
            "/attention - Kamera modulini boshqarish\n"
            "/students - Talabalar ro'yxati\n"
            "/broadcast - Hammaga xabar yuborish\n\n"
            "💻 Boshqaruv paneli: <a href='https://lectioai.uz/professor/dashboard'>Dashboard</a>"
        )
    else:
        text = (
            f"👋 Salom, {message.from_user.first_name}!\n"
            "Lectio AI yordamchisiga xush kelibsiz.\n\n"
            "📚 /study - Bugungi flashcardlar\n"
            "📊 /stats - Shaxsiy statistika\n"
            "🔥 /streak - Faollik tarixi\n"
            "🏆 /rank - Reyting\n"
            "📅 /schedule - Darslar jadvali\n\n"
            "Akkountni ulash uchun tizimga kiring: <a href='https://lectioai.uz/login'>Kirish</a>"
        )
    await message.answer(text)

# --- STUDENT COMMANDS ---

@router.message(Command("stats"))
async def cmd_stats(message: Message):
    # Dasturiy ravishda rasm yaratamiz
    card_path = await generate_stats_card(
        name=message.from_user.full_name,
        xp=12450,
        streak=15,
        rank=2,
        level="Daraja 12 - Zukko Talaba"
    )
    photo = FSInputFile(card_path)
    await message.answer_photo(photo, caption="Sizning joriy statisikangiz 📊")
    # Clean up
    if os.path.exists(card_path):
        os.remove(card_path)

@router.message(Command("study"))
async def cmd_study(message: Message, state: FSMContext):
    await state.set_state(StudySession.studying)
    
    # Mock data
    await state.update_data(cards_due=42, current_card=1, correct_count=0)
    
    await send_next_flashcard(message.chat.id, message.bot, state)

async def send_next_flashcard(chat_id: int, bot, state: FSMContext):
    data = await state.get_data()
    card_num = data.get("current_card", 1)
    
    if card_num > 5: # Mock session limit for demo
        accuracy = int((data.get("correct_count", 0) / 5) * 100)
        await bot.send_message(
            chat_id, 
            f"🎉 Mashg'ulot yakunlandi!\n\n"
            f"Bajarildi: 5 ta karta\n"
            f"Aniqlik: {accuracy}%\n"
            f"XP olindi: +25 ⚡"
        )
        await state.clear()
        return

    text = f"📖 <b>Savol {card_num}:</b>\n\nTermodinamikaning 1-qonuni nima?"
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="👁 Ko'rsatish", callback_data="show_answer")]
    ])
    
    await bot.send_message(chat_id, text, reply_markup=keyboard)

@router.callback_query(F.data == "show_answer")
async def process_show_answer(callback: CallbackQuery, state: FSMContext):
    await state.set_state(StudySession.rating)
    
    text = (
        "📖 <b>Savol:</b>\nTermodinamikaning 1-qonuni nima?\n\n"
        "💡 <b>Javob:</b>\nEnergiya yo'qdan bor bo'lmaydi va bordan yo'q bo'lmaydi..."
    )
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="😢 Bilmadim", callback_data="rate_hard"),
            InlineKeyboardButton(text="😐 Qiyin", callback_data="rate_medium")
        ],
        [
            InlineKeyboardButton(text="😊 Oson", callback_data="rate_easy"),
            InlineKeyboardButton(text="🚀 Zo'r", callback_data="rate_perfect")
        ]
    ])
    
    await callback.message.edit_text(text, reply_markup=keyboard)
    await callback.answer()

@router.callback_query(F.data.startswith("rate_"))
async def process_rating(callback: CallbackQuery, state: FSMContext):
    rating = callback.data.split("_")[1]
    
    data = await state.get_data()
    correct_count = data.get("correct_count", 0)
    
    if rating in ["easy", "perfect"]:
        correct_count += 1
        
    await state.update_data(
        current_card=data.get("current_card", 1) + 1,
        correct_count=correct_count
    )
    
    # Karta baholandi, xabarni o'zgartirish
    await callback.message.edit_reply_markup(reply_markup=None)
    
    # Keyingi kartani yuborish
    await send_next_flashcard(callback.message.chat.id, callback.bot, state)
    await callback.answer(f"Baholandi: {rating.title()}")
