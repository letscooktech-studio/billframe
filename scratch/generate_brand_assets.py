import os
import numpy as np
from PIL import Image, ImageOps

SOURCE_PATH = 'C:/Users/manis/.gemini/antigravity/brain/b7518e44-99c6-47f3-9b05-4526047e62da/.user_uploaded/media_1790880030297.png'
PROJECT_ROOT = 'c:/Users/manis/OneDrive/Desktop/BILL FRAMES INVOICE APP'

im_raw = Image.open(SOURCE_PATH).convert('RGBA')

# 1. Find tight bounding box of logo content (alpha > 10)
alpha_channel = np.array(im_raw)[:, :, 3]
rows = np.any(alpha_channel > 10, axis=1)
cols = np.any(alpha_channel > 10, axis=0)
ymin, ymax = np.where(rows)[0][[0, -1]]
xmin, xmax = np.where(cols)[0][[0, -1]]

logo_cropped = im_raw.crop((xmin, ymin, xmax + 1, ymax + 1))
cw, ch = logo_cropped.size
print(f'Cropped logo: {cw}x{ch}')

DARK_BG = (11, 11, 13, 255) # #0B0B0D

def make_centered_canvas(content: Image.Image, canvas_w: int, canvas_h: int, target_w: int, bg_color=None):
    aspect = content.size[1] / content.size[0]
    target_h = int(target_w * aspect)
    resized = content.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    if bg_color:
        canvas = Image.new('RGBA', (canvas_w, canvas_h), bg_color)
    else:
        canvas = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
        
    offset_x = (canvas_w - target_w) // 2
    offset_y = (canvas_h - target_h) // 2
    canvas.alpha_composite(resized, (offset_x, offset_y))
    return canvas

# 2. Generate billframe-mark.png (1024x1024, transparent)
mark_1024 = make_centered_canvas(logo_cropped, 1024, 1024, 840, None)
os.makedirs(f'{PROJECT_ROOT}/assets/brand', exist_ok=True)
mark_1024.save(f'{PROJECT_ROOT}/assets/brand/billframe-mark.png', 'PNG')
print('Generated assets/brand/billframe-mark.png')

# 3. Generate icon.png (1024x1024, dark background #0B0B0D)
icon_1024 = make_centered_canvas(logo_cropped, 1024, 1024, 720, DARK_BG)
icon_1024.save(f'{PROJECT_ROOT}/assets/icon.png', 'PNG')
print('Generated assets/icon.png')

# 4. Generate adaptive-icon.png (1024x1024, transparent, safe zone 580px)
adaptive_1024 = make_centered_canvas(logo_cropped, 1024, 1024, 580, None)
adaptive_1024.save(f'{PROJECT_ROOT}/assets/adaptive-icon.png', 'PNG')
print('Generated assets/adaptive-icon.png')

# 5. Generate monochrome-icon.png (1024x1024, transparent, Material You monochrome)
# For monochrome, pixels should be white (#FFFFFF), with alpha representing opacity/shadows
arr_adaptive = np.array(adaptive_1024)
r = arr_adaptive[:, :, 0]
g = arr_adaptive[:, :, 1]
b = arr_adaptive[:, :, 2]
a = arr_adaptive[:, :, 3]

# Calculate relative luminance on visible pixels
lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
# Modulate alpha by luminance for shadow depth
new_a = (a.astype(float) * lum).clip(0, 255).astype(np.uint8)

mono_arr = np.zeros_like(arr_adaptive)
mono_arr[:, :, 0] = 255
mono_arr[:, :, 1] = 255
mono_arr[:, :, 2] = 255
mono_arr[:, :, 3] = new_a

mono_img = Image.fromarray(mono_arr, 'RGBA')
mono_img.save(f'{PROJECT_ROOT}/assets/monochrome-icon.png', 'PNG')
print('Generated assets/monochrome-icon.png')

# 6. Generate splash-icon.png & splash.png
splash_icon = make_centered_canvas(logo_cropped, 512, 512, 380, None)
splash_icon.save(f'{PROJECT_ROOT}/assets/splash-icon.png', 'PNG')

splash_screen = make_centered_canvas(logo_cropped, 1242, 2436, 420, DARK_BG)
splash_screen.save(f'{PROJECT_ROOT}/assets/splash.png', 'PNG')
print('Generated splash assets')

# 7. Generate favicon.png (192x192)
favicon = make_centered_canvas(logo_cropped, 192, 192, 140, DARK_BG)
favicon.save(f'{PROJECT_ROOT}/assets/favicon.png', 'PNG')
print('Generated assets/favicon.png')

# 8. Generate Android native mipmap icons
MIPMAP_DENSITIES = {
    'mdpi': (48, 108),
    'hdpi': (72, 162),
    'xhdpi': (96, 216),
    'xxhdpi': (144, 324),
    'xxxhdpi': (192, 432),
}

for density, (legacy_size, adaptive_size) in MIPMAP_DENSITIES.items():
    density_dir = f'{PROJECT_ROOT}/android/app/src/main/res/mipmap-{density}'
    os.makedirs(density_dir, exist_ok=True)
    
    # Legacy ic_launcher.png (with dark background)
    target_mark_w = int(legacy_size * 0.72)
    ic_legacy = make_centered_canvas(logo_cropped, legacy_size, legacy_size, target_mark_w, DARK_BG)
    ic_legacy.save(f'{density_dir}/ic_launcher.png', 'PNG')
    
    # Round icon ic_launcher_round.png
    mask = Image.new('L', (legacy_size, legacy_size), 0)
    from PIL import ImageDraw
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, legacy_size, legacy_size), fill=255)
    ic_round = Image.new('RGBA', (legacy_size, legacy_size), (0, 0, 0, 0))
    ic_round.paste(ic_legacy, (0, 0), mask=mask)
    ic_round.save(f'{density_dir}/ic_launcher_round.png', 'PNG')
    
    # Adaptive foreground (108dp canvas, safe zone ~58dp)
    target_fg_w = int(adaptive_size * (580 / 1024))
    ic_fg = make_centered_canvas(logo_cropped, adaptive_size, adaptive_size, target_fg_w, None)
    ic_fg.save(f'{density_dir}/ic_launcher_foreground.png', 'PNG')
    
    # Adaptive monochrome
    mono_resized = mono_img.resize((adaptive_size, adaptive_size), Image.Resampling.LANCZOS)
    mono_resized.save(f'{density_dir}/ic_launcher_monochrome.png', 'PNG')

print('Generated all native mipmap icons')

# 9. Generate Android native splashscreen_logo drawables
SPLASH_DENSITIES = {
    'mdpi': (288, 120),
    'hdpi': (432, 180),
    'xhdpi': (576, 240),
    'xxhdpi': (864, 360),
    'xxxhdpi': (1152, 480),
}

for density, (canvas_size, target_w) in SPLASH_DENSITIES.items():
    drawable_dir = f'{PROJECT_ROOT}/android/app/src/main/res/drawable-{density}'
    os.makedirs(drawable_dir, exist_ok=True)
    splash_logo = make_centered_canvas(logo_cropped, canvas_size, canvas_size, target_w, DARK_BG)
    splash_logo.save(f'{drawable_dir}/splashscreen_logo.png', 'PNG')

print('Generated all native splashscreen drawables')
