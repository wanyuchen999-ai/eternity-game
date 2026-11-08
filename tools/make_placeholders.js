/* ============================================================
 * 《午夜档案》占位素材生成器（开发辅助工具，非游戏运行必需）
 * 运行：node tools/make_placeholders.js
 * 产出：
 *   assets/images/case01/*.svg   12 张 CCTV 风格占位监控图（4 摄像头 × 3 时间点）
 *   assets/audio/*.wav           6 个占位音效
 * 正式素材就绪后，直接替换文件并在 js/levels.js 中改图片路径即可。
 * ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const IMG_DIR = path.join(ROOT, "assets", "images", "case01");
const WAV_DIR = path.join(ROOT, "assets", "audio");
fs.mkdirSync(IMG_DIR, { recursive: true });
fs.mkdirSync(WAV_DIR, { recursive: true });

/* ---------- 确定性伪随机（保证每次生成结果一致） ---------- */
function rng(seed){
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/* ============================================================
 * 画面尺寸 800 × 450（16:9）
 * 线索闪烁点（仅 22:24 出现，与 levels.js 中线索坐标对应）：
 *   CAM01 (240,315)=30%,70%   CAM02 (540,268)=68%,60%
 *   CAM03 (352,352)=44%,78%   CAM04 (502,327)=63%,73%
 * ============================================================ */
const CLUE_SPOTS = {
  CAM01: [240, 315],
  CAM02: [540, 268],
  CAM03: [352, 352],
  CAM04: [502, 327],
};

/* ---------- 通用部件 ---------- */
function windows(x, y, cols, rows, w, h, gx, gy, lit, seed){
  const r = rng(seed);
  let s = "";
  for (let i = 0; i < cols; i++){
    for (let j = 0; j < rows; j++){
      const wx = x + i * (w + gx), wy = y + j * (h + gy);
      const on = r() < lit;
      s += '<rect x="' + wx.toFixed(1) + '" y="' + wy.toFixed(1) + '" width="' + w + '" height="' + h +
        '" fill="' + (on ? "#cde8cf" : "#0a0f0b") + '" opacity="' + (on ? (0.10 + r() * 0.13).toFixed(2) : "1") +
        '" stroke="#1c261e" stroke-width="1"/>';
    }
  }
  return s;
}

/* 简笔人物剪影：x=水平位置 baseY=脚底 h=身高 arm=手臂姿势 */
function person(x, baseY, h, opts){
  opts = opts || {};
  const s = h / 76;
  let arm = "";
  if (opts.arm === "forward"){
    arm = '<path d="M ' + (8 * s) + ' ' + (-58 * s) + ' L ' + (26 * s) + ' ' + (-48 * s) +
      '" stroke="#3d5748" stroke-width="' + (3.2 * s).toFixed(1) + '" fill="none" stroke-linecap="round"/>';
  } else if (opts.arm === "upL"){
    arm = '<path d="M ' + (-6 * s) + ' ' + (-52 * s) + ' L ' + (-22 * s) + ' ' + (-64 * s) +
      '" stroke="#3d5748" stroke-width="' + (3.2 * s).toFixed(1) + '" fill="none" stroke-linecap="round"/>';
  }
  return '<g transform="translate(' + x + ',' + baseY + ')">' +
    '<ellipse cx="0" cy="2" rx="' + (16 * s).toFixed(1) + '" ry="' + (4 * s).toFixed(1) + '" fill="#000" opacity="0.45"/>' +
    '<circle cx="0" cy="' + (-68 * s).toFixed(1) + '" r="' + (8.5 * s).toFixed(1) + '" fill="#0d1510" stroke="#3d5748" stroke-width="1.2"/>' +
    '<path d="M ' + (-9 * s).toFixed(1) + ' ' + (-58 * s).toFixed(1) + ' h ' + (18 * s).toFixed(1) +
      ' l ' + (3 * s).toFixed(1) + ' ' + (34 * s).toFixed(1) + ' h ' + (-24 * s).toFixed(1) +
      ' Z" fill="#0d1510" stroke="#3d5748" stroke-width="1.2"/>' +
    '<path d="M ' + (-7 * s).toFixed(1) + ' ' + (-24 * s).toFixed(1) + ' L ' + (-9 * s).toFixed(1) +
      ' 0 M ' + (7 * s).toFixed(1) + ' ' + (-24 * s).toFixed(1) + ' L ' + (9 * s).toFixed(1) +
      ' 0" stroke="#0d1510" stroke-width="' + (5 * s).toFixed(1) + '" stroke-linecap="round" fill="none"/>' +
    arm + '</g>';
}

function lamp(x, topY, baseY){
  return '<g><line x1="' + x + '" y1="' + topY + '" x2="' + x + '" y2="' + baseY + '" stroke="#2a3a30" stroke-width="4"/>' +
    '<path d="M ' + (x - 12) + ' ' + topY + ' h 24" stroke="#2a3a30" stroke-width="4"/>' +
    '<circle cx="' + x + '" cy="' + (topY + 7) + '" r="4" fill="#cde8cf" opacity="0.7"/>' +
    '<polygon points="' + (x - 14) + ',' + (topY + 9) + ' ' + (x + 14) + ',' + (topY + 9) + ' ' + (x + 80) + ',' + baseY + ' ' + (x - 80) + ',' + baseY + '" fill="#cde8cf" opacity="0.045"/></g>';
}

function lockPlate(x, y, open){
  const shackle = '<path d="M ' + (x - 5) + ' ' + (y - 6) + ' v -6 a 5 5 0 0 1 10 0 v 6" fill="none" stroke="#8fa79a" stroke-width="2.4"/>';
  return '<g><rect x="' + (x - 9) + '" y="' + (y - 6) + '" width="18" height="16" rx="2" fill="#232d24" stroke="#5a6f60" stroke-width="1.4"/>' +
    (open ? '<g transform="rotate(34 ' + (x - 5) + ' ' + (y - 6) + ')">' + shackle + '</g>' : shackle) +
    '<circle cx="' + x + '" cy="' + (y + 2) + '" r="1.8" fill="#8fa79a"/></g>';
}

function badge(x, y){
  return '<g transform="translate(' + x + ',' + y + ') rotate(14)">' +
    '<path d="M -7 -10 L -12 -17" stroke="#8fa79a" stroke-width="1.5"/>' +
    '<rect x="-7" y="-10" width="14" height="20" rx="3" fill="#cfd8cf" opacity="0.9"/>' +
    '<rect x="-5" y="-6" width="10" height="7" fill="#5b6e60" opacity="0.8"/>' +
    '<path d="M -2 -8 L 2 -2 M 2 -8 L -2 -2" stroke="#ffffff" opacity="0.7" stroke-width="1"/></g>';
}

function ribbon(x, y){
  return '<path d="M ' + (x - 5) + ' ' + y + ' q 5 -7 10 0 q -5 7 -10 0" fill="#d9c08c" opacity="0.85"/>' +
    '<path d="M ' + (x + 5) + ' ' + y + ' l 6 -3" stroke="#d9c08c" stroke-width="1.6" opacity="0.7"/>';
}

function phoneAt(x, y){
  return '<g><rect x="' + (x - 6) + '" y="' + (y - 10) + '" width="12" height="20" rx="2" fill="#0a0d0a" stroke="#4a5c55" stroke-width="1.2"/>' +
    '<rect x="' + (x - 4) + '" y="' + (y - 8) + '" width="8" height="16" fill="#141c15"/></g>';
}

/* 线索位置的微弱闪烁光圈（仅 22:24，帮助试玩时定位；正式图片可忽略） */
function shimmer(x, y){
  return '<g><circle cx="' + x + '" cy="' + y + '" r="13" fill="none" stroke="#d9c08c" stroke-width="1.5" opacity="0.35">' +
    '<animate attributeName="r" values="11;19;11" dur="2.2s" repeatCount="indefinite"/>' +
    '<animate attributeName="opacity" values="0.4;0.08;0.4" dur="2.2s" repeatCount="indefinite"/></circle>' +
    '<circle cx="' + x + '" cy="' + y + '" r="2.5" fill="#e8d8a8" opacity="0.5"/></g>';
}

function rain(op){
  function drop(seed){
    const r = rng(seed);
    let s = "";
    for (let i = 0; i < 46; i++){
      const x = r() * 840 - 20, y = r() * 470 - 30, l = 14 + r() * 14;
      s += '<line x1="' + x.toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + (x - 6).toFixed(1) + '" y2="' + (y + l).toFixed(1) +
        '" stroke="#aebfb2" stroke-width="1" opacity="' + (0.25 + r() * 0.45).toFixed(2) + '"/>';
    }
    return s;
  }
  return '<g opacity="' + op + '">' +
    '<g><animateTransform attributeName="transform" type="translate" from="0 -40" to="0 40" dur="0.7s" repeatCount="indefinite"/>' + drop(7) + '</g>' +
    '<g><animateTransform attributeName="transform" type="translate" from="0 -70" to="0 50" dur="1.1s" repeatCount="indefinite"/>' + drop(13) + '</g></g>';
}

function sheen(){
  return '<g fill="#cfe6d4">' +
    '<rect x="60" y="392" width="230" height="3" opacity="0.05"/>' +
    '<rect x="430" y="408" width="280" height="3" opacity="0.045"/>' +
    '<rect x="240" y="356" width="180" height="2" opacity="0.04"/></g>';
}

/* ---------- 四路摄像头的场景草图 ---------- */
function sceneCAM01(t){
  let s = '<rect x="0" y="0" width="800" height="450" fill="url(#sky)"/>';
  s += '<g fill="#0e150f" stroke="#33473a" stroke-width="1"><rect x="0" y="36" width="330" height="176"/><rect x="470" y="56" width="330" height="156"/></g>';
  s += windows(18, 52, 5, 3, 34, 26, 22, 18, 0.35, 101);
  s += windows(492, 72, 5, 3, 34, 26, 22, 18, 0.30, 102);
  s += '<g fill="#0e150f" stroke="#33473a" stroke-width="1"><rect x="350" y="96" width="100" height="116"/></g>';
  s += windows(360, 108, 2, 3, 26, 22, 20, 16, 0.4, 103);
  s += '<rect x="500" y="150" width="180" height="60" fill="#0b110d" stroke="#33473a"/>' +
    '<text x="590" y="188" text-anchor="middle" font-size="20" letter-spacing="6" fill="#d9c08c" opacity="0.85" font-family="SimSun,serif">恒丰珠宝</text>';
  s += '<rect x="0" y="270" width="800" height="180" fill="#090e0b"/>';
  s += '<polygon points="330,270 470,270 520,450 280,450" fill="#070b09"/>';
  s += '<line x1="0" y1="352" x2="800" y2="352" stroke="#748b7d" stroke-width="2" stroke-dasharray="26 20" opacity="0.4"/>';
  for (let i = 0; i < 5; i++) s += '<rect x="' + (300 + i * 40) + '" y="286" width="24" height="46" fill="#6f8578" opacity="0.28"/>';
  s += lamp(120, 120, 300) + lamp(690, 100, 300);
  s += '<g transform="translate(528,240)"><rect x="-6" y="-28" width="12" height="32" rx="2" fill="#10160f" stroke="#33473a"/>' +
    '<circle cx="0" cy="-19" r="3.5" fill="#b4604f" opacity="0.9"/><circle cx="0" cy="-9" r="3.5" fill="#7fae8b" opacity="0.25"/></g>';
  s += sheen();
  if (t === "22:24") s += person(230, 372, 96) + ribbon(238, 314);
  if (t === "22:36") s += person(560, 380, 70);   // 案发后远处路人
  return s;
}

function sceneCAM02(t){
  let s = '<rect x="0" y="0" width="800" height="450" fill="url(#sky)"/>';
  s += '<rect x="40" y="70" width="720" height="330" fill="#0e150f" stroke="#33473a" stroke-width="1.2"/>';
  s += '<rect x="40" y="70" width="720" height="56" fill="#0b110d" stroke="#33473a"/>' +
    '<text x="380" y="108" text-anchor="middle" font-size="26" letter-spacing="14" fill="#d9c08c" opacity="0.9" font-family="SimSun,serif">恒 丰 珠 宝</text>' +
    '<text x="700" y="104" text-anchor="middle" font-size="11" fill="#6f7d83">HENG FENG JEWELRY</text>';
  s += '<rect x="80" y="150" width="360" height="210" fill="#0b110d" stroke="#33473a" stroke-width="1.6"/>' +
    '<line x1="260" y1="150" x2="260" y2="360" stroke="#33473a" stroke-width="1.2"/>' +
    '<line x1="80" y1="255" x2="440" y2="255" stroke="#33473a" stroke-width="1.2"/>' +
    '<line x1="130" y1="170" x2="250" y2="340" stroke="#cde8cf" opacity="0.05" stroke-width="18"/>';
  [[140, 320], [260, 320], [380, 320]].forEach(function (p){
    s += '<rect x="' + (p[0] - 16) + '" y="' + (p[1] - 26) + '" width="32" height="26" fill="#101812" stroke="#3d5748"/>' +
      '<circle cx="' + p[0] + '" cy="' + (p[1] - 32) + '" r="4.5" fill="#9fd6a4" opacity="0.75"/>';
  });
  s += '<rect x="490" y="150" width="150" height="250" fill="#0b110d" stroke="#33473a" stroke-width="1.6"/>' +
    '<rect x="502" y="166" width="126" height="216" fill="#0d1410" stroke="#3d5748"/>' +
    '<line x1="565" y1="166" x2="565" y2="382" stroke="#3d5748" stroke-width="1.2"/>';
  if (t === "22:36") s += '<line x1="638" y1="170" x2="638" y2="380" stroke="#cde8cf" stroke-width="2" opacity="0.28"/>';  // 门微开
  s += lockPlate(540, 268, t === "22:24");
  s += '<rect x="470" y="400" width="190" height="12" fill="#0c110d" stroke="#2a3a30"/>' +
    '<rect x="455" y="412" width="220" height="14" fill="#0a0f0b" stroke="#2a3a30"/>';
  if (t === "22:24") s += person(566, 396, 92, { arm: "upL" });   // 陈淼锁门
  return s;
}

function sceneCAM03(t){
  let s = '<rect x="0" y="0" width="800" height="450" fill="url(#sky)"/>';
  s += '<polygon points="0,0 300,110 300,410 0,450" fill="#0d130f" stroke="#2a3a30"/>' +
    '<polygon points="800,0 540,130 540,390 800,450" fill="#0c120e" stroke="#2a3a30"/>' +
    '<polygon points="300,110 540,130 540,390 300,410" fill="#0a0f0c"/>' +
    '<polygon points="0,450 300,410 540,390 800,450" fill="#090e0b"/>';
  s += '<line x1="96" y1="70" x2="96" y2="368" stroke="#3d5748" stroke-width="4" opacity="0.6"/>' +
    '<line x1="84" y1="150" x2="108" y2="150" stroke="#3d5748" stroke-width="3" opacity="0.6"/>' +
    '<line x1="84" y1="280" x2="108" y2="280" stroke="#3d5748" stroke-width="3" opacity="0.6"/>';
  s += '<g transform="translate(430,300)"><rect x="0" y="0" width="96" height="86" rx="4" fill="#111b13" stroke="#3d5748" stroke-width="1.4"/>' +
    '<rect x="-6" y="-10" width="108" height="14" rx="3" fill="#16221a" stroke="#3d5748"/>' +
    '<path d="M 14 20 h 68 M 14 44 h 68" stroke="#22301f" stroke-width="3"/></g>';
  s += '<g fill="#131b12" stroke="#3d5748"><rect x="560" y="330" width="52" height="48"/><rect x="580" y="292" width="40" height="40"/></g>';
  if (t === "22:24"){ s += person(400, 340, 42) + badge(352, 352); }
  s += sheen();
  return s;
}

function sceneCAM04(t){
  let s = '<rect x="0" y="0" width="800" height="450" fill="url(#sky)"/>';
  s += '<rect x="0" y="40" width="800" height="150" fill="#0d130f" stroke="#2a3a30"/>';
  s += windows(24, 60, 9, 2, 40, 30, 34, 28, 0.25, 104);
  s += '<rect x="0" y="360" width="800" height="90" fill="#0a0f0c"/>' +
    '<line x1="0" y1="360" x2="800" y2="360" stroke="#2a3a30"/>';
  for (let i = 0; i < 4; i++) s += '<line x1="' + (80 + i * 180) + '" y1="360" x2="' + (40 + i * 180) + '" y2="450" stroke="#182219" stroke-width="1.5"/>';
  s += '<g transform="translate(70,86)"><rect x="0" y="0" width="110" height="46" fill="#101812" stroke="#3d5748"/>' +
    '<text x="55" y="30" text-anchor="middle" font-size="16" fill="#9fb8a8" font-family="SimSun,serif">公交站台</text></g>' +
    '<line x1="90" y1="132" x2="90" y2="360" stroke="#3d5748" stroke-width="4"/>';
  s += '<rect x="130" y="120" width="560" height="14" fill="#111a13" stroke="#3d5748"/>' +
    '<line x1="160" y1="134" x2="160" y2="360" stroke="#3d5748" stroke-width="5"/>' +
    '<line x1="660" y1="134" x2="660" y2="360" stroke="#3d5748" stroke-width="5"/>' +
    '<rect x="180" y="150" width="460" height="180" fill="#0c1410" opacity="0.5" stroke="#22301f"/>';
  s += '<rect x="250" y="316" width="190" height="10" fill="#131b12" stroke="#3d5748"/>' +
    '<rect x="258" y="326" width="8" height="34" fill="#131b12"/>' +
    '<rect x="424" y="326" width="8" height="34" fill="#131b12"/>';
  if (t !== "22:12"){
    s += person(464, 392, 100, { arm: "forward" });
    s += phoneAt(502, 327);
  }
  s += sheen();
  return s;
}

const SCENES = { CAM01: sceneCAM01, CAM02: sceneCAM02, CAM03: sceneCAM03, CAM04: sceneCAM04 };

/* ---------- 整帧包装（CCTV 角标 / 扫描线 / 噪点 / 雨幕） ---------- */
function frameSVG(cam, camName, time, sceneInner){
  const rainOp = time === "22:12" ? 0.28 : (time === "22:24" ? 0.45 : 0.34);
  let s = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" font-family="Consolas,&quot;Courier New&quot;,monospace">' +
    '<defs>' +
    '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1511"/><stop offset="1" stop-color="#080d0a"/></linearGradient>' +
    '<radialGradient id="vig" cx="50%" cy="46%" r="72%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.5"/></radialGradient>' +
    '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>' +
    '<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="2.2" fill="#000" opacity="0.16"/></pattern>' +
    '</defs>' +
    '<rect width="800" height="450" fill="#080d0a"/>' +
    sceneInner +
    rain(rainOp) +
    '<rect width="800" height="450" fill="url(#scan)"/>' +
    '<rect width="800" height="450" filter="url(#n)" opacity="0.06">' +
    '<animate attributeName="opacity" values="0.05;0.09;0.04;0.07;0.05" dur="0.9s" repeatCount="indefinite"/></rect>' +
    '<rect width="800" height="450" fill="url(#vig)"/>' +
    '<text x="22" y="40" font-size="21" fill="#cfe6d4" opacity="0.92" letter-spacing="1">' + cam + ' ' + camName + '</text>' +
    '<text x="778" y="424" text-anchor="end" font-size="24" fill="#cfe6d4" opacity="0.92" letter-spacing="1">10-17 ' + time + ':07</text>' +
    '<text x="22" y="424" font-size="12" fill="#8fae98" opacity="0.6" letter-spacing="1">PLACEHOLDER · 占位素材（请在 js/levels.js 中替换为你的监控图）</text>' +
    '</svg>';
  return s;
}

/* ---------- 生成 12 张监控占位图 ---------- */
const CAMS = [
  ["CAM01", "十字路口全景"],
  ["CAM02", "珠宝店正门"],
  ["CAM03", "侧门小巷"],
  ["CAM04", "公交站台"],
];
const TIMES = ["22:12", "22:24", "22:36"];
let count = 0;
CAMS.forEach(function (cam){
  TIMES.forEach(function (time){
    const scene = SCENES[cam[0]](time);
    const inner = time === "22:24" ? scene + shimmer(CLUE_SPOTS[cam[0]][0], CLUE_SPOTS[cam[0]][1]) : scene;
    const file = cam[0].toLowerCase() + "_" + time.replace(":", "") + ".svg";
    fs.writeFileSync(path.join(IMG_DIR, file), frameSVG(cam[0], cam[1], time, inner));
    count++;
  });
});
console.log("[OK] 监控占位图 × " + count + " → " + path.relative(ROOT, IMG_DIR));

/* ============================================================
 * 占位音效（22050Hz / 16bit / 单声道 WAV）
 * ============================================================ */
function wavFile(name, dur, fn){
  const sr = 22050, n = Math.round(dur * sr);
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++){
    const t = i / sr;
    let v = Math.max(-1, Math.min(1, fn(t)));
    buf.writeInt16LE(Math.round(v * 32000), 44 + i * 2);
  }
  fs.writeFileSync(path.join(WAV_DIR, name), buf);
}
const sin = (f, t) => Math.sin(2 * Math.PI * f * t);
wavFile("click.wav",       0.05, t => sin(1100, t) * Math.exp(-t * 120) * 0.7);
wavFile("switch_cam.wav",  0.09, t => sin(1500 - 6000 * t, t) * Math.exp(-t * 45) * 0.6);
wavFile("switch_time.wav", 0.09, t => sin(880 - 3000 * t, t) * Math.exp(-t * 45) * 0.6);
wavFile("clue_found.wav",  0.26, t => t < 0.11
  ? sin(880, t) * Math.exp(-t * 18) * 0.55
  : sin(1318, t) * Math.exp(-(t - 0.11) * 16) * 0.6);
wavFile("panel.wav",       0.05, t => sin(520, t) * Math.exp(-t * 90) * 0.45);
wavFile("reveal.wav",      0.50, t => {
  const k = t < 0.14 ? 523.25 : (t < 0.28 ? 659.25 : 783.99);
  const lt = t < 0.14 ? t : (t < 0.28 ? t - 0.14 : t - 0.28);
  return (sin(k, t) * 0.5 + sin(k * 2, t) * 0.12) * Math.exp(-lt * 7) * 0.7;
});
console.log("[OK] 占位音效 × 6 → " + path.relative(ROOT, WAV_DIR));

/* ============================================================
 * 首页 / 结算页氛围背景（占位，可替换）
 * 雨夜街口：虚化楼影 + 光斑 + 红色霓虹 + 湿路反光 + 雨丝 + 暗角颗粒
 * ============================================================ */
function makeMenuBg(){
  const W = 1600, H = 900;
  const r = rng(99);

  let bokeh = "";
  for (let i = 0; i < 26; i++){
    const x = 80 + r() * (W - 160), y = 60 + r() * 420, rad = 4 + r() * 12;
    const warm = r() < 0.8;
    bokeh += '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + rad.toFixed(1) +
      '" fill="' + (warm ? "#d9c08c" : "#e06c5f") + '" opacity="' + (0.05 + r() * 0.14).toFixed(2) + '" filter="url(#soft)"/>';
  }
  let streaks = "";
  for (let i = 0; i < 12; i++){
    const x = 100 + r() * (W - 200), w = 20 + r() * 60, h = 90 + r() * 180, y = 560 + r() * 240;
    streaks += '<rect x="' + x.toFixed(0) + '" y="' + y.toFixed(0) + '" width="' + w.toFixed(0) + '" height="' + h.toFixed(0) +
      '" fill="' + (r() < 0.25 ? "#b03a30" : "#cde8cf") + '" opacity="' + (0.04 + r() * 0.05).toFixed(2) + '" filter="url(#soft)"/>';
  }
  let drops = "";
  for (let i = 0; i < 70; i++){
    const x = r() * (W + 40) - 20, y = r() * (H + 40) - 30, l = 16 + r() * 20;
    drops += '<line x1="' + x.toFixed(0) + '" y1="' + y.toFixed(0) + '" x2="' + (x - 7).toFixed(0) + '" y2="' + (y + l).toFixed(0) +
      '" stroke="#aebfb2" stroke-width="1" opacity="' + (0.10 + r() * 0.22).toFixed(2) + '"/>';
  }

  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
    '<defs>' +
    '<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1216"/><stop offset="0.55" stop-color="#070c10"/><stop offset="1" stop-color="#04070a"/></linearGradient>' +
    '<filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="10"/></filter>' +
    '<filter id="soft2" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="26"/></filter>' +
    '<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>' +
    '<radialGradient id="vig" cx="42%" cy="40%" r="80%"><stop offset="45%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.72"/></radialGradient>' +
    '</defs>' +
    '<rect width="' + W + '" height="' + H + '" fill="url(#g)"/>' +
    '<g filter="url(#soft2)">' +
    '<rect x="-40" y="120" width="520" height="520" fill="#0c1318"/>' +
    '<rect x="420" y="60" width="380" height="560" fill="#0a1116"/>' +
    '<rect x="900" y="140" width="420" height="500" fill="#0c1217"/>' +
    '<rect x="1280" y="80" width="380" height="580" fill="#0b1015"/>' +
    '</g>' +
    bokeh +
    '<g filter="url(#soft2)"><rect x="1080" y="300" width="240" height="34" fill="#a02c26" opacity="0.75"/></g>' +
    '<g filter="url(#soft)"><rect x="1100" y="308" width="200" height="16" fill="#e0483c" opacity="0.55"/></g>' +
    '<g filter="url(#soft2)"><polygon points="1120,660 1260,660 1300,900 1080,900" fill="#8f2a24" opacity="0.15"/></g>' +
    '<g filter="url(#soft)"><polygon points="300,120 360,120 520,760 80,760" fill="#cde8cf" opacity="0.05"/></g>' +
    '<circle cx="330" cy="140" r="16" fill="#e8f2dc" opacity="0.5" filter="url(#soft)"/>' +
    streaks +
    '<g>' + drops + '</g>' +
    '<rect width="' + W + '" height="' + H + '" fill="url(#vig)"/>' +
    '<rect width="' + W + '" height="' + H + '" filter="url(#grain)" opacity="0.05"/>' +
    '</svg>';

  const UI_DIR = path.join(ROOT, "assets", "images", "ui");
  fs.mkdirSync(UI_DIR, { recursive: true });
  fs.writeFileSync(path.join(UI_DIR, "menu_bg.svg"), svg);
  console.log("[OK] 首页氛围背景 → " + path.relative(ROOT, path.join("assets", "images", "ui", "menu_bg.svg")));
}
makeMenuBg();

/* 输出线索坐标对照表（与 js/levels.js 中保持一致） */
console.log("\n线索闪烁点（图片百分比坐标，与 levels.js 对应）：");
Object.keys(CLUE_SPOTS).forEach(function (cam){
  const p = CLUE_SPOTS[cam];
  console.log("  " + cam + " 22:24  x: " + (p[0] / 800 * 100).toFixed(1) + "  y: " + (p[1] / 450 * 100).toFixed(1));
});
