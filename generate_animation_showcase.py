import os
import subprocess

artifact_dir = r"C:\Users\manis\.gemini\antigravity\brain\b7518e44-99c6-47f3-9b05-4526047e62da"
html_path = os.path.join(artifact_dir, "animations_and_processing_showcase.html")
png_path = os.path.join(artifact_dir, "animations_and_processing_showcase.png")

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Billframe 4.0 — Animation & Processing System Showcase</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #06080d;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 36px;
      line-height: 1.5;
    }
    h1 { font-size: 28px; font-weight: 800; margin-bottom: 6px; letter-spacing: -0.5px; }
    p.subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 32px; }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 28px;
      margin-bottom: 36px;
    }

    .card {
      background: #0d1019;
      border: 1px solid #1e2538;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 16px 36px rgba(0,0,0,0.6);
      position: relative;
      overflow: hidden;
    }
    .card-title {
      font-size: 16px;
      font-weight: 700;
      color: #f1f5f9;
      margin-bottom: 4px;
    }
    .card-desc {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 20px;
    }

    /* 1. Field with Animated Processing Icon */
    .field-wrap {
      margin-bottom: 16px;
    }
    .field-label {
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
      margin-bottom: 6px;
      display: block;
    }
    .input-box {
      height: 50px;
      border-radius: 12px;
      background: #141724;
      border: 1px solid #262e45;
      display: flex;
      align-items: center;
      padding: 0 14px;
      gap: 10px;
      transition: all 0.2s ease;
    }
    .input-box.focused {
      border-color: #818cf8;
      box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.2);
    }
    .input-box.success {
      border-color: #22c55e;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
    }
    .input-box.error {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
      animation: shake 0.4s ease;
    }
    .input-text {
      flex: 1;
      background: transparent;
      border: none;
      color: #f8fafc;
      font-size: 14px;
      outline: none;
    }
    .field-msg {
      font-size: 11px;
      margin-top: 5px;
      font-weight: 500;
    }
    .msg-proc { color: #818cf8; }
    .msg-succ { color: #22c55e; }
    .msg-err { color: #ef4444; }

    /* Animated Processing Spinner SVG */
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
    @keyframes spin-reverse {
      100% { transform: rotate(-360deg); }
    }
    @keyframes pulse-scale {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.08); }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-4px); }
      40%, 80% { transform: translateX(4px); }
    }
    @keyframes pop-check {
      0% { transform: scale(0); }
      70% { transform: scale(1.25); }
      100% { transform: scale(1); }
    }
    @keyframes shimmer-sweep {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    .spinner-svg {
      animation: spin 0.9s linear infinite;
    }
    .spinner-pulse {
      animation: pulse-scale 1.2s ease-in-out infinite;
    }
    .success-pop {
      animation: pop-check 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    /* 2. Executive Processing Modal Simulation */
    .exec-modal-preview {
      background: #0a0d16;
      border: 1.5px solid #20273d;
      border-radius: 20px;
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      box-shadow: 0 16px 36px rgba(0,0,0,0.8);
    }
    .orbital-container {
      width: 90px;
      height: 90px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .outer-orbital {
      position: absolute;
      width: 84px;
      height: 84px;
      animation: spin 1.4s linear infinite;
    }
    .inner-orbital {
      position: absolute;
      width: 60px;
      height: 60px;
      animation: spin-reverse 0.95s linear infinite;
    }
    .center-badge {
      width: 44px;
      height: 44px;
      border-radius: 22px;
      background: #141928;
      border: 1.5px solid #2c3552;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      animation: pulse-scale 1.4s ease-in-out infinite;
    }
    .modal-title { font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 4px; text-align: center; }
    .modal-sub { font-size: 11.5px; color: #94a3b8; margin-bottom: 16px; text-align: center; }
    .step-list { width: 100%; display: flex; flex-direction: column; gap: 8px; }
    .step-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
    }
    .step-dot {
      width: 16px;
      height: 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: 900;
    }
    .dot-done { background: #22c55e; color: #fff; }
    .dot-active { background: #818cf8; animation: spin 1s linear infinite; }
    .dot-pending { background: #1e2538; }

    /* 3. Shimmer Skeleton Rows */
    .skeleton-card {
      background: #0f121d;
      border: 1px solid #1e2436;
      border-radius: 14px;
      padding: 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
      position: relative;
      overflow: hidden;
    }
    .skel-box {
      background: #1a1e2e;
      position: relative;
      overflow: hidden;
      border-radius: 6px;
    }
    .skel-box::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(129, 140, 248, 0.15), transparent);
      animation: shimmer-sweep 1.25s infinite;
    }

    /* 4. Spring Button Simulation */
    .spring-btn {
      width: 100%;
      height: 50px;
      border-radius: 25px;
      background: #ffffff;
      color: #000000;
      font-size: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      border: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .spring-btn:hover {
      transform: scale(0.98);
    }
  </style>
</head>
<body>
  <h1>Billframe 4.0 — Animation & Processing System</h1>
  <p class="subtitle">Complete micro-interaction and processing feedback suite with 60fps animations across input fields, orbital loaders, skeleton shimmers, and bottom sheets.</p>

  <div class="grid">
    <!-- Panel 1: Field Micro-Animations & Processing Icons -->
    <div class="card">
      <div class="card-title">1. Form Field Processing & Validation Icons</div>
      <div class="card-desc">Interactive states: Idle, Real-time Processing spinner, Verified checkmark pop, and Error shake.</div>

      <!-- State: Processing -->
      <div class="field-wrap">
        <label class="field-label">GSTIN (Live Verification)</label>
        <div class="input-box focused">
          <span style="font-size:14px; color:#818cf8;">🏢</span>
          <input class="input-text" value="27AABCU9603R1ZM" readonly>
          <!-- Processing Spinner -->
          <div class="spinner-pulse">
            <svg class="spinner-svg" width="20" height="20" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8" stroke="rgba(255,255,255,0.12)" stroke-width="2.5" fill="none"/>
              <circle cx="10" cy="10" r="8" stroke="#818cf8" stroke-width="2.5" stroke-dasharray="50" stroke-dashoffset="18" stroke-linecap="round" fill="none"/>
            </svg>
          </div>
        </div>
        <div class="field-msg msg-proc">⚡ Verifying GSTIN against CBIC portal...</div>
      </div>

      <!-- State: Success Verified -->
      <div class="field-wrap">
        <label class="field-label">IFSC Code (Validated)</label>
        <div class="input-box success">
          <span style="font-size:14px; color:#22c55e;">🏦</span>
          <input class="input-text" value="HDFC0000060" readonly>
          <div class="success-pop" style="width:20px; height:20px; border-radius:10px; background:rgba(34,197,94,0.15); border:1.5px solid #22c55e; display:flex; align-items:center; justify-content:center; color:#22c55e; font-size:12px; font-weight:bold;">✓</div>
        </div>
        <div class="field-msg msg-succ">✓ HDFC Bank, Fort Branch verified</div>
      </div>

      <!-- State: Error Shake -->
      <div class="field-wrap">
        <label class="field-label">PAN Number (Format Error)</label>
        <div class="input-box error">
          <span style="font-size:14px; color:#ef4444;">🪪</span>
          <input class="input-text" value="ABCDE123" readonly>
          <div style="width:20px; height:20px; border-radius:10px; background:rgba(239,68,68,0.15); border:1.5px solid #ef4444; display:flex; align-items:center; justify-content:center; color:#ef4444; font-size:11px; font-weight:bold;">!</div>
        </div>
        <div class="field-msg msg-err">⚠ Invalid PAN: Must be 10 alphanumeric characters</div>
      </div>
    </div>

    <!-- Panel 2: Executive Document Processing Modal -->
    <div class="card">
      <div class="card-title">2. Executive Processing Modal (Dual Orbital Rings)</div>
      <div class="card-desc">Concentric counter-rotating rings with live progressive step checklist.</div>

      <div class="exec-modal-preview">
        <!-- Orbital Rings -->
        <div class="orbital-container">
          <!-- Outer clockwise -->
          <svg class="outer-orbital" viewBox="0 0 84 84">
            <circle cx="42" cy="42" r="38" stroke="rgba(255,255,255,0.08)" stroke-width="3" fill="none"/>
            <circle cx="42" cy="42" r="38" stroke="#818cf8" stroke-width="3.5" stroke-dasharray="240" stroke-dashoffset="95" stroke-linecap="round" fill="none"/>
          </svg>
          <!-- Inner counter-clockwise -->
          <svg class="inner-orbital" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="26" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="160" stroke-dashoffset="75" stroke-linecap="round" fill="none"/>
          </svg>
          <div class="center-badge">📄</div>
        </div>

        <div class="modal-title">Finalizing Tax Invoice</div>
        <div class="modal-sub">Generating cryptographic hash & compiling Rule 46 PDF</div>

        <div class="step-list">
          <div class="step-item">
            <div class="step-dot dot-done">✓</div>
            <span style="color:#e2e8f0;">Validating GST taxable values & HSN codes</span>
          </div>
          <div class="step-item">
            <div class="step-dot dot-done">✓</div>
            <span style="color:#e2e8f0;">Recording immutable audit ledger hash</span>
          </div>
          <div class="step-item">
            <div class="step-dot dot-active"></div>
            <span style="color:#ffffff; font-weight:700;">Compiling print-fidelity PDF layout...</span>
          </div>
          <div class="step-item" style="opacity:0.4;">
            <div class="step-dot dot-pending"></div>
            <span style="color:#94a3b8;">Attaching UPI payment QR code</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel 3: Shimmer Skeleton & Button Press Micro-Interactions -->
    <div class="card">
      <div class="card-title">3. Shimmer Skeletons & Action Button Loaders</div>
      <div class="card-desc">Continuous gradient sweep skeletons and spring press action buttons.</div>

      <!-- Skeleton Row 1 -->
      <div class="skeleton-card">
        <div class="skel-box" style="width:38px; height:38px; border-radius:10px;"></div>
        <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
          <div class="skel-box" style="width:65%; height:14px;"></div>
          <div class="skel-box" style="width:40%; height:10px;"></div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
          <div class="skel-box" style="width:55px; height:14px;"></div>
          <div class="skel-box" style="width:35px; height:10px;"></div>
        </div>
      </div>

      <!-- Skeleton Row 2 -->
      <div class="skeleton-card">
        <div class="skel-box" style="width:38px; height:38px; border-radius:10px;"></div>
        <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
          <div class="skel-box" style="width:50%; height:14px;"></div>
          <div class="skel-box" style="width:30%; height:10px;"></div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
          <div class="skel-box" style="width:60px; height:14px;"></div>
          <div class="skel-box" style="width:40px; height:10px;"></div>
        </div>
      </div>

      <div style="margin-top:20px;">
        <button class="spring-btn">
          <svg class="spinner-svg" width="18" height="18" viewBox="0 0 18 18">
            <circle cx="9" cy="9" r="7" stroke="#111" stroke-width="2.5" stroke-dasharray="44" stroke-dashoffset="15" stroke-linecap="round" fill="none"/>
          </svg>
          Processing Document...
        </button>
      </div>
    </div>
  </div>
</body>
</html>
"""

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print("Saved showcase HTML to:", html_path)

browser = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
cmd = [
    browser,
    "--headless",
    "--disable-gpu",
    "--window-size=1200,900",
    "--screenshot=" + png_path,
    html_path
]
subprocess.run(cmd, check=True)
print("Saved screenshot to:", png_path)
