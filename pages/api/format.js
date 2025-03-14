import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ 
      error: 'OpenAI API key not configured. Please add your API key to .env.local' 
    });
  }

  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that formats text to be more readable while preserving its meaning. Format the text to:"
            + "\n- Fix spacing around punctuation"
            + "\n- Ensure proper capitalization"
            + "\n- Add paragraph breaks"
            + "\n- Remove unnecessary whitespace"
            + "\n- Fix common typographical errors"
            + "\nOnly return the formatted text without any additional commentary."
        },
        {
          role: "user",
          content: content
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const formattedText = completion.choices[0].message.content;

    return res.status(200).json({
      content: formattedText,
      model: completion.model
    });

  } catch (error) {
    console.error('OpenAI API error:', error);

    if (error.code === 'invalid_api_key') {
      return res.status(500).json({ 
        error: 'Invalid OpenAI API key. Please check your API key in .env.local'
      });
    }

    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({
        error: 'OpenAI rate limit exceeded. Please try again later.'
      });
    }

    return res.status(500).json({
      error: 'Error formatting text. Please try again later.'
    });
  }
}

function formatText(text) {
  // Split into paragraphs and process each one
  let paragraphs = text.split(/\n\s*\n/);
  
  paragraphs = paragraphs.map(paragraph => {
    // Basic formatting for each paragraph
    let formatted = paragraph
      // Remove multiple spaces and normalize whitespace within lines
      .replace(/[ \t]+/g, ' ')
      .trim();

    // Ensure proper spacing around punctuation
    formatted = formatted
      .replace(/\s*([.!?,])\s*/g, '$1 ')  // Add space after punctuation
      .replace(/\s+([.!?,])/g, '$1')      // Remove space before punctuation
      .trim();

    // Ensure proper capitalization
    formatted = formatted
      .replace(/\. ([a-z])/g, (match, letter) => `. ${letter.toUpperCase()}`)  // After periods
      .replace(/^[a-z]/, letter => letter.toUpperCase());  // First letter of paragraph

    return formatted;
  });

  // Join paragraphs with double newlines
  return paragraphs.join('\n\n');
} 