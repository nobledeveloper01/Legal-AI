import React from 'react';

interface FileEntry {
  id: number;
  timestamp: string;
  file?: {
    name: string;
    type: string;
    size: number;
  };
}

interface SidebarProps {
  files: FileEntry[];
  selectedFile: FileEntry | null;
  onSelectFile: (file: FileEntry) => void;
  onNewProject: () => void;
  onDeleteProject: (id: number) => void; // Added new prop for deletion
}

const Sidebar: React.FC<SidebarProps> = ({ 
  files, 
  selectedFile, 
  onSelectFile, 
  onNewProject,
  onDeleteProject 
}) => {
  return (
    <div className="w-[272px] bg-white border-r border-gray-200 shadow-lg flex flex-col h-full">
      {/* Fixed Header */}
      <div className="p-5 border-b border-gray-200 bg-white z-10 sticky top-0">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 text-transparent bg-clip-text animate-gradient">
            Projects
          </h2>
          <button
            onClick={onNewProject}
            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105"
          >
            + New
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="space-y-3">
          {files.length === 0 ? (
            <p className="text-gray-500 animate-fadeIn">No projects created yet</p>
          ) : (
            files.map((fileEntry) => (
              <div
                key={fileEntry.id}
                className={`p-3 bg-white rounded-lg cursor-pointer border border-gray-200 hover:bg-gray-50 flex justify-between items-center ${
                  selectedFile?.id === fileEntry.id ? 'bg-gray-50 ring-2 ring-blue-500' : ''
                } transform transition-all duration-300 hover:scale-102 hover:shadow-md`}
              >
                <div 
                  className="flex-1" 
                  onClick={() => onSelectFile(fileEntry)}
                >
                  <span className="block">
                    {fileEntry.file?.name || `Project ${fileEntry.id}`}
                  </span>
                  <small className="text-gray-500 text-xs">{fileEntry.timestamp}</small>
                </div>
                <button
                  onClick={() => onDeleteProject(fileEntry.id)}
                  className="ml-2 text-red-500 hover:text-red-700 transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;