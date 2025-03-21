import React, { useState, ChangeEvent, useRef } from "react";
import { showToast } from "./ShowToast";

interface AnalysisResult {
  risks: string[];
  summary: string;
  keyPoints: string[];
}

interface MainContentProps {
  onLogout: () => void;
  onFileUpload: (file: File) => Promise<AnalysisResult>;
  selectedAnalysis: AnalysisResult | null;
  isUploadLoading: boolean;
  remainingUploads: number;
}

const MainContent: React.FC<MainContentProps> = ({
  onLogout,
  onFileUpload,
  selectedAnalysis,
  isUploadLoading,
  remainingUploads,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxUploads = 10;
  const isUploadDisabled = isUploadLoading || !!selectedAnalysis;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.match(/\.(pdf|doc|docx|txt)$/i)) {
        setError(
          "Please upload a valid legal document (PDF, DOC, DOCX, or TXT)"
        );
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        showToast("File size must be less than 10MB", "error");
        return;
      }
      setFile(selectedFile);
      setError("");
      setUploadProgress(0);
    }
  };

  const resetFileInput = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }
    if (remainingUploads <= 0) {
      setError("Upload limit reached (10 per day). Please wait until tomorrow or delete existing documents.");
      showToast("Upload limit reached (10 per day). Please wait until tomorrow or delete existing documents.", "error");
      return;
    }
    setError("");

    try {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) clearInterval(interval);
      }, 200);

      await onFileUpload(file);
      resetFileInput();
    } catch (err) {
      setError("Failed to upload document. Please try again.");
      console.error("Upload error:", err);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-5 md:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen overflow-y-auto">
      {/* Header */}
      <div className="flex flex-row items-center justify-between mb-6 md:mb-8 mt-16 md:mt-0">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-800 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 text-transparent bg-clip-text animate-floatIn">
          Legal AI Dashboard
        </h1>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-sm sm:text-base"
        >
          Logout
        </button>
      </div>

      {/* Welcome Section */}
      {!selectedAnalysis && !file && (
        <div className="mb-6 md:mb-8 p-4 sm:p-6 bg-white rounded-xl shadow-md animate-fadeIn">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
            Welcome to Legal AI
          </h2>
          <p className="mt-2 text-gray-600 text-sm sm:text-base">
            Upload a legal document to get started with AI-powered analysis.
            Identify risks, get summaries, and more!
          </p>
          <p className="mt-2 text-gray-600 text-sm sm:text-base">
            Remaining Uploads:{" "}
            <span className="font-bold text-blue-500">
              {remainingUploads} / {maxUploads}
            </span>
          </p>
        </div>
      )}

      {/* Upload Section */}
      <div className="mb-6 md:mb-8 border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-6 md:p-8 text-center bg-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-102">
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          id="fileUpload"
          disabled={isUploadDisabled }
          ref={fileInputRef}
        />
        <label
          htmlFor="fileUpload"
          className={`cursor-pointer inline-flex items-center transform transition-all duration-300 hover:scale-110 ${
            isUploadDisabled || remainingUploads <= 0
              ? "text-gray-400 cursor-not-allowed"
              : "text-blue-500 hover:text-blue-700"
          }`}
        >
          <svg
            className={`mr-2 ${
              !isUploadDisabled && "animate-bounce"
            }`}
            width="20"
            height="20"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z" />
          </svg>
          Upload Legal Document
        </label>
        <p className="mt-2 text-xs sm:text-sm text-gray-500">
          Supports PDF, DOC, DOCX, TXT (Max 10MB)
        </p>
        <p className="mt-2 text-xs sm:text-sm text-gray-600">
          Remaining Uploads:{" "}
          <span className="font-bold text-blue-500">
            {remainingUploads} / {maxUploads}
          </span>
        </p>
        {file && (
          <div className="mt-4 animate-slideIn">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <span className="mr-2 text-blue-500">📄</span>
                <span className="text-gray-700 text-sm truncate">
                  {file.name}
                </span>
              </div>
              <button
                onClick={resetFileInput}
                className="text-red-500 hover:text-red-700"
                disabled={isUploadLoading}
              >
                ✗
              </button>
            </div>
            {isUploadLoading && (
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-xs sm:text-sm text-gray-600 mt-2 block animate-pulse">
                  {uploadProgress}% complete
                </span>
              </div>
            )}
            <button
              onClick={handleUpload}
              disabled={isUploadLoading }
              className="mt-4 px-3 py-1 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-all duration-300 flex items-center justify-center text-sm sm:text-base"
            >
              {isUploadLoading ? (
                <>
                  Analyzing
                  <span className="spinner" />
                </>
              ) : (
                "Analyze Document"
              )}
            </button>
          </div>
        )}
        {error && (
          <p className="mt-2 text-red-500 text-xs sm:text-sm">{error}</p>
        )}
      </div>

      {/* Analysis Results */}
      {selectedAnalysis && (
        <div className="mt-6 md:mt-8 space-y-4 sm:space-y-6">
          <div className="p-4 sm:p-6 bg-red-50 rounded-xl shadow-md transform transition-all duration-300 hover:scale-102">
            <h3 className="font-semibold text-red-600 mb-2 sm:mb-3 text-base sm:text-lg animate-pulse">
              Risks Identified
            </h3>
            <ul className="space-y-2 text-sm sm:text-base">
              {selectedAnalysis.risks.length > 0 ? (
                selectedAnalysis.risks.map((risk, index) => (
                  <li key={index} className="flex items-center">
                    <span className="mr-2 text-red-500">⚠️</span>
                    {risk}
                  </li>
                ))
              ) : (
                <li className="text-gray-600">No risks identified</li>
              )}
            </ul>
          </div>

          <div className="p-4 sm:p-6 bg-blue-50 rounded-xl shadow-md transform transition-all duration-300 hover:scale-102">
            <h3 className="font-semibold text-blue-600 mb-2 sm:mb-3 text-base sm:text-lg">
              Summary
            </h3>
            <p className="text-gray-700 text-sm sm:text-base">
              {selectedAnalysis.summary}
            </p>
          </div>

          <div className="p-4 sm:p-6 bg-green-50 rounded-xl shadow-md transform transition-all duration-300 hover:scale-102">
            <h3 className="font-semibold text-green-600 mb-2 sm:mb-3 text-base sm:text-lg">
              Key Points
            </h3>
            <ul className="space-y-2 text-sm sm:text-base">
              {selectedAnalysis.keyPoints.map((point, index) => (
                <li key={index} className="flex items-center">
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
