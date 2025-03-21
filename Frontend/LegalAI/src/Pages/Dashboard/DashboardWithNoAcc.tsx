import React, { useState, ChangeEvent, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { showToast } from "../../components/ShowToast";
import { FaBars, FaTimes } from 'react-icons/fa';

interface AnalysisResult {
  risks: string[];
  summary: string;
  keyPoints: string[];
}

interface ApiResponse {
  message: string;
  analysis: string;
  remainingUploads: number | null;
}

interface ErrorResponse {
  error: string;
  waitTime?: number;
}

const LegalDocAnalyzer: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [remainingUploads, setRemainingUploads] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Add ref for file input
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const isLoggedIn = false; // This would come from your auth system
  const MAX_FREE_USES = 3;

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
        return;
      }
      setFile(selectedFile);
      setError("");
      setUploadProgress(0);
    }
  };

  const resetFileInput = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset the input value
    }
    setUploadProgress(0);
  };

  const analyzeDocument = async () => {
    if (!file) {
      setError("Please upload a document first");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setUploadProgress(progress);
        if (progress >= 100) clearInterval(interval);
      }, 100);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/documents/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        if (
          errorData.error ===
          "Upload limit reached for anonymous users. Please log in or wait."
        ) {
          showToast("Upload limit reached. Please wait 2 hours or log in.");
          setIsModalOpen(true);
          setRemainingUploads(0);
        } else {
          throw new Error(errorData.error || "Failed to upload document");
        }
        return;
      }

      const data: ApiResponse = await response.json();
      const parsedAnalysis: AnalysisResult = JSON.parse(
        data.analysis.replace("```json\n", "").replace("\n```", "")
      );
      setAnalysis(parsedAnalysis);
      setRemainingUploads(data.remainingUploads);
      resetFileInput(); // Reset file input after successful upload
    } catch (err) {
      showToast("Failed to analyze document. Please try again later.");
      console.error("Analysis error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLoginRedirect = () => {
    setIsModalOpen(false);
    navigate("/login");
  };

  const handleSignUpRedirect = () => {
    setIsModalOpen(false);
    navigate("/signup");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-lg p-4 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo/Name */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-Prata bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 text-transparent bg-clip-text animate-gradient">
          Legal AI
        </h1>

        {/* Hamburger Menu Button (visible on mobile) */}
        <button
          className="sm:hidden text-2xl focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex flex-row space-x-4">
          <button
            onClick={handleLoginRedirect}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-sm sm:text-base"
          >
            Login
          </button>
          <button
            onClick={handleSignUpRedirect}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-sm sm:text-base"
          >
            Sign Up
          </button>
        </div>

        {/* Mobile Sidebar */}
        <div
          className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-20 ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          } sm:hidden`}
        >
          <div className="flex flex-col p-4 space-y-4">
            <button
              className="self-end text-2xl"
              onClick={toggleMenu}
              aria-label="Close menu"
            >
              <FaTimes />
            </button>
            <button
              onClick={() => {
                handleLoginRedirect();
                setIsMenuOpen(false);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-300"
            >
              Login
            </button>
            <button
              onClick={() => {
                handleSignUpRedirect();
                setIsMenuOpen(false);
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300"
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Overlay for mobile menu */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 sm:hidden z-10"
            onClick={toggleMenu}
          />
        )}
      </div>
    </header>
      {/* Hero Section */}
      <section className="py-12 px-6 text-center">
        <h2 className="mx-4 text-4xl font-extrabold text-gray-800 mb-4 animate-floatIn">
          Revolutionize Your Legal Document Analysis
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 animate-fadeIn">
          Powered by cutting-edge AI, Legal AI provides instant insights, risk
          assessment, and key point extraction for your legal documents.
        </p>
      </section>

      {/* Feature Cards */}
      <section className="max-w-7xl mx-auto px-6 pb-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            title: "Risk Detection",
            desc: "Identify potential legal risks instantly",
            icon: "⚠️",
          },
          {
            title: "Summary Generation",
            desc: "Get concise document summaries",
            icon: "📝",
          },
          {
            title: "Key Point Extraction",
            desc: "Extract critical clauses and terms",
            icon: "✓",
          },
        ].map((feature, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl animate-floatIn"
            style={{ animationDelay: `${index * 200}ms` }}
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-600">{feature.desc}</p>
          </div>
        ))}
      </section>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-5xl w-full bg-white shadow-2xl rounded-2xl p-4 lg:p-8 transform transition-all duration-500 hover:shadow-3xl animate-floatIn">
          {!isLoggedIn && remainingUploads !== null && (
            <div className="mb-6 text-sm text-gray-600 text-center animate-pulse">
              Free uses remaining: {remainingUploads}/{MAX_FREE_USES}
            </div>
          )}

          <div className="mb-6 border-2 border-dashed border-gray-300 rounded-xl p-4 lg:p-8 text-center bg-gray-50 hover:bg-gray-100 transition-all duration-300 transform hover:scale-102">
            <label
              htmlFor="fileUpload"
              className="cursor-pointer block h-full w-full"
            >
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="fileUpload"
                disabled={isLoading}
                ref={fileInputRef}
              />

              <div className="text-blue-500 hover:text-blue-700 inline-flex items-center transform transition-all duration-300 hover:scale-110">
                <svg
                  className="mr-2 animate-bounce"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z" />
                </svg>
                Upload Legal Document
              </div>
              {file && (
                <div className="mt-4 animate-slideIn">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg transform transition-all duration-300 hover:scale-102">
                    <div className="flex items-center">
                      <span className="mr-2 text-blue-500 animate-spin">
                        📄
                      </span>
                      <span className="text-gray-700">{file.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevents triggering the file input when clicking the remove button
                        resetFileInput();
                      }}
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
            </label>
          </div>

          <button
            onClick={analyzeDocument}
            disabled={!file || isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:bg-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-300"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin mr-2 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8h8a8 8 0 11-16 0z"
                  />
                </svg>
                Analyzing...
              </span>
            ) : (
              "Analyze Now"
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-xl animate-shake">
              {error}
            </div>
          )}

          {analysis && (
            <div className="mt-8 space-y-6 animate-slideIn">
              <div className="lg:p-6 p-2 bg-red-50 rounded-xl transform transition-all duration-300 hover:scale-102">
                <h3 className="font-semibold text-red-600 mb-3 animate-pulse">
                  Risks Identified
                </h3>
                <ul className="space-y-2">
                  {analysis.risks.map((risk, index) => (
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

              <div className="lg:p-6 p-2 bg-blue-50 rounded-xl transform transition-all duration-300 hover:scale-102">
                <h3 className="font-semibold text-blue-600 mb-3">Summary</h3>
                <p className="text-gray-700 animate-typewriter">
                  {analysis.summary}
                </p>
              </div>

              <div className="lg:p-6 p-2 bg-green-50 rounded-xl transform transition-all duration-300 hover:scale-102">
                <h3 className="font-semibold text-green-600 mb-3">
                  Key Points
                </h3>
                <ul className="space-y-2">
                  {analysis.keyPoints.map((point, index) => (
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
      </main>

      {/* Testimonials Section */}
      <section className="py-12 px-6 bg-gradient-to-br from-purple-100 to-blue-100">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8 animate-floatIn">
          What Our Users Say
        </h2>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              name: "John D.",
              role: "Attorney",
              quote: "Legal AI saved me hours of manual review!",
            },
            {
              name: "Sarah M.",
              role: "Business Owner",
              quote: "The risk detection is a game-changer for my contracts.",
            },
          ].map((testimonial, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105 animate-floatIn"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <p className="text-gray-600 italic mb-4">"{testimonial.quote}"</p>
              <p className="font-semibold text-gray-800">{testimonial.name}</p>
              <p className="text-sm text-gray-500">{testimonial.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text animate-gradient">
              Legal AI
            </h3>
            <p className="text-sm">
              © {new Date().getFullYear()} Legal AI. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <a
              href="#"
              className="hover:text-purple-400 transition-colors duration-300"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="hover:text-purple-400 transition-colors duration-300"
            >
              Terms of Service
            </a>
            <a
              href="#"
              className="hover:text-purple-400 transition-colors duration-300"
            >
              Contact Us
            </a>
          </div>
        </div>
      </footer>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-blue-500/30 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative w-full max-w-md p-8 bg-white shadow-2xl rounded-3xl border-2 border-purple-200 animate-modalIn">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">
              Free Limit Reached
            </h3>
            <div className="mt-4">
              <p className="text-gray-600 animate-fadeIn">
                You've reached your upload limit. Please wait 2 hours or log
                in/sign up to continue!
              </p>
            </div>
            <div className="mt-6 flex justify-center space-x-4">
              <button
                type="button"
                onClick={handleLoginRedirect}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl hover:from-blue-600 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 hover:shadow-lg animate-pulse"
              >
                Login
              </button>
              <button
                type="button"
                onClick={handleSignUpRedirect}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg animate-pulse"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Updated Tailwind CSS Animations
const styles = `
  @keyframes floatIn {
    0% { transform: translateY(50px) scale(0.95); opacity: 0; }
    100% { transform: translateY(0) scale(1); opacity: 1; }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  @keyframes typewriter {
    from { width: 0; }
    to { width: 100%; }
  }
  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes modalIn {
    0% { transform: scale(0.75) rotate(12deg); opacity: 0; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  .animate-floatIn { animation: floatIn 0.8s ease-out; }
  .animate-shake { animation: shake 0.5s ease-in-out; }
  .animate-typewriter { 
    animation: typewriter 2s steps(40) 1s 1 normal both;
    overflow: hidden;
    white-space: nowrap;
  }
  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient 3s ease infinite;
  }
  .animate-modalIn {
    animation: modalIn 0.5s ease-out;
  }
  .hover\\:scale-102:hover { transform: scale(1.02); }
  .hover\\:scale-105:hover { transform: scale(1.05); }
`;

export default LegalDocAnalyzer;
