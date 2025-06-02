import { Plugin, setIcon } from "obsidian";
import { ProminentBookmarksSettings, DEFAULT_SETTINGS } from "./settingsData";
import { ProminentBookmarksSettingTab } from "./settingsTab";


export default class ProminentBookmarks extends Plugin {
    files: Set<string> = new Set();
    settings: ProminentBookmarksSettings;
    _observers: MutationObserver[] = [];

    async onload() {
        console.log("ProminentBookmarks plugin loaded");
        await this.loadSettings();
        this.addSettingTab(new ProminentBookmarksSettingTab(this.app, this));
        this.app.workspace.onLayoutReady(() => {
            this.updateAll();
            // Listen for file explorer DOM changes to update icons dynamically
            for (const leaf of this.fileExplorers) {
                const containerEl = (leaf as any).containerEl as HTMLElement;
                // Use a single MutationObserver per file explorer
                const observer = new MutationObserver((mutations) => {
                    // Only update if nodes were actually added or removed
                    if (mutations.some(m => m.addedNodes.length > 0 || m.removedNodes.length > 0)) {
                        this.updateAll();
                    }
                });
                observer.observe(containerEl, { childList: true, subtree: false }); // subtree: false to avoid deep recursion
                this._observers.push(observer);
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
        // Disconnect MutationObservers if present
        if (this._observers) {
            for (const observer of this._observers) observer.disconnect();
            this._observers = [];
        }
    }

    get bookmarkedGroups() {
        // Defensive: check for plugin existence
        const bookmarksPlugin = (this.app as any)?.internalPlugins?.plugins?.bookmarks;
        if (bookmarksPlugin?.enabled && bookmarksPlugin?.instance?.items) {
            return bookmarksPlugin.instance.items;
        }
        return [];
    }

    get fileExplorers() {
        // Cast to any to access containerEl (Obsidian API limitation)
        return (this.app.workspace.getLeavesOfType("file-explorer") as any[]);
    }

    updateAll() {
        this.removeAllIcons();

        const allFiles = extractBookmarkedFiles(this.bookmarkedGroups);
        for (const file of allFiles) {
            const iconName = this.settings.separateIcons
                ? file.type === "folder" 
                    ? this.settings.folderIcon || "bookmark"
                    : this.settings.fileIcon || "bookmark"
                : this.settings.fileIcon || "bookmark";
            this.setIcon(file, iconName);
        }
    }

    setIcon(file: { type: string, path: string }, icon: string) {
        if (this.files.has(file.path)) return;
        this.files.add(file.path);

        for (const leaf of this.fileExplorers) {
            const view = (leaf as any).view;
            const containerEl = (leaf as any).containerEl as HTMLElement;
            let el: HTMLElement | null =
                view?.fileItems?.[file.path]?.titleEl ??
                containerEl.querySelector(
                    `.nav-${file.type}-title[data-path="${CSS.escape(file.path)}"]`
                );
            if (el) {
                // Remove existing icons to avoid duplicates
                el.querySelectorAll(".prominent-decorated-file").forEach((e: Element) => e.remove());

                if (file.type === "folder") {
                    // Hide the collapse/chevron icon
                    const collapseIcon = el.querySelector('.collapse-icon, .nav-folder-collapse-indicator');
                    if (collapseIcon) {
                        (collapseIcon as HTMLElement).style.display = "none";
                    }
                    // Always add the icon at the start
                    const iconEl = document.createElement("div");
                    setIcon(iconEl, icon);
                    iconEl.classList.add("prominent-decorated-file");
                    el.insertBefore(iconEl, el.firstChild);
                } else {
                    // For files, add as before
                    setIcon(el.createDiv("prominent-decorated-file"), icon);
                }
            }
        }
    }

    removeAllIcons() {
        for (const leaf of this.fileExplorers) {
            const containerEl = (leaf as any).containerEl as HTMLElement;
            // Remove the bookmark icons
            const icons = containerEl.querySelectorAll(".prominent-decorated-file");
            icons.forEach((i: Element) => i.remove());

            // Restore folder chevrons
            const collapseIcons = containerEl.querySelectorAll('.collapse-icon, .nav-folder-collapse-indicator');
            collapseIcons.forEach((icon: Element) => (icon as HTMLElement).style.display = "");
        }
        this.files.clear();
    }
}

// Utility function from above!
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
