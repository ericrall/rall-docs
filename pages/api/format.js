import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Formatting prompt for consistent results
const FORMATTING_PROMPT = `
Please improve the formatting and organization of the following text while preserving its meaning.
Focus heavily on readability through proper spacing and structure.

Key formatting requirements:
1. Add blank lines between paragraphs
2. Add blank lines between different topics or sections
3. Add blank lines before and after headings
4. Add blank lines before and after lists
5. Keep text aligned and properly indented
6. Preserve any existing formatting like bold, italic, or code blocks

Important: Use actual blank lines for spacing. Do not use markdown separators (***) or other special characters for spacing.
Always err on the side of more spacing rather than less.`;

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract content from request body
    const { content } = req.body;

    // Validate content
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }

    try {
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: FORMATTING_PROMPT
          },
          {
            role: "user",
            content: content
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent formatting
        max_tokens: 2000, // Adjust based on your needs
      });

      // Extract the formatted content from the response
      const formattedContent = completion.choices[0].message.content;

      // Return the formatted content
      return res.status(200).json({ 
        content: formattedContent,
        usage: completion.usage
      });

    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      return res.status(500).json({ 
        error: 'Error while formatting content',
        details: openaiError.message 
      });
    }

  } catch (error) {
    // Handle any other errors
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
} 