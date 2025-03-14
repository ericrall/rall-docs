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

export default function Editor() {
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
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-[66ch] mx-auto"> {/* Limit width to 66 characters */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Rall Docs Editor</h1>
          <button
            onClick={handleFormat}
            disabled={isFormatting || !value}
            className={`px-4 py-2 rounded-md text-white font-medium
              ${isFormatting || !value 
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'}
              transition-colors duration-200`}
          >
            {isFormatting ? 'Formatting...' : 'Format'}
          </button>
        </div>

        {formatError && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400">
            <p className="font-medium">Error formatting document:</p>
            <p className="mt-1">{formatError}</p>
          </div>
        )}

        {!isLoading && (
          <div 
            className="prose dark:prose-invert max-w-none"
            style={{
              '--editor-font-size': `${fontSize}px`,
            }}
          >
            <style jsx global>{`
              .ql-editor {
                font-size: var(--editor-font-size);
                transition: font-size 0.3s ease;
                padding: 2rem;
                min-height: 500px;
                max-width: 66ch;
                margin: 0 auto;
                line-height: 1.6;
                border: none !important;
              }
              .ql-container {
                border: none !important;
              }
              .ql-toolbar {
                border: none !important;
                display: flex;
                justify-content: center;
                padding: 1rem 0;
                background: transparent !important;
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
                background: rgba(0, 0, 0, 0.05);
              }
              .dark .ql-toolbar button:hover {
                background: rgba(255, 255, 255, 0.1);
              }
              .ql-toolbar button.ql-active {
                background: rgba(0, 0, 0, 0.1);
              }
              .dark .ql-toolbar button.ql-active {
                background: rgba(255, 255, 255, 0.2);
              }
              .ql-toolbar .ql-stroke {
                stroke: currentColor;
              }
              .ql-toolbar .ql-fill {
                fill: currentColor;
              }
              .dark .ql-toolbar .ql-stroke {
                stroke: #e2e8f0;
              }
              .dark .ql-toolbar .ql-fill {
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
              className="bg-transparent"
            />
          </div>
        )}
      </div>
    </div>
  );
} 