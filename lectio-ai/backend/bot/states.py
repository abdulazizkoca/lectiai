from aiogram.fsm.state import State, StatesGroup

class StudySession(StatesGroup):
    idle = State()
    studying = State()
    rating = State()
    complete = State()
    
class LessonCreation(StatesGroup):
    waiting_for_title = State()
    waiting_for_material = State()
    confirm = State()
