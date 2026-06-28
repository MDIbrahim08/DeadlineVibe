const fs = require('fs');
require('dotenv').config();

const apiKey = process.env.GROQ_API_KEY;

const systemPrompt = `You are the DeadlineVibe Weekly Review AI. Generate an insightful, motivating weekly summary.
Task data provided. Stats: 0 completed, 9 overdue, top category: Mixed.
Be warm, data-driven, and forward-looking. Use specific numbers. Keep each field concise (2-3 sentences max).

Return a JSON object with EXACTLY these keys:
- "momentum": string (e.g. "accelerating", "stable", "declining")
- "aiNarrative": string (the main summary)
- "winHighlight": string (biggest win)
- "nextWeekFocus": string (what to focus on next)`;

fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt + '\n\nIMPORTANT: You must return ONLY valid JSON.' },
      { role: 'user', content: 'Weekly task review:\n[]' }
    ],
    response_format: { type: 'json_object' }
  })
}).then(r => r.json()).then(d => console.log(d.choices[0].message.content)).catch(console.error);
