# Prominent Bookmarks for Obsidian

> **Based on original code by [Javalent](https://github.com/javalent/prominent-files).**

Make your most important notes and folders stand out in the Obsidian File Explorer! Prominent Bookmarks enhances the visibility of your Bookmarked files and folders, giving you quick access and a visually distinct experience.

## Features

- **Highlight Bookmarked Files & Folders:** Adds prominent, customizable icons to your Bookmarked items in the File Explorer.
- **Custom Icon Support:** Choose different Lucide icons for files, folders, and folder notes.
- **Color Customization:** Set custom colors for each icon type, or use the default theme color.
- **Toggle Coloring:** Enable or disable icon coloring with a single switch.
- **Expanded Folder Icons:** Optionally show a different icon when a folder or folder note is expanded.
- **Folder Note Detection:** Automatically detects folder notes (files with the same name as their parent folder).

## Requirements

- The [Files](https://help.obsidian.md/Plugins/File+explorer) Core Plugin must be enabled.
- The Bookmarks Core Plugin must also be enabled.
- *Optionally* add a **Folder Notes** plugin to hide the base files of Folder Notes

## Installation

1. Go to the [Releases](https://github.com/Jack-Chronicle/prominent-bookmarks/releases) page of this plugin's GitHub repository.
2. Download the following files from the latest release:
   - `main.js`
   - `manifest.json`
   - `package.json`
   - `styles.css`
3. Place all three files into a new folder named `prominent-bookmarks` inside your Obsidian vault's `.obsidian/plugins/` directory.
   - Example path: `YourVault/.obsidian/plugins/prominent-bookmarks/`
4. Restart Obsidian or reload plugins.
5. Enable "Prominent Bookmarks" in the Community Plugins settings.

## Usage

1. Open the plugin settings to customize icons and colors for your Bookmarked files and folders.
2. Toggle coloring on or off as desired.
3. Your Bookmarked items will now appear more prominent in the File Explorer!

## Customizing Appearance

You can further style the appearance of Bookmarked items by targeting the `.prominent-decorated-file` CSS class in your custom CSS snippets. This class controls the layout and style of the prominent icons.

---

### Credits

This plugin is inspired by and based on the work of [Javalent](https://github.com/javalent/prominent-files). Many thanks for the original idea and code foundation.

