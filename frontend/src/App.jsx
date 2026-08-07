import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import FileExplorer from './components/FileExplorer';
import CodeEditor from './components/CodeEditor';
import ChatPanel from './components/ChatPanel';
import AuthModal from './components/AuthModal';
import NewProjectModal from './components/NewProjectModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');

  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);

  const [fileTree, setFileTree] = useState(null);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTabPath, setActiveTabPath] = useState(null);

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);

  const [streamingState, setStreamingState] = useState({
    isStreaming: false,
    agent: '',
    text: ''
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);

  // Authorization Header Helper
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  // Load Projects on Auth
  useEffect(() => {
    if (token) {
      fetchProjects();
    } else {
      setProjects([]);
      setActiveProject(null);
    }
  }, [token]);

  // Load Workspace Files & Chats on Active Project Select
  useEffect(() => {
    if (activeProject && token) {
      fetchFileTree(activeProject.id);
      fetchChats(activeProject.id);
    }
  }, [activeProject, token]);

  const activeChatIdRef = useRef(null);

  // Load Messages on Active Chat Select
  useEffect(() => {
    if (activeChat && token) {
      if (activeChatIdRef.current !== activeChat.id) {
        activeChatIdRef.current = activeChat.id;
        fetchMessages(activeChat.id);
      }
    } else {
      activeChatIdRef.current = null;
      setMessages([]);
    }
  }, [activeChat?.id, token]);

  const checkAuthError = (res) => {
    if ((res.status === 401 || res.status === 403) && token) {
      handleLogout();
      setAuthModalOpen(true);
      return true;
    }
    return false;
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/projects`, { headers: getAuthHeaders() });
      if (checkAuthError(res)) return;
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0 && !activeProject) {
          setActiveProject(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const handleCreateProject = async (name, description) => {
    try {
      const res = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, description })
      });
      if (checkAuthError(res)) return;
      if (res.ok) {
        const newProj = await res.json();
        setProjects(prev => [...prev, newProj]);
        setActiveProject(newProj);
      }
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const fetchFileTree = async (projectId) => {
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/files/tree`, { headers: getAuthHeaders() });
      if (checkAuthError(res)) return;
      if (res.ok) {
        const tree = await res.json();
        setFileTree(tree);
      }
    } catch (err) {
      console.error('Failed to fetch file tree:', err);
    }
  };

  const handleSelectFile = async (path) => {
    // Check if already open
    const existing = openTabs.find(t => t.path === path);
    if (existing) {
      setActiveTabPath(path);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/projects/${activeProject.id}/files/content?path=${encodeURIComponent(path)}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const filename = path.split('/').pop() || path;
        const newTab = { path: data.path, name: filename, content: data.content, isDirty: false };
        setOpenTabs(prev => [...prev, newTab]);
        setActiveTabPath(data.path);
      }
    } catch (err) {
      console.error('Failed to read file content:', err);
    }
  };

  const handleContentChange = (path, newContent) => {
    setOpenTabs(prev => prev.map(t => t.path === path ? { ...t, content: newContent, isDirty: true } : t));
  };

  const handleSaveFile = async () => {
    const activeTab = openTabs.find(t => t.path === activeTabPath);
    if (!activeTab || !activeProject) return;

    try {
      const res = await fetch(`${API_BASE}/api/projects/${activeProject.id}/files/content`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ path: activeTab.path, content: activeTab.content })
      });
      if (res.ok) {
        setOpenTabs(prev => prev.map(t => t.path === activeTabPath ? { ...t, isDirty: false } : t));
      }
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  };

  const handleCreateFile = async (path, isDirectory) => {
    if (!token) {
      setAuthModalOpen(true);
      return;
    }
    if (!activeProject) {
      setNewProjectModalOpen(true);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/projects/${activeProject.id}/files`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ path, isDirectory })
      });
      if (res.ok) {
        fetchFileTree(activeProject.id);
        if (!isDirectory) {
          handleSelectFile(path);
        }
      } else {
        const errData = await res.json();
        alert(`Failed to create ${isDirectory ? 'folder' : 'file'}: ${errData.message || 'Error occurred'}`);
      }
    } catch (err) {
      console.error('Failed to create file/dir:', err);
      alert(`Error creating ${isDirectory ? 'folder' : 'file'}: ${err.message}`);
    }
  };

  const handleDeleteFile = async (path) => {
    if (!activeProject || !window.confirm(`Delete ${path}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/projects/${activeProject.id}/files?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchFileTree(activeProject.id);
        handleCloseTab(path);
      }
    } catch (err) {
      console.error('Failed to delete file/dir:', err);
    }
  };

  const handleCloseTab = (path) => {
    setOpenTabs(prev => prev.filter(t => t.path !== path));
    if (activeTabPath === path) {
      const remaining = openTabs.filter(t => t.path !== path);
      setActiveTabPath(remaining.length > 0 ? remaining[remaining.length - 1].path : null);
    }
  };

  const fetchChats = async (projectId) => {
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/chats`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setChats(data);
        if (data.length > 0) {
          setActiveChat(data[0]);
        } else {
          setActiveChat(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    }
  };

  const handleCreateChat = async () => {
    if (!token) {
      setAuthModalOpen(true);
      return;
    }
    if (!activeProject) {
      setNewProjectModalOpen(true);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/projects/${activeProject.id}/chats`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: `Chat Session #${chats.length + 1}` })
      });
      if (res.ok) {
        const newChat = await res.json();
        setChats(prev => [...prev, newChat]);
        setActiveChat(newChat);
      } else {
        const errData = await res.json();
        alert(`Failed to create chat: ${errData.message || 'Error occurred'}`);
      }
    } catch (err) {
      console.error('Failed to create chat:', err);
      alert(`Error creating chat: ${err.message}`);
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (!activeProject || !window.confirm('Delete this chat session?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/projects/${activeProject.id}/chats/${chatId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setChats(prev => prev.filter(c => c.id !== chatId));
        setActiveChat(null);
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const res = await fetch(`${API_BASE}/api/chats/${chatId}/messages`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleSendMessage = async (content, mode) => {
    if (!token) {
      setAuthModalOpen(true);
      return;
    }
    if (!activeProject) {
      setNewProjectModalOpen(true);
      return;
    }

    let targetChat = activeChat;

    if (!targetChat) {
      try {
        const res = await fetch(`${API_BASE}/api/projects/${activeProject.id}/chats`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ title: 'Chat Session #1' })
        });
        if (res.ok) {
          targetChat = await res.json();
          activeChatIdRef.current = targetChat.id;
          setChats([targetChat]);
          setActiveChat(targetChat);
        } else {
          alert('Failed to initialize chat session.');
          return;
        }
      } catch (err) {
        alert('Error initializing chat session.');
        return;
      }
    }

    // Append user message and assistant placeholder immediately into messages state
    const userMsg = { role: 'USER', content };
    const assistantPlaceholder = { role: 'ASSISTANT', content: '' };
    setMessages(prev => [...prev, userMsg, assistantPlaceholder]);

    const updateAssistantMessage = (newText) => {
      setMessages(prev => {
        const copy = [...prev];
        if (copy.length > 0 && copy[copy.length - 1].role === 'ASSISTANT') {
          copy[copy.length - 1] = { ...copy[copy.length - 1], content: newText };
        }
        return copy;
      });
    };

    setStreamingState({ isStreaming: true, agent: 'orchestrator', text: '' });

    try {
      const res = await fetch(`${API_BASE}/api/chats/${targetChat.id}/messages/stream`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content, mode })
      });

      if (!res.ok) {
        // Fallback to non-streaming endpoint
        const fallbackRes = await fetch(`${API_BASE}/api/chats/${targetChat.id}/messages`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ content })
        });
        if (fallbackRes.ok) {
          const assistantMsg = await fallbackRes.json();
          setMessages(prev => {
            const filtered = prev.filter((m, i) => i !== prev.length - 1);
            return [...filtered, assistantMsg];
          });
        }
        setStreamingState({ isStreaming: false, agent: '', text: '' });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let currentAgent = 'orchestrator';

      let buffer = '';
      while (true) {
        let done = false;
        let value = null;
        try {
          const resChunk = await reader.read();
          done = resChunk.done;
          value = resChunk.value;
        } catch (streamErr) {
          console.warn('Stream socket closed by server:', streamErr);
          break;
        }

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('event:')) {
            const eventName = trimmedLine.replace('event:', '').trim();
            if (['planner', 'coding', 'reviewer', 'orchestrator'].includes(eventName)) {
              currentAgent = eventName;
              setStreamingState({ isStreaming: true, agent: currentAgent, text: accumulatedText });
            }
          } else if (line.startsWith('data:') || trimmedLine.startsWith('data:')) {
            const dataIdx = line.indexOf('data:');
            let payload = line.substring(dataIdx + 5);
            if (payload.startsWith(' ')) {
              payload = payload.substring(1);
            }
            if (!payload) continue;

            try {
              const data = JSON.parse(payload);
              if (data.name && ['planner', 'coding', 'reviewer', 'orchestrator'].includes(data.name)) {
                currentAgent = data.name;
              }

              if (typeof data.content === 'string') {
                accumulatedText += data.content;
                updateAssistantMessage(accumulatedText);
                setStreamingState({ isStreaming: true, agent: currentAgent, text: accumulatedText });
              } else if (typeof data.response === 'string' && data.response.trim().length > 0) {
                if (data.response.length >= accumulatedText.length) {
                  accumulatedText = data.response;
                }
                updateAssistantMessage(accumulatedText);
                setStreamingState({ isStreaming: true, agent: currentAgent, text: accumulatedText });
              } else if (typeof data.text === 'string') {
                accumulatedText += data.text;
                updateAssistantMessage(accumulatedText);
                setStreamingState({ isStreaming: true, agent: currentAgent, text: accumulatedText });
              }
            } catch (e) {
              if (payload.trim()) {
                accumulatedText += payload;
                updateAssistantMessage(accumulatedText);
                setStreamingState({ isStreaming: true, agent: currentAgent, text: accumulatedText });
              }
            }
          }
        }
      }

      if (buffer.trim()) {
        const trimmedLine = buffer.trim();
        if (buffer.startsWith('data:') || trimmedLine.startsWith('data:')) {
          const dataIdx = buffer.indexOf('data:');
          let payload = buffer.substring(dataIdx + 5);
          if (payload.startsWith(' ')) payload = payload.substring(1);
          if (payload) {
            try {
              const data = JSON.parse(payload);
              if (typeof data.content === 'string') accumulatedText += data.content;
              else if (typeof data.response === 'string' && data.response.trim().length > 0) {
                if (data.response.length >= accumulatedText.length) accumulatedText = data.response;
              } else if (typeof data.text === 'string') accumulatedText += data.text;
            } catch (e) {
              accumulatedText += payload;
            }
          }
        }
      }

      const finalResponse = accumulatedText.trim() || 'Response completed.';
      updateAssistantMessage(finalResponse);

      if (activeProject) {
        fetchFileTree(activeProject.id);
      }
    } catch (err) {
      console.error('Error in streaming:', err);
      if (accumulatedText && accumulatedText.trim()) {
        updateAssistantMessage(accumulatedText.trim());
      } else {
        updateAssistantMessage('Failed to complete stream response.');
      }
    } finally {
      setStreamingState({ isStreaming: false, agent: '', text: '' });
    }
  };

  const handleAuthSuccess = (newToken, email) => {
    setToken(newToken);
    setUserEmail(email);
    localStorage.setItem('token', newToken);
    localStorage.setItem('userEmail', email);
  };

  const handleLogout = () => {
    setToken('');
    setUserEmail('');
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
  };

  return (
    <div className="ide-container">
      <Navbar
        projects={projects}
        activeProject={activeProject}
        onSelectProject={setActiveProject}
        onOpenNewProjectModal={() => setNewProjectModalOpen(true)}
        userToken={token}
        userEmail={userEmail}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <div className="ide-workspace">
        <FileExplorer
          fileTree={fileTree}
          onSelectFile={handleSelectFile}
          activeFilePath={activeTabPath}
          onCreateFile={handleCreateFile}
          onDeleteFile={handleDeleteFile}
        />

        <CodeEditor
          tabs={openTabs}
          activeTabPath={activeTabPath}
          onSelectTab={setActiveTabPath}
          onCloseTab={handleCloseTab}
          onContentChange={handleContentChange}
          onSaveFile={handleSaveFile}
        />

        <ChatPanel
          chats={chats}
          activeChat={activeChat}
          onSelectChat={setActiveChat}
          onCreateChat={handleCreateChat}
          onDeleteChat={handleDeleteChat}
          messages={messages}
          streamingState={streamingState}
          onSendMessage={handleSendMessage}
        />
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <NewProjectModal
        isOpen={newProjectModalOpen}
        onClose={() => setNewProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}
