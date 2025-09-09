import React, { useState, useEffect } from 'react';
import './App.css';
import { Document, Page, pdfjs } from 'react-pdf';
import JSZip from 'jszip';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Enhanced MediaItem interface based on specifications
interface MediaItem {
  id: string;
  name: string;
  originalName: string;
  type: string;
  mediaType: 'book' | 'comic' | 'pdf' | 'audio' | 'video' | 'image' | 'other';
  size: number;
  tags: string[];
  labels: string[];
  genres: string[];
  dateAdded: Date;
  file?: File;
  
  // Common metadata
  title?: string;
  sortTitle?: string;
  summary?: string;
  year?: number;
  rating?: number;
  coverImage?: string;
  
  // Book-specific metadata
  authors?: string[];
  publisher?: string;
  isbn?: string;
  pageCount?: number;
  series?: string;
  seriesIndex?: number;
  
  // Media-specific metadata
  duration?: number;
  artist?: string;
  album?: string;
  director?: string;
  
  // File metadata
  lastModified?: Date;
  fileHash?: string;
}

// File type detection utility
const detectMediaType = (filename: string, mimeType: string): 'book' | 'comic' | 'pdf' | 'audio' | 'video' | 'image' | 'other' => {
  const ext = filename.toLowerCase().split('.').pop() || '';
  
  // Book formats
  if (['epub', 'mobi', 'azw', 'azw3', 'fb2', 'lit', 'pdb', 'txt'].includes(ext)) {
    return 'book';
  }
  
  // Comic formats
  if (['cbz', 'cbr', 'cbt', 'cb7'].includes(ext)) {
    return 'comic';
  }
  
  // PDF
  if (ext === 'pdf') {
    return 'pdf';
  }
  
  // Audio
  if (['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'wma'].includes(ext) || mimeType.startsWith('audio/')) {
    return 'audio';
  }
  
  // Video
  if (['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext) || mimeType.startsWith('video/')) {
    return 'video';
  }
  
  // Image
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext) || mimeType.startsWith('image/')) {
    return 'image';
  }
  
  return 'other';
};

// Get icon for media type
const getMediaIcon = (mediaType: string) => {
  switch (mediaType) {
    case 'book': return '📚';
    case 'comic': return '📖';
    case 'pdf': return '📄';
    case 'audio': return '🎵';
    case 'video': return '🎬';
    case 'image': return '🖼️';
    default: return '📁';
  }
};

function App() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'dateAdded' | 'size' | 'title'>('name');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  // Load media items from localStorage on startup
  useEffect(() => {
    const stored = localStorage.getItem('mediaItems');
    if (stored) {
      const parsed = JSON.parse(stored);
      setMediaItems(parsed.map((item: any) => ({
        ...item,
        dateAdded: new Date(item.dateAdded),
        lastModified: item.lastModified ? new Date(item.lastModified) : undefined
      })));
    }
  }, []);

  // Save media items to localStorage
  useEffect(() => {
    localStorage.setItem('mediaItems', JSON.stringify(mediaItems));
  }, [mediaItems]);

  // Extract basic metadata from file
  const extractMetadata = async (file: File): Promise<Partial<MediaItem>> => {
    const metadata: Partial<MediaItem> = {
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      lastModified: new Date(file.lastModified)
    };

    // Auto-generate genres/tags based on file type and name
    const filename = file.name.toLowerCase();
    const autoTags: string[] = [];

    // Simple genre detection based on filename keywords
    if (filename.includes('sci-fi') || filename.includes('science fiction')) autoTags.push('Science Fiction');
    if (filename.includes('fantasy')) autoTags.push('Fantasy');
    if (filename.includes('mystery')) autoTags.push('Mystery');
    if (filename.includes('romance')) autoTags.push('Romance');
    if (filename.includes('horror')) autoTags.push('Horror');
    if (filename.includes('comic') || filename.includes('manga')) autoTags.push('Comic');

    if (autoTags.length > 0) {
      metadata.genres = autoTags;
    }

    return metadata;
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const newItems: MediaItem[] = [];

    for (const file of Array.from(files)) {
      const mediaType = detectMediaType(file.name, file.type);
      const basicMetadata = await extractMetadata(file);

      const newItem: MediaItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        originalName: file.name,
        type: file.type || 'unknown',
        mediaType,
        size: file.size,
        tags: [],
        labels: [],
        genres: basicMetadata.genres || [],
        dateAdded: new Date(),
        file,
        ...basicMetadata
      };

      newItems.push(newItem);
    }

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
        ? { ...item, tags: [...item.tags.filter(t => t !== tag), tag] }
        : item
    ));
  };

  const addLabel = (itemId: string, label: string) => {
    setMediaItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, labels: [...item.labels.filter(l => l !== label), label] }
        : item
    ));
  };

  const removeItem = (itemId: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateItem = (itemId: string, updates: Partial<MediaItem>) => {
    setMediaItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  // Enhanced filtering and sorting
  const filteredAndSortedItems = mediaItems
    .filter(item => {
      const matchesSearch = (item.title || item.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.authors || []).some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           item.summary?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => item.tags.includes(tag) || item.genres.includes(tag));
      const matchesMediaType = selectedMediaTypes.length === 0 || selectedMediaTypes.includes(item.mediaType);
      
      return matchesSearch && matchesTags && matchesMediaType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'title': return (a.title || a.name).localeCompare(b.title || b.name);
        case 'dateAdded': return b.dateAdded.getTime() - a.dateAdded.getTime();
        case 'size': return b.size - a.size;
        default: return 0;
      }
    });

  const allTags = Array.from(new Set([
    ...mediaItems.flatMap(item => item.tags),
    ...mediaItems.flatMap(item => item.genres)
  ]));

  const mediaTypeCounts = mediaItems.reduce((acc, item) => {
    acc[item.mediaType] = (acc[item.mediaType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="media-organizer">
      <header className="header">
        <h1>📚 Universal Media Library</h1>
        <p>Organize your books, comics, documents, and media files</p>
      </header>

      {/* Main Controls */}
      <div className="controls">
        <input
          type="text"
          placeholder="Search by title, author, or content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value as any)}
          className="sort-select"
        >
          <option value="name">Sort by Filename</option>
          <option value="title">Sort by Title</option>
          <option value="dateAdded">Sort by Date Added</option>
          <option value="size">Sort by Size</option>
        </select>

        <div className="view-toggle">
          <button 
            className={viewMode === 'grid' ? 'active' : ''}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </button>
          <button 
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
        </div>
      </div>

      {/* Media Type Filter */}
      <div className="media-type-filter">
        <h3>Media Types:</h3>
        <div className="media-type-buttons">
          {Object.entries(mediaTypeCounts).map(([type, count]) => (
            <button
              key={type}
              className={`media-type-btn ${selectedMediaTypes.includes(type) ? 'selected' : ''}`}
              onClick={() => setSelectedMediaTypes(prev => 
                prev.includes(type) 
                  ? prev.filter(t => t !== type)
                  : [...prev, type]
              )}
            >
              {getMediaIcon(type)} {type} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="tag-filter">
          <h3>Filter by Tags/Genres:</h3>
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
      )}

      {/* Upload Area */}
      <div 
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
      >
        <p>📱 Drag and drop media files here or click to upload</p>
        <p>Supports: EPUB, PDF, CBZ/CBR, Audio, Video, Images, and more</p>
        <input
          type="file"
          multiple
          accept=".epub,.pdf,.cbz,.cbr,.mp3,.mp4,.jpg,.jpeg,.png,.gif,.mobi,.azw,.txt"
          onChange={(e) => handleFileUpload(e.target.files)}
          className="file-input"
        />
      </div>

      {/* Media Grid/List */}
      <div className={`media-container ${viewMode}`}>
        {filteredAndSortedItems.map(item => (
          <MediaCard 
            key={item.id} 
            item={item} 
            viewMode={viewMode}
            onAddTag={addTag}
            onAddLabel={addLabel}
            onRemove={removeItem}
            onEdit={() => {
              setSelectedItem(item);
              setShowEditor(true);
            }}
            onView={() => {
              setSelectedItem(item);
              setShowViewer(true);
            }}
          />
        ))}
      </div>

      {/* Empty State */}
      {mediaItems.length === 0 && (
        <div className="empty-state">
          <h2>No media files yet</h2>
          <p>Upload books, comics, PDFs, or other media to start building your library!</p>
        </div>
      )}

      {/* Media Viewer Modal */}
      {showViewer && selectedItem && (
        <MediaViewer 
          item={selectedItem}
          onClose={() => {
            setShowViewer(false);
            setSelectedItem(null);
          }}
        />
      )}

      {/* Metadata Editor Modal */}
      {showEditor && selectedItem && (
        <MetadataEditor 
          item={selectedItem}
          onSave={(updates) => {
            updateItem(selectedItem.id, updates);
            setShowEditor(false);
            setSelectedItem(null);
          }}
          onClose={() => {
            setShowEditor(false);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
}

// Enhanced Media Card Component
interface MediaCardProps {
  item: MediaItem;
  viewMode: 'grid' | 'list';
  onAddTag: (id: string, tag: string) => void;
  onAddLabel: (id: string, label: string) => void;
  onRemove: (id: string) => void;
  onEdit: () => void;
  onView: () => void;
}

function MediaCard({ item, viewMode, onAddTag, onAddLabel, onRemove, onEdit, onView }: MediaCardProps) {
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag.trim()) {
      onAddTag(item.id, newTag.trim());
      setNewTag('');
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
    <div className={`media-card ${viewMode} ${item.mediaType}`}>
      <div className="media-icon">
        {getMediaIcon(item.mediaType)}
      </div>

      <div className="media-info">
        <h3>{item.title || item.name}</h3>
        {item.authors && item.authors.length > 0 && (
          <p className="authors">by {item.authors.join(', ')}</p>
        )}
        {item.series && (
          <p className="series">{item.series} {item.seriesIndex && `#${item.seriesIndex}`}</p>
        )}
        <div className="file-details">
          <span className="media-type">{item.mediaType.toUpperCase()}</span>
          <span className="file-size">{formatFileSize(item.size)}</span>
          {item.year && <span className="year">{item.year}</span>}
        </div>
        {item.summary && (
          <p className="summary">{item.summary.substring(0, 150)}...</p>
        )}
      </div>

      {/* Tags and Genres */}
      <div className="tags-section">
        <div className="tags">
          {[...item.tags, ...item.genres].map(tag => (
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

      {/* Action Buttons */}
      <div className="action-buttons">
        <button onClick={onView} className="view-btn" title="View/Read">
          👁️
        </button>
        <button onClick={onEdit} className="edit-btn" title="Edit Metadata">
          ✏️
        </button>
        <button onClick={() => onRemove(item.id)} className="remove-btn" title="Remove">
          🗑️
        </button>
      </div>
    </div>
  );
}

// Media Viewer Component
interface MediaViewerProps {
  item: MediaItem;
  onClose: () => void;
}

function MediaViewer({ item, onClose }: MediaViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);

  const renderViewer = () => {
    if (!item.file) {
      return <div className="viewer-error">File not available for viewing</div>;
    }

    switch (item.mediaType) {
      case 'pdf':
        return (
          <div className="pdf-viewer">
            <Document
              file={item.file}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            >
              <Page pageNumber={currentPage} />
            </Document>
            {numPages && (
              <div className="pdf-controls">
                <button 
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} of {numPages}
                </span>
                <button 
                  disabled={currentPage >= numPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        );
      
      case 'image':
        return (
          <img 
            src={URL.createObjectURL(item.file)}
            alt={item.title || item.name}
            className="image-viewer"
          />
        );
      
      case 'book':
      case 'comic':
        return (
          <div className="text-viewer">
            <h3>{item.title || item.name}</h3>
            <p>Book/Comic viewer coming soon...</p>
            <p>File format: {item.type}</p>
          </div>
        );
      
      default:
        return (
          <div className="unsupported-viewer">
            <h3>{item.title || item.name}</h3>
            <p>Viewer for {item.mediaType} files is not yet supported.</p>
            <p>File type: {item.type}</p>
          </div>
        );
    }
  };

  return (
    <div className="media-viewer-modal">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <div className="modal-header">
          <h2>{item.title || item.name}</h2>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>
        <div className="modal-body">
          {renderViewer()}
        </div>
      </div>
    </div>
  );
}

// Metadata Editor Component
interface MetadataEditorProps {
  item: MediaItem;
  onSave: (updates: Partial<MediaItem>) => void;
  onClose: () => void;
}

function MetadataEditor({ item, onSave, onClose }: MetadataEditorProps) {
  const [formData, setFormData] = useState<Partial<MediaItem>>({
    title: item.title || item.name,
    authors: item.authors || [],
    publisher: item.publisher || '',
    year: item.year || undefined,
    summary: item.summary || '',
    series: item.series || '',
    seriesIndex: item.seriesIndex || undefined,
    tags: item.tags || [],
    genres: item.genres || [],
    rating: item.rating || 0
  });

  const [newAuthor, setNewAuthor] = useState('');
  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addAuthor = () => {
    if (newAuthor.trim()) {
      setFormData(prev => ({
        ...prev,
        authors: [...(prev.authors || []), newAuthor.trim()]
      }));
      setNewAuthor('');
    }
  };

  const removeAuthor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      authors: (prev.authors || []).filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="metadata-editor-modal">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Metadata</h2>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="metadata-form">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Authors</label>
            <div className="authors-list">
              {(formData.authors || []).map((author, index) => (
                <div key={index} className="author-chip">
                  {author}
                  <button type="button" onClick={() => removeAuthor(index)}>×</button>
                </div>
              ))}
            </div>
            <div className="add-author">
              <input
                type="text"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="Add author..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAuthor())}
              />
              <button type="button" onClick={addAuthor}>Add</button>
            </div>
          </div>

          <div className="form-group">
            <label>Publisher</label>
            <input
              type="text"
              value={formData.publisher || ''}
              onChange={(e) => setFormData({...formData, publisher: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Year</label>
            <input
              type="number"
              value={formData.year || ''}
              onChange={(e) => setFormData({...formData, year: parseInt(e.target.value) || undefined})}
            />
          </div>

          <div className="form-group">
            <label>Series</label>
            <input
              type="text"
              value={formData.series || ''}
              onChange={(e) => setFormData({...formData, series: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Series Index</label>
            <input
              type="number"
              value={formData.seriesIndex || ''}
              onChange={(e) => setFormData({...formData, seriesIndex: parseInt(e.target.value) || undefined})}
            />
          </div>

          <div className="form-group">
            <label>Summary</label>
            <textarea
              value={formData.summary || ''}
              onChange={(e) => setFormData({...formData, summary: e.target.value})}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Rating</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className={star <= (formData.rating || 0) ? 'active' : ''}
                  onClick={() => setFormData({...formData, rating: star === formData.rating ? 0 : star})}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tags-list">
              {(formData.tags || []).map((tag, index) => (
                <div key={index} className="tag-chip">
                  {tag}
                  <button type="button" onClick={() => removeTag(index)}>×</button>
                </div>
              ))}
            </div>
            <div className="add-tag">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button type="button" onClick={addTag}>Add</button>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
            <button type="submit" className="save-btn">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;