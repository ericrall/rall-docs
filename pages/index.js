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
  const [visibleChars, setVisibleChars] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Handle the typing animation
  useEffect(() => {
    if (isAnimating) {
      setVisibleChars(0);
      setCursorPosition(0);
      const text = 'Rall Docs.';
      let currentChar = 0;

      const typingInterval = setInterval(() => {
        if (currentChar <= text.length) {
          setCursorPosition(currentChar);
          setVisibleChars(currentChar);
          currentChar++;
        } else {
          clearInterval(typingInterval);
          setTimeout(() => {
            setIsAnimating(false);
            setCursorPosition(-1); // Hide cursor after animation
          }, 500);
        }
      }, 100);

      return () => clearInterval(typingInterval);
    }
  }, [isAnimating]);

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

      setValue(data.content);
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
          --accent-glow: 0 0 20px rgba(59, 130, 246, 0.5);
          --content-width: 66ch;
        }

        /* Global background */
        body {
          background-color: #000;
          margin: 0;
          padding: 0;
          min-height: 100vh;
          font-family: Helvetica, Arial, sans-serif;
          color: white;
          font-size: 18px;
        }

        /* Title animation styles */
        .logo-section {
          width: 100%;
          background: var(--title-bg);
          padding: 2rem 0;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .logo-container {
          width: var(--content-width);
          margin: 0 auto;
          text-align: center;
        }
        .char {
          display: inline-block;
          opacity: 0;
          transition: opacity 0.1s ease-out;
          color: #fff;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }
        .char.visible {
          opacity: 1;
        }
        .cursor {
          position: absolute;
          top: 0;
          width: 2px;
          height: 100%;
          background-color: #3b82f6;
          animation: blink 1s step-end infinite;
          transition: transform 0.1s ease-out;
          box-shadow: var(--accent-glow);
          opacity: 0;
        }
        .cursor.visible {
          opacity: 1;
        }

        /* Editor styles */
        .editor-container {
          width: var(--content-width);
          margin: 0 auto;
          padding: 2rem 0;
          position: relative;
        }

        .enhance-button {
          position: absolute;
          top: 2rem;
          left: 0;
          right: 0;
          width: 100%;
          padding: 1.25rem;
          font-size: 1.25rem;
          font-weight: 500;
          text-align: center;
          border-radius: 12px;
          background: var(--button-bg);
          color: white;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: var(--accent-glow);
          z-index: 10;
        }

        .ql-editor {
          min-height: 600px;
          background: var(--editor-bg);
          border-radius: 16px;
          color: #E2E8F0;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif !important;
          font-size: 24px !important;  /* Set a large default size */
          line-height: 1.6;
          padding: 5rem 2rem 2rem !important;
          width: 100% !important;
          max-width: 66ch !important;  /* Enforce 66 character width */
          box-sizing: border-box !important;
          border: 1px solid rgba(59, 130, 246, 0.2);
          box-shadow: var(--accent-glow);
          margin: 0 auto;  /* Center the editor */
        }

        .ql-editor p {
          font-size: inherit !important;
        }

        .ql-container {
          height: auto;
          border: none !important;
          font-family: inherit !important;
        }

        .ql-toolbar {
          display: none !important;
        }
      `}</style>

      {/* Logo section */}
      <div className="logo-section">
        <div className="logo-container">
          <h1 
            className="text-7xl font-light tracking-wider select-none"
            onMouseEnter={() => setIsAnimating(true)}
          >
            {'Rall Docs.'.split('').map((char, index) => (
              <span
                key={index}
                className={`char ${index < visibleChars ? 'visible' : ''}`}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
            <span 
              className={`cursor ${cursorPosition >= 0 ? 'visible' : ''}`}
              style={{
                transform: `translateX(${cursorPosition * 0.61}em)`
              }}
            />
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
              className="enhance-button"
            >
              {isFormatting ? 'Formatting...' : 'Format'}
            </button>
          </>
        )}
      </div>
    </div>
  );
} 