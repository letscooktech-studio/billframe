import os
import base64

uploaded_dir = r"C:\Users\manis\.gemini\antigravity\brain\b7518e44-99c6-47f3-9b05-4526047e62da\.user_uploaded"
artifact_dir = r"C:\Users\manis\.gemini\antigravity\brain\b7518e44-99c6-47f3-9b05-4526047e62da"

def get_b64(fname):
    p = os.path.join(uploaded_dir, fname)
    with open(p, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

onboarding_ref_b64 = get_b64("media_1791999524646_d4a0eb28.jpg")
studio_ref_b64 = get_b64("media_1791999525663_3b399809.jpg")
clients_ref_b64 = get_b64("media_1791999526640_6888eebf.jpg")
payments_ref_b64 = get_b64("media_1791999527664_ff14f4ee.jpg")
docs_ref_b64 = get_b64("media_1791999528744_509e759f.jpg")

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Billframe 4.0 — Exact Palette & Half-Middle Overlay Proof</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: #05070a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 32px;
      line-height: 1.5;
    }}
    h1 {{ font-size: 26px; font-weight: 800; margin-bottom: 6px; }}
    p.lead {{ color: #94a3b8; font-size: 14px; margin-bottom: 32px; }}
    
    .section-title {{
      font-size: 18px;
      font-weight: 700;
      color: #e2e8f0;
      margin: 36px 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #1e293b;
    }}

    .comparison-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 28px;
      margin-bottom: 40px;
    }}

    .panel {{
      background: #0c0f17;
      border: 1px solid #1e2538;
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 12px 30px rgba(0,0,0,0.6);
      display: flex;
      flex-direction: column;
      align-items: center;
    }}
    .panel-header {{
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }}
    .panel-title {{ font-size: 14px; font-weight: 700; color: #f1f5f9; }}
    .badge {{
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}
    .badge-target {{ background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }}
    .badge-code {{ background: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.3); }}

    /* Mobile Phone Simulator Frame */
    .phone-frame {{
      width: 290px;
      height: 560px;
      border-radius: 32px;
      border: 7px solid #1e2538;
      overflow: hidden;
      position: relative;
      background: #000000;
      box-shadow: 0 20px 40px rgba(0,0,0,0.8);
    }}
    .phone-img {{
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }}

    /* Onboarding Render */
    .onboarding-screen {{
      width: 100%;
      height: 100%;
      background: #000000;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 24px 16px 20px 16px;
      position: relative;
      overflow: hidden;
    }}
    .nebula-bg {{
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 320px;
      background: radial-gradient(75% 52% at 50% 12%, rgba(81,93,195,0.82) 0%, rgba(55,58,106,0.55) 30%, rgba(24,25,56,0.25) 65%, rgba(0,0,0,0) 100%);
      pointer-events: none;
    }}
    .ob-header {{ text-align: center; position: relative; z-index: 2; margin-top: 8px; }}
    .ob-logo {{ font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }}
    .ob-tagline {{ font-size: 11px; color: #9ca2cb; margin-top: 2px; font-weight: 500; }}
    .ob-heading {{ font-size: 18px; font-weight: 700; color: #ffffff; margin-top: 16px; }}
    .ob-sub {{ font-size: 11px; color: #8e92ab; line-height: 15px; margin-top: 4px; padding: 0 10px; }}

    .ob-cards-row {{
      display: flex;
      gap: 10px;
      position: relative;
      z-index: 2;
      margin: 14px 0;
    }}
    .ob-card {{
      flex: 1;
      border-radius: 18px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 240px;
    }}
    .ob-card-dark {{
      background: #111218;
      border: 1.5px solid #3f4460;
      box-shadow: 0 4px 16px rgba(81, 93, 195, 0.25);
    }}
    .ob-card-light {{
      background: #f0f2f6;
      border: 1.5px solid #dde1ec;
    }}
    .card-radio {{
      align-self: flex-end;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 6px;
    }}
    .radio-dark-checked {{ background: #ffffff; color: #000; font-size: 11px; font-weight: 900; }}
    .radio-light-unchecked {{ border: 2px solid #c5c8d6; }}

    .mini-doc {{
      border-radius: 12px;
      padding: 8px;
      margin-bottom: 10px;
    }}
    .mini-doc-dark {{ background: #181922; border: 1px solid #282a38; }}
    .mini-doc-light {{ background: #ffffff; border: 1px solid #e5e7eb; }}
    .doc-icon {{ width: 20px; height: 20px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; margin-bottom: 6px; }}
    .doc-icon-dark {{ background: #242634; color: #fff; }}
    .doc-icon-light {{ background: #f3f4f6; color: #111; }}
    .skel-line {{ height: 3px; border-radius: 2px; margin-bottom: 4px; }}
    .mini-btn {{
      height: 20px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: 700;
      margin-top: 4px;
    }}
    .btn-dark-pri {{ background: #ffffff; color: #000000; }}
    .btn-dark-sec {{ border: 1px solid #333748; color: #9ca2cb; }}
    .btn-light-pri {{ background: #111827; color: #ffffff; }}
    .btn-light-sec {{ border: 1px solid #d1d5db; color: #374151; }}

    .card-title-dark {{ font-size: 13px; font-weight: 700; color: #ffffff; }}
    .card-desc-dark {{ font-size: 9.5px; color: #8c90a4; line-height: 13px; margin-top: 2px; }}
    .card-title-light {{ font-size: 13px; font-weight: 700; color: #111827; }}
    .card-desc-light {{ font-size: 9.5px; color: #606475; line-height: 13px; margin-top: 2px; }}

    .continue-btn {{
      width: 100%;
      height: 44px;
      border-radius: 22px;
      background: #24283b;
      border: 1px solid #343b56;
      color: #ffffff;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      position: relative;
      z-index: 2;
    }}
    .ob-footer {{ text-align: center; font-size: 10px; color: #6b7082; margin-top: 8px; position: relative; z-index: 2; }}

    /* Half-Middle Bottom Sheet Simulator */
    .sheet-sim {{
      width: 100%;
      height: 100%;
      position: relative;
      background: #030407;
      overflow: hidden;
    }}
    .sim-content-behind {{
      padding: 16px;
      filter: blur(8px);
      opacity: 0.35;
      user-select: none;
    }}
    .sim-scrim {{
      position: absolute;
      inset: 0;
      background: rgba(2, 3, 5, 0.76);
      backdrop-filter: blur(20px);
    }}
    .half-sheet {{
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 52%;
      border-top-left-radius: 26px;
      border-top-right-radius: 26px;
      overflow: hidden;
      border-top: 1.5px solid;
      box-shadow: 0 -12px 30px rgba(0,0,0,0.8);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 10px 18px 16px 18px;
    }}
    .drag-pill {{
      width: 36px;
      height: 3px;
      border-radius: 2px;
      background: rgba(255,255,255,0.3);
      margin: 0 auto 6px auto;
    }}
    .sheet-close {{
      position: absolute;
      top: 10px;
      right: 14px;
      color: #cbd5e1;
      font-size: 14px;
      font-weight: bold;
    }}
    .sheet-kicker {{ font-size: 9px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 2px; }}
    .sheet-title {{ font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px; margin-bottom: 4px; }}
    .sheet-desc {{ font-size: 10.5px; color: #e2e8f0; line-height: 15px; margin-bottom: 10px; max-width: 220px; }}
    .sheet-bullets {{ display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }}
    .bullet-row {{ display: flex; align-items: center; gap: 6px; font-size: 10px; color: #cbd5e1; }}
    .bullet-dot {{ width: 5px; height: 5px; border-radius: 50%; }}
    .sheet-cta {{
      width: 100%;
      height: 40px;
      border-radius: 20px;
      background: #ffffff;
      color: #000000;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.4);
    }}
  </style>
</head>
<body>
  <h1>Billframe 4.0 — Exact Sampled Palette & Half-Middle Sheet Proof</h1>
  <p class="lead">Side-by-side visual verification showing user target reference vs code implementation.</p>

  <!-- 1. Onboarding -->
  <div class="section-title">1. Onboarding Theme Selection (True Black #000000 + Luminous Nebula Glow)</div>
  <div class="comparison-grid">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">User Uploaded Target</span>
        <span class="badge badge-target">media_1791999524646_d4a0eb28.jpg</span>
      </div>
      <div class="phone-frame">
        <img class="phone-img" src="data:image/jpeg;base64,{onboarding_ref_b64}">
      </div>
    </div>
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">Reconstructed Implementation</span>
        <span class="badge badge-code">ThemeSelectionStep.tsx</span>
      </div>
      <div class="phone-frame">
        <div class="onboarding-screen">
          <div class="nebula-bg"></div>
          <div class="ob-header">
            <div class="ob-logo">Billframe</div>
            <div class="ob-tagline">Invoices made simple.</div>
            <div class="ob-heading">Choose your theme</div>
            <div class="ob-sub">Pick what feels right for you. You can always change it later in settings.</div>
          </div>
          <div class="ob-cards-row">
            <!-- Dark Card -->
            <div class="ob-card ob-card-dark">
              <div class="card-radio radio-dark-checked">✓</div>
              <div class="mini-doc mini-doc-dark">
                <div class="doc-icon doc-icon-dark">📄</div>
                <div class="skel-line" style="background:#4b5063; width:40px;"></div>
                <div class="skel-line" style="background:#333748; width:26px;"></div>
                <div class="mini-btn btn-dark-pri">Primary</div>
                <div class="mini-btn btn-dark-sec">Secondary</div>
              </div>
              <div>
                <div class="card-title-dark">Dark Theme</div>
                <div class="card-desc-dark">Clean contrast for dark environments.</div>
              </div>
            </div>
            <!-- Light Card -->
            <div class="ob-card ob-card-light">
              <div class="card-radio radio-light-unchecked"></div>
              <div class="mini-doc mini-doc-light">
                <div class="doc-icon doc-icon-light">📄</div>
                <div class="skel-line" style="background:#9ca3af; width:40px;"></div>
                <div class="skel-line" style="background:#d1d5db; width:26px;"></div>
                <div class="mini-btn btn-light-pri">Primary</div>
                <div class="mini-btn btn-light-sec">Secondary</div>
              </div>
              <div>
                <div class="card-title-light">Light Theme</div>
                <div class="card-desc-light">A bright, clean look for well-lit workspaces.</div>
              </div>
            </div>
          </div>
          <div>
            <div class="continue-btn">Continue &rarr;</div>
            <div class="ob-footer">You can change this later in settings.</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 2. Template Studio -->
  <div class="section-title">2. Template Studio — Half-Middle Bottom Sheet with Electric Cyan/Violet Plasma Stream</div>
  <div class="comparison-grid">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">User Uploaded Target</span>
        <span class="badge badge-target">media_1791999525663_3b399809.jpg</span>
      </div>
      <div class="phone-frame">
        <img class="phone-img" src="data:image/jpeg;base64,{studio_ref_b64}">
      </div>
    </div>
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">Reconstructed Half-Middle Sheet</span>
        <span class="badge badge-code">FeatureIntroductionSheet (template_studio)</span>
      </div>
      <div class="phone-frame">
        <div class="sheet-sim">
          <div class="sim-content-behind">
            <h2 style="font-size:16px;">Template Studio</h2>
            <div style="background:#13151f; height:80px; border-radius:8px; margin:8px 0;"></div>
            <div style="background:#13151f; height:80px; border-radius:8px; margin:8px 0;"></div>
          </div>
          <div class="sim-scrim"></div>
          <div class="half-sheet" style="background:#080C1E; border-color:#1E2540;">
            <!-- SVG Plasma Stream -->
            <svg style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none;" viewBox="0 0 320 330">
              <defs>
                <radialGradient id="sim_b_ts" cx="82%" cy="42%" rx="68%" ry="58%">
                  <stop offset="0%" stop-color="#4841C8" stop-opacity="0.8"/>
                  <stop offset="45%" stop-color="#77A2FF" stop-opacity="0.35"/>
                  <stop offset="100%" stop-color="#080C1E" stop-opacity="0"/>
                </radialGradient>
                <linearGradient id="sim_r_ts" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stop-color="#4841C8" stop-opacity="0.2"/>
                  <stop offset="50%" stop-color="#77A2FF" stop-opacity="0.85"/>
                  <stop offset="100%" stop-color="#D9F6FF" stop-opacity="1"/>
                </linearGradient>
              </defs>
              <rect width="320" height="330" fill="url(#sim_b_ts)"/>
              <path d="M 130 310 Q 200 240, 240 170 T 330 50" stroke="#4841C8" stroke-width="80" stroke-opacity="0.3" fill="none" stroke-linecap="round"/>
              <path d="M 130 310 Q 200 240, 240 170 T 330 50" stroke="url(#sim_r_ts)" stroke-width="36" stroke-opacity="0.75" fill="none" stroke-linecap="round"/>
              <path d="M 130 310 Q 200 240, 240 170 T 330 50" stroke="#D9F6FF" stroke-width="10" stroke-opacity="0.9" fill="none" stroke-linecap="round"/>
            </svg>
            <div style="position:relative; z-index:2;">
              <div class="drag-pill"></div>
              <div class="sheet-close">&times;</div>
              <div class="sheet-kicker" style="color:#939AFF;">FEATURE PREVIEW</div>
              <div class="sheet-title">Template Studio</div>
              <div class="sheet-desc">Design beautiful, professional documents with flexible visual templates.</div>
              <div class="sheet-bullets">
                <div class="bullet-row"><div class="bullet-dot" style="background:#939AFF;"></div>Custom branding & executive letterheads</div>
                <div class="bullet-row"><div class="bullet-dot" style="background:#939AFF;"></div>Rule 46 compliant layouts</div>
              </div>
            </div>
            <div style="position:relative; z-index:2;">
              <div class="sheet-cta">Explore Templates &rarr;</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 3. Clients -->
  <div class="section-title">3. Clients — Half-Middle Bottom Sheet with Neon Turquoise/Mint Stream</div>
  <div class="comparison-grid">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">User Uploaded Target</span>
        <span class="badge badge-target">media_1791999526640_6888eebf.jpg</span>
      </div>
      <div class="phone-frame">
        <img class="phone-img" src="data:image/jpeg;base64,{clients_ref_b64}">
      </div>
    </div>
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">Reconstructed Half-Middle Sheet</span>
        <span class="badge badge-code">FeatureIntroductionSheet (clients)</span>
      </div>
      <div class="phone-frame">
        <div class="sheet-sim">
          <div class="sim-content-behind">
            <h2 style="font-size:16px;">Clients</h2>
            <div style="background:#13151f; height:50px; border-radius:8px; margin:8px 0;"></div>
            <div style="background:#13151f; height:50px; border-radius:8px; margin:8px 0;"></div>
          </div>
          <div class="sim-scrim"></div>
          <div class="half-sheet" style="background:#061011; border-color:#102B2D;">
            <!-- SVG Plasma Stream -->
            <svg style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none;" viewBox="0 0 320 330">
              <defs>
                <radialGradient id="sim_b_cl" cx="82%" cy="42%" rx="68%" ry="58%">
                  <stop offset="0%" stop-color="#087F78" stop-opacity="0.8"/>
                  <stop offset="45%" stop-color="#79FFF3" stop-opacity="0.35"/>
                  <stop offset="100%" stop-color="#061011" stop-opacity="0"/>
                </radialGradient>
                <linearGradient id="sim_r_cl" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stop-color="#087F78" stop-opacity="0.2"/>
                  <stop offset="50%" stop-color="#79FFF3" stop-opacity="0.85"/>
                  <stop offset="100%" stop-color="#D4FFFF" stop-opacity="1"/>
                </linearGradient>
              </defs>
              <rect width="320" height="330" fill="url(#sim_b_cl)"/>
              <path d="M 130 310 Q 200 240, 240 170 T 330 50" stroke="#087F78" stroke-width="80" stroke-opacity="0.3" fill="none" stroke-linecap="round"/>
              <path d="M 130 310 Q 200 240, 240 170 T 330 50" stroke="url(#sim_r_cl)" stroke-width="36" stroke-opacity="0.75" fill="none" stroke-linecap="round"/>
              <path d="M 130 310 Q 200 240, 240 170 T 330 50" stroke="#D4FFFF" stroke-width="10" stroke-opacity="0.9" fill="none" stroke-linecap="round"/>
            </svg>
            <div style="position:relative; z-index:2;">
              <div class="drag-pill"></div>
              <div class="sheet-close">&times;</div>
              <div class="sheet-kicker" style="color:#79FFF3;">FEATURE PREVIEW</div>
              <div class="sheet-title">Clients</div>
              <div class="sheet-desc">Centralize your client contacts and invoice history.</div>
              <div class="sheet-bullets">
                <div class="bullet-row"><div class="bullet-dot" style="background:#79FFF3;"></div>Complete customer profiles with GSTIN</div>
                <div class="bullet-row"><div class="bullet-dot" style="background:#79FFF3;"></div>Outstanding balances & ledgers</div>
              </div>
            </div>
            <div style="position:relative; z-index:2;">
              <div class="sheet-cta">Add a Client &rarr;</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 4. Payments -->
  <div class="section-title">4. Payments & UPI — Half-Middle Bottom Sheet with Vibrant Cobalt/Indigo Stream</div>
  <div class="comparison-grid">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">User Uploaded Target</span>
        <span class="badge badge-target">media_1791999527664_ff14f4ee.jpg</span>
      </div>
      <div class="phone-frame">
        <img class="phone-img" src="data:image/jpeg;base64,{payments_ref_b64}">
      </div>
    </div>
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">Reconstructed Half-Middle Sheet</span>
        <span class="badge badge-code">FeatureIntroductionSheet (payments)</span>
      </div>
      <div class="phone-frame">
        <div class="sheet-sim">
          <div class="sim-content-behind">
            <h2 style="font-size:16px;">Payments & UPI</h2>
            <div style="background:#13151f; height:60px; border-radius:8px; margin:8px 0;"></div>
            <div style="background:#13151f; height:60px; border-radius:8px; margin:8px 0;"></div>
          </div>
          <div class="sim-scrim"></div>
          <div class="half-sheet" style="background:#080A1C; border-color:#1A2244;">
            <!-- SVG Plasma Stream -->
            <svg style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none;" viewBox="0 0 320 330">
              <defs>
                <radialGradient id="sim_b_pm" cx="82%" cy="42%" rx="68%" ry="58%">
                  <stop offset="0%" stop-color="#173C8C" stop-opacity="0.8"/>
                  <stop offset="45%" stop-color="#95A1FF" stop-opacity="0.35"/>
                  <stop offset="100%" stop-color="#080A1C" stop-opacity="0"/>
                </radialGradient>
                <linearGradient id="sim_r_pm" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stop-color="#173C8C" stop-opacity="0.2"/>
                  <stop offset="50%" stop-color="#95A1FF" stop-opacity="0.85"/>
                  <stop offset="100%" stop-color="#DAF8FF" stop-opacity="1"/>
                </linearGradient>
              </defs>
              <rect width="320" height="330" fill="url(#sim_b_pm)"/>
              <path d="M 130 310 Q 200 240, 240 170 T 330 50" stroke="#173C8C" stroke-width="80" stroke-opacity="0.3" fill="none" stroke-linecap="round"/>
              <path d="M 130 310 Q 200 240, 240 170 T 330 50" stroke="url(#sim_r_pm)" stroke-width="36" stroke-opacity="0.75" fill="none" stroke-linecap="round"/>
              <path d="M 130 310 Q 200 240, 240 170 T 330 50" stroke="#DAF8FF" stroke-width="10" stroke-opacity="0.9" fill="none" stroke-linecap="round"/>
            </svg>
            <div style="position:relative; z-index:2;">
              <div class="drag-pill"></div>
              <div class="sheet-close">&times;</div>
              <div class="sheet-kicker" style="color:#95A1FF;">FEATURE PREVIEW</div>
              <div class="sheet-title">Payments & UPI</div>
              <div class="sheet-desc">Set up direct UPI payments and track transaction statuses.</div>
              <div class="sheet-bullets">
                <div class="bullet-row"><div class="bullet-dot" style="background:#95A1FF;"></div>Direct UPI QR codes with zero fees</div>
                <div class="bullet-row"><div class="bullet-dot" style="background:#95A1FF;"></div>Bank reconciliation & cash logs</div>
              </div>
            </div>
            <div style="position:relative; z-index:2;">
              <div class="sheet-cta">Set Up UPI &rarr;</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 5. Documents -->
  <div class="section-title">5. Documents — Half-Middle Bottom Sheet with Sapphire/Violet Stream</div>
  <div class="comparison-grid">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">User Uploaded Target</span>
        <span class="badge badge-target">media_1791999528744_509e759f.jpg</span>
      </div>
      <div class="phone-frame">
        <img class="phone-img" src="data:image/jpeg;base64,{docs_ref_b64}">
      </div>
    </div>
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">Reconstructed Half-Middle Sheet</span>
        <span class="badge badge-code">FeatureIntroductionSheet (documents)</span>
      </div>
      <div class="phone-frame">
        <div class="sheet-sim">
          <div class="sim-content-behind">
            <h2 style="font-size:16px;">Documents</h2>
            <div style="background:#13151f; height:60px; border-radius:8px; margin:8px 0;"></div>
            <div style="background:#13151f; height:60px; border-radius:8px; margin:8px 0;"></div>
          </div>
          <div class="sim-scrim"></div>
          <div class="half-sheet" style="background:#090B18; border-color:#1C2346;">
            <!-- SVG Plasma Stream -->
            <svg style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none;" viewBox="0 0 320 330">
              <defs>
                <radialGradient id="sim_b_dc" cx="82%" cy="42%" rx="68%" ry="58%">
                  <stop offset="0%" stop-color="#234ED8" stop-opacity="0.8"/>
                  <stop offset="45%" stop-color="#69A1FF" stop-opacity="0.35"/>
                  <stop offset="100%" stop-color="#090B18" stop-opacity="0"/>
                </radialGradient>
                <linearGradient id="sim_r_dc" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stop-color="#234ED8" stop-opacity="0.2"/>
                  <stop offset="50%" stop-color="#69A1FF" stop-opacity="0.85"/>
                  <stop offset="100%" stop-color="#DAF0FF" stop-opacity="1"/>
                </linearGradient>
              </defs>
              <rect width="320" height="330" fill="url(#sim_b_dc)"/>
              <path d="M 130 310 Q 200 240, 240 170 T 330 50" stroke="#234ED8" stroke-width="80" stroke-opacity="0.3" fill="none" stroke-linecap="round"/>
              <path d="M 130 310 Q 200 240, 240 170 T 330 50" stroke="url(#sim_r_dc)" stroke-width="36" stroke-opacity="0.75" fill="none" stroke-linecap="round"/>
              <path d="M 130 310 Q 200 240, 240 170 T 330 50" stroke="#DAF0FF" stroke-width="10" stroke-opacity="0.9" fill="none" stroke-linecap="round"/>
            </svg>
            <div style="position:relative; z-index:2;">
              <div class="drag-pill"></div>
              <div class="sheet-close">&times;</div>
              <div class="sheet-kicker" style="color:#91ADFF;">FEATURE PREVIEW</div>
              <div class="sheet-title">Documents</div>
              <div class="sheet-desc">Create and customize invoices, receipts, quotes, and more.</div>
              <div class="sheet-bullets">
                <div class="bullet-row"><div class="bullet-dot" style="background:#91ADFF;"></div>29+ legal & commercial document types</div>
                <div class="bullet-row"><div class="bullet-dot" style="background:#91ADFF;"></div>100% offline generation with PDF export</div>
              </div>
            </div>
            <div style="position:relative; z-index:2;">
              <div class="sheet-cta">New Document &rarr;</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

</body>
</html>
"""

out_file = os.path.join(artifact_dir, "exact_palette_and_sheet_proof.html")
with open(out_file, "w", encoding="utf-8") as f:
    f.write(html_content)

print("Generated exact palette proof at:", out_file)
