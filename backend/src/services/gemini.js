const { GoogleGenAI } = require('@google/genai');

let model = null;
let genAI = null;

function initGemini() {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY missing. AI coaching disabled.');
    return;
  }
  try {
    genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    model = 'gemini-2.5-flash';
    console.log('✨ Gemini AI ready (gemini-2.5-flash)');
  } catch (err) {
    console.error('Gemini init failed:', err.message);
  }
}

async function getCoachingMessage(score, trend, distractionType) {
  if (!genAI) return "Let's get back into the zone.";

  try {
    const prompt = `Act as a strict but encouraging focus coach.\nContext: User is working/studying.\nCurrent Focus Score: ${score}/100.\nTrend: ${trend}.\nDistraction: ${distractionType || 'unknown'}.\n\nTask: Generate a VERY SHORT (max 6 words) spoken nudge to get them back on track.\nExamples: "Eyes on the screen.", "Put the phone down.", "Stay with me.", "Deep breath, refocus."\nOutput: Text only, no quotes.`;

    const result = await genAI.models.generateContent({
      model,
      contents: prompt,
    });
    return result.text.trim();
  } catch (err) {
    console.error('Gemini generation error:', err.message);
    return 'Focus check. You got this.';
  }
}

module.exports = { initGemini, getCoachingMessage };
