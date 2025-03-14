import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid server-side rendering issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function Editor() {
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFormatting, setIsFormatting] = useState(false);
  const [formatError, setFormatError] = useState('');

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
      console.log('Sending format request...');
      const response = await fetch('/api/format', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: value }),
      });

      console.log('Response received:', response.status);
      let data;
      
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Failed to parse server response');
      }

      if (!response.ok) {
        console.error('Server error response:', data);
        throw new Error(
          data.details || data.error || 'Failed to format content'
        );
      }

      if (!data.content || typeof data.content !== 'string') {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      setValue(data.content);
      console.log('Formatting successful');
    } catch (error) {
      console.error('Formatting error:', error);
      setFormatError(
        error.message || 'An unexpected error occurred while formatting'
      );
    } finally {
      setIsFormatting(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
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
          <div className="prose dark:prose-invert max-w-none">
            <ReactQuill 
              theme="snow" 
              value={value} 
              onChange={setValue}
              className="bg-white dark:bg-gray-800 min-h-[500px] rounded-md"
            />
          </div>
        )}
      </div>
    </div>
  );
} 