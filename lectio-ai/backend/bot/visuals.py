import os
from PIL import Image, ImageDraw, ImageFont
import matplotlib.pyplot as plt
import io

def get_font(size):
    # Try to load a generic sans-serif font, fallback to default
    try:
        return ImageFont.truetype("arial.ttf", size)
    except IOError:
        return ImageFont.load_default()

async def generate_stats_card(name: str, xp: int, streak: int, rank: int, level: str) -> str:
    """
    Generates a beautiful stats card image using Pillow.
    Returns the file path to the generated image.
    """
    width, height = 800, 400
    
    # Create dark background image
    image = Image.new("RGB", (width, height), "#0A0A0F")
    draw = ImageDraw.Draw(image)
    
    # Draw subtle gradient or shapes
    draw.rectangle([0, 0, width, 100], fill="#1B4FD8")
    
    # Draw Avatar Placeholder
    draw.ellipse([50, 50, 150, 150], fill="#F5A623")
    draw.text((85, 80), name[0].upper(), font=get_font(48), fill="black")
    
    # Draw Name and Level
    draw.text((180, 110), name, font=get_font(36), fill="white")
    draw.text((180, 160), level, font=get_font(24), fill="#F5A623")
    
    # Draw Stats Boxes
    # Box 1: XP
    draw.rounded_rectangle([50, 220, 250, 320], radius=15, fill="#18181F", outline="#333", width=2)
    draw.text((70, 240), "Jami XP", font=get_font(20), fill="#888")
    draw.text((70, 270), f"{xp:,} ⚡", font=get_font(32), fill="#0D9373")

    # Box 2: Streak
    draw.rounded_rectangle([280, 220, 480, 320], radius=15, fill="#18181F", outline="#333", width=2)
    draw.text((300, 240), "Streak", font=get_font(20), fill="#888")
    draw.text((300, 270), f"{streak} kun 🔥", font=get_font(32), fill="#F5A623")

    # Box 3: Rank
    draw.rounded_rectangle([510, 220, 710, 320], radius=15, fill="#18181F", outline="#333", width=2)
    draw.text((530, 240), "Reyting", font=get_font(20), fill="#888")
    draw.text((530, 270), f"#{rank} 🏆", font=get_font(32), fill="white")
    
    temp_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "tmp")
    os.makedirs(temp_dir, exist_ok=True)
    output_path = os.path.join(temp_dir, f"stats_{name.replace(' ', '_')}.png")
    image.save(output_path)
    return output_path

async def generate_weekly_chart(data: list) -> str:
    """
    Generates a matplotlib chart for weekly XP progress.
    """
    days = ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan', 'Yak']
    
    plt.style.use('dark_background')
    fig, ax = plt.subplots(figsize=(8, 4))
    
    ax.bar(days, data, color='#1B4FD8', edgecolor='#F5A623')
    ax.set_title("Haftalik Faollik (XP)", color='white', fontsize=16)
    ax.set_ylabel("XP", color='white')
    
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    temp_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "tmp")
    os.makedirs(temp_dir, exist_ok=True)
    output_path = os.path.join(temp_dir, "weekly_chart.png")
    plt.savefig(output_path, bbox_inches='tight', transparent=True)
    plt.close()
    
    return output_path
