import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function analyzeDocument(filePath, extractedText = '') {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString('base64');
    const mimeType = getMimeType(filePath);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a legal document analyst for a law firm. Extract key information from documents.

Return JSON with these fields:
{
  "parties": ["Party 1", "Party 2"],
  "important_dates": ["2024-01-15", "2024-03-20"],
  "key_terms": [{"label": "Contract Amount", "value": "$50,000"}, {"label": "Duration", "value": "12 months"}],
  "deadlines": ["2024-06-30: Filing deadline", "2024-07-15: Response due"],
  "legal_citations": ["Cal. Civ. Code § 1234", "U.S.C. § 1983"],
  "summary": "Brief 2-3 sentence summary of the document"
}

Be thorough but concise. If a field has no data, return an empty array/object.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: extractedText ? `Document text: ${extractedText.substring(0, 3000)}\n\nAnalyze this document and extract key information.` : "Analyze this document image and extract key information."
            },
            ...(mimeType ? [{
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` }
            }] : [])
          ]
        }
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Document analysis error:', error);
    return {
      parties: [],
      important_dates: [],
      key_terms: [],
      deadlines: [],
      legal_citations: [],
      summary: "Failed to analyze document"
    };
  }
}

function getMimeType(filePath) {
  const ext = filePath.toLowerCase().split('.').pop();
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif'
  };
  return mimeTypes[ext] || null;
}

export default { analyzeDocument };
