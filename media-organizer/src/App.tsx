import React, { useState, useEffect } from 'react';
import './App.css';
import { Document, Page, pdfjs } from 'react-pdf';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Forward declaration for MediaItem interface
interface MediaItem {
  id: string;
  name: string;
  originalName: string;
  type: string;
  mediaType: 'book' | 'comic' | 'pdf' | 'music' | 'movie' | 'tv' | 'image' | 'other';
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
  
  // Music-specific metadata
  duration?: number;
  artist?: string;
  albumArtist?: string;
  album?: string;
  trackNumber?: number;
  discNumber?: number;
  
  // Video-specific metadata
  director?: string;
  cast?: string[];
  runtime?: number;
  // TV Show specific
  season?: number;
  episode?: number;
  showTitle?: string;
  
  // Playback metadata
  currentPosition?: number;
  watchedStatus?: 'unwatched' | 'partial' | 'watched';
  
  // File metadata
  lastModified?: Date;
  fileHash?: string;
}

// API Service Layer for External Metadata Fetching
interface APIResult {
  success: boolean;
  data?: Partial<MediaItem>;
  error?: string;
}

class MetadataAPIService {
  // TMDB API for movies and TV shows
  static async fetchMovieMetadata(title: string, year?: number): Promise<APIResult> {
    try {
      const apiKey = process.env.REACT_APP_TMDB_API_KEY || process.env.TMDB_API_KEY;
      if (!apiKey) {
        return { success: false, error: 'TMDB API key not configured' };
      }

      const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(title)}${year ? `&year=${year}` : ''}`;
      const response = await fetch(searchUrl);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const movie = data.results[0];
        return {
          success: true,
          data: {
            title: movie.title,
            summary: movie.overview,
            year: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : undefined,
            rating: movie.vote_average ? Math.round(movie.vote_average / 2) : undefined,
            coverImage: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
            genres: movie.genre_ids ? [] : undefined // We'd need to map genre IDs to names
          }
        };
      }

      return { success: false, error: 'No movie found with that title' };
    } catch (error) {
      return { success: false, error: 'Failed to fetch movie data' };
    }
  }

  static async fetchTVMetadata(title: string, year?: number): Promise<APIResult> {
    try {
      const apiKey = process.env.REACT_APP_TMDB_API_KEY || process.env.TMDB_API_KEY;
      if (!apiKey) {
        return { success: false, error: 'TMDB API key not configured' };
      }

      const searchUrl = `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(title)}${year ? `&first_air_date_year=${year}` : ''}`;
      const response = await fetch(searchUrl);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const show = data.results[0];
        return {
          success: true,
          data: {
            showTitle: show.name,
            title: show.name,
            summary: show.overview,
            year: show.first_air_date ? parseInt(show.first_air_date.split('-')[0]) : undefined,
            rating: show.vote_average ? Math.round(show.vote_average / 2) : undefined,
            coverImage: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : undefined
          }
        };
      }

      return { success: false, error: 'No TV show found with that title' };
    } catch (error) {
      return { success: false, error: 'Failed to fetch TV show data' };
    }
  }

  // Open Library API for books
  static async fetchBookMetadata(title: string, author?: string): Promise<APIResult> {
    try {
      let searchQuery = `title:${encodeURIComponent(title)}`;
      if (author) {
        searchQuery += `+author:${encodeURIComponent(author)}`;
      }

      const searchUrl = `https://openlibrary.org/search.json?q=${searchQuery}&limit=5`;
      const response = await fetch(searchUrl);
      const data = await response.json();

      if (data.docs && data.docs.length > 0) {
        const book = data.docs[0];
        return {
          success: true,
          data: {
            title: book.title,
            authors: book.author_name || [],
            publisher: book.publisher ? book.publisher[0] : undefined,
            year: book.first_publish_year,
            isbn: book.isbn ? book.isbn[0] : undefined,
            pageCount: book.number_of_pages_median,
            summary: book.first_sentence ? book.first_sentence.join(' ') : undefined,
            coverImage: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : undefined
          }
        };
      }

      return { success: false, error: 'No book found with that title' };
    } catch (error) {
      return { success: false, error: 'Failed to fetch book data' };
    }
  }

  // MusicBrainz API for music
  static async fetchMusicMetadata(artist: string, album?: string): Promise<APIResult> {
    try {
      let searchQuery = `artist:${encodeURIComponent(artist)}`;
      if (album) {
        searchQuery += `+release:${encodeURIComponent(album)}`;
      }

      const searchUrl = `https://musicbrainz.org/ws/2/release?query=${searchQuery}&fmt=json&limit=5`;
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'UniversalMediaLibrary/1.0 (contact@example.com)'
        }
      });
      const data = await response.json();

      if (data.releases && data.releases.length > 0) {
        const release = data.releases[0];
        return {
          success: true,
          data: {
            album: release.title,
            artist: release['artist-credit'] ? release['artist-credit'][0].name : artist,
            year: release.date ? parseInt(release.date.split('-')[0]) : undefined,
            albumArtist: release['artist-credit'] ? release['artist-credit'][0].name : undefined
          }
        };
      }

      return { success: false, error: 'No music release found' };
    } catch (error) {
      return { success: false, error: 'Failed to fetch music data' };
    }
  }

  // Generic metadata fetcher based on media type
  static async fetchMetadata(mediaType: string, title: string, additionalInfo?: { year?: number; artist?: string; author?: string }): Promise<APIResult> {
    switch (mediaType) {
      case 'movie':
        return this.fetchMovieMetadata(title, additionalInfo?.year);
      case 'tv':
        return this.fetchTVMetadata(title, additionalInfo?.year);
      case 'book':
      case 'comic':
        return this.fetchBookMetadata(title, additionalInfo?.author);
      case 'music':
        return this.fetchMusicMetadata(additionalInfo?.artist || title, title);
      default:
        return { success: false, error: 'Metadata fetching not supported for this media type' };
    }
  }
}

// MediaItem interface already defined above for API service

// File type detection utility
const detectMediaType = (filename: string, mimeType: string): 'book' | 'comic' | 'pdf' | 'music' | 'movie' | 'tv' | 'image' | 'other' => {
  const ext = filename.toLowerCase().split('.').pop() || '';
  const lowerFilename = filename.toLowerCase();
  
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
  
  // Music
  if (['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'wma'].includes(ext) || mimeType.startsWith('audio/')) {
    return 'music';
  }
  
  // TV Shows (detect by common TV naming patterns)
  if (['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext) || mimeType.startsWith('video/')) {
    // Check for TV show patterns: S01E01, Season 1, Episode 1, etc.
    const tvPatterns = [
      /s\d+e\d+/i, // S01E01
      /season\s*\d+.*episode\s*\d+/i, // Season 1 Episode 1
      /\d+x\d+/i, // 1x01
    ];
    
    if (tvPatterns.some(pattern => pattern.test(lowerFilename))) {
      return 'tv';
    }
    return 'movie';
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
    case 'music': return '🎵';
    case 'movie': return '🎬';
    case 'tv': return '📺';
    case 'image': return '🖼️';
    default: return '📁';
  }
};

// Get media type display name
const getMediaTypeDisplayName = (mediaType: string) => {
  switch (mediaType) {
    case 'book': return 'Books';
    case 'comic': return 'Comics';
    case 'pdf': return 'Documents';
    case 'music': return 'Music';
    case 'movie': return 'Movies';
    case 'tv': return 'TV Shows';
    case 'image': return 'Photos';
    default: return 'Other';
  }
};

function App() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  
  // Navigation state
  const [currentView, setCurrentView] = useState<'home' | 'music' | 'movies' | 'tv' | 'books' | 'comics' | 'documents' | 'photos'>('home');

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

  // Extract enhanced metadata from file
  const extractMetadata = async (file: File, mediaType: MediaItem['mediaType']): Promise<Partial<MediaItem>> => {
    const metadata: Partial<MediaItem> = {
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      lastModified: new Date(file.lastModified),
      watchedStatus: 'unwatched'
    };

    const filename = file.name.toLowerCase();
    const autoTags: string[] = [];

    // Enhanced metadata extraction based on media type
    if (mediaType === 'music') {
      // Extract music metadata from filename patterns
      const patterns = {
        artist: /^(.+?) - .+/,
        album: /\[(.+?)\]/,
        trackNumber: /^\d+\./
      };
      
      const artistMatch = filename.match(patterns.artist);
      if (artistMatch) metadata.artist = artistMatch[1];
      
      const albumMatch = filename.match(patterns.album);
      if (albumMatch) metadata.album = albumMatch[1];
      
      // Auto-detect music genres
      if (filename.includes('rock')) autoTags.push('Rock');
      if (filename.includes('pop')) autoTags.push('Pop');
      if (filename.includes('jazz')) autoTags.push('Jazz');
      if (filename.includes('classical')) autoTags.push('Classical');
      if (filename.includes('electronic')) autoTags.push('Electronic');
    }
    
    else if (mediaType === 'movie' || mediaType === 'tv') {
      // Extract video metadata from filename
      const yearMatch = filename.match(/\((\d{4})\)/);
      if (yearMatch) metadata.year = parseInt(yearMatch[1]);
      
      if (mediaType === 'tv') {
        // Extract season/episode info
        const seasonMatch = filename.match(/s(\d+)e(\d+)/i);
        if (seasonMatch) {
          metadata.season = parseInt(seasonMatch[1]);
          metadata.episode = parseInt(seasonMatch[2]);
        }
        
        // Extract show title (everything before season info)
        const showMatch = filename.match(/^(.+?)(?:\s*s\d+e\d+)/i);
        if (showMatch) metadata.showTitle = showMatch[1].replace(/\./g, ' ').trim();
      }
      
      // Auto-detect video genres
      if (filename.includes('action')) autoTags.push('Action');
      if (filename.includes('comedy')) autoTags.push('Comedy');
      if (filename.includes('drama')) autoTags.push('Drama');
      if (filename.includes('horror')) autoTags.push('Horror');
      if (filename.includes('sci-fi') || filename.includes('science fiction')) autoTags.push('Science Fiction');
    }
    
    else if (mediaType === 'book') {
      // Auto-detect book genres
      if (filename.includes('sci-fi') || filename.includes('science fiction')) autoTags.push('Science Fiction');
      if (filename.includes('fantasy')) autoTags.push('Fantasy');
      if (filename.includes('mystery')) autoTags.push('Mystery');
      if (filename.includes('romance')) autoTags.push('Romance');
      if (filename.includes('horror')) autoTags.push('Horror');
      if (filename.includes('non-fiction')) autoTags.push('Non-Fiction');
    }

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
      const basicMetadata = await extractMetadata(file, mediaType);

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

  const updateItem = (itemId: string, updates: Partial<MediaItem>) => {
    setMediaItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  const removeItem = (itemId: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Filter items by media type and search
  const getFilteredItems = (mediaTypes: MediaItem['mediaType'][], limit?: number) => {
    return mediaItems
      .filter(item => {
        const matchesType = mediaTypes.includes(item.mediaType);
        const matchesSearch = !searchTerm || 
          (item.title || item.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.artist || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.authors || []).some(author => author.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesType && matchesSearch;
      })
      .sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime())
      .slice(0, limit);
  };

  // Get recently added items (last 10)
  const recentItems = mediaItems
    .sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime())
    .slice(0, 10);

  // Get continue watching/reading items (items with partial progress)
  const continueItems = mediaItems
    .filter(item => item.watchedStatus === 'partial')
    .sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime())
    .slice(0, 6);

  // Get media type counts for library overview
  const libraryStats = mediaItems.reduce((acc, item) => {
    acc[item.mediaType] = (acc[item.mediaType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const renderLibrarySection = (title: string, items: MediaItem[], viewAllAction?: () => void) => {
    if (items.length === 0) return null;
    
    return (
      <div className="library-section">
        <div className="section-header">
          <h2>{title}</h2>
          {viewAllAction && (
            <button className="view-all-btn" onClick={viewAllAction}>
              View All
            </button>
          )}
        </div>
        <div className="media-row">
          {items.map(item => (
            <div key={item.id} className="media-card-compact">
              <div className="media-poster" onClick={() => {
                setSelectedItem(item);
                setShowViewer(true);
              }}>
                {item.coverImage ? (
                  <img 
                    src={item.coverImage} 
                    alt={item.title || item.name}
                    className="cover-image"
                  />
                ) : (
                  <div className="media-icon-large">
                    {getMediaIcon(item.mediaType)}
                  </div>
                )}
                {item.watchedStatus === 'partial' && (
                  <div className="progress-indicator">▶</div>
                )}
                <div className="media-overlay-compact">
                  <button className="edit-icon-btn" onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem(item);
                    setShowEditor(true);
                  }}>
                    ✏️
                  </button>
                </div>
              </div>
              <div className="media-info-compact">
                <h4>{item.title || item.name}</h4>
                <p className="media-subtitle">
                  {item.mediaType === 'music' && item.artist && `${item.artist}`}
                  {item.mediaType === 'movie' && item.year && `${item.year}`}
                  {item.mediaType === 'tv' && item.season && item.episode && `S${item.season}E${item.episode}`}
                  {item.mediaType === 'book' && item.authors && `${item.authors[0]}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHomeDashboard = () => (
    <div className="dashboard">
      {/* Library Overview */}
      <div className="library-overview">
        <h2>Your Library</h2>
        <div className="library-grid">
          {Object.entries(libraryStats).map(([mediaType, count]) => (
            <div 
              key={mediaType} 
              className="library-card"
              onClick={() => setCurrentView(mediaType as any)}
            >
              <div className="library-icon">
                {getMediaIcon(mediaType)}
              </div>
              <div className="library-info">
                <h3>{getMediaTypeDisplayName(mediaType)}</h3>
                <p>{count} {count === 1 ? 'item' : 'items'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recently Added */}
      {renderLibrarySection(
        'Recently Added', 
        recentItems,
        () => console.log('View all recent')
      )}

      {/* Continue Watching/Reading */}
      {renderLibrarySection(
        'Continue Watching', 
        continueItems
      )}

      {/* Quick access sections */}
      {renderLibrarySection(
        'Movies', 
        getFilteredItems(['movie'], 6),
        () => setCurrentView('movies')
      )}

      {renderLibrarySection(
        'TV Shows', 
        getFilteredItems(['tv'], 6),
        () => setCurrentView('tv')
      )}

      {renderLibrarySection(
        'Music', 
        getFilteredItems(['music'], 6),
        () => setCurrentView('music')
      )}

      {renderLibrarySection(
        'Books', 
        getFilteredItems(['book'], 6),
        () => setCurrentView('books')
      )}
    </div>
  );

  const renderMediaTypeView = (mediaTypes: MediaItem['mediaType'][]) => {
    const filteredItems = getFilteredItems(mediaTypes);
    
    return (
      <div className="media-type-view">
        <div className="media-grid-full">
          {filteredItems.map(item => (
            <MediaCard 
              key={item.id} 
              item={item}
              onEdit={() => {
                setSelectedItem(item);
                setShowEditor(true);
              }}
              onView={() => {
                setSelectedItem(item);
                setShowViewer(true);
              }}
              onRemove={removeItem}
            />
          ))}
        </div>
        
        {filteredItems.length === 0 && (
          <div className="empty-state">
            <h3>No {getMediaTypeDisplayName(mediaTypes[0]).toLowerCase()} found</h3>
            <p>Upload some files to get started!</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="media-organizer plex-style">
      {/* Navigation Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-header">
          <h1>📚 Media Hub</h1>
        </div>
        
        <div className="nav-section">
          <button 
            className={currentView === 'home' ? 'nav-item active' : 'nav-item'}
            onClick={() => setCurrentView('home')}
          >
            🏠 Home
          </button>
        </div>

        <div className="nav-section">
          <h3>Library</h3>
          <button 
            className={currentView === 'movies' ? 'nav-item active' : 'nav-item'}
            onClick={() => setCurrentView('movies')}
          >
            🎬 Movies ({libraryStats.movie || 0})
          </button>
          <button 
            className={currentView === 'tv' ? 'nav-item active' : 'nav-item'}
            onClick={() => setCurrentView('tv')}
          >
            📺 TV Shows ({libraryStats.tv || 0})
          </button>
          <button 
            className={currentView === 'music' ? 'nav-item active' : 'nav-item'}
            onClick={() => setCurrentView('music')}
          >
            🎵 Music ({libraryStats.music || 0})
          </button>
          <button 
            className={currentView === 'books' ? 'nav-item active' : 'nav-item'}
            onClick={() => setCurrentView('books')}
          >
            📚 Books ({libraryStats.book || 0})
          </button>
          <button 
            className={currentView === 'comics' ? 'nav-item active' : 'nav-item'}
            onClick={() => setCurrentView('comics')}
          >
            📖 Comics ({libraryStats.comic || 0})
          </button>
          <button 
            className={currentView === 'documents' ? 'nav-item active' : 'nav-item'}
            onClick={() => setCurrentView('documents')}
          >
            📄 Documents ({libraryStats.pdf || 0})
          </button>
          <button 
            className={currentView === 'photos' ? 'nav-item active' : 'nav-item'}
            onClick={() => setCurrentView('photos')}
          >
            🖼️ Photos ({libraryStats.image || 0})
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <h2>
              {currentView === 'home' && 'Dashboard'}
              {currentView === 'movies' && 'Movies'}
              {currentView === 'tv' && 'TV Shows'}
              {currentView === 'music' && 'Music'}
              {currentView === 'books' && 'Books'}
              {currentView === 'comics' && 'Comics'}
              {currentView === 'documents' && 'Documents'}
              {currentView === 'photos' && 'Photos'}
            </h2>
          </div>
          <div className="header-right">
            <input
              type="text"
              placeholder="Search your library..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-header"
            />
          </div>
        </header>

        {/* Upload Area */}
        <div 
          className={`upload-area-header ${isDragging ? 'dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
        >
          <span>📱 Drop files here to add to your library</span>
          <input
            type="file"
            multiple
            accept=".epub,.pdf,.cbz,.cbr,.mp3,.mp4,.jpg,.jpeg,.png,.gif,.mobi,.azw,.txt,.mkv,.avi"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="file-input-header"
          />
        </div>

        {/* Content Area */}
        <div className="content-area">
          {currentView === 'home' && renderHomeDashboard()}
          {currentView === 'movies' && renderMediaTypeView(['movie'])}
          {currentView === 'tv' && renderMediaTypeView(['tv'])}
          {currentView === 'music' && renderMediaTypeView(['music'])}
          {currentView === 'books' && renderMediaTypeView(['book'])}
          {currentView === 'comics' && renderMediaTypeView(['comic'])}
          {currentView === 'documents' && renderMediaTypeView(['pdf'])}
          {currentView === 'photos' && renderMediaTypeView(['image'])}
        </div>
      </main>

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
  onEdit: () => void;
  onView: () => void;
  onRemove: (id: string) => void;
}

function MediaCard({ item, onEdit, onView, onRemove }: MediaCardProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDisplayInfo = () => {
    switch (item.mediaType) {
      case 'music':
        return {
          primary: item.title || item.name,
          secondary: item.artist || 'Unknown Artist',
          tertiary: item.album || ''
        };
      case 'movie':
        return {
          primary: item.title || item.name,
          secondary: item.year ? `(${item.year})` : '',
          tertiary: item.director || ''
        };
      case 'tv':
        return {
          primary: item.showTitle || item.title || item.name,
          secondary: item.season && item.episode ? `S${item.season}E${item.episode}` : '',
          tertiary: item.director || ''
        };
      case 'book':
        return {
          primary: item.title || item.name,
          secondary: item.authors ? item.authors.join(', ') : '',
          tertiary: item.series || ''
        };
      default:
        return {
          primary: item.title || item.name,
          secondary: '',
          tertiary: ''
        };
    }
  };

  const displayInfo = getDisplayInfo();

  return (
    <div className="media-card-detailed">
      <div className="media-poster-large">
        {item.coverImage ? (
          <img 
            src={item.coverImage} 
            alt={item.title || item.name}
            className="cover-image-large"
          />
        ) : (
          <div className="media-icon-xl">
            {getMediaIcon(item.mediaType)}
          </div>
        )}
        <div className="media-overlay">
          <button onClick={onView} className="play-btn">▶</button>
          <button onClick={onEdit} className="edit-btn">✏️</button>
        </div>
      </div>
      
      <div className="media-details">
        <div className="title-with-edit">
          <h3>{displayInfo.primary}</h3>
          <button onClick={onEdit} className="inline-edit-btn" title="Edit metadata">
            ✏️
          </button>
        </div>
        {displayInfo.secondary && <p className="media-secondary">{displayInfo.secondary}</p>}
        {displayInfo.tertiary && <p className="media-tertiary">{displayInfo.tertiary}</p>}
        
        <div className="media-meta">
          <span className="file-size">{formatFileSize(item.size)}</span>
          {item.genres.length > 0 && (
            <div className="genres">
              {item.genres.slice(0, 2).map(genre => (
                <span key={genre} className="genre-tag">{genre}</span>
              ))}
            </div>
          )}
        </div>
        
        <div className="media-actions">
          <button onClick={onView} className="btn-play">Play</button>
          <button onClick={onEdit} className="btn-edit">Edit</button>
          <button onClick={() => onRemove(item.id)} className="btn-remove">Remove</button>
        </div>
      </div>
    </div>
  );
}

// Media Viewer Component (keeping the existing one)
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
      
      case 'music':
        return (
          <div className="audio-player">
            <div className="audio-info">
              <h3>{item.title || item.name}</h3>
              {item.artist && <p>by {item.artist}</p>}
              {item.album && <p>from {item.album}</p>}
            </div>
            <audio controls src={URL.createObjectURL(item.file)}>
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      
      case 'movie':
      case 'tv':
        return (
          <div className="video-player">
            <video controls src={URL.createObjectURL(item.file)} className="video-element">
              Your browser does not support the video element.
            </video>
            <div className="video-info">
              <h3>{item.title || item.name}</h3>
              {item.year && <p>({item.year})</p>}
              {item.summary && <p>{item.summary}</p>}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="unsupported-viewer">
            <h3>{item.title || item.name}</h3>
            <p>Preview not available for {item.mediaType} files.</p>
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

// Metadata Editor Component (keeping the existing one with updates)
interface MetadataEditorProps {
  item: MediaItem;
  onSave: (updates: Partial<MediaItem>) => void;
  onClose: () => void;
}

function MetadataEditor({ item, onSave, onClose }: MetadataEditorProps) {
  const [formData, setFormData] = useState<Partial<MediaItem>>({
    title: item.title || item.name,
    authors: item.authors || [],
    artist: item.artist || '',
    album: item.album || '',
    director: item.director || '',
    publisher: item.publisher || '',
    year: item.year || undefined,
    summary: item.summary || '',
    series: item.series || '',
    seriesIndex: item.seriesIndex || undefined,
    tags: item.tags || [],
    genres: item.genres || [],
    rating: item.rating || 0,
    season: item.season || undefined,
    episode: item.episode || undefined,
    showTitle: item.showTitle || '',
    coverImage: item.coverImage || ''
  });

  const [newAuthor, setNewAuthor] = useState('');
  const [newTag, setNewTag] = useState('');
  const [coverPreview, setCoverPreview] = useState(item.coverImage || '');
  
  // Tab and validation state
  const [activeTab, setActiveTab] = useState<'basic' | 'media' | 'organization'>('basic');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // API loading and feedback state
  const [isLoadingAPI, setIsLoadingAPI] = useState(false);
  const [apiMessage, setApiMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields before saving
    const errors = validateForm(formData, item.mediaType);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Switch to the tab with the first error
      if (errors.title || errors.year || errors.summary) setActiveTab('basic');
      else if (errors.artist || errors.director || errors.season) setActiveTab('media');
      else setActiveTab('organization');
      return;
    }
    
    onSave({...formData, coverImage: coverPreview});
  };

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCoverPreview(result);
        setFormData({...formData, coverImage: result});
      };
      reader.readAsDataURL(file);
    }
  };

  // Validation function
  const validateForm = (data: Partial<MediaItem>, mediaType: string): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (!data.title?.trim()) {
      errors.title = 'Title is required';
    }
    
    if (data.year && (data.year < 1000 || data.year > new Date().getFullYear() + 10)) {
      errors.year = 'Please enter a valid year';
    }
    
    if (mediaType === 'book' && data.authors && data.authors.length === 0) {
      errors.authors = 'At least one author is recommended for books';
    }
    
    if (mediaType === 'music' && !data.artist?.trim()) {
      errors.artist = 'Artist is recommended for music';
    }
    
    if ((mediaType === 'movie' || mediaType === 'tv') && !data.director?.trim()) {
      errors.director = 'Director is recommended for videos';
    }
    
    return errors;
  };

  // Handle field changes with validation
  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear validation error when field is corrected
    if (validationErrors[field]) {
      const newErrors = { ...validationErrors };
      delete newErrors[field];
      setValidationErrors(newErrors);
    }
  };

  // Calculate completion percentage
  const calculateCompletion = (): number => {
    const requiredFields = ['title', 'summary'];
    const mediaSpecificFields = {
      book: ['authors', 'publisher'],
      music: ['artist', 'album'],
      movie: ['director', 'year'],
      tv: ['director', 'season', 'episode'],
      comic: ['authors', 'series'],
      pdf: ['title', 'summary']
    };
    
    const allFields = [...requiredFields, ...(mediaSpecificFields[item.mediaType as keyof typeof mediaSpecificFields] || [])];
    const completed = allFields.filter(field => {
      const value = formData[field as keyof MediaItem];
      return value && (Array.isArray(value) ? value.length > 0 : String(value).trim() !== '');
    }).length;
    
    return Math.round((completed / allFields.length) * 100);
  };

  // Auto-Fill functionality
  const handleAutoFill = async () => {
    if (!formData.title) {
      setApiMessage({ type: 'error', text: 'Please enter a title first to search for metadata.' });
      setTimeout(() => setApiMessage(null), 5000);
      return;
    }

    setIsLoadingAPI(true);
    setApiMessage(null);

    try {
      const additionalInfo: { year?: number; artist?: string; author?: string } = {};
      
      if (formData.year) additionalInfo.year = formData.year;
      if (formData.artist) additionalInfo.artist = formData.artist;
      if (formData.authors && formData.authors.length > 0) additionalInfo.author = formData.authors[0];

      const result = await MetadataAPIService.fetchMetadata(item.mediaType, formData.title, additionalInfo);
      
      if (result.success && result.data) {
        // Merge API data with existing form data, preserving user's existing data
        const mergedData = { ...formData };
        Object.keys(result.data).forEach(key => {
          const typedKey = key as keyof MediaItem;
          if (result.data![typedKey] !== undefined && result.data![typedKey] !== null) {
            // Only overwrite if the current field is empty
            if (!mergedData[typedKey] || 
                (Array.isArray(mergedData[typedKey]) && (mergedData[typedKey] as any[]).length === 0) ||
                String(mergedData[typedKey]).trim() === '') {
              (mergedData as any)[typedKey] = result.data![typedKey];
            }
          }
        });
        
        setFormData(mergedData);
        if (result.data.coverImage) {
          setCoverPreview(result.data.coverImage);
        }
        
        setApiMessage({ type: 'success', text: 'Metadata successfully fetched and populated!' });
        setTimeout(() => setApiMessage(null), 5000);
      } else {
        setApiMessage({ type: 'error', text: result.error || 'Failed to fetch metadata' });
        setTimeout(() => setApiMessage(null), 5000);
      }
    } catch (error) {
      setApiMessage({ type: 'error', text: 'An error occurred while fetching metadata' });
      setTimeout(() => setApiMessage(null), 5000);
    } finally {
      setIsLoadingAPI(false);
    }
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

  // Floating Input Component
  const FloatingInput = ({ label, field, type = "text", required = false, multiline = false }: {
    label: string;
    field: string;
    type?: string;
    required?: boolean;
    multiline?: boolean;
  }) => {
    const value = formData[field as keyof MediaItem] || '';
    const hasError = validationErrors[field];
    
    return (
      <div className={`floating-input-group ${hasError ? 'error' : ''} ${value ? 'filled' : ''}`}>
        {multiline ? (
          <textarea
            value={String(value)}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="floating-input"
            placeholder=" "
            rows={4}
          />
        ) : (
          <input
            type={type}
            value={String(value)}
            onChange={(e) => handleFieldChange(field, type === 'number' ? parseInt(e.target.value) || undefined : e.target.value)}
            className="floating-input"
            placeholder=" "
          />
        )}
        <label className="floating-label">
          {label} {required && <span className="required-star">*</span>}
        </label>
        {hasError && <span className="error-message">{hasError}</span>}
      </div>
    );
  };

  return (
    <div className="metadata-editor-modal modern">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <div className="modal-header">
          <div className="header-info">
            <h2>Edit Metadata - {getMediaTypeDisplayName(item.mediaType)}</h2>
            <div className="completion-indicator">
              <div className="completion-bar">
                <div 
                  className="completion-progress" 
                  style={{ width: `${calculateCompletion()}%` }}
                ></div>
              </div>
              <span className="completion-text">{calculateCompletion()}% Complete</span>
            </div>
            {/* Auto-Fill Button */}
            <button 
              type="button" 
              onClick={handleAutoFill}
              disabled={isLoadingAPI || !formData.title}
              className="auto-fill-btn"
              title="Automatically fetch metadata from online databases"
            >
              {isLoadingAPI ? (
                <>
                  <span className="spinner">⟳</span>
                  Fetching...
                </>
              ) : (
                <>
                  <span className="auto-fill-icon">🔍</span>
                  Auto-Fill
                </>
              )}
            </button>
          </div>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        {/* API Message */}
        {apiMessage && (
          <div className={`api-message ${apiMessage.type}`}>
            <span className="message-icon">
              {apiMessage.type === 'success' ? '✅' : '❌'}
            </span>
            {apiMessage.text}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            <span className="tab-icon">📝</span>
            Basic Info
            {(validationErrors.title || validationErrors.year || validationErrors.summary) && 
              <span className="error-indicator">!</span>}
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => setActiveTab('media')}
          >
            <span className="tab-icon">{getMediaIcon(item.mediaType)}</span>
            Media Details
            {(validationErrors.artist || validationErrors.director || validationErrors.season) && 
              <span className="error-indicator">!</span>}
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'organization' ? 'active' : ''}`}
            onClick={() => setActiveTab('organization')}
          >
            <span className="tab-icon">🏷️</span>
            Organization
          </button>
        </div>

        <form onSubmit={handleSubmit} className="metadata-form tabbed">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="tab-content">
              <div className="tab-section">
                <h3 className="section-title">Cover Image</h3>
                <div className="cover-upload-section">
                  <div className="cover-preview">
                    {coverPreview ? (
                      <img src={coverPreview} alt="Cover preview" className="cover-preview-image" />
                    ) : (
                      <div className="cover-placeholder">
                        <span className="cover-icon">{getMediaIcon(item.mediaType)}</span>
                        <p>No cover image</p>
                      </div>
                    )}
                  </div>
                  <div className="cover-upload-controls">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageUpload}
                      className="cover-file-input"
                      id="cover-upload"
                    />
                    <label htmlFor="cover-upload" className="cover-upload-btn">
                      Choose Image
                    </label>
                    <input
                      type="url"
                      placeholder="Or enter image URL..."
                      value={formData.coverImage || ''}
                      onChange={(e) => {
                        handleFieldChange('coverImage', e.target.value);
                        setCoverPreview(e.target.value);
                      }}
                      className="cover-url-input"
                    />
                    {coverPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setCoverPreview('');
                          handleFieldChange('coverImage', '');
                        }}
                        className="remove-cover-btn"
                      >
                        Remove Cover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="tab-section">
                <h3 className="section-title">Basic Information</h3>
                <div className="form-grid">
                  <FloatingInput label="Title" field="title" required />
                  <FloatingInput label="Sort Title" field="sortTitle" />
                  <FloatingInput label="Year" field="year" type="number" />
                </div>
                <FloatingInput label="Summary" field="summary" multiline />
                
                <div className="form-group">
                  <label className="section-label">Rating</label>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        className={star <= (formData.rating || 0) ? 'active' : ''}
                        onClick={() => handleFieldChange('rating', star === formData.rating ? 0 : star)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Media Details Tab */}
          {activeTab === 'media' && (
            <div className="tab-content">
              {/* Music-specific fields */}
              {item.mediaType === 'music' && (
                <div className="tab-section">
                  <h3 className="section-title">Music Information</h3>
                  <div className="form-grid">
                    <FloatingInput label="Artist" field="artist" required />
                    <FloatingInput label="Album Artist" field="albumArtist" />
                    <FloatingInput label="Album" field="album" />
                    <FloatingInput label="Track Number" field="trackNumber" type="number" />
                    <FloatingInput label="Disc Number" field="discNumber" type="number" />
                  </div>
                </div>
              )}

              {/* Video-specific fields */}
              {(item.mediaType === 'movie' || item.mediaType === 'tv') && (
                <div className="tab-section">
                  <h3 className="section-title">Video Information</h3>
                  <div className="form-grid">
                    <FloatingInput label="Director" field="director" />
                    <FloatingInput label="Runtime (minutes)" field="runtime" type="number" />
                  </div>
                  {item.mediaType === 'tv' && (
                    <>
                      <FloatingInput label="Show Title" field="showTitle" />
                      <div className="form-grid">
                        <FloatingInput label="Season" field="season" type="number" />
                        <FloatingInput label="Episode" field="episode" type="number" />
                      </div>
                    </>
                  )}
                  <div className="form-group">
                    <label className="section-label">Cast</label>
                    <textarea
                      value={(formData.cast || []).join(', ')}
                      onChange={(e) => handleFieldChange('cast', e.target.value.split(',').map(c => c.trim()).filter(c => c))}
                      placeholder="Enter cast members, separated by commas..."
                      rows={3}
                      className="floating-input"
                    />
                  </div>
                </div>
              )}

              {/* Book-specific fields */}
              {(item.mediaType === 'book' || item.mediaType === 'comic') && (
                <div className="tab-section">
                  <h3 className="section-title">Publication Information</h3>
                  <div className="form-grid">
                    <FloatingInput label="Publisher" field="publisher" />
                    <FloatingInput label="ISBN" field="isbn" />
                    <FloatingInput label="Page Count" field="pageCount" type="number" />
                    <FloatingInput label="Series" field="series" />
                    <FloatingInput label="Series Index" field="seriesIndex" type="number" />
                  </div>
                  
                  <div className="form-group">
                    <label className="section-label">Authors</label>
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
                        className="floating-input"
                      />
                      <button type="button" onClick={addAuthor} className="add-btn">Add</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Organization Tab */}
          {activeTab === 'organization' && (
            <div className="tab-content">
              <div className="tab-section">
                <h3 className="section-title">Tags & Labels</h3>
                <div className="form-group">
                  <label className="section-label">Tags</label>
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
                      className="floating-input"
                    />
                    <button type="button" onClick={addTag} className="add-btn">Add</button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="section-label">Genres</label>
                  <div className="genres-list">
                    {(formData.genres || []).map((genre, index) => (
                      <div key={index} className="genre-chip">
                        {genre}
                        <button type="button" onClick={() => {
                          const newGenres = [...(formData.genres || [])];
                          newGenres.splice(index, 1);
                          handleFieldChange('genres', newGenres);
                        }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="tab-section">
                <h3 className="section-title">Collection Status</h3>
                <div className="form-group">
                  <label className="section-label">Watch/Read Status</label>
                  <div className="status-options">
                    {['unwatched', 'partial', 'watched'].map(status => (
                      <button
                        key={status}
                        type="button"
                        className={`status-btn ${formData.watchedStatus === status ? 'active' : ''}`}
                        onClick={() => handleFieldChange('watchedStatus', status)}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

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