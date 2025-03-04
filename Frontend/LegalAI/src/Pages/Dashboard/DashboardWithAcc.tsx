import React, { useState } from 'react';
import Sidebar from '../../components/SideBar';
import MainContent from '../../components/MainContent';

interface FileEntry {
  id: number;
  timestamp: string;
  file?: {
    name: string;
    type: string;
    size: number;
  };
}

interface AnalysisResult {
  risks: string[];
  summary: string;
  keyPoints: string[];
}

const DashboardWithAcc: React.FC = () => {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [analysisResults, setAnalysisResults] = useState<Map<number, AnalysisResult | null>>(
    new Map()
  );

  const handleNewProject = () => {
    const newProject: FileEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
    };
    setFiles((prev) => [newProject, ...prev]);
    setSelectedFile(newProject);
    setAnalysisResults((prev) => new Map(prev).set(newProject.id, null));
  };

  const handleFileUpload = (file: File, analysis: AnalysisResult) => {
    let currentSelectedFile = selectedFile;

    // If no project is selected, create a new one
    if (!currentSelectedFile) {
      currentSelectedFile = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
      };
      setFiles((prev) => [currentSelectedFile!, ...prev]);
      setSelectedFile(currentSelectedFile);
      setAnalysisResults((prev) => new Map(prev).set(currentSelectedFile!.id, null));
    }

    const updatedFileEntry: FileEntry = {
      ...currentSelectedFile,
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
      },
    };

    setFiles((prev) => prev.map((f) => (f.id === currentSelectedFile!.id ? updatedFileEntry : f)));
    setSelectedFile(updatedFileEntry);
    setAnalysisResults((prev) => new Map(prev).set(updatedFileEntry.id, analysis));
  };

  const handleDeleteProject = (id: number) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
    if (selectedFile?.id === id) {
      setSelectedFile(null);
    }
    setAnalysisResults((prev) => {
      const newResults = new Map(prev);
      newResults.delete(id);
      return newResults;
    });
  };

  const handleLogout = () => {
    console.log('Logged out');
    // Add actual logout logic here
  };

  const handleSelectFile = (file: FileEntry) => {
    setSelectedFile(file);
  };

  return (
    <div className="flex h-screen font-sans bg-gray-100">
      <Sidebar
        files={files}
        selectedFile={selectedFile}
        onSelectFile={handleSelectFile}
        onNewProject={handleNewProject}
        onDeleteProject={handleDeleteProject}
      />
      <MainContent
        onLogout={handleLogout}
        onFileUpload={handleFileUpload}
        selectedAnalysis={selectedFile ? analysisResults.get(selectedFile.id) || null : null}
      />
    </div>
  );
};

export default DashboardWithAcc;