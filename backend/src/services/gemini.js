const { GoogleGenerativeAI } = require('@google/generative-ai');

let model = null;

function initGemini() {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY missing. AI coaching disabled.');
    return;
  }
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Fast, low-latency model for nudges
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('✨ Gemini AI ready (gemini-1.5-flash)');
  } catch (err) {
    console.error('Gemini init failed:', err.message);
  }
}

async function getCoachingMessage(score, trend, distractionType) {
  if (!model) return "Let's get back into the zone.";

  try {
    const prompt = `Act as a strict but encouraging focus coach.\nContext: User is working/studying.\nCurrent Focus Score: ${score}/100.\nTrend: ${trend}.\nDistraction: ${distractionType || 'unknown'}.\n\nTask: Generate a VERY SHORT (max 6 words) spoken nudge to get them back on track.\nExamples: "Eyes on the screen.", "Put the phone down.", "Stay with me.", "Deep breath, refocus."\nOutput: Text only, no quotes.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('Gemini generation error:', err.message);
    return 'Focus check. You got this.';
  }
}

module.exports = { initGemini, getCoachingMessage };