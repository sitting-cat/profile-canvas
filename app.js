'use strict';

/* ================================================================
 * 未来の自分へ：
 *
 * x / y は画像の左上を (0, 0)、右下を (1, 1) とした開始位置
 * 画像ファイルのサイズが未定なためこのような定義方法になっている。px単位じゃないので注意。
 * 各項目の位置を変える場合は、下記 x / y だけを調整すること。
 * baseSize は画像の高さに対する基準文字サイズ
 * lineHeight はプロフィールで明示的に改行した行の間隔
 * ================================================================ */

const TEXT_LAYOUT = Object.freeze({
  name:    { x: 0.54, y: 0.125, baseSize: 0.074, weight: 700 },
  title:   { x: 0.54, y: 0.235, baseSize: 0.06, weight: 500 },
  profile: { x: 0.45, y: 0.45, baseSize: 0.0425, weight: 400, lineHeight: 1.70 }
});

/* ================================================================
 * ランダム肩書の候補はここで編集。
 * ================================================================ */
const TITLE_PREFIXES = Object.freeze([
  'さすらいの', 'はじめての', '伝説の', '駆け出しの', '気まぐれな',
  '夢見る', '新米', '流浪の', '迷子の', '夜更かしの', 
  '若き', '熟練の', '陽気な', '謎めいた', '幸運な'
]);

const TITLE_ROLES = Object.freeze([
  '冒険者', '探索者', '受付嬢', '錬金術師', '旅人',
  '商人', '吟遊詩人', '地図職人', '守護者', '研究員',
  '騎士', '狩人', '魔術師', '占い師', '行商人'
]);

/* 文字色と影はここで定義 */
const TEXT_STYLE = Object.freeze({
  nameColor: '#fffaf2',
  titleColor: '#fffaf2',
  profileColor: '#fffaf2',
  shadowColor: 'rgba(0, 0, 0, 0.72)',
  shadowBlurRatio: 0.010,
  shadowOffsetRatio: 0.003
});

const $ = (selector) => document.querySelector(selector);
const els = {
  canvas: $('#canvas'), wrap: $('#canvasWrap'), input: $('#imageInput'), drop: $('#dropzone'),
  name: $('#name'), title: $('#title'), randomTitle: $('#randomTitle'), profile: $('#profile'),
  font: $('#font'), preview: $('#fontPreview'),
  nameSize: $('#nameSize'), titleSize: $('#titleSize'), profileSize: $('#profileSize'),
  meta: $('#canvasMeta'), status: $('#status'), png: $('#downloadPng'), jpg: $('#downloadJpg')
};
const ctx = els.canvas.getContext('2d', { alpha: false });
let source = null;
let fileBase = 'profile-card';
let renderToken = 0;

els.name.value = 'エンフォリア';
els.title.value = 'はじめての冒険者';
els.profile.value = 'こんにちは！\nこの世界にはどんな冒険が待っているのかな？';

const themeButton = $('[data-theme-toggle]');
let theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
function setTheme() {
  document.documentElement.dataset.theme = theme;
  themeButton.setAttribute('aria-label', theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え');
  themeButton.innerHTML = theme === 'dark'
    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
    : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
}
themeButton.addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; setTheme(); });
setTheme();

function isExact16by9(width, height) {
  return width * 9 === height * 16;
}

async function ensureFont(font, size) {
  const family = font.split(',')[0].replaceAll("'", '');
  try { await document.fonts.load(`${size}px ${family}`, '日本語プロフィール名前肩書'); } catch (_) {}
}

function drawSingleLine(text, layout, scale, color, fontFamily, imageWidth, imageHeight) {
  const fontSize = Math.round(imageHeight * layout.baseSize * scale);
  ctx.font = `${layout.weight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.fillText(text, imageWidth * layout.x, imageHeight * layout.y);
}

async function render() {
  if (!source) return;
  const token = ++renderToken;
  const width = source.width;
  const height = source.height;
  const maxFontSize = Math.round(height * TEXT_LAYOUT.name.baseSize * (+els.nameSize.value / 100));
  await ensureFont(els.font.value, maxFontSize);
  if (token !== renderToken) return;

  els.canvas.width = width;
  els.canvas.height = height;
  ctx.drawImage(source, 0, 0, width, height);

  /* 背景パネルは描画しません。文字の背後は完全に元画像のままです。 */
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.shadowColor = TEXT_STYLE.shadowColor;
  ctx.shadowBlur = height * TEXT_STYLE.shadowBlurRatio;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = height * TEXT_STYLE.shadowOffsetRatio;

  drawSingleLine(els.name.value, TEXT_LAYOUT.name, +els.nameSize.value / 100, TEXT_STYLE.nameColor, els.font.value, width, height);
  drawSingleLine(els.title.value, TEXT_LAYOUT.title, +els.titleSize.value / 100, TEXT_STYLE.titleColor, els.font.value, width, height);

  const profileScale = +els.profileSize.value / 100;
  const profileFontSize = Math.round(height * TEXT_LAYOUT.profile.baseSize * profileScale);
  const profileLineHeight = profileFontSize * TEXT_LAYOUT.profile.lineHeight;
  ctx.font = `${TEXT_LAYOUT.profile.weight} ${profileFontSize}px ${els.font.value}`;
  ctx.fillStyle = TEXT_STYLE.profileColor;

  /* 自動折り返しはしません。入力された改行だけを行として扱います。 */
  els.profile.value.split(/\r?\n/).forEach((line, index) => {
    ctx.fillText(line, width * TEXT_LAYOUT.profile.x, height * TEXT_LAYOUT.profile.y + profileLineHeight * index);
  });

  els.meta.textContent = `${width} × ${height}・16:9`;
  els.wrap.classList.add('has-image');
}

function setStatus(text, kind = '') {
  els.status.textContent = text;
  els.status.dataset.kind = kind;
}

async function decodeImage(file) {
  if ('createImageBitmap' in window) return createImageBitmap(file, { imageOrientation: 'from-image' });
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function loadFile(file) {
  if (!file) return;
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    setStatus('PNG、JPEG、WebP画像を選択してください。', 'error');
    els.input.value = '';
    return;
  }
  try {
    const candidate = await decodeImage(file);
    if (!isExact16by9(candidate.width, candidate.height)) {
      setStatus(`読み込んだ画像は16:9ではありません（${candidate.width} × ${candidate.height}）。トリミングしていない画像を選択してください。`, 'error');
      if (typeof candidate.close === 'function') candidate.close();
      els.input.value = '';
      return;
    }
    if (source && typeof source.close === 'function') source.close();
    source = candidate;
    fileBase = (file.name.replace(/\.[^.]+$/, '') || 'profile-card').replace(/[^\p{L}\p{N}_-]+/gu, '-');
    els.png.disabled = false;
    els.jpg.disabled = false;
    setStatus(`${file.name} を読み込みました。`);
    await render();
  } catch (_) {
    setStatus('画像を読み込めませんでした。別の画像をお試しください。', 'error');
    els.input.value = '';
  }
}

els.input.addEventListener('change', (event) => loadFile(event.target.files[0]));
['dragenter', 'dragover'].forEach((type) => els.drop.addEventListener(type, (event) => {
  event.preventDefault();
  els.drop.classList.add('drag');
}));
['dragleave', 'drop'].forEach((type) => els.drop.addEventListener(type, (event) => {
  event.preventDefault();
  els.drop.classList.remove('drag');
}));
els.drop.addEventListener('drop', (event) => loadFile(event.dataTransfer.files[0]));

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function generateRandomTitle() {
  els.title.value = `${randomItem(TITLE_PREFIXES)}${randomItem(TITLE_ROLES)}`;
  els.title.dispatchEvent(new Event('input', { bubbles: true }));
  els.title.focus();
}

els.randomTitle.addEventListener('click', generateRandomTitle);

let animationFrame = 0;
function updateUI() {
  $('#nameSizeOut').textContent = `${els.nameSize.value}%`;
  $('#titleSizeOut').textContent = `${els.titleSize.value}%`;
  $('#profileSizeOut').textContent = `${els.profileSize.value}%`;
  els.preview.style.fontFamily = els.font.value;
}
function scheduleRender() {
  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(render);
  updateUI();
}
[els.name, els.title, els.profile, els.font, els.nameSize, els.titleSize, els.profileSize]
  .forEach((element) => element.addEventListener('input', scheduleRender));

function download(type, quality) {
  if (!source) return;
  render().then(() => els.canvas.toBlob((blob) => {
    if (!blob) { setStatus('画像の書き出しに失敗しました。', 'error'); return; }
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `${fileBase}-profile.${type === 'image/png' ? 'png' : 'jpg'}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(`${type === 'image/png' ? 'PNG' : 'JPEG'}を書き出しました。`);
  }, type, quality));
}
els.png.addEventListener('click', () => download('image/png'));
els.jpg.addEventListener('click', () => download('image/jpeg', 0.94));

function drawPlaceholder() {
  const width = 1920, height = 1080;
  els.canvas.width = width;
  els.canvas.height = height;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#9d8c85');
  gradient.addColorStop(1, '#665b58');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}
drawPlaceholder();
updateUI();
