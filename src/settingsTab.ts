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

        // Folder Note Icon Mode
        new Setting(containerEl)
            .setName("Folder Note Icon Mode")
            .setDesc("Choose which icon to use for folder notes (notes with the same name as their folder)")
            .addDropdown(drop =>
                drop
                    .addOption("file", "Same as File")
                    .addOption("folder", "Same as Folder")
                    .addOption("custom", "Custom Icon")
                    .setValue(this.plugin.settings.folderNoteIconMode)
                    .onChange(async (value: string) => {
                        this.plugin.settings.folderNoteIconMode = value as "file" | "folder" | "custom";
                        await this.plugin.saveSettings();
                        this.display();
                        this.plugin.updateAll();
                    })
            );

        if (this.plugin.settings.folderNoteIconMode === "custom") {
            new Setting(containerEl)
                .setName("Folder Note Custom Icon")
                .setDesc("Lucide icon name for folder notes (custom)")
                .addText(text =>
                    text
                        .setPlaceholder("book")
                        .setValue(this.plugin.settings.folderNoteIcon || "book")
                        .onChange(async (value) => {
                            this.plugin.settings.folderNoteIcon = value || "book";
                            await this.plugin.saveSettings();
                            this.plugin.updateAll();
                        })
                );
        }

        // Folder expanded icon toggle and input
        new Setting(containerEl)
            .setName("Show Second Icon for Expanded Folders")
            .setDesc("Display a different icon when a folder is expanded.")
            .addToggle(toggle =>
                toggle
                    .setValue(this.plugin.settings.folderExpandedIconEnabled || false)
                    .onChange(async (value) => {
                        this.plugin.settings.folderExpandedIconEnabled = value;
                        await this.plugin.saveSettings();
                        this.display();
                        this.plugin.updateAll();
                    })
            );
        if (this.plugin.settings.folderExpandedIconEnabled) {
            new Setting(containerEl)
                .setName("Expanded Folder Icon")
                .setDesc("Lucide icon name for expanded folders")
                .addText(text =>
                    text
                        .setPlaceholder("chevron-down")
                        .setValue(this.plugin.settings.folderExpandedIcon || "chevron-down")
                        .onChange(async (value) => {
                            this.plugin.settings.folderExpandedIcon = value || "chevron-down";
                            await this.plugin.saveSettings();
                            this.plugin.updateAll();
                        })
                );
        }

        // Folder note expanded icon toggle and input
        new Setting(containerEl)
            .setName("Show Second Icon for Expanded Folder Notes")
            .setDesc("Display a different icon when a folder note's folder is expanded.")
            .addToggle(toggle =>
                toggle
                    .setValue(this.plugin.settings.folderNoteExpandedIconEnabled || false)
                    .onChange(async (value) => {
                        this.plugin.settings.folderNoteExpandedIconEnabled = value;
                        await this.plugin.saveSettings();
                        this.display();
                        this.plugin.updateAll();
                    })
            );
        if (this.plugin.settings.folderNoteExpandedIconEnabled) {
            new Setting(containerEl)
                .setName("Expanded Folder Note Icon")
                .setDesc("Lucide icon name for expanded folder notes")
                .addText(text =>
                    text
                        .setPlaceholder("chevron-down")
                        .setValue(this.plugin.settings.folderNoteExpandedIcon || "chevron-down")
                        .onChange(async (value) => {
                            this.plugin.settings.folderNoteExpandedIcon = value || "chevron-down";
                            await this.plugin.saveSettings();
                            this.plugin.updateAll();
                        })
                );
        }

        // Icon coloring toggle
        new Setting(containerEl)
            .setName("Enable Icon Coloring")
            .setDesc("Toggle to enable or disable custom coloring for prominent icons.")
            .addToggle(toggle =>
                toggle
                    .setValue(this.plugin.settings.iconColoringEnabled ?? true)
                    .onChange(async (value) => {
                        this.plugin.settings.iconColoringEnabled = value;
                        await this.plugin.saveSettings();
                        this.display();
                        this.plugin.updateAll();
                    })
            );

        if (this.plugin.settings.iconColoringEnabled ?? true) {
            new Setting(containerEl)
                .setName("File Icon Color")
                .setDesc("Color for file icons (hex or CSS color)")
                .addText(text =>
                    text
                        .setPlaceholder("#4f46e5")
                        .setValue(this.plugin.settings.fileIconColor || "#4f46e5")
                        .onChange(async (value) => {
                            this.plugin.settings.fileIconColor = value || "#4f46e5";
                            await this.plugin.saveSettings();
                            this.plugin.updateAll();
                        })
                );
            new Setting(containerEl)
                .setName("Folder Icon Color")
                .setDesc("Color for folder icons (hex or CSS color)")
                .addText(text =>
                    text
                        .setPlaceholder("#22c55e")
                        .setValue(this.plugin.settings.folderIconColor || "#22c55e")
                        .onChange(async (value) => {
                            this.plugin.settings.folderIconColor = value || "#22c55e";
                            await this.plugin.saveSettings();
                            this.plugin.updateAll();
                        })
                );
            new Setting(containerEl)
                .setName("Folder Note Icon Color")
                .setDesc("Color for folder note icons (hex or CSS color)")
                .addText(text =>
                    text
                        .setPlaceholder("#eab308")
                        .setValue(this.plugin.settings.folderNoteIconColor || "#eab308")
                        .onChange(async (value) => {
                            this.plugin.settings.folderNoteIconColor = value || "#eab308";
                            await this.plugin.saveSettings();
                            this.plugin.updateAll();
                        })
                );
        }
    }
}
