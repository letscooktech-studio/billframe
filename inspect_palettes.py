import os
import base64
from PIL import Image
import numpy as np

uploaded_dir = r"C:\Users\manis\.gemini\antigravity\brain\b7518e44-99c6-47f3-9b05-4526047e62da\.user_uploaded"
files = [
    ("Onboarding Theme Selection", "media_1791999524646_d4a0eb28.jpg"),
    ("Template Studio Screen & Banner", "media_1791999525663_3b399809.jpg"),
    ("Clients Screen & Banner", "media_1791999526640_6888eebf.jpg"),
    ("Payments & UPI Screen & Banner", "media_1791999527664_ff14f4ee.jpg"),
    ("Documents Screen & Banner", "media_1791999528744_509e759f.jpg")
]

html = [
    "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Pixel Analysis</title>",
    "<style>",
    "body{background:#0a0c10;color:#fff;font-family:system-ui,-apple-system,sans-serif;padding:24px;margin:0;}",
    "h1{font-size:24px;margin-bottom:8px;font-weight:700;}",
    "p.sub{color:#94a3b8;font-size:14px;margin-bottom:24px;}",
    ".grid{display:flex;flex-wrap:wrap;gap:24px;}",
    ".card{background:#161922;border:1px solid #2d3345;border-radius:14px;padding:20px;max-width:320px;box-shadow:0 10px 30px rgba(0,0,0,0.5);}",
    ".card h3{margin:0 0 4px 0;font-size:16px;color:#f8fafc;}",
    ".card .meta{color:#64748b;font-size:11px;font-family:monospace;margin-bottom:12px;}",
    ".img-wrap{background:#000;padding:12px;border-radius:10px;text-align:center;border:1px solid #1e293b;}",
    "img{image-rendering:pixelated;width:100%;height:auto;border-radius:6px;display:block;}",
    ".palette{margin-top:16px;display:flex;flex-direction:column;gap:6px;}",
    ".swatch{display:flex;align-items:center;gap:10px;font-size:12px;font-family:monospace;}",
    ".swatch-box{width:28px;height:22px;border-radius:4px;border:1px solid rgba(255,255,255,0.2);}",
    "</style></head><body>",
    "<h1>User Uploaded Reference Images & Exact Palettes</h1>",
    "<p class='sub'>Direct high-precision pixel sampling from user-supplied targets.</p>",
    "<div class='grid'>"
]

for title, fname in files:
    p = os.path.join(uploaded_dir, fname)
    with open(p, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")
    
    im = Image.open(p).convert("RGB")
    arr = np.array(im)
    
    # Sample distinctive colors
    # 1. Background
    bg_hex = "#{:02x}{:02x}{:02x}".format(*arr[5, 5])
    
    # 2. Key highlight/wave color
    r = arr[:,:,0].astype(int)
    g = arr[:,:,1].astype(int)
    b = arr[:,:,2].astype(int)
    diff = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    colored_mask = (diff > 25) & (arr.sum(axis=2) > 60)
    
    swatches = []
    swatches.append((bg_hex, "Canvas / Pure Base BG"))
    
    if np.any(colored_mask):
        c_pixels = arr[colored_mask]
        # Sort by brightness
        brights = c_pixels[np.argsort(-c_pixels.sum(axis=1))]
        if len(brights) > 0:
            p_top = brights[0]
            swatches.append(("#{0:02x}{1:02x}{2:02x}".format(p_top[0], p_top[1], p_top[2]), "Peak Glow Highlight"))
        if len(brights) > len(brights)//2:
            p_mid = brights[len(brights)//2]
            swatches.append(("#{0:02x}{1:02x}{2:02x}".format(p_mid[0], p_mid[1], p_mid[2]), "Atmospheric Body / Flow"))
        if len(brights) > 0:
            p_deep = brights[-1]
            swatches.append(("#{0:02x}{1:02x}{2:02x}".format(p_deep[0], p_deep[1], p_deep[2]), "Deep Glow Margin"))
            
    html.append(f"""
    <div class='card'>
      <h3>{title}</h3>
      <div class='meta'>{fname}</div>
      <div class='img-wrap'>
        <img src='data:image/jpeg;base64,{b64}'>
      </div>
      <div class='palette'>
        {"".join([f"<div class='swatch'><div class='swatch-box' style='background:{hex_code}'></div><span>{hex_code} &bull; {desc}</span></div>" for hex_code, desc in swatches])}
      </div>
    </div>
    """)

html.append("</div></body></html>")
out_path = r"C:\Users\manis\.gemini\antigravity\brain\b7518e44-99c6-47f3-9b05-4526047e62da\inspected_crops\inspection_viewer.html"
with open(out_path, "w", encoding="utf-8") as f:
    f.write("\n".join(html))
print("Saved inspection viewer HTML to", out_path)
