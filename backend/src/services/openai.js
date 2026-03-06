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
          content: `You are a financial document analyst for an accounting firm. Extract key information from receipts, invoices, and financial documents.

Return JSON with these fields:
{
  "vendor": "Company Name",
  "amount": 123.45,
  "date": "2024-03-15",
  "category": "Office Supplies",
  "payment_method": "Credit Card",
  "line_items": [
    {"description": "Item 1", "amount": 50.00},
    {"description": "Item 2", "amount": 73.45}
  ],
  "tax_amount": 12.34,
  "subtotal": 111.11,
  "receipt_number": "12345",
  "notes": "Any additional notes"
}

Categories to choose from: Office Supplies, Meals, Travel, Equipment, Software, Services, Utilities, Rent, Insurance, Professional Services, Marketing, Other

Be thorough. If a field has no data, use null or empty arrays.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: extractedText ? `Document text: ${extractedText.substring(0, 3000)}\n\nAnalyze this financial document.` : "Analyze this receipt/invoice and extract financial information."
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
      vendor: null,
      amount: 0,
      date: null,
      category: 'Other',
      payment_method: null,
      line_items: [],
      tax_amount: 0,
      subtotal: 0,
      receipt_number: null,
      notes: "Failed to analyze document"
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
