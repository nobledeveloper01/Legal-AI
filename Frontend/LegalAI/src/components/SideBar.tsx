import React from 'react';

interface FileEntry {
  id: string;
  timestamp: string;
  file?: { name: string; type: string };
}

interface SidebarProps {
  files: FileEntry[];
  selectedFile: FileEntry | null;
  onSelectFile: (file: FileEntry) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  isSidebarContentLoading?: boolean;
  onToggleSidebar?: () => void;
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

const Sidebar: React.FC<SidebarProps> = ({
  files,
  selectedFile,
  onSelectFile,
  onNewProject,
  onDeleteProject,
  isSidebarContentLoading,
  onToggleSidebar,
}) => {
  const handleNewProject = () => {
    onNewProject();
    if (onToggleSidebar && window.innerWidth < 768) {
      onToggleSidebar();
    }
  };

  return (
    <div className="w-full md:w-72 h-screen bg-white border-r border-gray-200 shadow-lg flex flex-col">
      {/* Fixed Header */}
      <div className="p-4 md:p-5 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h2 className="text-lg md:text-xl font-bold text-gray-800 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 text-transparent bg-clip-text animate-gradient">
            Projects
          </h2>
          <button
            onClick={handleNewProject}
            className="px-2 py-1 md:px-3 md:py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 text-sm md:text-base"
          >
            + New
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      {isSidebarContentLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="spinner" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          <div className="space-y-3">
            {files.length === 0 ? (
              <p className="text-gray-500 animate-fadeIn text-sm md:text-base">No projects created yet</p>
            ) : (
              files.map((fileEntry) => (
                <div
                  key={fileEntry.id}
                  className={`p-3 bg-white rounded-lg cursor-pointer border border-gray-200 hover:bg-gray-50 flex justify-between items-center ${
                    selectedFile?.id === fileEntry.id ? 'bg-gray-50 ring-2 ring-blue-500' : ''
                  } transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md`}
                >
                  <div className="flex-1" onClick={() => onSelectFile(fileEntry)}>
                    <span className="block text-sm md:text-base">
                      {fileEntry.file?.name || `Project ${fileEntry.id}`}
                    </span>
                    <small className="text-gray-500 text-xs">
                      {formatTimestamp(fileEntry.timestamp)}
                    </small>
                  </div>
                  <button
                    onClick={() => onDeleteProject(fileEntry.id)}
                    className="ml-2 text-red-500 hover:text-red-700 transition-colors duration-200 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;