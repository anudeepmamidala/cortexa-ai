import React from 'react';
import { Bot, Folder, Plus, User, LogOut } from 'lucide-react';

export default function Navbar({
  projects,
  activeProject,
  onSelectProject,
  onOpenNewProjectModal,
  userToken,
  userEmail,
  onOpenAuthModal,
  onLogout
}) {
  return (
    <header className="ide-navbar">
      <div className="brand-section">
        <Bot className="brand-icon" size={22} />
        <span>Cortexa AI IDE</span>
      </div>

      <div className="project-selector-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="project-selector">
          <Folder size={14} style={{ color: '#89b4fa' }} />
          <select
            value={activeProject ? activeProject.id : ''}
            onChange={(e) => {
              const selected = projects.find(p => p.id === Number(e.target.value));
              if (selected) onSelectProject(selected);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {projects.length === 0 ? (
              <option value="">No Projects Found</option>
            ) : (
              projects.map(p => (
                <option key={p.id} value={p.id} style={{ background: '#181825', color: '#cdd6f4' }}>
                  {p.name}
                </option>
              ))
            )}
          </select>
        </div>

        <button className="btn btn-outline btn-sm" onClick={onOpenNewProjectModal} title="New Project">
          <Plus size={14} />
          <span>New Project</span>
        </button>
      </div>

      <div className="user-actions">
        {userToken ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{userEmail}</span>
            <button className="btn btn-outline btn-sm" onClick={onLogout} title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onOpenAuthModal}>
            <User size={14} />
            <span>Login / Register</span>
          </button>
        )}
      </div>
    </header>
  );
}
