import { FileStructure } from "@/components/FileBrowser/FileBrowser";

export const hexToBytes = (hex: string) => {
  let bytes = new Uint8Array(Math.ceil(hex.length / 2));
  for (let i = 0; i < bytes.length; i++)
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
};

export const bytesToHex = (bytes: Uint8Array) => {
  return bytes.map((byte: any) => byte.toString(16).padStart(2, "0")).join("");
};

export const parseDirectories = (
  dirList: string[],
  parentPath: string = "/"
): FileStructure[] => {
  const structures = dirList.map((path) => {
    const isFolder = path.endsWith("/");
    const name = isFolder ? path.slice(0, -1) : path;

    return {
      name,
      path: parentPath,
      type: isFolder ? "folder" : "file",
      children: isFolder ? [] : undefined,
      isOpen: false,
    } as FileStructure;
  });

  // Sort: folders first (alphabetically), then files (alphabetically)
  return structures.sort((a, b) => {
    // If both are folders or both are files, sort alphabetically
    if (a.type === b.type) {
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    }
    // Folders come before files
    return a.type === "folder" ? -1 : 1;
  });
};
