import { Plugin, setIcon } from "obsidian";
import { ProminentBookmarksSetting, DEFAULT_SETTINGS } from "./settingsData";
import { ProminentBookmarksSettingTab } from "./settingsTab";


export default class ProminentBookmarks extends Plugin {
    files: Set<string> = new Set();
    settings: ProminentBookmarksSettings;

    async onload() {
        console.log("ProminentBookmarks plugin loaded");
        await this.loadSettings();
        this.addSettingTab(new ProminentBookmarksSettingTab(this.app, this));
        this.app.workspace.onLayoutReady(() => {
            this.updateAll();
            this.registerEvent(this.app.workspace.on("bookmarks-changed", () => this.updateAll()));
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
    }

    get bookmarkedGroups() {
        // This is now an array of groups
        return (this.app as any).internalPlugins.plugins.bookmarks.instance.items || [];
    }

    get fileExplorers() {
        return this.app.workspace.getLeavesOfType("file-explorer");
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
            const el =
                view?.fileItems?.[file.path]?.titleEl ??
                leaf.containerEl.querySelector(
                    `.nav-${file.type}-title[data-path="${CSS.escape(file.path)}"]`
                );
            if (el) {
                // Remove existing icons to avoid duplicates
                el.querySelectorAll(".prominent-decorated-file").forEach(e => e.remove());

                if (file.type === "folder") {
                    // Hide the collapse/chevron icon
                    const collapseIcon = el.querySelector('.collapse-icon, .nav-folder-collapse-indicator');
                    if (collapseIcon) {
                        (collapseIcon as HTMLElement).style.display = "none";
                        // Create and insert the bookmark icon at the start
                        const iconEl = document.createElement("div");
                        setIcon(iconEl, icon);
                        iconEl.classList.add("prominent-decorated-file");
                        el.insertBefore(iconEl, el.firstChild);
                    } else {
                        // Fallback: just add the icon
                        setIcon(el.createDiv("prominent-decorated-file"), icon);
                    }
                } else {
                    // For files, add as before
                    setIcon(el.createDiv("prominent-decorated-file"), icon);
                }
            }
        }
    }

    removeAllIcons() {
        for (const leaf of this.fileExplorers) {
            // Remove the bookmark icons
            const icons = leaf.containerEl.querySelectorAll(".prominent-decorated-file");
            icons.forEach(i => i.remove());

            // Restore folder chevrons
            const collapseIcons = leaf.containerEl.querySelectorAll('.collapse-icon, .nav-folder-collapse-indicator');
            collapseIcons.forEach(icon => (icon as HTMLElement).style.display = "");
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
