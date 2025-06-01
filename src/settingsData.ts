export interface ProminentBookmarksSettings {
    separateIcons: boolean;
    fileIcon: string;
    folderIcon: string;
}

export const DEFAULT_SETTINGS: ProminentBookmarksSettings = {
    separateIcons: false,
    fileIcon: "bookmark",
    folderIcon: "bookmark"
};
