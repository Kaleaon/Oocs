# Media Hub - A Universal Media Organizer

Media Hub is a web-based application designed to help you organize your personal collection of movies, TV shows, music, books, comics, and documents. It provides a clean, modern interface to manage and view your media, and it leverages online databases to automatically fetch rich metadata and cover art.

This project is a React-based frontend that runs entirely in your browser, using `localStorage` to persist your library data.

## Key Features

*   **Unified Library**: View all your different media types in one cohesive application.
*   **Drag & Drop Upload**: Easily add files to your library by simply dragging them into the app.
*   **Automatic Metadata Fetching**: The app automatically fetches metadata from online sources like:
    *   The Movie Database (TMDB) for movies and TV shows.
    *   The Open Movie Database (OMDb) for additional movie ratings.
    *   Open Library for book information.
    *   MusicBrainz for music album and artist details.
*   **Rich Metadata Editor**: A powerful, tabbed editor allows you to manually tweak any metadata field, change cover art, and add tags.
*   **In-Browser Viewers**:
    *   Read PDFs and comics directly in the app.
    *   Play audio and video files.
    *   View images.
*   **Dashboard View**: Get an at-a-glance overview of your library statistics and recently added items.
*   **Search & Filter**: Quickly find items in your library with a powerful search bar.
*   **Client-Side Storage**: Your entire library and all metadata are stored locally in your browser's `localStorage`. No server or account is required.

## Setup and Running the Application

Follow these steps to get Media Hub running on your local machine.

### Prerequisites

*   [Node.js](https://nodejs.org/) (which includes `npm`) installed on your system.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd media-organizer
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up API Keys (Optional but Recommended):**
    This application uses the TMDB API to fetch metadata for movies and TV shows. While it can function without it, the experience is significantly better with it enabled.

    *   Get a free API key from [The Movie Database (TMDB)](https://www.themoviedb.org/signup).
    *   Create a file named `.env` in the `media-organizer` root directory.
    *   Add your API key to the `.env` file like this:
        ```
        REACT_APP_TMDB_API_KEY=your_tmdb_api_key_here
        ```

### Running the App

Once the installation is complete, you can start the development server:

```bash
npm start
```

This will open the application in your default web browser, usually at [http://localhost:3000](http://localhost:3000).

## How to Use

1.  **Add Media**: Drag and drop media files from your computer onto the upload area at the top of the main view.
2.  **Browse**: Use the sidebar to navigate between the main dashboard and your different media libraries (Movies, Books, etc.).
3.  **View & Edit**:
    *   Click on a media card's poster to open the viewer.
    *   Click the pencil icon (✏️) on a card or in the editor to open the metadata editor.
4.  **Auto-Fill Metadata**: In the metadata editor, you can use the "Auto-Fill" button to fetch information from online databases automatically.

## Future Vision

This React application serves as the foundation and prototype for a more ambitious, cross-platform Universal Media Library. The broader vision for this project includes:
*   A native mobile (Android) application.
*   A centralized database backend instead of browser storage.
*   Advanced library scanning and synchronization with local file systems.
*   Support for importing from other media management tools like Calibre.

The components and logic built here are designed to be reusable and are a major step towards achieving that goal.
