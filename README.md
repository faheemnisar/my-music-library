# My Music Library

A responsive personal music library for saving YouTube links, organizing liked songs, creating playlists, and playing supported videos inside an embedded YouTube player.

## Features
- Add YouTube video links and supported YouTube Music links
- Embedded YouTube player opens inside the site
- Liked songs, search, custom playlists, and track details
- Responsive dark interface for desktop and mobile
- Browser-local storage; no backend required

## Publish with GitHub Pages
1. Open **Settings → Pages** in the repository.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select **main** and **/(root)**, then click **Save**.
4. Open the published URL displayed by GitHub Pages.

## Important notes
- Songs and playlists are stored in the current browser's local storage. They do not automatically sync across devices or browsers.
- This does not automatically import YouTube Music's existing liked songs. Add tracks by pasting their links.
- Playback uses YouTube's embedded player. Some videos block embedding, require account sign-in, or are restricted by region or rights holders. YouTube Music does not provide an official public API for unrestricted streaming of all personal liked songs.
- Do not put API keys, passwords, or other secrets in frontend files.
