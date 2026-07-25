import { Request, Response } from 'express';

export const parseStandupWithAI = async (req: Request, res: Response) => {
  try {
    const { text, audioBase64, mimeType, apiKey } = req.body;

    const geminiKey = apiKey || process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return res.status(400).json({ 
        error: 'Missing Gemini API Key. Please provide a free Gemini API key from https://aistudio.google.com/app/apikey' 
      });
    }

    if (!text && !audioBase64) {
      return res.status(400).json({ error: 'Please provide either text or audio data for AI processing.' });
    }

    const systemPrompt = `You are an expert Tech Lead Scrum Master AI. Analyze the following spoken standup update or audio and extract structured items into JSON format.

JSON Structure expected:
{
  "yesterday": [
    { "text": "Clean task description", "hours": "estimated or logged hours as string, e.g. 3.5 or empty string" }
  ],
  "today": [
    { "text": "Clean planned task description", "hours": "estimated hours as string, e.g. 2.0 or empty string" }
  ],
  "blockers": [
    "Clean description of blockers, dependencies or impediments"
  ]
}

Rules:
1. Classify completed past work into "yesterday".
2. Classify future/current planned work (e.g. "will be looking into", "today", "focusing on") into "today".
3. Classify impediments into "blockers".
4. Extract spoken numbers related to time (e.g. "3 hours", "half a day" = 4) into the "hours" field.
5. Return ONLY valid JSON without markdown wrapping or code blocks.`;

    const contents: any[] = [];

    if (audioBase64) {
      contents.push({
        parts: [
          { text: systemPrompt },
          {
            inline_data: {
              mime_type: mimeType || 'audio/webm',
              data: audioBase64
            }
          }
        ]
      });
    } else {
      contents.push({
        parts: [
          { text: `${systemPrompt}\n\nSpoken Standup Text:\n"${text}"` }
        ]
      });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

    const apiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      console.error('Gemini API Error:', errText);
      return res.status(500).json({ error: `Gemini API returned error: ${apiResponse.statusText}` });
    }

    const data: any = await apiResponse.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Clean potential markdown quotes
    const cleanJsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanJsonString);

    return res.json({
      success: true,
      data: parsedData
    });
  } catch (error: any) {
    console.error('AI Standup Parsing Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process AI standup parsing' });
  }
};
