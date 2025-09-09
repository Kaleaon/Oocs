# Media Organizer

## Overview

Media Organizer is a React-based web application designed to help users organize and manage their media files. The application provides functionality for uploading files via drag-and-drop or file selection, organizing content with tags and labels, searching through media collections, and sorting items by various criteria. The app uses browser localStorage for data persistence, making it a client-side solution for personal media organization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application is built as a single-page React application using Create React App with TypeScript. The architecture follows a component-based structure with:

- **Main App Component**: Centralized state management using React hooks (useState, useEffect)
- **State Management**: Local component state for managing media items, filters, search terms, and sorting preferences
- **Data Persistence**: Browser localStorage for saving and retrieving media items across sessions
- **File Handling**: Native HTML5 File API for drag-and-drop and file upload functionality

### Component Structure
- **App.tsx**: Main application component containing all business logic and state management
- **MediaItem Interface**: TypeScript interface defining the structure of media objects with properties like id, name, type, size, tags, labels, dateAdded, and optional file reference

### Data Model
The core data structure centers around the MediaItem interface which includes:
- Unique identifier and basic file metadata (name, type, size)
- Organizational features (tags, labels arrays)
- Timestamp tracking (dateAdded)
- Optional file reference for uploaded content

### UI/UX Design Decisions
- **Responsive Design**: CSS flexbox layout with mobile-friendly controls
- **Visual Hierarchy**: Gradient header design with clear section separation
- **Interactive Elements**: Focus states and hover effects for better user experience
- **Drag-and-Drop Interface**: Visual feedback during file drag operations

### Build and Development
- **TypeScript Configuration**: Strict mode enabled with modern ES features
- **Build System**: Create React App's webpack configuration for development and production builds
- **Testing Setup**: Jest and React Testing Library for unit and integration testing

## External Dependencies

### Core Framework Dependencies
- **React 19.1.1**: Main UI framework with modern hooks and concurrent features
- **React DOM 19.1.1**: DOM rendering layer for React components
- **TypeScript 4.9.5**: Static type checking and enhanced developer experience

### Development and Testing Tools
- **React Scripts 5.0.1**: Build tooling, development server, and configuration management
- **@testing-library/react 16.3.0**: Component testing utilities focused on user interactions
- **@testing-library/jest-dom 6.8.0**: Extended Jest matchers for DOM element assertions
- **@testing-library/user-event 13.5.0**: User interaction simulation for testing
- **Web Vitals 2.1.4**: Performance monitoring and Core Web Vitals measurement

### Browser APIs
- **localStorage**: Client-side data persistence for media item storage
- **File API**: Native browser file handling for upload and drag-and-drop functionality
- **URL API**: File object URL generation for media preview capabilities

### Build and Configuration
- **Create React App**: Zero-configuration build setup with webpack, Babel, and ESLint
- **ESLint**: Code quality and style enforcement with React-specific rules
- **Browserslist**: Target browser configuration for optimal compatibility and performance