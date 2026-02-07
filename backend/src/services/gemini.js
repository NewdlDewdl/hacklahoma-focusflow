const { GoogleGenerativeAI } = require("@google/generative-ai");

let model;

function initGemini() {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ GEMINI_API_KEY missing. AI coaching disabled.");
    return;
  }
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-pro" });
    console.log("✨ Gemini AI ready for coaching");
  } catch (err) {
    console.error("Gemini init failed:", err.message);
  }
}

async function getCoachingMessage(score, trend, distractionType) {
  // Fallback if not configured
  if (!model) return "Let's get back into the zone.";
  
  try {
    const prompt = `
      Act as a strict but encouraging focus coach.
      Context: User is working/studying.
      Current Focus Score: ${score}/100.
      Trend: ${trend}.
      Distraction: ${distractionType || "unknown"}.
      
      Task: Generate a VERY SHORT (max 6 words) spoken nudge to get them back on track.
      Examples: "Eyes on the screen.", "Put the phone down.", "Stay with me.", "Deep breath, refocus."
      Output: Text only.
    `;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return text;
  } catch (err) {
    console.error("Gemini generation error:", err.message);
    return "Focus check. You got this.";
  }
}

module.exports = { initGemini, getCoachingMessage };