export interface ProminentBookmarksSettings {
    separateIcons: boolean;
    fileIcon: string;
    folderIcon: string;
    folderNoteIconMode: "file" | "folder" | "custom";
    folderNoteIcon?: string;
    folderExpandedIconEnabled?: boolean;
    folderExpandedIcon?: string;
    folderNoteExpandedIconEnabled?: boolean;
    folderNoteExpandedIcon?: string;
}

export const DEFAULT_SETTINGS: ProminentBookmarksSettings = {
    separateIcons: false,
    fileIcon: "bookmark",
    folderIcon: "bookmark",
    folderNoteIconMode: "file",
    folderNoteIcon: "book",
    folderExpandedIconEnabled: false,
    folderExpandedIcon: "chevron-down",
    folderNoteExpandedIconEnabled: false,
    folderNoteExpandedIcon: "chevron-down"
};
