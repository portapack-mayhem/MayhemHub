import { IFileStructure } from "@/types";

export const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(Math.ceil(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
};

export const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const parseDirectories = (
  dirList: string[],
  parentPath: string = "/"
): IFileStructure[] => {
  const structures = dirList.map((path) => {
    const isFolder = path.endsWith("/");
    const name = isFolder ? path.slice(0, -1) : path;

    return {
      name,
      path: parentPath,
      type: isFolder ? ("folder" as const) : ("file" as const),
      children: isFolder ? [] : undefined,
      isOpen: false,
    };
  });

  return structures.sort((a, b) => {
    if (a.type === b.type) {
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    }
    return a.type === "folder" ? -1 : 1;
  });
};

export const parseDeviceVersion = (infoResponse: string): string => {
  const matches = infoResponse.match(/Mayhem Version:\s*(.*)/i);
  return matches?.[1] ?? "";
};

export const parseFileSize = (response: string): number => {
  const lines = response.split("\r\n");
  return parseInt(lines[1] || "0", 10);
};
