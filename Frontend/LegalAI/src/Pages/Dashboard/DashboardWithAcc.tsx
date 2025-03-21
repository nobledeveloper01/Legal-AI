import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/SideBar';
import MainContent from '../../components/MainContent';
import Cookies from "js-cookie";
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../components/ShowToast';
import axios, { AxiosError } from 'axios';

const spinnerStyles = `
  .spinner {
    width: 20px;
    height: 20px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    display: inline-block;
    margin-left: 8px;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = spinnerStyles;
document.head.appendChild(styleSheet);

interface FileEntry {
  id: string;
  timestamp: string;
  file?: { name: string; type: string };
}

interface AnalysisResult {
  risks: string[];
  summary: string;
  keyPoints: string[];
}

interface HistoryResponse {
  documents: {
    _id: string;
    filename: string;
    contentType: string;
    createdAt: string;
    analysis: string;
  }[];
  remainingUploads: number;
}

const DashboardWithAcc: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [analysisResults, setAnalysisResults] = useState<Map<string, AnalysisResult | null>>(new Map());
  const [remainingUploads, setRemainingUploads] = useState<number>(10);
  const [isSidebarLoading, setIsSidebarLoading] = useState(false);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [isUploadLoading, setIsUploadLoading] = useState(false);
  const [isSidebarContentLoading, setIsSidebarContentLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { 'Content-Type': 'application/json' },
  });

  apiClient.interceptors.request.use((config) => {
    const token = Cookies.get('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleSelectFileAndClose = (file: FileEntry) => {
    setSelectedFile(file);
    setIsSidebarOpen(false);
  };

  const handleNewProject = () => {
    setSelectedFile(null);
    setIsSidebarOpen(false);
  };

  const fetchHistory = async () => {
    setIsSidebarContentLoading(true);
    try {
      const token = Cookies.get('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await apiClient.get<HistoryResponse>('/documents/history');
      
      const formattedFiles: FileEntry[] = response.data.documents.map((item) => ({
        id: item._id,
        timestamp: item.createdAt,
        file: {
          name: item.filename,
          type: item.contentType,
        },
      }));

      const results = new Map<string, AnalysisResult | null>();
      response.data.documents.forEach((item) => {
        const analysis: AnalysisResult = JSON.parse(
          item.analysis.replace('```json\n', '').replace('\n```', '')
        );
        results.set(item._id, analysis);
      });

      setFiles(formattedFiles);
      setAnalysisResults(results);
      setRemainingUploads(response.data.remainingUploads);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error fetching history:', axiosError.message);
      if (axiosError.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setIsSidebarContentLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploadLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      showToast(response.data.message, "success");
      const analysis: AnalysisResult = JSON.parse(
        response.data.analysis.replace('```json\n', '').replace('\n```', '')
      );

      const newFileEntry: FileEntry = {
        id: response.data._id || Date.now().toString(),
        timestamp: new Date().toISOString(),
        file: {
          name: file.name,
          type: file.type,
        },
      };

      setFiles((prev) => [newFileEntry, ...prev]);
      setSelectedFile(newFileEntry);
      setAnalysisResults((prev) => new Map(prev).set(newFileEntry.id, analysis));
      setRemainingUploads(response.data.remainingUploads);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Upload error:', axiosError.message);
      showToast(
        axiosError.response?.data?.error || "Failed to upload file",
        "error"
      );
      throw error;
    } finally {
      setIsUploadLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const response = await apiClient.delete(`/documents/${id}`);
      
      setFiles((prev) => prev.filter((file) => file.id !== id));
      if (selectedFile?.id === id) {
        setSelectedFile(null);
      }
      setAnalysisResults((prev) => {
        const newResults = new Map(prev);
        newResults.delete(id);
        return newResults;
      });
      
      setRemainingUploads(response.data.remainingUploads || remainingUploads + 1);
      showToast("Document deleted successfully", "success");
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error deleting document:', axiosError.message);
      showToast(
        axiosError.response?.data?.message || "Failed to delete document",
        "error"
      );
      if (axiosError.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    Cookies.remove('user');
    navigate('/');
    showToast("Logged Out Successfully", "success");
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Mobile Sidebar Toggle Button */}
      <button
        className="md:hidden fixed top-4 right-4 z-20 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300"
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 md:w-72 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:fixed md:translate-x-0 transition-transform duration-300 ease-in-out z-10`}
      >
        {isSidebarLoading ? (
          <div className="w-full h-screen flex items-center justify-center bg-white border-r">
            <div className="spinner" />
          </div>
        ) : (
          <Sidebar
            files={files}
            selectedFile={selectedFile}
            onSelectFile={handleSelectFileAndClose}
            onNewProject={handleNewProject}
            onDeleteProject={handleDeleteProject}
            isSidebarContentLoading={isSidebarContentLoading}
            onToggleSidebar={toggleSidebar}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full md:ml-[18rem] overflow-y-auto">
        {isContentLoading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="spinner" />
          </div>
        ) : (
          <MainContent
            onLogout={handleLogout}
            onFileUpload={handleFileUpload}
            selectedAnalysis={selectedFile ? analysisResults.get(selectedFile.id) || null : null}
            isUploadLoading={isUploadLoading}
            remainingUploads={remainingUploads}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardWithAcc;