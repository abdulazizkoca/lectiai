# Backend uchun Dockerfile (Render.com va Production muhiti uchun optimallashtirilgan)
# RAM cheklovi (512MB - 1GB) bo'lgan serverlar uchun yengil qilib yozilgan.

FROM python:3.10-slim

# MediaPipe, OpenCV headless va audio uchun kerak bo'lgan asosiy tizim kutubxonalari
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1-mesa-glx \
    ffmpeg \
    portaudio19-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dastlab faqat requirements ni nusxalash (Docker cache dan yutish uchun)
COPY requirements.txt .

# RAM kam serverlarda o'rnatish payti qotib qolmasligi uchun --no-cache-dir va default-timeout
RUN pip install --no-cache-dir --default-timeout=100 -r requirements.txt

# Barcha kodlarni konteynerga nusxalash
COPY . .

EXPOSE 8000

# Render portini avtomatik olish uchun $PORT o'zgaruvchisi bilan
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
