import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid server-side rendering issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

// Custom Quill modules configuration
const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['clean']
  ]
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
  const [fontSize, setFontSize] = useState(16); // Default font size

  // Calculate font size based on content length
  useEffect(() => {
    if (value) {
      const length = value.length;
      let newSize;
      if (length < 500) {
        newSize = 18; // Larger font for shorter content
      } else if (length < 2000) {
        newSize = 16; // Medium font for moderate content
      } else {
        newSize = 14; // Smaller font for longer content
      }
      setFontSize(newSize);
    }
  }, [value]);

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
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 font-['Helvetica'] flex flex-col items-center">
      <div className="w-full max-w-[66ch] mx-auto flex flex-col items-center">
        <div className="w-full flex justify-center mb-8">
          <h1 className="text-4xl font-light tracking-wide">Rall Docs.</h1>
        </div>

        {formatError && (
          <div className="w-full mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400">
            <p className="font-medium">Error enhancing document:</p>
            <p className="mt-1">{formatError}</p>
          </div>
        )}

        {!isLoading && (
          <div 
            className="prose dark:prose-invert max-w-none w-full"
            style={{
              '--editor-font-size': `${fontSize}px`,
            }}
          >
            <style jsx global>{`
              body {
                font-family: Helvetica, sans-serif;
              }
              .ql-editor {
                font-family: Helvetica, sans-serif;
                font-size: var(--editor-font-size);
                transition: font-size 0.3s ease;
                padding: 2rem;
                min-height: 500px;
                max-width: 66ch;
                margin: 0 auto;
                line-height: 1.6;
                border: none !important;
                background: #1a2f1a !important;
                border-radius: 0 0 8px 8px !important;
              }
              .ql-container {
                font-family: Helvetica, sans-serif !important;
                border: none !important;
              }
              .ql-toolbar {
                font-family: Helvetica, sans-serif;
                border: none !important;
                display: flex;
                justify-content: center;
                padding: 1rem;
                background: #234023 !important;
                border-radius: 8px 8px 0 0 !important;
              }
              .ql-formats {
                display: flex;
                gap: 0.5rem;
              }
              .ql-toolbar button {
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 0.375rem;
                transition: all 0.2s;
              }
              .ql-toolbar button:hover {
                background: rgba(255, 255, 255, 0.1);
              }
              .ql-toolbar button.ql-active {
                background: rgba(255, 255, 255, 0.2);
              }
              .ql-toolbar .ql-stroke {
                stroke: #e2e8f0;
              }
              .ql-toolbar .ql-fill {
                fill: #e2e8f0;
              }
              .dark .ql-editor {
                color: #e2e8f0;
              }
              /* Remove default Quill styles */
              .ql-snow * {
                border: none !important;
                box-shadow: none !important;
              }
            `}</style>
            <ReactQuill 
              theme="snow"
              value={value} 
              onChange={setValue}
              modules={modules}
              formats={formats}
              className="bg-transparent mb-8"
            />

            <div className="w-full flex justify-center">
              <button
                onClick={handleFormat}
                disabled={isFormatting || !value}
                className={`
                  w-[66ch] flex items-center justify-center gap-2 px-6 py-4
                  text-base font-medium tracking-wide
                  transition-all duration-200
                  border border-green-900 rounded-lg
                  ${isFormatting || !value 
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-300 hover:bg-green-900/50 active:bg-green-900'}
                `}
              >
                <span className="relative">
                  {isFormatting ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </span>
                <span>{isFormatting ? 'Enhancing...' : 'Enhance'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 