import React, { useState, useEffect, useCallback } from 'react';
import dots_loading from '../assets/images/dots_loading.svg';
import { useAuth } from '../hooks/useAuth';
import { ErrorMessage } from '../utils/msg';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Define types for better type checking and code clarity
type Policy = string;
type Company = string;
type Policies = Record<Company, Policy[]>;

const Gpt: React.FC = () => {
  // State management using useState hooks
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [company1, setCompany1] = useState('');
  const [pdf1, setPdf1] = useState('');
  const [company2, setCompany2] = useState('');
  const [pdf2, setPdf2] = useState('');
  const [parsedAnswer, setParsedAnswer] = useState('');

  // Custom hook for authentication and related functions
  const { askQuestion, comparePolicies, user } = useAuth();

  // Get policies from user object, defaulting to an empty object if undefined
  const policies: Policies = user?.policies || {};

  // Memoized function to handle form submission
  const handleSubmit = useCallback(async () => {
    // Validate input before proceeding
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result: string;

      if (isCompareMode) {
        // Validate inputs for compare mode
        if (!company1 || !pdf1 || !company2 || !pdf2) {
          throw new Error('Please select both policies for comparison');
        }
        const policy1 = `${company1}/${pdf1}`;
        const policy2 = `${company2}/${pdf2}`;
        result = await comparePolicies(policy1, policy2, question);
      } else {
        // Validate inputs for question mode
        if (!company1 || !pdf1) {
          throw new Error('Please select a company and policy');
        }
        const formattedQuestion = `${company1}, ${pdf1}, "${question}"`;
        result = await askQuestion(formattedQuestion);
      }

      setAnswer(result);
    } catch (error) {
      console.error('Error processing request:', error);
      setError(
        error instanceof Error ? error.message : 'An unknown error occurred',
      );
      setAnswer('');
    } finally {
      setLoading(false);
    }
  }, [
    question,
    isCompareMode,
    company1,
    pdf1,
    company2,
    pdf2,
    comparePolicies,
    askQuestion,
  ]);

  // Effect to parse markdown and sanitize HTML when answer changes
  useEffect(() => {
    const parseMarkdown = async () => {
      if (answer) {
        const rawMarkup = await marked(answer);
        const sanitizedMarkup = DOMPurify.sanitize(rawMarkup);
        setParsedAnswer(sanitizedMarkup);
      }
    };

    parseMarkdown();
  }, [answer]);

  // Render the component
  return (
    <div className="flex h-full w-1/2 flex-col p-8">
      {/* Answer Box */}
      <div className="mb-2 h-1/2">
        <div className="h-full w-full rounded-md border border-slate-600 bg-slate-800 bg-opacity-30 p-4 shadow-lg backdrop-blur-lg backdrop-filter">
          <div className="h-full overflow-auto">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <img src={dots_loading} alt="Loading..." />
              </div>
            ) : error ? (
              <ErrorMessage error={error} />
            ) : parsedAnswer ? (
              <div
                className="text-white"
                dangerouslySetInnerHTML={{ __html: parsedAnswer }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-center text-white">
                Your answer will appear here
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Policy Comparison and Q&A Section */}
      <div className="w-full rounded-md border border-slate-600 bg-slate-800 bg-opacity-30 p-8 shadow-lg backdrop-blur-lg backdrop-filter">
        <h1 className="mb-6 text-center text-4xl font-bold text-white">
          Q&A and Policy comparison
        </h1>

        {/* Toggle switch for mode selection */}
        <div className="mb-4 flex items-center justify-center">
          <label className="mr-2 text-white">Policy question</label>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={isCompareMode}
              onChange={() => setIsCompareMode(!isCompareMode)}
            />
            <div className="peer relative h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
          </label>
          <label className="ml-2 text-white">Compare Policies</label>
        </div>

        {/* Company and Policy selection for the first policy */}
        <div className="mb-4 flex justify-between">
          <select
            className="w-[48%] rounded border-2 bg-gray-500 p-2 text-white"
            value={company1}
            onChange={(e) => {
              setCompany1(e.target.value);
              setPdf1('');
            }}
          >
            <option value="">Select Company</option>
            {Object.keys(policies).map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
          <select
            className="w-[48%] rounded border-2 bg-gray-500 p-2 text-white"
            value={pdf1}
            onChange={(e) => setPdf1(e.target.value)}
            disabled={!company1}
          >
            <option value="">Select Policy</option>
            {company1 &&
              policies[company1].map((pdf) => (
                <option key={pdf} value={pdf}>
                  {pdf}
                </option>
              ))}
          </select>
        </div>

        {/* Company and Policy selection for the second policy (only in compare mode) */}
        {isCompareMode && (
          <div className="mb-4 flex justify-between">
            <select
              className="w-[48%] rounded border-2 bg-gray-500 p-2 text-white"
              value={company2}
              onChange={(e) => {
                setCompany2(e.target.value);
                setPdf2('');
              }}
            >
              <option value="">Select Company</option>
              {Object.keys(policies).map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
            <select
              className="w-[48%] rounded border-2 bg-gray-500 p-2 text-white"
              value={pdf2}
              onChange={(e) => setPdf2(e.target.value)}
              disabled={!company2}
            >
              <option value="">Select Policy</option>
              {company2 &&
                policies[company2].map((pdf) => (
                  <option key={pdf} value={pdf}>
                    {pdf}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Question input and submit button */}
        <div className="relative my-4">
          <input
            type="text"
            className="peer block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2.5 text-sm text-white focus:border-blue-600 focus:text-white focus:outline-none focus:ring-0 dark:focus:border-blue-500"
            placeholder={
              isCompareMode
                ? 'Specify comparison ex. Parking damage'
                : 'Specify question ex. Young drivers'
            }
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button
            className="mt-6 w-full rounded bg-blue-500 py-2 text-[18px] text-white transition-colors duration-300 hover:bg-blue-600"
            onClick={handleSubmit}
          >
            {isCompareMode ? 'Compare Policies' : 'Send Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Gpt;
