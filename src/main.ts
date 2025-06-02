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
  // A folder is a folder note if its nav-folder-title element has the 'has-folder-note' attribute
  for (const leaf of plugin.app.workspace.getLeavesOfType("file-explorer") as any[]) {
    const containerEl = leaf.containerEl as HTMLElement;
    const selector = `.nav-folder-title[data-path="${CSS.escape(folderPath)}"]`;
    const el = containerEl.querySelector(selector);
    if (el && el.hasAttribute("has-folder-note")) return true;
  }
  return false;
}

function isFileFolderNote(filePath: string, plugin: Plugin): boolean {
  // A file is a folder note if it is directly within a folder whose nav-folder-title has 'has-folder-note' and matches the file's parent
  const parts = filePath.split("/");
  const parentPath = parts.slice(0, -1).join("/");
  for (const leaf of plugin.app.workspace.getLeavesOfType("file-explorer") as any[]) {
    const containerEl = leaf.containerEl as HTMLElement;
    const selector = `.nav-folder-title[data-path="${CSS.escape(parentPath)}"]`;
    const el = containerEl.querySelector(selector);
    if (el && el.hasAttribute("has-folder-note")) {
      // Now check if the file is directly inside this folder
      const fileSelector = `.nav-file-title[data-path="${CSS.escape(filePath)}"]`;
      if (containerEl.querySelector(fileSelector)) return true;
    }
  }
  return false;
}

function getProminentType(file: { type: string, path: string }, allFiles: { type: string, path: string }[], settings: ProminentBookmarksSettings, plugin: Plugin): number {
  if (file.type === "file") {
    if (isFileFolderNote(file.path, plugin)) {
      if (settings.folderNoteIconMode === "file") return 1;
      if (settings.folderNoteIconMode === "folder") return 2;
      if (settings.folderNoteIconMode === "custom") return 3;
    }
    return 1;
  } else if (file.type === "folder") {
    if (isFolderNote(file.path, plugin)) {
      if (settings.folderNoteIconMode === "file") return 1;
      if (settings.folderNoteIconMode === "folder") return 2;
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
    this.app.workspace.onLayoutReady(() => this.updateAll());
    this.registerDomEvent(document, "click", (evt) => {
      if ((evt.target as HTMLElement).closest(".tree-item")) {
        setTimeout(() => this.updateAll(), 50);
      }
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {
    this.removeAllIcons();
    if (this._bookmarkObserver) this._bookmarkObserver();
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
      this._bookmarkObserver = window.setInterval(() => this.updateAll(), 2000);
    }
  }

  updateAll() {
    this.removeAllIcons();
    const allFiles = extractBookmarkedFiles(this.bookmarkedGroups);
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
          el.appendChild(iconEl);
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
