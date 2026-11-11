import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

mkdirSync('D:\\naya\\frontend\\public\\og', { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(`<!doctype html>
<html><head><meta charset="utf-8"><style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;1,500&family=Manrope:wght@400;600&display=swap');
* { box-sizing: border-box; }
body { margin:0; width:1200px; height:630px; background:#09060F; color:#F8F2F6; overflow:hidden; font-family:Manrope,Arial,sans-serif; }
.frame { position:relative; width:100%; height:100%; background: radial-gradient(circle at 78% 38%, rgba(110,53,164,.28), transparent 40%), radial-gradient(circle at 18% 80%, rgba(87,26,55,.38), transparent 45%), #09060F; }
.noise { position:absolute; inset:0; opacity:.04; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
.ring { position:absolute; border:1px solid rgba(201,167,245,.16); border-radius:999px; }
.r1 { width:490px; height:490px; right:48px; top:70px; }
.r2 { width:380px; height:380px; right:103px; top:125px; border-color:rgba(232,160,183,.14); }
.r3 { width:260px; height:260px; right:163px; top:185px; border-color:rgba(201,167,245,.12); }
.orb { position:absolute; width:190px; height:190px; right:198px; top:220px; border-radius:44% 56% 48% 52% / 55% 42% 58% 45%; background:linear-gradient(145deg,#E8A0B7 0%,#6E35A4 46%,#571A37 100%); transform:rotate(38deg); box-shadow:0 0 100px rgba(110,53,164,.45); }
.glow { position:absolute; width:300px; height:300px; right:140px; top:170px; border-radius:999px; background:rgba(110,53,164,.18); filter:blur(55px); }
.mark { position:absolute; left:72px; top:62px; display:flex; align-items:center; gap:14px; }
.logo { width:40px; height:40px; border:1px solid rgba(201,167,245,.35); border-radius:12px; display:grid; place-items:center; font-family:Georgia,serif; font-size:20px; color:#C9A7F5; }
.wordmark { font-family:Georgia,serif; font-size:25px; letter-spacing:.02em; }
.tag { display:block; margin-top:4px; font-size:8px; letter-spacing:.32em; text-transform:uppercase; color:#A78BA8; }
.copy { position:absolute; left:72px; bottom:78px; max-width:640px; }
.eyebrow { display:flex; align-items:center; gap:12px; color:#E8A0B7; text-transform:uppercase; letter-spacing:.24em; font-size:10px; font-weight:600; }
.eyebrow:before { content:''; width:30px; height:1px; background:rgba(232,160,183,.7); }
h1 { margin:24px 0 0; font-family:'Playfair Display',Georgia,serif; font-weight:500; font-size:78px; line-height:.96; letter-spacing:-.04em; }
h1 em { color:#E8A0B7; font-weight:500; }
p { margin:20px 0 0; font-size:14px; letter-spacing:.02em; color:#A78BA8; }
.rule { position:absolute; left:72px; bottom:50px; width:1056px; height:1px; background:rgba(255,255,255,.09); }
.foot { position:absolute; left:72px; bottom:28px; font-size:9px; letter-spacing:.18em; text-transform:uppercase; color:rgba(167,139,168,.65); }
.demo { position:absolute; right:72px; bottom:28px; font-size:9px; letter-spacing:.18em; text-transform:uppercase; color:rgba(201,167,245,.75); }
</style></head>
<body><div class="frame">
  <div class="noise"></div>
  <div class="glow"></div><div class="ring r1"></div><div class="ring r2"></div><div class="ring r3"></div>
  <div class="orb"></div>
  <div class="mark"><div class="logo">N</div><div><div class="wordmark">Nayacura</div><span class="tag">Private care</span></div></div>
  <div class="copy">
    <div class="eyebrow">Confidential sexual wellness & relationship care</div>
    <h1>Your wellness.<br>Your confidence.<br><em>Your private space.</em></h1>
    <p>Qualified specialist pathways · secure video or in person · consent-first care</p>
  </div>
  <div class="rule"></div>
  <div class="foot">Nayacura · Development demo</div>
  <div class="demo">Adults 18+</div>
</div></body></html>`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.screenshot({ path: 'D:\\naya\\frontend\\public\\og\\nayacura-og.png' });
await browser.close();
console.log('Wrote OG image.');
