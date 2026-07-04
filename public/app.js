const $ = (id) => document.getElementById(id);

const modeInfo = {
  topics: ['Viral Topic Finder', 'Mythology niche ke liye 10 Shorts aur 8 Long video ideas generate karega.'],
  script: ['Script Generator', 'Hook, timestamps, voice-over, visuals, SFX, BGM aur CTA ke saath complete script.'],
  package: ['Full Content Package', 'Topic se final upload tak: script, prompts, edit plan, SEO, hashtags, pinned comments.'],
  imagePrompts: ['AI Image Prompt Generator', 'Har scene ke liye cinematic image prompts, negative prompts aur thumbnail prompt.'],
  imageVideo: ['Image-to-Video Prompt Generator', 'Camera movement, motion, lighting aur transition prompts for AI video tools.'],
  voiceover: ['Voice-over Director', 'Tone, pause, speed, emotion, stress words aur BGM guide.'],
  seo: ['SEO Pack Generator', 'Titles, thumbnail text, description, tags, hashtags aur upload checklist.'],
  analyzer: ['Video Analyzer', 'Script/video ko score karke batayega kaha sahi hai aur kaha glti hai.'],
  youtube: ['YouTube Data', 'Optional YouTube API se trend search aur channel videos fetch karega.']
};

let currentMode = 'topics';
let lastOutput = null;
let lastYoutubeData = [];

const fieldIds = [
  'channelName','niche','language','videoType','duration','topic','audience','tone','goal','keywords','references','channelData'
];

function getPayload() {
  const data = {};
  fieldIds.forEach(id => data[id] = $(id).value.trim());
  return data;
}

function setLoading(isLoading, text = 'Generating...') {
  $('loader').classList.toggle('hidden', !isLoading);
  $('loader').lastChild.textContent = ' ' + text;
  [...document.querySelectorAll('button')].forEach(btn => btn.disabled = isLoading);
}

function saveContext() {
  localStorage.setItem('mythologyStudioContext', JSON.stringify(getPayload()));
  toast('Channel setup saved');
}

function loadContext() {
  try {
    const saved = JSON.parse(localStorage.getItem('mythologyStudioContext') || '{}');
    Object.entries(saved).forEach(([id, value]) => {
      if ($(id)) $(id).value = value;
    });
  } catch {}
}

function toast(message) {
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText = `position:fixed;right:18px;bottom:18px;background:rgba(20,16,34,.95);border:1px solid rgba(255,255,255,.15);color:#ffd36e;padding:12px 14px;border-radius:14px;z-index:999;font-weight:900;box-shadow:0 18px 45px rgba(0,0,0,.35)`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    const status = $('apiStatus');
    if (data.geminiConfigured) {
      status.textContent = `Gemini Ready • ${data.model}`;
      status.className = 'status-pill ok';
    } else {
      status.textContent = 'Demo Mode • Add GEMINI_API_KEY';
      status.className = 'status-pill warn';
    }
  } catch {
    $('apiStatus').textContent = 'Server error';
    $('apiStatus').className = 'status-pill warn';
  }
}

function switchMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab.dataset.mode === mode));
  const [title, help] = modeInfo[mode];
  $('modeTitle').textContent = title;
  $('modeHelp').textContent = help;
  $('normalActions').classList.toggle('hidden', mode === 'analyzer' || mode === 'youtube');
  $('analyzerPanel').classList.toggle('hidden', mode !== 'analyzer');
  $('youtubePanel').classList.toggle('hidden', mode !== 'youtube');
}

async function generate(mode = currentMode) {
  const payload = getPayload();
  if (lastYoutubeData.length) {
    payload.channelData = `${payload.channelData}\n\nYOUTUBE DATA:\n${JSON.stringify(lastYoutubeData.slice(0, 15), null, 2)}`;
  }
  setLoading(true);
  $('result').className = 'result';
  $('resultMeta').textContent = 'AI output generate ho raha hai...';
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, payload })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Generation failed');
    lastOutput = data.result;
    renderOutput(data.result);
    $('resultMeta').textContent = `${data.provider === 'demo' ? 'Demo output' : 'Generated with Gemini'} • ${new Date().toLocaleString()}`;
    updateScore(data.result);
    autoSaveOutput(mode, data.result);
  } catch (err) {
    renderError(err.message);
  } finally {
    setLoading(false);
  }
}

async function analyzeVideo() {
  const base = getPayload();
  const payload = {
    ...base,
    topic: $('analyzeTitle').value.trim() || base.topic,
    videoTitle: $('analyzeTitle').value.trim(),
    thumbnailText: $('thumbnailText').value.trim(),
    transcript: $('transcript').value.trim(),
    editingNotes: $('editingNotes').value.trim()
  };
  const fd = new FormData();
  fd.append('payload', JSON.stringify(payload));
  const file = $('videoFile').files[0];
  if (file) fd.append('video', file);
  setLoading(true, 'Analyzing...');
  $('resultMeta').textContent = 'Video/script analysis ho raha hai...';
  try {
    const res = await fetch('/api/analyze-video', { method: 'POST', body: fd });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Analysis failed');
    lastOutput = data.result;
    renderOutput(data.result);
    $('resultMeta').textContent = `${data.fileReceived ? 'Video file + text analyzed' : 'Text/script analyzed'} • ${new Date().toLocaleString()}`;
    updateScore(data.result);
    autoSaveOutput('analyzer', data.result);
  } catch (err) {
    renderError(err.message);
  } finally {
    setLoading(false);
  }
}

function updateScore(obj) {
  const score = obj?.overallScore || obj?.viralPotential || obj?.scores?.retention || null;
  $('scoreBox').textContent = score ? `${score}` : 'AI';
}

function autoSaveOutput(mode, output) {
  const history = JSON.parse(localStorage.getItem('mythologyStudioHistory') || '[]');
  history.unshift({ mode, output, createdAt: new Date().toISOString(), topic: $('topic').value.trim() });
  localStorage.setItem('mythologyStudioHistory', JSON.stringify(history.slice(0, 20)));
}

function renderError(message) {
  $('result').innerHTML = `<div class="card"><h4>Error</h4><div class="v">${escapeHtml(message)}</div><p style="color:#b9adc9">Check .env API key, quota, model name, internet, ya input size.</p></div>`;
  $('resultMeta').textContent = 'Error aaya';
  $('scoreBox').textContent = '!';
}

function renderOutput(data) {
  $('result').innerHTML = renderAny(data, 'Result');
}

function renderAny(value, title = '') {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return `<div class="v">${escapeHtml(String(value))}</div>`;
  }
  if (Array.isArray(value)) {
    if (!value.length) return '<div class="v">No items</div>';
    if (value.every(x => typeof x !== 'object')) {
      return `<div>${value.map(x => `<span class="badge">${escapeHtml(String(x))}</span>`).join('')}</div>`;
    }
    return value.map((item, i) => `<div class="card"><h4>${escapeHtml(title)} ${i + 1}</h4>${renderObject(item)}</div>`).join('');
  }
  return `<div class="card">${title ? `<h4>${escapeHtml(formatKey(title))}</h4>` : ''}${renderObject(value)}</div>`;
}

function renderObject(obj) {
  return Object.entries(obj).map(([key, val]) => {
    const rendered = (typeof val === 'object' && val !== null) ? renderAny(val, key) : `<div class="v">${escapeHtml(String(val))}</div>`;
    return `<div class="kv"><div class="k">${escapeHtml(formatKey(key))}</div><div>${rendered}</div></div>`;
  }).join('');
}

function formatKey(key) {
  return String(key).replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, s => s.toUpperCase());
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function stringifyOutput() {
  return typeof lastOutput === 'string' ? lastOutput : JSON.stringify(lastOutput || {}, null, 2);
}

async function copyOutput() {
  if (!lastOutput) return toast('Pehle output generate kare');
  await navigator.clipboard.writeText(stringifyOutput());
  toast('Copied');
}

function download(filename, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function downloadTxt() {
  if (!lastOutput) return toast('Pehle output generate kare');
  download(`mythology-${currentMode}-${Date.now()}.txt`, stringifyOutput());
}

function downloadJson() {
  if (!lastOutput) return toast('Pehle output generate kare');
  download(`mythology-${currentMode}-${Date.now()}.json`, JSON.stringify(lastOutput, null, 2), 'application/json');
}

function demoFill() {
  $('channelName').value = 'CURRENT AFFAIR WORLD';
  $('niche').value = 'Mythology';
  $('language').value = 'Hindi';
  $('videoType').value = 'Shorts';
  $('duration').value = '60 seconds';
  $('topic').value = 'अगर हनुमान जी चाहते तो रामायण युद्ध होता ही नहीं?';
  $('audience').value = 'Hindi mythology viewers aur students';
  $('tone').value = 'Cinematic, suspenseful, devotional, emotional';
  $('goal').value = 'Views, retention, subscribers';
  $('keywords').value = 'Hanuman ji, Ramayan, Lanka, Ravan, Shri Ram, dharm, रहस्य, क्या होता अगर';
  $('references').value = 'High retention Shorts style: first 3 sec question, every 5 sec new visual, cliffhanger or strong lesson ending';
  $('channelData').value = 'Best themes: Ramayan mystery, Hanuman power, Krishna strategy, Mahabharat hidden lessons';
  toast('Demo data filled');
}

async function searchYoutube() {
  const q = $('ytQuery').value.trim();
  setLoading(true, 'Fetching YouTube...');
  try {
    const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}&maxResults=12`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'YouTube fetch failed');
    lastYoutubeData = data.videos || [];
    lastOutput = lastYoutubeData;
    renderVideos(lastYoutubeData);
    $('resultMeta').textContent = `YouTube search data • ${lastYoutubeData.length} videos`;
    $('scoreBox').textContent = 'YT';
  } catch (err) {
    renderError(err.message);
  } finally {
    setLoading(false);
  }
}

async function fetchChannel() {
  const channelId = $('ytChannelId').value.trim();
  if (!channelId) return toast('Channel ID paste kare');
  setLoading(true, 'Fetching channel...');
  try {
    const res = await fetch(`/api/youtube/channel?channelId=${encodeURIComponent(channelId)}&maxResults=15`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Channel fetch failed');
    lastYoutubeData = data.videos || [];
    lastOutput = lastYoutubeData;
    renderVideos(lastYoutubeData);
    $('resultMeta').textContent = `Channel recent data • ${lastYoutubeData.length} videos`;
    $('scoreBox').textContent = 'YT';
  } catch (err) {
    renderError(err.message);
  } finally {
    setLoading(false);
  }
}

function renderVideos(videos) {
  if (!videos.length) {
    $('result').innerHTML = '<div class="empty">No YouTube videos found.</div>';
    return;
  }
  $('result').innerHTML = `<div class="video-grid">${videos.map(v => `
    <div class="card video-card">
      ${v.thumbnail ? `<img src="${escapeHtml(v.thumbnail)}" alt="thumbnail">` : ''}
      <div class="body">
        <a href="${escapeHtml(v.url)}" target="_blank" rel="noreferrer">${escapeHtml(v.title || 'Video')}</a>
        <p>${escapeHtml(v.channelTitle || '')}</p>
        <p>Views: ${Number(v.views || 0).toLocaleString()} • Likes: ${Number(v.likes || 0).toLocaleString()} • ${Math.round((v.seconds || 0)/60)} min</p>
        <p>${escapeHtml(v.publishedAt || '')}</p>
      </div>
    </div>`).join('')}</div>`;
}

function init() {
  loadContext();
  checkHealth();
  document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => switchMode(tab.dataset.mode)));
  $('generateBtn').addEventListener('click', () => generate());
  $('analyzeBtn').addEventListener('click', analyzeVideo);
  $('copyBtn').addEventListener('click', copyOutput);
  $('copyAnalyzeBtn').addEventListener('click', copyOutput);
  $('downloadBtn').addEventListener('click', downloadTxt);
  $('jsonBtn').addEventListener('click', downloadJson);
  $('sampleBtn').addEventListener('click', demoFill);
  $('saveContextBtn').addEventListener('click', saveContext);
  $('ytSearchBtn').addEventListener('click', searchYoutube);
  $('ytChannelBtn').addEventListener('click', fetchChannel);
  $('sendYtToAiBtn').addEventListener('click', () => {
    if (!lastYoutubeData.length) return toast('Pehle YouTube data fetch kare');
    switchMode('topics');
    generate('topics');
  });
}

init();
