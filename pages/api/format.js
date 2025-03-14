import OpenAI from 'openai';

// OpenAI API configuration
const OPENAI_CONFIG = {
  model: "gpt-4o-mini",  // Using gpt-4o-mini model
  temperature: 0.3,
  max_tokens: 2000
};

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Formatting prompt template
const FORMAT_PROMPT = `
Please improve the formatting of this text while preserving its meaning.
Add appropriate spacing between paragraphs and sections.
Use actual line breaks, not special characters.

Text to format:`;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content } = req.body || {};
    
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid content',
        details: 'Content must be a non-empty string'
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'Configuration error',
        details: 'OpenAI API key is missing'
      });
    }

    try {
      const completion = await openai.chat.completions.create({
        ...OPENAI_CONFIG,
        messages: [
          {
            role: "user",
            content: `${FORMAT_PROMPT}\n\n${content}`
          }
        ]
      });

      if (!completion?.choices?.[0]?.message?.content) {
        throw new Error('No content received from OpenAI');
      }

      return res.status(200).json({ 
        content: completion.choices[0].message.content,
        model: OPENAI_CONFIG.model
      });

    } catch (openaiError) {
      console.error('OpenAI Error:', openaiError);
      
      if (openaiError.name === 'AuthenticationError') {
        return res.status(401).json({
          error: 'Authentication failed',
          details: 'Invalid OpenAI API key'
        });
      }
      
      if (openaiError.name === 'RateLimitError') {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          details: 'Too many requests to OpenAI API'
        });
      }

      return res.status(503).json({ 
        error: 'OpenAI service error',
        details: openaiError.message
      });
    }

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      details: error.message
    });
  }
} 