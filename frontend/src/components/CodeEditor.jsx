import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import { X, Save, FileCode, Code } from 'lucide-react';

export default function CodeEditor({
  tabs,
  activeTabPath,
  onSelectTab,
  onCloseTab,
  onContentChange,
  onSaveFile
}) {
  const editorRef = useRef(null);

  const activeTab = tabs.find(t => t.path === activeTabPath);

  const getLanguage = (path) => {
    if (!path) return 'plaintext';
    if (path.endsWith('.java')) return 'java';
    if (path.endsWith('.py')) return 'python';
    if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
    if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.md')) return 'markdown';
    if (path.endsWith('.css')) return 'css';
    if (path.endsWith('.html')) return 'html';
    if (path.endsWith('.sql')) return 'sql';
    return 'plaintext';
  };

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSaveFile();
    });
  };

  return (
    <main className="center-editor-area">
      {/* Tabs Bar */}
      <div className="tabs-bar">
        {tabs.map((tab) => (
          <div
            key={tab.path}
            className={`tab-item ${tab.path === activeTabPath ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.path)}
          >
            <FileCode size={13} style={{ color: '#89b4fa' }} />
            <span>{tab.name || tab.path}</span>
            {tab.isDirty && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f9e2af' }}></span>}
            <span
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.path);
              }}
            >
              <X size={12} />
            </span>
          </div>
        ))}
      </div>

      {/* Editor Content Area */}
      <div className="editor-canvas">
        {activeTab ? (
          <div style={{ height: '100%', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '16px',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {activeTab.isDirty && (
                <button className="btn btn-primary btn-sm" onClick={onSaveFile} title="Save File (Ctrl+S)">
                  <Save size={12} />
                  <span>Save</span>
                </button>
              )}
            </div>

            <Editor
              height="100%"
              theme="vs-dark"
              language={getLanguage(activeTab.path)}
              value={activeTab.content}
              onChange={(value) => onContentChange(activeTab.path, value)}
              onMount={handleEditorMount}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
              }}
            />
          </div>
        ) : (
          <div className="editor-empty">
            <Code size={48} style={{ opacity: 0.2 }} />
            <p>Select a file from the explorer to open in editor</p>
          </div>
        )}
      </div>
    </main>
  );
}
