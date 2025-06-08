import { Plugin } from "obsidian";
import { ProminentBookmarksSettings, DEFAULT_SETTINGS } from "./settingsData";
import { ProminentBookmarksSettingTab } from "./settingsTab";
import * as lucide from "lucide-static";

function toPascalCase(str: string): string {
  return str.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join("");
}
function getLucideIcon(name: string): string {
  const pascalName = toPascalCase(name);
  return (lucide as any)[pascalName] || (lucide as any)["Bookmark"] || "";
}

function isFolderNote(folderPath: string, plugin: Plugin): boolean {
  // Vault-structure-based: Check if the folder contains a file with the same name as the folder (any extension)
  const { vault } = plugin.app;
  const folderName = folderPath.split("/").pop();
  if (!folderName) return false;
  const folder = vault.getAbstractFileByPath(folderPath);
  if (!folder || folder.constructor.name !== "TFolder") return false;
  // Check for file with same name as folder (any extension)
  for (const child of (folder as any).children) {
    if (child.constructor.name === "TFile") {
      const fileName = child.name.split(".")[0];
      if (fileName === folderName) return true;
    }
  }
  return false;
}

function isFileFolderNote(filePath: string, plugin: Plugin): boolean {
  // Vault-structure-based: Check if the file is inside a folder with the same name as the file (without extension)
  const { vault } = plugin.app;
  const parts = filePath.split("/");
  if (parts.length < 2) return false;
  const fileNameNoExt = parts[parts.length - 1].replace(/\.[^/.]+$/, "");
  const parentFolderName = parts[parts.length - 2];
  return fileNameNoExt === parentFolderName;
}

function getProminentType(file: { type: string, path: string }, allFiles: { type: string, path: string }[], settings: ProminentBookmarksSettings, plugin: Plugin): number {
  if (file.type === "file") {
    // If the file is a folder note, it should still have prominent value 1
    return 1;
  } else if (file.type === "folder") {
    // If the folder is a folder note (contains a file with the same name as the folder), always return 3
    if (isFolderNote(file.path, plugin)) {
      return 3;
    }
    return settings.separateIcons ? 2 : 1;
  }
  return 1;
}

export default class ProminentBookmarks extends Plugin {
  settings: ProminentBookmarksSettings;
  _bookmarkObserver: any = null;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new ProminentBookmarksSettingTab(this.app, this));
    this.watchBookmarks();
    this.app.workspace.onLayoutReady(() => {
      this.updateColoringClass();
      this.updateAll(); // Ensure icons are updated after layout is ready
      // One-time fallback: check for file explorer for up to 2 seconds after startup
      let explorerCheckTries = 0;
      const explorerCheckInterval = window.setInterval(() => {
        const explorers = this.fileExplorers;
        if (explorers.length > 0) {
          this.updateAll();
          window.clearInterval(explorerCheckInterval);
        }
        explorerCheckTries++;
        if (explorerCheckTries > 20) { // ~2 seconds if interval is 100ms
          window.clearInterval(explorerCheckInterval);
        }
      }, 100);
    });
    // Also call updateAll() in case workspace is already ready
    this.updateAll();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.updateColoringClass();
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.updateColoringClass();
  }

  updateColoringClass() {
    const body = document.body;
    if (this.settings.iconColoringEnabled ?? true) {
      body.classList.add("prominent-bookmarks-coloring-enabled");
    } else {
      body.classList.remove("prominent-bookmarks-coloring-enabled");
    }
  }

  onunload() {
    this.removeAllIcons(); // Ensure icons are removed on unload
    if (this._bookmarkObserver) {
      if (typeof this._bookmarkObserver === 'function') {
        this._bookmarkObserver(); // For bookmarksPlugin.instance.onChange
      } else {
        clearInterval(this._bookmarkObserver); // For setInterval fallback
      }
      this._bookmarkObserver = null;
    }
    // Remove all 'prominent' attributes from tree items
    for (const leaf of this.fileExplorers) {
      const containerEl = (leaf as any).containerEl as HTMLElement;
      containerEl.querySelectorAll('.tree-item[prominent]').forEach((el: Element) => {
        el.removeAttribute('prominent');
      });
      containerEl.querySelectorAll('.nav-file-title[prominent], .nav-folder-title[prominent]').forEach((el: Element) => {
        el.removeAttribute('prominent');
      });
    }
  }

  get bookmarkedGroups() {
    const bookmarksPlugin = (this.app as any)?.internalPlugins?.plugins?.bookmarks;
    if (bookmarksPlugin?.enabled && bookmarksPlugin?.instance?.items) {
      return bookmarksPlugin.instance.items;
    }
    return [];
  }

  get fileExplorers() {
    return (this.app.workspace.getLeavesOfType("file-explorer") as any[]);
  }

  watchBookmarks() {
    const bookmarksPlugin = (this.app as any)?.internalPlugins?.plugins?.bookmarks;
    if (bookmarksPlugin?.instance?.onChange) {
      this._bookmarkObserver = bookmarksPlugin.instance.onChange(() => this.updateAll());
    } else {
      // If no onChange, fallback to a one-time update (no interval)
      this.updateAll();
    }
  }

  updateAll() {
    this.removeAllIcons();
    const allFiles = extractBookmarkedFiles(this.bookmarkedGroups);
    // Collect folder note files and their parent folders
    const folderNoteFolders = new Set<string>();
    for (const file of allFiles) {
      if (file.type === "file" && isFileFolderNote(file.path, this)) {
        // Find the parent folder path
        const parts = file.path.split("/");
        if (parts.length > 1) {
          const folderPath = parts.slice(0, -1).join("/");
          folderNoteFolders.add(folderPath);
        }
      }
    }
    for (const file of allFiles) {
      const prominentType = getProminentType(file, allFiles, this.settings, this);
      for (const leaf of this.fileExplorers) {
        const containerEl = (leaf as any).containerEl as HTMLElement;
        const selector = `.nav-${file.type}-title[data-path="${CSS.escape(file.path)}"]`;
        const el = containerEl.querySelector(selector);
        if (el) {
          el.querySelectorAll(".prominent-decorated-file").forEach((e: Element) => e.remove());
          const treeItemEl = el.closest('.tree-item');
          if (treeItemEl) {
            treeItemEl.setAttribute("prominent", prominentType.toString());
          } else {
            el.setAttribute("prominent", prominentType.toString());
          }
          let iconName = this.settings.fileIcon || "bookmark";
          if (prominentType === 2) iconName = this.settings.folderIcon || iconName;
          if (prominentType === 3) {
            if (this.settings.folderNoteIconMode === "custom") {
              iconName = this.settings.folderNoteIcon || "book";
            } else if (this.settings.folderNoteIconMode === "folder") {
              iconName = this.settings.folderIcon || iconName;
            } else {
              iconName = this.settings.fileIcon || iconName;
            }
          }
          let isCollapsed = false;
          if (treeItemEl && treeItemEl.classList.contains("is-collapsed")) isCollapsed = true;
          if ((prominentType === 2 && this.settings.folderExpandedIconEnabled) || (prominentType === 3 && this.settings.folderNoteIconMode === "custom" && this.settings.folderNoteExpandedIconEnabled)) {
            if (!isCollapsed) {
              if (prominentType === 3 && this.settings.folderNoteIconMode === "custom" && this.settings.folderNoteExpandedIconEnabled) {
                iconName = this.settings.folderNoteExpandedIcon || iconName;
              } else if (prominentType === 2 && this.settings.folderExpandedIconEnabled) {
                iconName = this.settings.folderExpandedIcon || iconName;
              }
            }
          }
          const iconEl = document.createElement("div");
          iconEl.classList.add("prominent-decorated-file");
          iconEl.innerHTML = getLucideIcon(iconName);

          // Set color if enabled
          if (this.settings.iconColoringEnabled ?? true) {
            let color = "";
            if (prominentType === 1) color = this.settings.fileIconColor || "#4f46e5";
            else if (prominentType === 2) color = this.settings.folderIconColor || "#22c55e";
            else if (prominentType === 3) color = this.settings.folderNoteIconColor || "#eab308";
            iconEl.style.color = color;
          } else {
            iconEl.style.color = ""; // Remove inline color
            // Remove any color class if present (let it inherit text color)
            iconEl.classList.remove("prominent-file-color", "prominent-folder-color", "prominent-foldernote-color");
          }

          // Find the nav-title-content element inside the nav-title
          let titleContent: HTMLElement | null = null;
          if (file.type === "file") {
            titleContent = el.querySelector('.tree-item-inner .nav-file-title-content');
          } else if (file.type === "folder") {
            titleContent = el.querySelector('.tree-item-inner .nav-folder-title-content');
          }
          // Remove any existing prominent icon that is a sibling of the content element
          if (titleContent) {
            let sibling = titleContent.nextElementSibling;
            while (sibling) {
              const next = sibling.nextElementSibling;
              if (sibling.classList.contains("prominent-decorated-file")) {
                sibling.remove();
              }
              sibling = next;
            }
            titleContent.insertAdjacentElement("afterend", iconEl);
          } else {
            // fallback: remove any prominent icon children, then append
            el.querySelectorAll(".prominent-decorated-file").forEach((e: Element) => e.remove());
            el.appendChild(iconEl);
          }
        }
      }
    }
    // Add prominent=3 and icon to folders that are parent of folder note files
    for (const folderPath of folderNoteFolders) {
      for (const leaf of this.fileExplorers) {
        const containerEl = (leaf as any).containerEl as HTMLElement;
        const selector = `.nav-folder-title[data-path="${CSS.escape(folderPath)}"]`;
        const el = containerEl.querySelector(selector);
        if (el) {
          el.querySelectorAll(".prominent-decorated-file").forEach((e: Element) => e.remove());
          const treeItemEl = el.closest('.tree-item');
          if (treeItemEl) {
            treeItemEl.setAttribute("prominent", "3");
          } else {
            el.setAttribute("prominent", "3");
          }
          let iconName = this.settings.folderNoteIconMode === "custom"
            ? (this.settings.folderNoteIcon || "book")
            : (this.settings.folderIcon || this.settings.fileIcon || "bookmark");
          if (this.settings.folderNoteIconMode === "folder") {
            iconName = this.settings.folderIcon || iconName;
          } else if (this.settings.folderNoteIconMode === "file") {
            iconName = this.settings.fileIcon || iconName;
          }
          // Expanded icon logic
          let isCollapsed = false;
          if (treeItemEl && treeItemEl.classList.contains("is-collapsed")) isCollapsed = true;
          if (this.settings.folderNoteIconMode === "custom" && this.settings.folderNoteExpandedIconEnabled && !isCollapsed) {
            iconName = this.settings.folderNoteExpandedIcon || iconName;
          }
          const iconEl = document.createElement("div");
          iconEl.classList.add("prominent-decorated-file");
          iconEl.innerHTML = getLucideIcon(iconName);

          // Set color if enabled
          if (this.settings.iconColoringEnabled ?? true) {
            iconEl.style.color = this.settings.folderNoteIconColor || "#eab308";
          } else {
            iconEl.style.color = "";
            iconEl.classList.remove("prominent-file-color", "prominent-folder-color", "prominent-foldernote-color");
          }

          // For folder note parent folders
          let titleContent2: HTMLElement | null = el.querySelector('.tree-item-inner .nav-folder-title-content');
          if (titleContent2) {
            let sibling = titleContent2.nextElementSibling;
            while (sibling) {
              const next = sibling.nextElementSibling;
              if (sibling.classList.contains("prominent-decorated-file")) {
                sibling.remove();
              }
              sibling = next;
            }
            titleContent2.insertAdjacentElement("afterend", iconEl);
          } else {
            el.querySelectorAll(".prominent-decorated-file").forEach((e: Element) => e.remove());
            el.appendChild(iconEl);
          }
        }
      }
    }
  }

  removeAllIcons() {
    for (const leaf of this.fileExplorers) {
      const containerEl = (leaf as any).containerEl as HTMLElement;
      const icons = containerEl.querySelectorAll(".prominent-decorated-file");
      icons.forEach((i: Element) => i.remove());
    }
  }
}

function extractBookmarkedFiles(items: any[]): { type: string, path: string }[] {
  const result: { type: string, path: string }[] = [];
  for (const item of items) {
    if ((item.type === "file" || item.type === "folder") && typeof item.path === "string") {
      result.push({ type: item.type, path: item.path });
    }
    if (Array.isArray(item.items)) {
      result.push(...extractBookmarkedFiles(item.items));
    }
  }
  return result;
}
