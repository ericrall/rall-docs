import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid server-side rendering issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

// Custom Quill modules configuration
const modules = {
  toolbar: false  // Disable the toolbar
};

// Custom formats allowed in the editor
const formats = [
  'header',
  'bold', 'italic', 'underline',
  'list', 'bullet'
];

export default function Home() {
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFormatting, setIsFormatting] = useState(false);
  const [formatError, setFormatError] = useState('');
  const [isAnimating, setIsAnimating] = useState(true);
  const [visibleChars, setVisibleChars] = useState([]);
  const [scrambledText, setScrambledText] = useState([]);

  // Handle the typing animation
  useEffect(() => {
    const text = 'rall docs.';
    const chars = text.split('');
    
    if (isAnimating) {
      // Reset states with initial values
      setVisibleChars(new Array(chars.length).fill(false));
      setScrambledText(new Array(chars.length).fill(''));
      
      const scrambleChar = () => {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
        return possible.charAt(Math.floor(Math.random() * possible.length));
      };

      let currentChar = 0;
      const revealNextChar = () => {
        if (currentChar < chars.length) {
          // Update both states synchronously
          setVisibleChars(prev => {
            const newVisible = [...prev];
            newVisible[currentChar] = true;
            return newVisible;
          });
          
          setScrambledText(prev => {
            const newScrambled = [...prev];
            // Clear current character
            newScrambled[currentChar] = '';
            // Only scramble upcoming characters
            for (let i = currentChar + 1; i < chars.length; i++) {
              newScrambled[i] = scrambleChar();
            }
            return newScrambled;
          });
          
          currentChar++;
          setTimeout(revealNextChar, 150);
        } else {
          setIsAnimating(false);
          setScrambledText(new Array(chars.length).fill(''));
        }
      };

      // Start the sequence
      revealNextChar();

      return () => {
        // Cleanup
        setVisibleChars(new Array(chars.length).fill(true));
        setScrambledText(new Array(chars.length).fill(''));
        setIsAnimating(false);
      };
    }
  }, []); // Only run once on mount

  // Load saved content from localStorage when component mounts
  useEffect(() => {
    try {
      const savedContent = localStorage.getItem('documentContent');
      if (savedContent) {
        setValue(savedContent);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    setIsLoading(false);
  }, []);

  // Auto-save content to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('documentContent', value);
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  }, [value, isLoading]);

  // Handle format button click
  const handleFormat = async () => {
    setIsFormatting(true);
    setFormatError('');

    try {
      const response = await fetch('/api/format', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: value }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Failed to parse server response');
      }

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to format content');
      }

      if (!data.content || typeof data.content !== 'string') {
        throw new Error('Invalid response format from server');
      }

      // Convert \n\n to proper line breaks for ReactQuill
      const formattedContent = data.content
        .replace(/\n\n/g, '</p><p><br></p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');

      setValue(formattedContent);
    } catch (error) {
      setFormatError(error.message || 'An unexpected error occurred while formatting');
    } finally {
      setIsFormatting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <style jsx global>{`
        :root {
          --title-bg: #0F172A;
          --guide-color: #3b82f6;
          --editor-bg: #1E293B;
          --button-bg: #3b82f6;
          --content-width: min(90vw, 66ch);
          --editor-padding: clamp(1rem, 5vw, 2rem);
        }

        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400&display=swap');

        /* Global background */
        body {
          background-color: #000;
          margin: 0;
          padding: 0;
          min-height: 100vh;
          font-family: Inter, Helvetica, Arial, sans-serif;
          color: white;
          font-size: clamp(16px, 4vw, 18px);
          -webkit-text-size-adjust: 100%;
        }

        /* Title styles */
        .logo-section {
          width: 100%;
          background: var(--title-bg);
          padding: clamp(1rem, 5vw, 2rem) 0;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .logo-container {
          width: var(--content-width);
          margin: 0 auto;
          text-align: center;
          position: relative;
        }
        .logo {
          font-family: 'Inter', sans-serif;
          font-weight: 300;
          letter-spacing: -0.03em;
          color: #fff;
        }
        .period {
          color: #60A5FA;
        }

        /* Editor styles */
        .editor-container {
          width: var(--content-width);
          margin: 0 auto;
          padding: var(--editor-padding) 0;
          position: relative;
        }

        .enhance-button {
          position: absolute;
          top: var(--editor-padding);
          left: 0;
          right: 0;
          width: 100%;
          padding: clamp(0.75rem, 3vw, 1.25rem);
          font-size: clamp(1rem, 3vw, 1.25rem);
          font-weight: 500;
          text-align: center;
          border-radius: 12px;
          background: var(--button-bg);
          color: white;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 10;
        }

        .enhance-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes rainbow-bg {
          0% { background: #60A5FA; }
          20% { background: #818CF8; }
          40% { background: #C084FC; }
          60% { background: #F472B6; }
          80% { background: #FB7185; }
          100% { background: #60A5FA; }
        }

        .enhance-button.dazzling {
          animation: rainbow-bg 2s linear infinite;
          background-size: 200% auto;
        }

        .ql-editor {
          min-height: clamp(300px, 70vh, 600px);
          background: var(--editor-bg);
          border-radius: clamp(8px, 3vw, 16px);
          color: #E2E8F0;
          font-family: "Inter", sans-serif !important;
          font-size: clamp(16px, 4vw, 24px) !important;
          line-height: 1.6;
          padding: clamp(3rem, 10vw, 5rem) var(--editor-padding) var(--editor-padding) !important;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          border: 1px solid rgba(59, 130, 246, 0.2);
          margin: 0 auto;
        }

        .ql-editor p {
          font-size: inherit !important;
          font-family: inherit !important;
        }

        .ql-container {
          height: auto;
          border: none !important;
          font-family: inherit !important;
        }

        .ql-toolbar {
          display: none !important;
        }

        /* Mobile optimizations */
        @media (max-width: 480px) {
          .error-message {
            margin: 1rem;
            padding: 1rem !important;
            font-size: 0.9rem !important;
          }
          
          .error-message p:first-child {
            font-size: 1rem !important;
          }
        }
      `}</style>

      {/* Logo section */}
      <div className="logo-section">
        <div className="logo-container">
          <h1 className="logo text-4xl sm:text-5xl md:text-7xl select-none">
            rall docs<span className="period">.</span>
          </h1>
        </div>
      </div>

      {/* Main content */}
      <div className="editor-container">
        {formatError && (
          <div className="error-message mb-8 p-6 rounded-xl bg-red-500/20 border border-red-500/30" style={{ backdropFilter: 'blur(8px)' }}>
            <p className="font-medium text-red-300 text-xl">Error enhancing document:</p>
            <p className="mt-2 text-red-200 text-lg">{formatError}</p>
          </div>
        )}

        {!isLoading && (
          <>
            <ReactQuill 
              theme="snow"
              value={value} 
              onChange={setValue}
              modules={modules}
              formats={formats}
            />

            <button
              onClick={handleFormat}
              disabled={isFormatting || !value}
              className={`enhance-button ${isFormatting ? 'dazzling' : ''}`}
            >
              {isFormatting ? 'dazzling...' : 'dazzle'}
            </button>
          </>
        )}
      </div>
    </div>
  );
} 