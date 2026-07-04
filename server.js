import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Mythology AI Content Studio - real backend using Gemini API + optional YouTube Data API

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 22 * 1024 * 1024 // 22MB practical inline limit for local use
  }
});

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

app.use(cors());
app.use(express.json({ limit: '3mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function cleanText(value = '') {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, 20000);
}

function buildContext(payload = {}) {
  const channel = cleanText(payload.channelName || 'Mythology Channel');
  const niche = cleanText(payload.niche || 'Mythology');
  const audience = cleanText(payload.audience || 'Hindi mythology viewers, students, general public');
  const language = cleanText(payload.language || 'Hindi');
  const videoType = cleanText(payload.videoType || 'Shorts');
  const duration = cleanText(payload.duration || '60 seconds');
  const tone = cleanText(payload.tone || 'Cinematic, suspenseful, devotional, simple Hindi');
  const goal = cleanText(payload.goal || 'Retention, watch time, subscribers');
  const topic = cleanText(payload.topic || '');
  const references = cleanText(payload.references || '');
  const keywords = cleanText(payload.keywords || 'Ramayan, Mahabharat, Hanuman, Krishna, Shiva, Vishnu, mystery, hidden truth');
  const competitorNotes = cleanText(payload.competitorNotes || '');
  const channelData = cleanText(payload.channelData || '');

  return `
CHANNEL CONTEXT
- Channel name: ${channel}
- Niche: ${niche}
- Audience: ${audience}
- Language: ${language}
- Video type: ${videoType}
- Target duration: ${duration}
- Tone/style: ${tone}
- Goal: ${goal}
- Main topic / seed idea: ${topic || 'Suggest best topic'}
- Trend keywords: ${keywords}
- Reference/competitor notes: ${references || competitorNotes || 'None'}
- Channel/video data pasted by creator: ${channelData || 'None'}
`.trim();
}

const JSON_RULES = `
Return ONLY valid JSON. No markdown, no code fence.
Use Hindi/Hinglish for creator-facing content unless user selected another language.
Be respectful with Hindu mythology and devotional subjects.
Do not claim guaranteed virality. Use "viral potential" as an estimate.
Prefer cinematic hooks, curiosity, retention loops, simple words, and clear scene directions.
`;

const systemBase = `
You are a senior YouTube growth strategist, Hindi mythology researcher, cinematic scriptwriter, AI image prompt engineer, video editor, and voice-over director.
You help a creator make mythology Shorts and long videos. Your output must be practical enough to copy directly into production tools like Gemini, Veo, Runway, Pika, CapCut, Premiere Pro, ElevenLabs, or similar tools.
${JSON_RULES}
`;

function modePrompt(mode, payload) {
  const context = buildContext(payload);
  const common = `${systemBase}\n\n${context}\n\n`;

  const prompts = {
    topics: `${common}
Generate viral topic ideas specifically for a mythology YouTube channel.
JSON schema:
{
  "channelDiagnosis": "1 paragraph",
  "shortsIdeas": [
    {"title":"", "hook":"", "angle":"", "whyItCanWork":"", "visualOpening":"", "thumbnailText":"", "viralPotential":0, "difficulty":"Easy/Medium/Hard"}
  ],
  "longVideoIdeas": [
    {"title":"", "openingHook":"", "chapters":[""], "retentionPromise":"", "thumbnailText":"", "viralPotential":0}
  ],
  "trendAngles": [""],
  "avoidTheseMistakes": [""]
}
Give exactly 10 shortsIdeas and 8 longVideoIdeas.`,

    script: `${common}
Write a complete production-ready script for the selected topic. If video type is Shorts, create a 60-second high-retention script. If long video, create a structured long script matching duration.
JSON schema:
{
  "seoTitle":"",
  "thumbnailText":"",
  "retentionPromise":"",
  "script":[
    {"time":"0:00-0:05", "voiceover":"", "visual":"", "onScreenText":"", "sfx":"", "bgm":"", "emotion":""}
  ],
  "cta":"",
  "pacingNotes":[""],
  "factCareNote":""
}`, 

    package: `${common}
Create a full content package from topic to final upload for this mythology video.
JSON schema:
{
  "topic":"",
  "viralAngle":"",
  "titles":["8 clickable titles"],
  "bestTitle":"",
  "hookOptions":["8 hooks"],
  "finalScript":[{"time":"", "voiceover":"", "visual":"", "onScreenText":"", "sfx":"", "bgm":"", "emotion":""}],
  "imagePrompts":[{"scene":1, "prompt":"", "negativePrompt":"", "aspectRatio":"9:16 or 16:9"}],
  "imageToVideoPrompts":[{"scene":1, "prompt":"", "camera":"", "motion":"", "lighting":"", "duration":""}],
  "voiceoverGuide":[{"lineOrTime":"", "tone":"", "pause":"", "speed":"", "emotion":""}],
  "editingPlan":[{"time":"", "cut":"", "effect":"", "text":"", "sound":""}],
  "description":"",
  "hashtags":["40 hashtags"],
  "pinnedComments":["5 pinned comment ideas"],
  "qualityChecklist":[""]
}`,

    imagePrompts: `${common}
Generate cinematic AI image prompts scene-by-scene for mythology video production.
JSON schema:
{
  "styleBible":"",
  "scenePrompts":[
    {"scene":1, "moment":"", "prompt":"", "negativePrompt":"", "aspectRatio":"9:16", "cameraLens":"", "lighting":"", "colorPalette":""}
  ],
  "characterConsistencyTips":[""],
  "thumbnailPrompt":""
}
Give at least 8 scene prompts for Shorts and 12 for long video.`,

    imageVideo: `${common}
Generate image-to-video prompts for AI video tools. Focus on camera movement, motion, particles, depth, divine atmosphere and cinematic retention.
JSON schema:
{
  "globalMotionStyle":"",
  "shots":[
    {"shot":1, "inputImageIdea":"", "videoPrompt":"", "cameraMovement":"", "subjectMotion":"", "environmentMotion":"", "transition":"", "duration":"", "sfx":""}
  ],
  "doNotDo":[""],
  "exportSettings":""
}`,

    voiceover: `${common}
Create a voice-over direction guide for the script/topic.
JSON schema:
{
  "voiceStyle":"",
  "recordingSettings":"",
  "lineByLineGuide":[
    {"line":"", "tone":"", "speed":"", "pauseAfter":"", "emotion":"", "stressWords":[""]}
  ],
  "bgmGuide":[{"time":"", "musicMood":"", "volume":"", "reason":""}],
  "mistakesToAvoid":[""]
}`,

    seo: `${common}
Generate YouTube SEO pack for mythology video.
JSON schema:
{
  "titles":["8 title options"],
  "bestTitle":"",
  "thumbnailTexts":["10 thumbnail text options"],
  "description":"",
  "chapters":[{"time":"", "title":""}],
  "hashtags":["40 hashtags"],
  "tags":["30 comma-style tags"],
  "pinnedComments":["5 pinned comment ideas"],
  "uploadChecklist":[""]
}`,

    analyzer: `${common}
Analyze the provided video idea/script/transcript/notes like a strict YouTube retention expert.
Find exactly where it is strong and where it is weak.
JSON schema:
{
  "overallScore":0,
  "scores":{"hook":0,"storyFlow":0,"mythologyAccuracyCare":0,"visuals":0,"voiceover":0,"editing":0,"retention":0,"seo":0},
  "whatIsGood":[""],
  "mainMistakes":[{"problem":"", "whyItHurts":"", "fix":""}],
  "retentionDropRisk":[{"timeOrPart":"", "risk":"", "fix":""}],
  "betterHookOptions":["8 improved hooks"],
  "improvedScript":"",
  "sceneWiseEditingFixes":[{"part":"", "visualFix":"", "soundFix":"", "textFix":""}],
  "voiceoverFixes":[{"lineOrPart":"", "direction":""}],
  "thumbnailTitleFix":{"title":"", "thumbnailText":"", "reason":""},
  "nextVideoIdeas":["8 related ideas"]
}`
  };

  return prompts[mode] || prompts.package;
}

function extractGeminiText(data) {
  const candidates = data?.candidates || [];
  for (const c of candidates) {
    const parts = c?.content?.parts || [];
    const text = parts.map(p => p.text || '').join('\n').trim();
    if (text) return text;
  }
  return '';
}

function safeParseJson(text) {
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return { ok: true, data: JSON.parse(match[0]) }; } catch {}
    }
    return { ok: false, data: { raw: text } };
  }
}

function demoResponse(mode, payload) {
  const topic = payload.topic || 'क्या हनुमान जी चाहते तो रामायण युद्ध रोक सकते थे?';
  const base = {
    demoMode: true,
    note: 'GEMINI_API_KEY नहीं मिली। .env में key डालते ही यह real AI output generate करेगा.',
    topic
  };
  if (mode === 'topics') {
    return {
      ...base,
      channelDiagnosis: 'Mythology audience mystery, devotion और hidden-angle वाली storytelling पर जल्दी रुकती है। Hook पहले 3 सेकंड में सवाल वाला होना चाहिए।',
      shortsIdeas: Array.from({ length: 10 }, (_, i) => ({
        title: [
          'हनुमान जी चाहते तो युद्ध खत्म क्यों नहीं किया?',
          'कृष्ण ने अर्जुन को युद्ध के लिए क्यों चुना?',
          'शिव जी का तीसरा नेत्र सच में क्या संकेत देता है?',
          'भीष्म पितामह मृत्यु का समय कैसे चुन पाए?',
          'रावण इतना ज्ञानी था फिर भी हार क्यों गया?',
          'समुद्र मंथन का सबसे बड़ा छुपा रहस्य',
          'कर्ण को सबसे बड़ा दानवीर क्यों कहा गया?',
          'अभिमन्यु चक्रव्यूह से बाहर क्यों नहीं निकले?',
          'विष्णु जी के अवतारों का असली उद्देश्य',
          'राम सेतु का रहस्य जिसने सबको चौंकाया'
        ][i],
        hook: 'अगर यह सच है... तो पूरी कहानी बदल जाती है!',
        angle: 'Known कथा + unexplored question + emotional reveal',
        whyItCanWork: 'Curiosity gap, belief respect और cinematic visuals मिलते हैं।',
        visualOpening: 'Dark temple, glowing scripture, dramatic zoom',
        thumbnailText: 'छुपा रहस्य 😱',
        viralPotential: 78 + (i % 8),
        difficulty: i % 3 === 0 ? 'Easy' : 'Medium'
      })),
      longVideoIdeas: Array.from({ length: 8 }, (_, i) => ({
        title: ['रामायण के 7 अनसुने रहस्य','महाभारत में कृष्ण की सबसे बड़ी रणनीति','समुद्र मंथन की पूरी कहानी','शिव पुराण के रहस्यमयी संकेत','हनुमान जी की शक्तियों का सच','रावण: खलनायक या महान विद्वान?','कर्ण की पूरी जीवनगाथा','विष्णु अवतारों का रहस्य'][i],
        openingHook: 'यह कहानी सिर्फ युद्ध की नहीं, नियति और धर्म की परीक्षा थी।',
        chapters: ['Hook', 'Origin', 'Conflict', 'Hidden lesson', 'Climax', 'Conclusion'],
        retentionPromise: 'हर 60 सेकंड में नया reveal मिलेगा।',
        thumbnailText: 'सच्चाई क्या है?',
        viralPotential: 80 + i
      })),
      trendAngles: ['क्या होता अगर...', 'छुपा हुआ रहस्य', 'गलत समझी गई कथा', 'शक्ति बनाम धर्म'],
      avoidTheseMistakes: ['बहुत लंबी भूमिका', 'बिना स्रोत दावे', 'धीमा voice-over', 'same visuals repeat']
    };
  }
  return {
    ...base,
    overallScore: 82,
    bestTitle: `${topic} | अनसुना रहस्य`,
    hookOptions: [
      'अगर मैं कहूँ कि इस एक फैसले से पूरी रामायण बदल सकती थी...',
      'जिस शक्ति से पहाड़ उठ सकता था, उससे युद्ध क्यों नहीं रुका?',
      'हनुमान जी ने अपनी पूरी शक्ति क्यों नहीं दिखाई?'
    ],
    finalScript: [
      { time: '0:00-0:05', voiceover: 'अगर हनुमान जी चाहते, तो क्या रामायण युद्ध रुक सकता था?', visual: 'Stormy battlefield, Hanuman silhouette', onScreenText: 'युद्ध रुक सकता था?', sfx: 'Boom hit', bgm: 'Dark cinematic build', emotion: 'Mystery' },
      { time: '0:06-0:20', voiceover: 'उनके पास ऐसी शक्ति थी कि वे अकेले लंका हिला सकते थे, लेकिन रामायण सिर्फ शक्ति की कहानी नहीं थी।', visual: 'Hanuman flying over Lanka, golden flames', onScreenText: 'शक्ति थी... फिर भी क्यों?', sfx: 'Wind whoosh', bgm: 'Epic low drums', emotion: 'Power' },
      { time: '0:21-0:45', voiceover: 'यह धर्म, मर्यादा और श्रीराम के उद्देश्य की परीक्षा थी। हनुमान जी सेवक थे, निर्णायक नहीं।', visual: 'Lord Ram with bow, calm divine light', onScreenText: 'धर्म की परीक्षा', sfx: 'Temple bell', bgm: 'Devotional rise', emotion: 'Devotion' },
      { time: '0:46-1:00', voiceover: 'यही वजह है कि उन्होंने शक्ति होते हुए भी मर्यादा चुनी। असली बल वही है जो धर्म के अनुसार चले।', visual: 'Hanuman bowing before Ram', onScreenText: 'शक्ति + मर्यादा', sfx: 'Cinematic hit', bgm: 'Emotional climax', emotion: 'Inspiration' }
    ],
    imagePrompts: [
      { scene: 1, prompt: 'Cinematic Hindu mythology scene, mighty Hanuman silhouette on stormy Lanka battlefield, glowing mace, dramatic clouds, divine rim light, ultra detailed, 9:16', negativePrompt: 'cartoon, low quality, distorted face, extra limbs', aspectRatio: '9:16' }
    ],
    imageToVideoPrompts: [
      { scene: 1, prompt: 'Slow push-in camera toward Hanuman silhouette, clouds moving fast, sparks flying, divine orange glow, epic tension', camera: 'slow dolly in', motion: 'cape and smoke movement', lighting: 'golden rim light', duration: '4 seconds' }
    ],
    voiceoverGuide: [{ lineOrTime: '0:00-0:05', tone: 'deep suspense', pause: 'after सवाल', speed: 'medium slow', emotion: 'curiosity' }],
    hashtags: ['#Hanuman', '#Ramayan', '#Mythology', '#HinduMythology', '#Shorts'],
    qualityChecklist: ['Hook first 3 sec', 'Every 5 sec visual change', 'Respectful narration', 'Strong final line']
  };
}

async function callGemini(mode, payload, mediaParts = []) {
  if (!GEMINI_API_KEY) {
    return { provider: 'demo', model: 'demo', result: demoResponse(mode, payload) };
  }

  const prompt = modePrompt(mode, payload);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          ...mediaParts,
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      temperature: Number(payload.temperature || 0.75),
      topP: 0.9,
      maxOutputTokens: Number(payload.maxOutputTokens || 8192),
      responseMimeType: 'application/json'
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message || `Gemini API error ${res.status}`;
    throw new Error(message);
  }

  const text = extractGeminiText(data);
  const parsed = safeParseJson(text);
  return {
    provider: 'gemini',
    model: GEMINI_MODEL,
    result: parsed.data,
    rawText: parsed.ok ? undefined : text
  };
}

async function youtubeFetch(endpoint, params) {
  if (!YOUTUBE_API_KEY) {
    const err = new Error('YOUTUBE_API_KEY missing. .env में YouTube API key डालें या इस feature को skip करें.');
    err.status = 400;
    throw err;
  }
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });
  url.searchParams.set('key', YOUTUBE_API_KEY);
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `YouTube API error ${res.status}`);
  }
  return data;
}

function isoDurationToSeconds(duration = '') {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (Number(match[1] || 0) * 3600) + (Number(match[2] || 0) * 60) + Number(match[3] || 0);
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    app: 'Mythology AI Content Studio',
    hasApiKey: Boolean(GEMINI_API_KEY),
    geminiConfigured: Boolean(GEMINI_API_KEY),
    youtubeConfigured: Boolean(YOUTUBE_API_KEY),
    model: GEMINI_MODEL,
    region: process.env.RENDER_REGION || process.env.REGION || 'IN',
    cacheSize: 0
  });
});

app.get('/api/routes', (req, res) => {
  res.json({
    ok: true,
    routes: [
      'GET /api/health',
      'GET /api/routes',
      'POST /api/generate',
      'POST /api/generate/:mode',
      'POST /api/topics',
      'POST /api/script',
      'POST /api/package',
      'POST /api/imagePrompts',
      'POST /api/imageVideo',
      'POST /api/voiceover',
      'POST /api/seo',
      'POST /api/analyze-video',
      'POST /api/generate-topics',
      'POST /api/full-package',
      'POST /api/image-prompts',
      'POST /api/image-to-video',
      'POST /api/seo-pack',
      'GET /api/youtube/search',
      'GET /api/youtube/channel'
    ]
  });
});

app.post('/api/generate', async (req, res) => {
  try {
    const mode = cleanText(req.body.mode || 'package');
    const payload = req.body.payload || {};
    const output = await callGemini(mode, payload);
    res.json({ ok: true, ...output });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Extra route aliases so frontend/backend mismatch never gives "Route not found".
app.post('/api/generate/:mode', async (req, res) => {
  try {
    const mode = cleanText(req.params.mode || req.body.mode || 'package');
    const payload = req.body.payload || req.body || {};
    const output = await callGemini(mode, payload);
    res.json({ ok: true, ...output });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

['topics', 'script', 'package', 'imagePrompts', 'imageVideo', 'voiceover', 'seo', 'analyzer'].forEach((modeName) => {
  app.post(`/api/${modeName}`, async (req, res) => {
    try {
      const payload = req.body.payload || req.body || {};
      const output = await callGemini(modeName, payload);
      res.json({ ok: true, ...output });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });
});


// Extra compatibility aliases for older frontend files.
const routeModeMap = {
  '/api/generate-topics': 'topics',
  '/api/viral-topics': 'topics',
  '/api/topics-generator': 'topics',
  '/api/generate-script': 'script',
  '/api/script-generator': 'script',
  '/api/full-package': 'package',
  '/api/generate-package': 'package',
  '/api/image-prompts': 'imagePrompts',
  '/api/generate-image-prompts': 'imagePrompts',
  '/api/image-to-video': 'imageVideo',
  '/api/generate-image-video': 'imageVideo',
  '/api/voice-over': 'voiceover',
  '/api/generate-voiceover': 'voiceover',
  '/api/seo-pack': 'seo',
  '/api/generate-seo': 'seo',
  '/api/analyze': 'analyzer',
  '/api/video-analyzer': 'analyzer'
};

for (const [routePath, modeName] of Object.entries(routeModeMap)) {
  app.post(routePath, async (req, res) => {
    try {
      const payload = req.body.payload || req.body || {};
      const output = await callGemini(modeName, payload);
      res.json({ ok: true, ...output });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });
}

app.get('/api/generate', (req, res) => {
  res.status(405).json({ ok: false, error: 'Use POST /api/generate, not GET.' });
});

app.post('/api/analyze-video', upload.single('video'), async (req, res) => {
  try {
    const payload = JSON.parse(req.body.payload || '{}');
    const mediaParts = [];

    if (req.file) {
      const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'audio/mpeg', 'audio/wav'];
      if (!allowed.includes(req.file.mimetype)) {
        return res.status(400).json({ ok: false, error: 'Unsupported file type. MP4/WebM/MOV/audio upload करें या transcript paste करें.' });
      }
      mediaParts.push({
        inlineData: {
          mimeType: req.file.mimetype,
          data: req.file.buffer.toString('base64')
        }
      });
      payload.videoFileInfo = `Uploaded file: ${req.file.originalname}, MIME: ${req.file.mimetype}, size: ${Math.round(req.file.size / 1024 / 1024 * 10) / 10}MB`;
    }

    const output = await callGemini('analyzer', payload, mediaParts);
    res.json({ ok: true, ...output, fileReceived: Boolean(req.file) });
  } catch (error) {
    const msg = error.code === 'LIMIT_FILE_SIZE'
      ? 'File 22MB se bada hai. Short clip upload करें या transcript/script paste करें.'
      : error.message;
    res.status(500).json({ ok: false, error: msg });
  }
});

app.get('/api/youtube/search', async (req, res) => {
  try {
    const q = cleanText(req.query.q || 'hindi mythology');
    const maxResults = Math.min(Number(req.query.maxResults || 12), 25);
    const search = await youtubeFetch('search', {
      part: 'snippet',
      type: 'video',
      order: req.query.order || 'relevance',
      regionCode: req.query.regionCode || 'IN',
      relevanceLanguage: req.query.language || 'hi',
      maxResults,
      q
    });
    const ids = (search.items || []).map(item => item?.id?.videoId).filter(Boolean);
    let details = { items: [] };
    if (ids.length) {
      details = await youtubeFetch('videos', {
        part: 'snippet,statistics,contentDetails',
        id: ids.join(',')
      });
    }
    const videos = (details.items || []).map(v => ({
      id: v.id,
      title: v.snippet?.title,
      channelTitle: v.snippet?.channelTitle,
      publishedAt: v.snippet?.publishedAt,
      thumbnail: v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.medium?.url,
      views: Number(v.statistics?.viewCount || 0),
      likes: Number(v.statistics?.likeCount || 0),
      comments: Number(v.statistics?.commentCount || 0),
      seconds: isoDurationToSeconds(v.contentDetails?.duration),
      url: `https://www.youtube.com/watch?v=${v.id}`
    }));
    res.json({ ok: true, videos });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, error: error.message });
  }
});

app.get('/api/youtube/channel', async (req, res) => {
  try {
    const channelId = cleanText(req.query.channelId || '');
    if (!channelId) return res.status(400).json({ ok: false, error: 'channelId required' });
    const maxResults = Math.min(Number(req.query.maxResults || 15), 25);
    const search = await youtubeFetch('search', {
      part: 'snippet',
      type: 'video',
      order: 'date',
      channelId,
      maxResults
    });
    const ids = (search.items || []).map(item => item?.id?.videoId).filter(Boolean);
    let details = { items: [] };
    if (ids.length) {
      details = await youtubeFetch('videos', {
        part: 'snippet,statistics,contentDetails',
        id: ids.join(',')
      });
    }
    const videos = (details.items || []).map(v => ({
      id: v.id,
      title: v.snippet?.title,
      description: (v.snippet?.description || '').slice(0, 500),
      publishedAt: v.snippet?.publishedAt,
      views: Number(v.statistics?.viewCount || 0),
      likes: Number(v.statistics?.likeCount || 0),
      comments: Number(v.statistics?.commentCount || 0),
      seconds: isoDurationToSeconds(v.contentDetails?.duration),
      url: `https://www.youtube.com/watch?v=${v.id}`
    }));
    res.json({ ok: true, videos });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Mythology AI Content Studio running on http://localhost:${PORT}`);
});
