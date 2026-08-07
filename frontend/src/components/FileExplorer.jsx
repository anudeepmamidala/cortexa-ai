import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileCode, Folder, FolderOpen, FilePlus, FolderPlus, Trash2 } from 'lucide-react';

function TreeNode({ node, onSelectFile, activeFilePath, onCreateFile, onDeleteFile }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!node) return null;

  const isDir = node.isDirectory;
  const isSelected = !isDir && activeFilePath === node.path;

  const handleClick = (e) => {
    e.stopPropagation();
    if (isDir) {
      setIsOpen(!isOpen);
    } else {
      onSelectFile(node.path);
    }
  };

  return (
    <div style={{ paddingLeft: '12px' }}>
      <div
        className={`tree-item ${isSelected ? 'active' : ''}`}
        onClick={handleClick}
        title={node.path}
      >
        {isDir ? (
          <>
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {isOpen ? <FolderOpen size={14} style={{ color: '#f9e2af' }} /> : <Folder size={14} style={{ color: '#f9e2af' }} />}
          </>
        ) : (
          <>
            <span style={{ width: '14px' }}></span>
            <FileCode size={14} style={{ color: '#89b4fa' }} />
          </>
        )}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.name}</span>

        {!isDir && (
          <Trash2
            size={12}
            className="hover-action"
            style={{ opacity: 0.5, cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFile(node.path);
            }}
          />
        )}
      </div>

      {isDir && isOpen && node.children && (
        <div>
          {node.children.map((child, idx) => (
            <TreeNode
              key={child.path || idx}
              node={child}
              onSelectFile={onSelectFile}
              activeFilePath={activeFilePath}
              onCreateFile={onCreateFile}
              onDeleteFile={onDeleteFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileExplorer({ fileTree, onSelectFile, activeFilePath, onCreateFile, onDeleteFile }) {
  const handleNewFilePrompt = () => {
    const filename = prompt('Enter new file path (e.g. src/App.java):');
    if (filename) {
      onCreateFile(filename, false);
    }
  };

  const handleNewFolderPrompt = () => {
    const foldername = prompt('Enter new folder path (e.g. src/components):');
    if (foldername) {
      onCreateFile(foldername, true);
    }
  };

  return (
    <aside className="left-sidebar">
      <div className="sidebar-header">
        <span>Explorer</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <FilePlus size={14} style={{ cursor: 'pointer' }} title="New File" onClick={handleNewFilePrompt} />
          <FolderPlus size={14} style={{ cursor: 'pointer' }} title="New Folder" onClick={handleNewFolderPrompt} />
        </div>
      </div>

      <div className="tree-container">
        {fileTree ? (
          <TreeNode
            node={fileTree}
            onSelectFile={onSelectFile}
            activeFilePath={activeFilePath}
            onCreateFile={onCreateFile}
            onDeleteFile={onDeleteFile}
          />
        ) : (
          <div style={{ padding: '16px', fontSize: '12px', color: 'var(--text-dim)' }}>
            No project workspace loaded. Select or create a project.
          </div>
        )}
      </div>
    </aside>
  );
}
