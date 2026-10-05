import React, { useState, useEffect } from 'react';
import './App.css';
import { Document, Page, pdfjs } from 'react-pdf';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/**
 * @interface MediaItem
 * @description Represents a single media item in the library. This comprehensive interface
 * holds all data related to a file, including its basic properties, metadata for various
 * media types, playback status, and file system information.
 */
interface MediaItem {
  /** @property {string} id - A unique identifier for the media item. */
  id: string;
  /** @property {string} name - The current filename of the media item. */
  name: string;
  /** @property {string} originalName - The original filename at the time of import. */
  originalName: string;
  /** @property {string} type - The MIME type of the file. */
  type: string;
  /** @property {'book' | 'comic' | 'pdf' | 'music' | 'movie' | 'tv' | 'image' | 'other'} mediaType - The detected category of the media. */
  mediaType: 'book' | 'comic' | 'pdf' | 'music' | 'movie' | 'tv' | 'image' | 'other';
  /** @property {number} size - The size of the file in bytes. */
  size: number;
  /** @property {string[]} tags - User-defined tags for organization. */
  tags: string[];
  /** @property {string[]} labels - User-defined labels for categorization. */
  labels: string[];
  /** @property {string[]} genres - The genres associated with the media item. */
  genres: string[];
  /** @property {Date} dateAdded - The timestamp when the item was added to the library. */
  dateAdded: Date;
  /** @property {File} [file] - The actual File object, used for viewing content. Stored in memory. */
  file?: File;
  
  // --- Common Metadata ---
  /** @property {string} [title] - The main title of the media item. */
  title?: string;
  /** @property {string} [sortTitle] - A version of the title used for sorting (e.g., "Avengers, The"). */
  sortTitle?: string;
  /** @property {string} [summary] - A plot summary or description. */
  summary?: string;
  /** @property {number} [year] - The primary release year. */
  year?: number;
  /** @property {number} [rating] - A user-defined rating, typically from 1 to 5. */
  rating?: number;
  /** @property {string} [coverImage] - A URL or base64 string for the cover image. */
  coverImage?: string;
  
  // --- Book-specific metadata ---
  /** @property {string[]} [authors] - A list of authors for the book. */
  authors?: string[];
  /** @property {string} [publisher] - The publisher's name. */
  publisher?: string;
  /** @property {string} [isbn] - The ISBN of the book. */
  isbn?: string;
  /** @property {number} [pageCount] - The number of pages in the book. */
  pageCount?: number;
  /** @property {string} [series] - The name of the series the book belongs to. */
  series?: string;
  /** @property {number} [seriesIndex] - The book's index within a series. */
  seriesIndex?: number;
  
  // --- Music-specific metadata ---
  /** @property {number} [duration] - The duration of the track in seconds. */
  duration?: number;
  /** @property {string} [artist] - The primary artist of the track. */
  artist?: string;
  /** @property {string} [albumArtist] - The artist for the entire album. */
  albumArtist?: string;
  /** @property {string} [album] - The album the track belongs to. */
  album?: string;
  /** @property {number} [trackNumber] - The track number on the album. */
  trackNumber?: number;
  /** @property {number} [discNumber] - The disc number for multi-disc albums. */
  discNumber?: number;
  
  // --- Video-specific metadata ---
  /** @property {string} [director] - The director of the movie or TV episode. */
  director?: string;
  /** @property {string[]} [cast] - A list of main cast members. */
  cast?: string[];
  /** @property {number} [runtime] - The runtime in minutes. */
  runtime?: number;
  /** @property {number} [season] - The season number for a TV show episode. */
  season?: number;
  /** @property {number} [episode] - The episode number for a TV show season. */
  episode?: number;
  /** @property {string} [showTitle] - The title of the TV show. */
  showTitle?: string;
  
  // --- Playback metadata ---
  /** @property {number} [currentPosition] - The last playback position in seconds. */
  currentPosition?: number;
  /** @property {'unwatched' | 'partial' | 'watched'} [watchedStatus] - The watch/read status of the item. */
  watchedStatus?: 'unwatched' | 'partial' | 'watched';
  
  // --- File metadata ---
  /** @property {Date} [lastModified] - The last modified date of the file. */
  lastModified?: Date;
  /** @property {string} [fileHash] - A hash of the file content to detect duplicates. */
  fileHash?: string;
  
  // --- External ratings and IDs ---
  /** @property {string} [imdbRating] - Rating from IMDb (e.g., "8.8/10"). */
  imdbRating?: string;
  /** @property {string} [rottenTomatoesRating] - Rating from Rotten Tomatoes (e.g., "94%"). */
  rottenTomatoesRating?: string;
  /** @property {string} [metacriticRating] - Rating from Metacritic (e.g., "82/100"). */
  metacriticRating?: string;
  /** @property {string} [imdbId] - The unique ID for the item on IMDb. */
  imdbId?: string;
}

/**
 * @interface APIResult
 * @description Represents the standardized result from a metadata API call.
 */
interface APIResult {
  /** @property {boolean} success - Indicates if the API call was successful. */
  success: boolean;
  /** @property {Partial<MediaItem>} [data] - The fetched metadata, if successful. */
  data?: Partial<MediaItem>;
  /** @property {string} [error] - An error message, if the call failed. */
  error?: string;
}

/**
 * @class MetadataAPIService
 * @description A static class that provides methods for fetching metadata from various external APIs.
 * It acts as a service layer to abstract away the complexities of different API endpoints and data formats.
 */
class MetadataAPIService {
  /**
   * Fetches movie metadata from the OMDb (Open Movie Database) API.
   * @param {string} title - The title of the movie to search for.
   * @param {number} [year] - The release year of the movie to narrow down the search.
   * @param {string} [imdbId] - The IMDb ID of the movie for a direct lookup.
   * @returns {Promise<APIResult>} A promise that resolves with the fetched metadata or an error.
   */
  static async fetchOMDbMetadata(title: string, year?: number, imdbId?: string): Promise<APIResult> {
    try {
      const apiKey = 'a207177'; // OMDb API key
      let searchUrl = `http://www.omdbapi.com/?apikey=${apiKey}`;
      
      if (imdbId) {
        searchUrl += `&i=${imdbId}`;
      } else {
        searchUrl += `&t=${encodeURIComponent(title)}`;
        if (year) searchUrl += `&y=${year}`;
      }

      const response = await fetch(searchUrl);
      const data = await response.json();

      if (data.Response === 'True') {
        // Parse ratings from OMDb
        const ratings: { [key: string]: string } = {};
        if (data.Ratings) {
          data.Ratings.forEach((rating: any) => {
            ratings[rating.Source] = rating.Value;
          });
        }

        return {
          success: true,
          data: {
            title: data.Title,
            summary: data.Plot !== 'N/A' ? data.Plot : undefined,
            year: data.Year && data.Year !== 'N/A' ? parseInt(data.Year) : undefined,
            director: data.Director !== 'N/A' ? data.Director : undefined,
            cast: data.Actors !== 'N/A' ? data.Actors.split(', ') : undefined,
            runtime: data.Runtime !== 'N/A' ? parseInt(data.Runtime) : undefined,
            genres: data.Genre !== 'N/A' ? data.Genre.split(', ') : undefined,
            coverImage: data.Poster !== 'N/A' ? data.Poster : undefined,
            // Additional OMDb-specific data
            imdbRating: ratings['Internet Movie Database'],
            rottenTomatoesRating: ratings['Rotten Tomatoes'],
            metacriticRating: ratings['Metacritic'],
            imdbId: data.imdbID
          }
        };
      }

      return { success: false, error: data.Error || 'No movie found' };
    } catch (error) {
      return { success: false, error: 'Failed to fetch OMDb data' };
    }
  }

  /**
   * Fetches movie metadata from The Movie Database (TMDB) API.
   * @param {string} title - The title of the movie to search for.
   * @param {number} [year] - The release year of the movie to narrow down the search.
   * @returns {Promise<APIResult>} A promise that resolves with the fetched metadata or an error.
   */
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
            genres: movie.genre_ids ? [] : undefined // Genre IDs would need a separate mapping call
          }
        };
      }

      return { success: false, error: 'No movie found with that title' };
    } catch (error) {
      return { success: false, error: 'Failed to fetch movie data' };
    }
  }

  /**
   * Fetches TV show metadata from The Movie Database (TMDB) API.
   * @param {string} title - The title of the TV show to search for.
   * @param {number} [year] - The first air date year of the show to narrow down the search.
   * @returns {Promise<APIResult>} A promise that resolves with the fetched metadata or an error.
   */
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

  /**
   * Fetches book metadata from the Open Library API.
   * @param {string} title - The title of the book to search for.
   * @param {string} [author] - The author of the book to narrow down the search.
   * @returns {Promise<APIResult>} A promise that resolves with the fetched metadata or an error.
   */
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

  /**
   * Fetches music metadata from the MusicBrainz API.
   * @param {string} artist - The artist of the music release.
   * @param {string} [album] - The album title to search for.
   * @returns {Promise<APIResult>} A promise that resolves with the fetched metadata or an error.
   */
  static async fetchMusicMetadata(artist: string, album?: string): Promise<APIResult> {
    try {
      let searchQuery = `artist:${encodeURIComponent(artist)}`;
      if (album) {
        searchQuery += `+release:${encodeURIComponent(album)}`;
      }

      const searchUrl = `https://musicbrainz.org/ws/2/release?query=${searchQuery}&fmt=json&limit=5`;
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'UniversalMediaLibrary/1.0 (contact@example.com)' // MusicBrainz API requires a User-Agent
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

  /**
   * Merges metadata from two different sources (TMDB and OMDb).
   * It prioritizes data from TMDB for quality but fills in gaps with OMDb data.
   * @param {Partial<MediaItem>} [tmdbData] - Metadata from TMDB.
   * @param {Partial<MediaItem>} [omdbData] - Metadata from OMDb.
   * @returns {Partial<MediaItem>} The merged metadata object.
   */
  static mergeMetadata(tmdbData?: Partial<MediaItem>, omdbData?: Partial<MediaItem>): Partial<MediaItem> {
    const merged: Partial<MediaItem> = {};
    
    if (tmdbData?.title || omdbData?.title) {
      merged.title = tmdbData?.title || omdbData?.title;
    }
    
    // Prefer longer, more detailed summaries
    if (tmdbData?.summary && omdbData?.summary) {
      merged.summary = tmdbData.summary.length > omdbData.summary.length ? tmdbData.summary : omdbData.summary;
    } else {
      merged.summary = tmdbData?.summary || omdbData?.summary;
    }
    
    merged.year = tmdbData?.year || omdbData?.year;
    merged.coverImage = tmdbData?.coverImage || omdbData?.coverImage; // Prefer TMDB images
    merged.director = tmdbData?.director || omdbData?.director;
    merged.cast = tmdbData?.cast || omdbData?.cast;
    merged.runtime = tmdbData?.runtime || omdbData?.runtime;
    
    // Combine and deduplicate genres
    if (tmdbData?.genres || omdbData?.genres) {
      const allGenres = [...(tmdbData?.genres || []), ...(omdbData?.genres || [])];
      merged.genres = Array.from(new Set(allGenres));
    }
    
    merged.rating = tmdbData?.rating; // Prefer TMDB's 5-star system
    
    // Add OMDb-specific rating data
    if (omdbData?.imdbRating) merged.imdbRating = omdbData.imdbRating;
    if (omdbData?.rottenTomatoesRating) merged.rottenTomatoesRating = omdbData.rottenTomatoesRating;
    if (omdbData?.metacriticRating) merged.metacriticRating = omdbData.metacriticRating;
    if (omdbData?.imdbId) merged.imdbId = omdbData.imdbId;
    
    return merged;
  }

  /**
   * Fetches and merges movie metadata from both TMDB and OMDb for the most complete result.
   * @param {string} title - The title of the movie.
   * @param {number} [year] - The release year of the movie.
   * @returns {Promise<APIResult>} A promise that resolves with the merged metadata.
   */
  static async fetchEnhancedMovieMetadata(title: string, year?: number): Promise<APIResult> {
    try {
      const [tmdbResult, omdbResult] = await Promise.allSettled([
        this.fetchMovieMetadata(title, year),
        this.fetchOMDbMetadata(title, year)
      ]);
      
      let tmdbData: Partial<MediaItem> | undefined;
      let omdbData: Partial<MediaItem> | undefined;
      const errors: string[] = [];
      
      if (tmdbResult.status === 'fulfilled' && tmdbResult.value.success) {
        tmdbData = tmdbResult.value.data;
      } else if (tmdbResult.status === 'fulfilled') {
        errors.push(`TMDB: ${tmdbResult.value.error}`);
      }
      
      if (omdbResult.status === 'fulfilled' && omdbResult.value.success) {
        omdbData = omdbResult.value.data;
      } else if (omdbResult.status === 'fulfilled') {
        errors.push(`OMDb: ${omdbResult.value.error}`);
      }
      
      if (tmdbData || omdbData) {
        const mergedData = this.mergeMetadata(tmdbData, omdbData);
        return {
          success: true,
          data: mergedData
        };
      }
      
      return {
        success: false,
        error: errors.length > 0 ? errors.join('; ') : 'Failed to fetch movie data from all sources'
      };
    } catch (error) {
      return { success: false, error: 'Failed to fetch enhanced movie data' };
    }
  }

  /**
   * A generic metadata fetcher that routes to the appropriate specific fetcher based on media type.
   * @param {string} mediaType - The type of media to fetch metadata for.
   * @param {string} title - The title of the media.
   * @param {object} [additionalInfo] - Extra information to refine the search.
   * @param {number} [additionalInfo.year] - The release year.
   * @param {string} [additionalInfo.artist] - The artist's name.
   * @param {string} [additionalInfo.author] - The author's name.
   * @returns {Promise<APIResult>} A promise that resolves with the fetched metadata.
   */
  static async fetchMetadata(mediaType: string, title: string, additionalInfo?: { year?: number; artist?: string; author?: string }): Promise<APIResult> {
    switch (mediaType) {
      case 'movie':
        return this.fetchEnhancedMovieMetadata(title, additionalInfo?.year);
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

/**
 * Detects the type of media based on the file's extension and MIME type.
 * @param {string} filename - The name of the file.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {MediaItem['mediaType']} The detected media type category.
 */
const detectMediaType = (filename: string, mimeType: string): 'book' | 'comic' | 'pdf' | 'music' | 'movie' | 'tv' | 'image' | 'other' => {
  const ext = filename.toLowerCase().split('.').pop() || '';
  const lowerFilename = filename.toLowerCase();
  
  if (['epub', 'mobi', 'azw', 'azw3', 'fb2', 'lit', 'pdb', 'txt'].includes(ext)) return 'book';
  if (['cbz', 'cbr', 'cbt', 'cb7'].includes(ext)) return 'comic';
  if (ext === 'pdf') return 'pdf';
  if (['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'wma'].includes(ext) || mimeType.startsWith('audio/')) return 'music';
  
  if (['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext) || mimeType.startsWith('video/')) {
    // Check for TV show patterns like S01E01, 1x01, etc.
    const tvPatterns = [/s\d+e\d+/i, /season\s*\d+.*episode\s*\d+/i, /\d+x\d+/i];
    if (tvPatterns.some(pattern => pattern.test(lowerFilename))) {
      return 'tv';
    }
    return 'movie';
  }
  
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext) || mimeType.startsWith('image/')) return 'image';
  
  return 'other';
};

/**
 * Returns an emoji icon representing the media type.
 * @param {string} mediaType - The media type category.
 * @returns {string} An emoji character.
 */
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

/**
 * Returns a user-friendly display name for a media type.
 * @param {string} mediaType - The media type category.
 * @returns {string} The display name (e.g., "TV Shows").
 */
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

/**
 * The main application component. It orchestrates the entire UI, manages state,
 * and handles all user interactions.
 * @returns {JSX.Element} The rendered App component.
 */
function App() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'music' | 'movies' | 'tv' | 'books' | 'comics' | 'documents' | 'photos'>('home');

  // Load media items from localStorage on initial component mount.
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

  // Save media items to localStorage whenever the `mediaItems` state changes.
  useEffect(() => {
    localStorage.setItem('mediaItems', JSON.stringify(mediaItems));
  }, [mediaItems]);

  /**
   * Extracts basic metadata from a file based on its name and type.
   * @param {File} file - The file to process.
   * @param {MediaItem['mediaType']} mediaType - The determined media type of the file.
   * @returns {Promise<Partial<MediaItem>>} A promise that resolves with the extracted metadata.
   */
  const extractMetadata = async (file: File, mediaType: MediaItem['mediaType']): Promise<Partial<MediaItem>> => {
    const metadata: Partial<MediaItem> = {
      title: file.name.replace(/\.[^/.]+$/, ''), // Basic title from filename
      lastModified: new Date(file.lastModified),
      watchedStatus: 'unwatched'
    };

    const filename = file.name.toLowerCase();
    const autoTags: string[] = [];

    if (mediaType === 'music') {
      const artistMatch = filename.match(/^(.+?) - .+/)
      if (artistMatch) metadata.artist = artistMatch[1];
      const albumMatch = filename.match(/\[(.+?)\]/);
      if (albumMatch) metadata.album = albumMatch[1];
    } else if (mediaType === 'movie' || mediaType === 'tv') {
      const yearMatch = filename.match(/\((\d{4})\)/);
      if (yearMatch) metadata.year = parseInt(yearMatch[1]);
      if (mediaType === 'tv') {
        const seasonMatch = filename.match(/s(\d+)e(\d+)/i);
        if (seasonMatch) {
          metadata.season = parseInt(seasonMatch[1]);
          metadata.episode = parseInt(seasonMatch[2]);
        }
        const showMatch = filename.match(/^(.+?)(?:\s*s\d+e\d+)/i);
        if (showMatch) metadata.showTitle = showMatch[1].replace(/\./g, ' ').trim();
      }
    }

    if (autoTags.length > 0) metadata.genres = autoTags;

    return metadata;
  };

  /**
   * Handles the processing of files uploaded by the user.
   * @param {FileList | null} files - The list of files from a file input or drop event.
   */
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

  /**
   * Handles the drop event for drag-and-drop file uploads.
   * @param {React.DragEvent} e - The drag event.
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  /**
   * Updates a specific media item in the state.
   * @param {string} itemId - The ID of the item to update.
   * @param {Partial<MediaItem>} updates - An object containing the fields to update.
   */
  const updateItem = (itemId: string, updates: Partial<MediaItem>) => {
    setMediaItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  /**
   * Removes a media item from the state.
   * @param {string} itemId - The ID of the item to remove.
   */
  const removeItem = (itemId: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== itemId));
  };

  /**
   * Filters the list of media items based on the current search term and selected media types.
   * @param {MediaItem['mediaType'][]} mediaTypes - An array of media types to include.
   * @param {number} [limit] - An optional limit on the number of items to return.
   * @returns {MediaItem[]} The filtered and sorted list of media items.
   */
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

  const recentItems = mediaItems
    .sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime())
    .slice(0, 10);

  const continueItems = mediaItems
    .filter(item => item.watchedStatus === 'partial')
    .sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime())
    .slice(0, 6);

  const libraryStats = mediaItems.reduce((acc, item) => {
    acc[item.mediaType] = (acc[item.mediaType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  /**
   * Renders a horizontal section of media cards for the dashboard.
   * @param {string} title - The title of the section (e.g., "Recently Added").
   * @param {MediaItem[]} items - The items to display in the section.
   * @param {() => void} [viewAllAction] - An optional function for a "View All" button.
   * @returns {JSX.Element | null} The rendered section or null if there are no items.
   */
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

  /**
   * Renders the main home dashboard view.
   * @returns {JSX.Element} The home dashboard component.
   */
  const renderHomeDashboard = () => (
    <div className="dashboard">
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

      {renderLibrarySection('Recently Added', recentItems)}
      {renderLibrarySection('Continue Watching', continueItems)}
      {renderLibrarySection('Movies', getFilteredItems(['movie'], 6), () => setCurrentView('movies'))}
      {renderLibrarySection('TV Shows', getFilteredItems(['tv'], 6), () => setCurrentView('tv'))}
      {renderLibrarySection('Music', getFilteredItems(['music'], 6), () => setCurrentView('music'))}
      {renderLibrarySection('Books', getFilteredItems(['book'], 6), () => setCurrentView('books'))}
    </div>
  );

  /**
   * Renders a grid view for a specific set of media types.
   * @param {MediaItem['mediaType'][]} mediaTypes - The media types to display.
   * @returns {JSX.Element} The media type grid view component.
   */
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

/**
 * @interface MediaCardProps
 * @description Props for the MediaCard component.
 */
interface MediaCardProps {
  /** @property {MediaItem} item - The media item to display. */
  item: MediaItem;
  /** @property {() => void} onEdit - Callback function to trigger the editor modal. */
  onEdit: () => void;
  /** @property {() => void} onView - Callback function to trigger the viewer modal. */
  onView: () => void;
  /** @property {(id: string) => void} onRemove - Callback function to remove the item. */
  onRemove: (id: string) => void;
}

/**
 * A detailed card component for displaying a single media item in a grid view.
 * @param {MediaCardProps} props - The component props.
 * @returns {JSX.Element} The rendered MediaCard component.
 */
function MediaCard({ item, onEdit, onView, onRemove }: MediaCardProps) {
  /**
   * Formats file size in bytes to a readable string (KB, MB, GB).
   * @param {number} bytes - The file size in bytes.
   * @returns {string} The formatted file size.
   */
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Gets the primary and secondary display info based on media type.
   * @returns {{primary: string, secondary: string, tertiary: string}} An object with display strings.
   */
  const getDisplayInfo = () => {
    switch (item.mediaType) {
      case 'music': return { primary: item.title || item.name, secondary: item.artist || 'Unknown Artist', tertiary: item.album || '' };
      case 'movie': return { primary: item.title || item.name, secondary: item.year ? `(${item.year})` : '', tertiary: item.director || '' };
      case 'tv': return { primary: item.showTitle || item.title || item.name, secondary: item.season && item.episode ? `S${item.season}E${item.episode}` : '', tertiary: item.director || '' };
      case 'book': return { primary: item.title || item.name, secondary: item.authors ? item.authors.join(', ') : '', tertiary: item.series || '' };
      default: return { primary: item.title || item.name, secondary: '', tertiary: '' };
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

/**
 * @interface MediaViewerProps
 * @description Props for the MediaViewer component.
 */
interface MediaViewerProps {
  /** @property {MediaItem} item - The media item to be viewed. */
  item: MediaItem;
  /** @property {() => void} onClose - Callback function to close the viewer modal. */
  onClose: () => void;
}

/**
 * A modal component for viewing different types of media content.
 * @param {MediaViewerProps} props - The component props.
 * @returns {JSX.Element} The rendered MediaViewer modal.
 */
function MediaViewer({ item, onClose }: MediaViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);

  /**
   * Renders the appropriate viewer based on the item's media type.
   * @returns {JSX.Element} The viewer element for the specific media type.
   */
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

/**
 * @interface MetadataEditorProps
 * @description Props for the MetadataEditor component.
 */
interface MetadataEditorProps {
  /** @property {MediaItem} item - The media item to be edited. */
  item: MediaItem;
  /** @property {(updates: Partial<MediaItem>) => void} onSave - Callback to save the updated metadata. */
  onSave: (updates: Partial<MediaItem>) => void;
  /** @property {() => void} onClose - Callback to close the editor modal. */
  onClose: () => void;
}

/**
 * A sophisticated modal component for editing all metadata fields of a media item.
 * Includes features like tabbed layout, validation, and fetching data from online APIs.
 * @param {MetadataEditorProps} props - The component props.
 * @returns {JSX.Element} The rendered MetadataEditor modal.
 */
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
  const [activeTab, setActiveTab] = useState<'basic' | 'media' | 'organization'>('basic');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isLoadingAPI, setIsLoadingAPI] = useState(false);
  const [apiMessage, setApiMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  /**
   * Handles form submission, including validation.
   * @param {React.FormEvent} e - The form event.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(formData, item.mediaType);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      if (errors.title || errors.year || errors.summary) setActiveTab('basic');
      else if (errors.artist || errors.director || errors.season) setActiveTab('media');
      else setActiveTab('organization');
      return;
    }
    onSave({...formData, coverImage: coverPreview});
  };

  /**
   * Handles changes to the cover image file input.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event.
   */
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

  /**
   * Validates the form data before submission.
   * @param {Partial<MediaItem>} data - The form data to validate.
   * @param {string} mediaType - The media type of the item being edited.
   * @returns {Record<string, string>} An object of validation errors.
   */
  const validateForm = (data: Partial<MediaItem>, mediaType: string): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!data.title?.trim()) errors.title = 'Title is required';
    if (data.year && (data.year < 1000 || data.year > new Date().getFullYear() + 10)) errors.year = 'Please enter a valid year';
    if (mediaType === 'book' && data.authors && data.authors.length === 0) errors.authors = 'At least one author is recommended for books';
    if (mediaType === 'music' && !data.artist?.trim()) errors.artist = 'Artist is recommended for music';
    if ((mediaType === 'movie' || mediaType === 'tv') && !data.director?.trim()) errors.director = 'Director is recommended for videos';
    return errors;
  };

  /**
   * Handles changes to any form field and clears validation errors for that field.
   * @param {string} field - The name of the field being changed.
   * @param {any} value - The new value of the field.
   */
  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (validationErrors[field]) {
      const newErrors = { ...validationErrors };
      delete newErrors[field];
      setValidationErrors(newErrors);
    }
  };

  /**
   * Calculates the completion percentage of the metadata form.
   * @returns {number} The completion percentage.
   */
  const calculateCompletion = (): number => {
    const requiredFields = ['title', 'summary'];
    const mediaSpecificFields = {
      book: ['authors', 'publisher'], music: ['artist', 'album'],
      movie: ['director', 'year'], tv: ['director', 'season', 'episode'],
      comic: ['authors', 'series'], pdf: ['title', 'summary']
    };
    const allFields = [...requiredFields, ...(mediaSpecificFields[item.mediaType as keyof typeof mediaSpecificFields] || [])];
    const completed = allFields.filter(field => {
      const value = formData[field as keyof MediaItem];
      return value && (Array.isArray(value) ? value.length > 0 : String(value).trim() !== '');
    }).length;
    return Math.round((completed / allFields.length) * 100);
  };

  /** Fetches metadata from external APIs and merges it into the form. */
  const handleAutoFill = async () => {
    if (!formData.title) {
      setApiMessage({ type: 'error', text: 'Please enter a title first to search for metadata.' });
      setTimeout(() => setApiMessage(null), 5000);
      return;
    }
    setIsLoadingAPI(true);
    setApiMessage(null);
    try {
      const additionalInfo = { year: formData.year, artist: formData.artist, author: formData.authors?.[0] };
      const result = await MetadataAPIService.fetchMetadata(item.mediaType, formData.title, additionalInfo);
      if (result.success && result.data) {
        const mergedData = { ...formData };
        Object.keys(result.data).forEach(key => {
          const typedKey = key as keyof MediaItem;
          if (result.data![typedKey] !== undefined && result.data![typedKey] !== null) {
            if (!mergedData[typedKey] || (Array.isArray(mergedData[typedKey]) && (mergedData[typedKey] as any[]).length === 0) || String(mergedData[typedKey]).trim() === '') {
              (mergedData as any)[typedKey] = result.data![typedKey];
            }
          }
        });
        setFormData(mergedData);
        if (result.data.coverImage) setCoverPreview(result.data.coverImage);
        let sources = [];
        if (result.data.imdbRating || result.data.rottenTomatoesRating) sources.push('OMDb');
        if (result.data.coverImage?.includes('tmdb')) sources.push('TMDB');
        if (sources.length === 0) sources.push('External APIs');
        setApiMessage({ type: 'success', text: `Metadata successfully fetched from ${sources.join(' + ')}!` });
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

  /** Adds a new author to the form data. */
  const addAuthor = () => {
    if (newAuthor.trim()) {
      setFormData(prev => ({ ...prev, authors: [...(prev.authors || []), newAuthor.trim()] }));
      setNewAuthor('');
    }
  };

  /**
   * Removes an author from the form data by index.
   * @param {number} index - The index of the author to remove.
   */
  const removeAuthor = (index: number) => {
    setFormData(prev => ({ ...prev, authors: (prev.authors || []).filter((_, i) => i !== index) }));
  };

  /** Adds a new tag to the form data. */
  const addTag = () => {
    if (newTag.trim()) {
      setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), newTag.trim()] }));
      setNewTag('');
    }
  };

  /**
   * Removes a tag from the form data by index.
   * @param {number} index - The index of the tag to remove.
   */
  const removeTag = (index: number) => {
    setFormData(prev => ({ ...prev, tags: (prev.tags || []).filter((_, i) => i !== index) }));
  };

  /**
   * A reusable input component with a floating label.
   * @param {{label: string, field: string, type?: string, required?: boolean, multiline?: boolean}} props - The component props.
   * @returns {JSX.Element} The rendered input component.
   */
  const FloatingInput = ({ label, field, type = "text", required = false, multiline = false }: {
    label: string; field: string; type?: string; required?: boolean; multiline?: boolean;
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

                {/* External Ratings Display */}
                {(formData.imdbRating || formData.rottenTomatoesRating || formData.metacriticRating) && (
                  <div className="form-group">
                    <label className="section-label">External Ratings</label>
                    <div className="external-ratings">
                      {formData.imdbRating && (
                        <div className="rating-item">
                          <span className="rating-source">IMDb:</span>
                          <span className="rating-value">{formData.imdbRating}</span>
                        </div>
                      )}
                      {formData.rottenTomatoesRating && (
                        <div className="rating-item">
                          <span className="rating-source">Rotten Tomatoes:</span>
                          <span className="rating-value">{formData.rottenTomatoesRating}</span>
                        </div>
                      )}
                      {formData.metacriticRating && (
                        <div className="rating-item">
                          <span className="rating-source">Metacritic:</span>
                          <span className="rating-value">{formData.metacriticRating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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