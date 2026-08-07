import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Plus, Trash2, Cpu } from 'lucide-react';

export default function ChatPanel({
  chats,
  activeChat,
  onSelectChat,
  onCreateChat,
  onDeleteChat,
  messages,
  streamingState,
  onSendMessage
}) {
  const [prompt, setPrompt] = useState('');
  const mode = 'ai_workspace';
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingState]);

  const handleSend = () => {
    if (!prompt.trim()) return;
    onSendMessage(prompt, mode);
    setPrompt('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMarkdownContent = (rawContent) => {
    if (!rawContent) return null;
    const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);

    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const firstLineEnd = part.indexOf('\n');
        const lang = firstLineEnd !== -1 ? part.substring(3, firstLineEnd).trim() : '';
        const code = firstLineEnd !== -1 ? part.substring(firstLineEnd + 1, part.length - 3) : part.substring(3, part.length - 3);

        return (
          <div key={index} className="code-block-wrapper" style={{
            margin: '8px 0',
            borderRadius: '6px',
            overflow: 'hidden',
            background: '#11111b',
            border: '1px solid var(--border-color)',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px'
          }}>
            {lang && (
              <div style={{
                background: '#181825',
                padding: '4px 10px',
                color: '#89b4fa',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                borderBottom: '1px solid var(--border-color)'
              }}>
                {lang}
              </div>
            )}
            <pre style={{ margin: 0, padding: '10px 12px', overflowX: 'auto', whiteSpace: 'pre-wrap', color: '#a6e3a1' }}>
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      return (
        <span key={index} style={{ whiteSpace: 'pre-wrap' }}>
          {part}
        </span>
      );
    });
  };

  return (
    <aside className="right-sidebar">
      {/* Header & Session Selector */}
      <div className="sidebar-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Bot size={16} style={{ color: '#cba6f7' }} />
            <span>AI Copilot</span>
          </div>
          <button className="btn btn-outline btn-sm" onClick={onCreateChat} title="New Chat Session">
            <Plus size={12} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Sessions Dropdown */}
        {chats.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <select
              value={activeChat ? activeChat.id : ''}
              onChange={(e) => {
                const selected = chats.find(c => c.id === Number(e.target.value));
                if (selected) onSelectChat(selected);
              }}
              style={{
                flex: 1,
                background: 'var(--bg-editor)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                outline: 'none'
              }}
            >
              {chats.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title || `Chat #${c.id}`}
                </option>
              ))}
            </select>

            {activeChat && (
              <Trash2
                size={14}
                style={{ cursor: 'pointer', color: 'var(--text-dim)' }}
                title="Delete Session"
                onClick={() => onDeleteChat(activeChat.id)}
              />
            )}
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="chat-history">
        {messages.length === 0 && !streamingState.isStreaming && (
          <div style={{
            textAlign: 'center',
            color: 'var(--text-dim)',
            fontSize: '12px',
            marginTop: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sparkles size={28} style={{ color: '#89b4fa', opacity: 0.7 }} />
            <p>Ask Cortexa AI anything about your code!</p>
            <span style={{ fontSize: '11px' }}>Examples: "Explain Main.java", "Generate unit test", "Fix bugs"</span>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={msg.id || `msg-${idx}`} className={`message-bubble ${(msg.role || '').toLowerCase()}`}>
            <div className="message-header">
              {(msg.role || '').toLowerCase() === 'user' ? (
                <>
                  <User size={12} />
                  <span>You</span>
                </>
              ) : (
                <>
                  <Bot size={12} style={{ color: '#cba6f7' }} />
                  <span>Cortexa Agent</span>
                  {idx === messages.length - 1 && streamingState.isStreaming && streamingState.agent && (
                    <span className="agent-badge">
                      <Cpu size={10} />
                      {streamingState.agent}
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="message-content">
              {msg.content ? (
                renderMarkdownContent(msg.content)
              ) : (
                <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  {streamingState.agent ? `[${streamingState.agent}] Thinking...` : 'Connecting to AI Agents...'}
                </span>
              )}
            </div>
          </div>
        ))}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Form & Controls */}
      <div className="chat-input-container">
        <textarea
          className="chat-input-box"
          rows={3}
          placeholder="Ask AI assistant (Shift+Enter for new line)..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <div className="chat-controls" style={{ justifyContent: 'flex-end' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSend}
            disabled={!prompt.trim() || streamingState.isStreaming}
          >
            <Send size={12} />
            <span>Send</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
