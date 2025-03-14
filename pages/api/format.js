import fetch from 'node-fetch';
import https from 'https';

const DEEPINFRA_API_URL = 'https://api.deepinfra.com/v1/openai/chat/completions';

// Create an HTTPS agent with more lenient settings
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Allow self-signed certificates
  keepAlive: true,
  timeout: 60000 // 60 seconds
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if DeepInfra API key is configured
  if (!process.env.DEEPINFRA_API_KEY) {
    return res.status(500).json({ 
      error: 'DeepInfra API key not configured. Please add your API key to .env.local' 
    });
  }

  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  // Retry logic
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Making request to DeepInfra API (attempt ${attempt}/${maxRetries})...`);
      
      const response = await fetch(DEEPINFRA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPINFRA_API_KEY}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that formats text to be more readable while preserving its meaning. Format the text by fixing spacing around punctuation, ensuring proper capitalization, removing unnecessary whitespace, and fixing common typographical errors. Agressively add line breaks with extra line breaks to separate content logically. Only return the formatted text without any additional commentary except add Done at the end."
            },
            {
              role: "user",
              content: content
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        }),
        agent: httpsAgent,
        timeout: 60000 // 60 second timeout
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Attempt ${attempt} failed:`, {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url: DEEPINFRA_API_URL
        });
        throw new Error(`DeepInfra API error: ${response.statusText} (${response.status})\n${errorData}`);
      }

      const completion = await response.json();
      console.log('DeepInfra API response:', JSON.stringify(completion, null, 2));

      const formattedText = completion.choices[0].message.content;

      if (!formattedText) {
        throw new Error('No text was generated');
      }

      return res.status(200).json({
        content: formattedText,
        model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo'
      });

    } catch (error) {
      console.error(`Attempt ${attempt} error:`, {
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });

      lastError = error;

      // If this isn't our last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  // If we get here, all attempts failed
  if (lastError.message.includes('unauthorized')) {
    return res.status(500).json({ 
      error: 'Invalid DeepInfra API key. Please check your API key in .env.local'
    });
  }

  if (lastError.message.includes('rate limit')) {
    return res.status(429).json({
      error: 'DeepInfra rate limit exceeded. Please try again later.'
    });
  }

  return res.status(503).json({
    error: `Failed to connect to DeepInfra API after ${maxRetries} attempts. Please try again later.`
  });
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