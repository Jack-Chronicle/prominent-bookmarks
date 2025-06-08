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
    iconColoringEnabled?: boolean; // NEW
    fileIconColor?: string;        // NEW
    folderIconColor?: string;      // NEW
    folderNoteIconColor?: string;  // NEW
}

export const DEFAULT_SETTINGS: ProminentBookmarksSettings = {
    separateIcons: false,
    fileIcon: "bookmark",
    folderIcon: "bookmark-plus",
    folderNoteIconMode: "file",
    folderNoteIcon: "book",
    folderExpandedIconEnabled: false,
    folderExpandedIcon: "bookmark-minus",
    folderNoteExpandedIconEnabled: false,
    folderNoteExpandedIcon: "book-open",
    iconColoringEnabled: true,           // NEW
    fileIconColor: "#4f46e5",            // NEW
    folderIconColor: "#22c55e",          // NEW
    folderNoteIconColor: "#eab308"       // NEW
};
