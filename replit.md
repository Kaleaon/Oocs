# Universal Media Library

## Overview

Universal Media Library is a comprehensive React-based web application designed to organize, manage, and view various types of media files including ebooks, comics, PDFs, audio, video, and image files. Inspired by Calibre's functionality, the application provides advanced media organization features, metadata management, and built-in viewers for different file formats. The app uses browser localStorage for data persistence and offers a responsive, mobile-friendly interface perfect for Android and web usage.

## Recent Changes (September 2025)

### Complete Plex-Style Interface Redesign
- **Modern Media Hub Layout**: Complete transformation to Plex-inspired interface with sidebar navigation and dashboard view
- **Library Sections**: Organized library sections for Movies, TV Shows, Music, Books, Comics, Documents, and Photos
- **Dashboard Overview**: Home dashboard with library statistics, recently added items, and continue watching sections
- **Horizontal Media Rows**: Netflix/Plex-style horizontal scrolling rows for different media categories

### Enhanced Media Management
- **Smart Media Detection**: Automatic categorization of movies vs TV shows based on filename patterns (S01E01, etc.)
- **Music Library**: Enhanced music management with artist, album, and track metadata extraction
- **Video Library**: Separate movie and TV show sections with season/episode tracking
- **Enhanced Metadata**: Comprehensive metadata system for all media types with smart auto-detection

### Advanced Playback Features
- **Built-in Media Players**: Audio and video players with full playback controls
- **Continue Watching**: Track playback progress and resume functionality
- **Watch Status**: Unwatched, partial, and watched status tracking for all media

### Professional UI/UX
- **Modern Dark Theme**: Professional dark interface with gradient backgrounds and blur effects
- **Responsive Design**: Fully responsive layout optimized for desktop, tablet, and mobile devices
- **Smooth Animations**: Polished hover effects, transitions, and card interactions
- **Search Integration**: Global search across all media types with smart filtering

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application is built as a single-page React application using Create React App with TypeScript. The enhanced architecture includes:

- **Main App Component**: Centralized state management with React hooks for media items, filters, and UI state
- **State Management**: Local component state for managing enhanced media metadata, filtering, and viewer states
- **Data Persistence**: Browser localStorage for saving comprehensive media metadata across sessions
- **File Handling**: Enhanced HTML5 File API with drag-and-drop and multi-file selection
- **Media Viewers**: Integrated viewers for PDF, images, and extensible framework for other formats

### Component Structure
- **App.tsx**: Main application component with enhanced media management logic
- **MediaCard Component**: Individual media item display with metadata and actions
- **MediaViewer Component**: Modal-based viewer system for different file types  
- **MetadataEditor Component**: Full-featured metadata editing interface
- **Enhanced MediaItem Interface**: Comprehensive data structure supporting various media types

### Data Model
The enhanced MediaItem interface includes:
- **Basic Metadata**: id, name, type, size, dateAdded, lastModified
- **Media Classification**: mediaType (book, comic, pdf, audio, video, image, other)
- **Organizational Features**: tags, labels, genres arrays
- **Content Metadata**: title, sortTitle, summary, year, rating, coverImage
- **Book-Specific**: authors, publisher, isbn, pageCount, series, seriesIndex  
- **Media-Specific**: duration, artist, album, director
- **File References**: Optional file object for uploaded content

### UI/UX Design Decisions
- **Material Design Inspired**: Modern card-based interface with elevation and transitions
- **Media Type Visualization**: Color-coded borders and icons for different media types
- **Advanced Search**: Multi-criteria search including title, author, and content
- **Responsive Grid**: Adaptive layout that works on mobile and desktop
- **Modal System**: Overlay-based viewers and editors with backdrop blur effects

### Build and Development
- **TypeScript Configuration**: Enhanced with stricter type checking for media metadata
- **Enhanced Error Handling**: Better error states and user feedback
- **Performance Optimizations**: Efficient state updates and render optimizations

## External Dependencies

### Core Framework Dependencies
- **React 19.1.1**: Main UI framework with modern hooks and concurrent features
- **React DOM 19.1.1**: DOM rendering layer for React components
- **TypeScript 4.9.5**: Static type checking and enhanced developer experience

### Media Handling Libraries
- **react-pdf**: PDF viewing and rendering capabilities
- **pdfjs-dist**: PDF.js library for document processing
- **jszip**: ZIP file handling for comic book archives (CBZ support)
- **epub**: EPUB file parsing and reading (future implementation)
- **react-reader**: EPUB reader component (future implementation)
- **file-type**: File type detection and validation
- **react-dropzone**: Enhanced drag-and-drop file upload (available for future use)
- **react-icons**: Icon library (available for future enhancements)

### Development and Testing Tools
- **React Scripts 5.0.1**: Build tooling, development server, and configuration management
- **@testing-library/react 16.3.0**: Component testing utilities focused on user interactions
- **@testing-library/jest-dom 6.8.0**: Extended Jest matchers for DOM element assertions
- **@testing-library/user-event 13.5.0**: User interaction simulation for testing
- **Web Vitals 2.1.4**: Performance monitoring and Core Web Vitals measurement

### Browser APIs and Features
- **localStorage**: Enhanced media metadata persistence
- **File API**: Advanced file handling with type detection
- **URL API**: File object URL generation for media preview
- **PDF.js CDN**: Remote PDF processing worker

### Future Enhancement Capabilities
- **EPUB Reading**: Foundation laid for full ebook reading experience
- **Comic Book Reading**: ZIP archive support ready for CBZ/CBR implementation
- **External API Integration**: Structure ready for metadata enrichment from online sources
- **Advanced Search**: Framework for full-text search and metadata queries

### Build and Configuration
- **Create React App**: Zero-configuration build setup optimized for media handling
- **ESLint**: Enhanced code quality rules for TypeScript and React
- **Webpack**: Configured for media file handling and chunking
- **Development Server**: Configured to serve on all interfaces for mobile testing