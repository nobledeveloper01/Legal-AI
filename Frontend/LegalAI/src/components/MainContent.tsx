import React, { useState, ChangeEvent } from 'react';

interface AnalysisResult {
  risks: string[];
  summary: string;
  keyPoints: string[];
}

interface MainContentProps {
  onLogout: () => void;
  onFileUpload: (file: File, analysis: AnalysisResult) => void;
  selectedAnalysis: AnalysisResult | null;
}

const MainContent: React.FC<MainContentProps> = ({ onLogout, onFileUpload, selectedAnalysis }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const analyzeDocument = (file: File): AnalysisResult => {
    return {
      risks: [
        `Potential issue with ${file.name} in clause 1`,
        'Ambiguous wording detected',
        'Missing standard clause',
      ],
      summary: `Analysis of ${file.name} indicates some concerns to review.`,
      keyPoints: [
        'Review terms carefully',
        `File size: ${(file.size / 1024).toFixed(2)} KB`,
        'Type: Legal document',
      ],
    };
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.match(/\.(pdf|doc|docx|txt)$/i)) {
        setError('Please upload a valid legal document (PDF, DOC, DOCX, or TXT)');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
      setError('');
      setUploadProgress(0);
      setIsLoading(true);

      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          const analysis = analyzeDocument(selectedFile);
          onFileUpload(selectedFile, analysis);
          setIsLoading(false);
          setFile(null);
          e.target.value = '';
        }
      }, 200);
    }
  };

  return (
    <div className="flex-1 p-5 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 text-transparent bg-clip-text animate-floatIn">
          Legal AI Dashboard
        </h1>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
        >
          Logout
        </button>
      </div>

      {/* Welcome Section (when no analysis is selected) */}
      {!selectedAnalysis && !file && (
        <div className="mb-8 p-6 bg-white rounded-xl shadow-md animate-fadeIn">
          <h2 className="text-xl font-semibold text-gray-800">Welcome to Legal AI</h2>
          <p className="mt-2 text-gray-600">
            Upload a legal document to get started with AI-powered analysis. Identify risks, get summaries, and more!
          </p>
         
        </div>
      )}

      {/* Upload Section */}
      <div className="mb-8 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-102">
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          id="fileUpload"
          disabled={isLoading}
        />
        <label
          htmlFor="fileUpload"
          className="cursor-pointer text-blue-500 hover:text-blue-700 inline-flex items-center transform transition-all duration-300 hover:scale-110"
        >
          <svg className="mr-2 animate-bounce" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z" />
          </svg>
          Upload Legal Document
        </label>
        <p className="mt-2 text-sm text-gray-500">Supports PDF, DOC, DOCX, TXT (Max 10MB)</p>
        {file && (
          <div className="mt-4 animate-slideIn">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg transform transition-all duration-300 hover:scale-102">
              <div className="flex items-center">
                <span className="mr-2 text-blue-500 animate-spin">📄</span>
                <span className="text-gray-700">{file.name}</span>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-red-500 hover:text-red-700 transform transition-all duration-300 hover:rotate-90"
              >
                ✗
              </button>
            </div>
            {uploadProgress > 0 && (
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 mt-2 block animate-pulse">
                  {uploadProgress}% complete
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-xl animate-shake">{error}</div>
      )}

      {/* Analysis Results */}
      {selectedAnalysis && (
        <div className="mt-8 space-y-6 animate-slideIn">
          <div className="p-6 bg-red-50 rounded-xl shadow-md transform transition-all duration-300 hover:scale-102">
            <h3 className="font-semibold text-red-600 mb-3 animate-pulse">Risks Identified</h3>
            <ul className="space-y-2">
              {selectedAnalysis.risks.map((risk, index) => (
                <li
                  key={index}
                  className="flex items-center animate-fadeIn"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className="mr-2 text-red-500">⚠️</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 bg-blue-50 rounded-xl shadow-md transform transition-all duration-300 hover:scale-102">
            <h3 className="font-semibold text-blue-600 mb-3">Summary</h3>
            <p className="text-gray-700 animate-typewriter">{selectedAnalysis.summary}</p>
          </div>

          <div className="p-6 bg-green-50 rounded-xl shadow-md transform transition-all duration-300 hover:scale-102">
            <h3 className="font-semibold text-green-600 mb-3">Key Points</h3>
            <ul className="space-y-2">
              {selectedAnalysis.keyPoints.map((point, index) => (
                <li
                  key={index}
                  className="flex items-center animate-fadeIn"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className="mr-2 text-green-500">✓</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default MainContent;