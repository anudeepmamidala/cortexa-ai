import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';

export default function NewProjectModal({ isOpen, onClose, onCreateProject }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onCreateProject(name, description);
      setName('');
      setDescription('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderPlus size={18} style={{ color: '#89b4fa' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Create New Project</h3>
          </div>
          <X size={16} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label>Project Name</label>
            <input
              className="form-input"
              type="text"
              required
              placeholder="e.g. e-commerce-backend"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Description (Optional)</label>
            <input
              className="form-input"
              type="text"
              placeholder="Microservices backend workspace..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: '8px', justifyContent: 'center' }}>
            {loading ? 'Creating Project...' : 'Create Project'}
          </button>
        </form>
      </div>
    </div>
  );
}
