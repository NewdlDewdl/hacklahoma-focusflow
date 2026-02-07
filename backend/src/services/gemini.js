const { GoogleGenAI } = require('@google/genai');

let ai = null;

function initGemini() {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY missing. AI coaching disabled.');
    return;
  }
  try {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log('✨ Gemini AI ready for coaching (gemini-2.5-flash)');
  } catch (err) {
    console.error('Gemini init failed:', err.message);
  }
}

async function getCoachingMessage(score, trend, distractionType) {
  if (!ai) return 'Let\'s get back into the zone.';

  try {
    const prompt = `Act as a strict but encouraging focus coach.
Context: User is working/studying.
Current Focus Score: ${score}/100.
Trend: ${trend}.
Distraction: ${distractionType || 'unknown'}.

Task: Generate a VERY SHORT (max 6 words) spoken nudge to get them back on track.
Examples: "Eyes on the screen.", "Put the phone down.", "Stay with me.", "Deep breath, refocus."
Output: Text only, no quotes.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (err) {
    console.error('Gemini generation error:', err.message);
    return 'Focus check. You got this.';
  }
}

module.exports = { initGemini, getCoachingMessage };
