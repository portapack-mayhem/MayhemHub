// Define FileType
export type FileType = "file" | "folder";

// Define file structure
export type FileStructure = {
  name: string;
  path: string;
  type: FileType;
  children?: FileStructure[];
  isOpen: boolean;
};
