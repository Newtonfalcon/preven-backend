import OpenAI from 'openai';
import 'dotenv/config'

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});



export async function summarizeText(rawText) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant', // Super fast & free
    messages: [
      {
        role: 'system',
        content: 'You are a medical summarizer. Output strictly valid JSON.',
      },
      {
        role: 'user',
        content: rawText,
      },
    ],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
}