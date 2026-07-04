# Mythology AI Content Studio

A real web tool for a Mythology YouTube channel.

It helps you generate:

- Viral Shorts and long-video topics
- Complete script with timestamp, voice-over, visual, SFX, BGM
- Cinematic AI image prompts
- Image-to-video prompts
- Voice-over guide
- SEO pack: titles, description, tags, 40 hashtags, pinned comments
- Video analyzer: score, mistakes, retention drops, improved hook, editing fixes
- Optional YouTube Data API: trend search and channel recent videos

## 1. Install

```bash
npm install
```

## 2. Setup API keys

Copy `.env.example` to `.env`:

```bash
copy .env.example .env
```

On Mac/Linux:

```bash
cp .env.example .env
```

Edit `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash
YOUTUBE_API_KEY=your_youtube_data_api_key_here
PORT=3000
```

`YOUTUBE_API_KEY` is optional. Without it, YouTube Data tab will not work, but Gemini content generation will work.

## 3. Run locally

```bash
npm start
```

Open:

```text
http://localhost:3000
```

## 4. Development mode

```bash
npm run dev
```

## 5. Render deploy

- Push this folder to GitHub.
- Render → New Web Service → select repo.
- Build command: `npm install`
- Start command: `npm start`
- Environment Variables:
  - `GEMINI_API_KEY`
  - `GEMINI_MODEL`
  - `YOUTUBE_API_KEY` optional
  - `NODE_ENV=production`

## 6. Notes

- Real AI output needs `GEMINI_API_KEY`.
- Without Gemini key, app runs in demo mode so UI can be tested.
- Video upload analyzer supports small MP4/WebM/MOV/audio files up to 22MB. For bigger videos, paste transcript/script.
- The tool estimates viral potential. It cannot guarantee virality.
- Keep API keys only in `.env` or Render environment variables. Never paste keys in frontend code.
