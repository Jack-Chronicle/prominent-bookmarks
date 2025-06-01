import { App, PluginSettingTab, Setting } from "obsidian";
import ProminentBookmarks from "./main";

export class ProminentBookmarksSettingTab extends PluginSettingTab {
    plugin: ProminentBookmarks;

    constructor(app: App, plugin: ProminentBookmarks) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // Toggle for separate icons
        new Setting(containerEl)
            .setName("Use Separate Icons for Files/Folders")
            .setDesc("Show different icons for bookmarked files and folders")
            .addToggle(toggle =>
                toggle
                    .setValue(this.plugin.settings.separateIcons)
                    .onChange(async (value) => {
                        this.plugin.settings.separateIcons = value;
                        await this.plugin.saveSettings();
                        this.display(); // re-render settings
                        this.plugin.updateAll(); // re-render icons
                    })
            );

        // Icon for files
        if (this.plugin.settings.separateIcons) {
            new Setting(containerEl)
                .setName("Bookmark Icon (Files)")
                .setDesc("Lucide icon name for bookmarked files")
                .addText(text =>
                    text
                        .setPlaceholder("bookmark")
                        .setValue(this.plugin.settings.fileIcon)
                        .onChange(async (value) => {
                            this.plugin.settings.fileIcon = value || "bookmark";
                            await this.plugin.saveSettings();
                            this.plugin.updateAll();
                        })
                );

            new Setting(containerEl)
                .setName("Bookmark Icon (Folders)")
                .setDesc("Lucide icon name for bookmarked folders")
                .addText(text =>
                    text
                        .setPlaceholder("bookmark")
                        .setValue(this.plugin.settings.folderIcon)
                        .onChange(async (value) => {
                            this.plugin.settings.folderIcon = value || "bookmark";
                            await this.plugin.saveSettings();
                            this.plugin.updateAll();
                        })
                );
        } else {
            new Setting(containerEl)
                .setName("Bookmark Icon")
                .setDesc("Lucide icon name for both files and folders")
                .addText(text =>
                    text
                        .setPlaceholder("bookmark")
                        .setValue(this.plugin.settings.fileIcon)
                        .onChange(async (value) => {
                            this.plugin.settings.fileIcon = value || "bookmark";
                            this.plugin.settings.folderIcon = value || "bookmark";
                            await this.plugin.saveSettings();
                            this.plugin.updateAll();
                        })
                );
        }
    }
}
