import React, { useState, useEffect } from 'react';
import './App.css';

interface MediaItem {
  id: string;
  name: string;
  type: string;
  size: number;
  tags: string[];
  labels: string[];
  dateAdded: Date;
  file?: File;
}

function App() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'dateAdded' | 'size'>('name');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Load media items from localStorage on startup
  useEffect(() => {
    const stored = localStorage.getItem('mediaItems');
    if (stored) {
      const parsed = JSON.parse(stored);
      setMediaItems(parsed.map((item: any) => ({
        ...item,
        dateAdded: new Date(item.dateAdded)
      })));
    }
  }, []);

  // Save media items to localStorage
  useEffect(() => {
    localStorage.setItem('mediaItems', JSON.stringify(mediaItems));
  }, [mediaItems]);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newItems: MediaItem[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type || 'unknown',
      size: file.size,
      tags: [],
      labels: [],
      dateAdded: new Date(),
      file
    }));

    setMediaItems(prev => [...prev, ...newItems]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const addTag = (itemId: string, tag: string) => {
    setMediaItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, tags: [...item.tags, tag] }
        : item
    ));
  };

  const addLabel = (itemId: string, label: string) => {
    setMediaItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, labels: [...item.labels, label] }
        : item
    ));
  };

  const removeItem = (itemId: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== itemId));
  };

  const filteredAndSortedItems = mediaItems
    .filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedTags.length === 0 || selectedTags.some(tag => item.tags.includes(tag)))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'dateAdded': return b.dateAdded.getTime() - a.dateAdded.getTime();
        case 'size': return b.size - a.size;
        default: return 0;
      }
    });

  const allTags = Array.from(new Set(mediaItems.flatMap(item => item.tags)));

  return (
    <div className="media-organizer">
      <header className="header">
        <h1>📚 Media Organizer</h1>
        <p>Android-compatible media organization tool</p>
      </header>

      <div className="controls">
        <input
          type="text"
          placeholder="Search media..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value as any)}
          className="sort-select"
        >
          <option value="name">Sort by Name</option>
          <option value="dateAdded">Sort by Date Added</option>
          <option value="size">Sort by Size</option>
        </select>
      </div>

      <div className="tag-filter">
        <h3>Filter by Tags:</h3>
        <div className="tag-list">
          {allTags.map(tag => (
            <button
              key={tag}
              className={`tag ${selectedTags.includes(tag) ? 'selected' : ''}`}
              onClick={() => setSelectedTags(prev => 
                prev.includes(tag) 
                  ? prev.filter(t => t !== tag)
                  : [...prev, tag]
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div 
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
      >
        <p>📱 Drag and drop files here or click to upload</p>
        <input
          type="file"
          multiple
          onChange={(e) => handleFileUpload(e.target.files)}
          className="file-input"
        />
      </div>

      <div className="media-grid">
        {filteredAndSortedItems.map(item => (
          <MediaCard 
            key={item.id} 
            item={item} 
            onAddTag={addTag}
            onAddLabel={addLabel}
            onRemove={removeItem}
          />
        ))}
      </div>

      {mediaItems.length === 0 && (
        <div className="empty-state">
          <h2>No media files yet</h2>
          <p>Upload some files to get started organizing your media library!</p>
        </div>
      )}
    </div>
  );
}

interface MediaCardProps {
  item: MediaItem;
  onAddTag: (id: string, tag: string) => void;
  onAddLabel: (id: string, label: string) => void;
  onRemove: (id: string) => void;
}

function MediaCard({ item, onAddTag, onAddLabel, onRemove }: MediaCardProps) {
  const [newTag, setNewTag] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const handleAddTag = () => {
    if (newTag.trim()) {
      onAddTag(item.id, newTag.trim());
      setNewTag('');
    }
  };

  const handleAddLabel = () => {
    if (newLabel.trim()) {
      onAddLabel(item.id, newLabel.trim());
      setNewLabel('');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="media-card">
      <div className="media-info">
        <h3>{item.name}</h3>
        <p>Type: {item.type}</p>
        <p>Size: {formatFileSize(item.size)}</p>
        <p>Added: {item.dateAdded.toLocaleDateString()}</p>
      </div>

      <div className="tags-section">
        <h4>Tags:</h4>
        <div className="tags">
          {item.tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
        <div className="add-tag">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add tag..."
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
          />
          <button onClick={handleAddTag}>Add</button>
        </div>
      </div>

      <div className="labels-section">
        <h4>Labels:</h4>
        <div className="labels">
          {item.labels.map(label => (
            <span key={label} className="label">{label}</span>
          ))}
        </div>
        <div className="add-label">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Add label..."
            onKeyPress={(e) => e.key === 'Enter' && handleAddLabel()}
          />
          <button onClick={handleAddLabel}>Add</button>
        </div>
      </div>

      <button className="remove-btn" onClick={() => onRemove(item.id)}>
        🗑️ Remove
      </button>
    </div>
  );
}

export default App;
