import { useState, useRef, ChangeEvent } from "react";
import { createFileService } from "@/features/fileSystem/services/fileService";
import { IFileStructure } from "@/types";
import { parseDirectories } from "@/utils/parsers";
import { isValidFolderName, sanitizeFolderName } from "@/utils/validators";

interface IUseFileOperationsProps {
  sendCommand: (
    command: string,
    updateFrame: boolean,
    awaitResponse?: boolean
  ) => Promise<any>;
  uploadFile: (
    filePath: string,
    bytes: Uint8Array,
    onProgress: (progress: any) => void
  ) => Promise<void>;
  onUploadStart: (fileName: string) => void;
  onUploadProgress: (progress: any) => void;
  onUploadComplete: (progress: any) => void;
}

interface IUseFileOperationsReturn {
  dirStructure: IFileStructure[];
  selectedUploadFolder: string;
  sdOverUsbEnabled: boolean;
  setDirStructure: (structure: IFileStructure[]) => void;
  setSelectedUploadFolder: (folder: string) => void;
  refreshFileSystem: () => Promise<void>;
  createNewFolder: () => Promise<void>;
  takeScreenshot: () => Promise<void>;
  toggleSdOverUsb: () => Promise<void>;
  handleFileUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  downloadFile: (filePath: string) => Promise<void>;
  updateDirectoryStructure: (
    targetFolder: IFileStructure,
    newChildren: IFileStructure[]
  ) => void;
}

export const useFileOperations = ({
  sendCommand,
  uploadFile,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
}: IUseFileOperationsProps): IUseFileOperationsReturn => {
  const [dirStructure, setDirStructure] = useState<IFileStructure[]>([]);
  const [selectedUploadFolder, setSelectedUploadFolder] = useState("/");
  const [sdOverUsbEnabled, setSdOverUsbEnabled] = useState(false);

  const fileService = useRef(createFileService());

  const refreshFileSystem = async () => {
    const response = await sendCommand("ls /", false, true);
    if (response.response) {
      const rootItems = response.response.split("\r\n").slice(1, -1);
      const structure = parseDirectories(rootItems, "/");
      setDirStructure(structure);
    }
  };

  const createNewFolder = async () => {
    const folderName = prompt("Enter new folder name:");

    if (!folderName?.trim()) {
      return;
    }

    if (!isValidFolderName(folderName)) {
      alert(
        "Invalid folder name. Please use only letters, numbers, hyphens and underscores."
      );
      return;
    }

    const safeName = sanitizeFolderName(folderName);
    await sendCommand(`mkdir /${safeName}`, false, true);
    await refreshFileSystem();
  };

  const takeScreenshot = async () => {
    const timestamp = Date.now();
    const filename = `screenshot_${timestamp}.png`;

    const result = await sendCommand(`screenshot /${filename}`, false, true);

    if (result.response?.includes("ok")) {
      alert(`Screenshot saved as ${filename}`);
      await refreshFileSystem();
    } else {
      alert("Failed to take screenshot");
    }
  };

  const toggleSdOverUsb = async () => {
    const newState = !sdOverUsbEnabled;
    const command = newState ? "sd_over_usb on" : "sd_over_usb off";

    const result = await sendCommand(command, false, true);

    if (result.response?.includes("ok")) {
      setSdOverUsbEnabled(newState);
      alert(
        `SD over USB ${newState ? "enabled" : "disabled"}. ${
          newState
            ? "SD card is now accessible via USB."
            : "SD card USB access disabled."
        }`
      );
    } else {
      alert("Failed to toggle SD over USB");
    }
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    onUploadStart(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      await uploadFile(
        `${selectedUploadFolder}${file.name}`,
        bytes,
        onUploadProgress
      );

      onUploadComplete({
        bytesTransferred: bytes.length,
        totalBytes: bytes.length,
        percentage: 100,
        speed: 0,
        timeElapsed: 0,
        timeRemaining: 0,
        chunksCompleted: 0,
        chunksFailed: 0,
      });

      await refreshFileSystem();
    } catch (error) {
      console.error("File upload failed:", error);
      alert("File upload failed");
    }
  };

  const downloadFile = async (filePath: string) => {
    try {
      const bytes = await fileService.current.downloadFile(
        filePath,
        sendCommand
      );
      const fileName = filePath.substring(filePath.lastIndexOf("/") + 1);

      const blob = new Blob([bytes]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("File download failed:", error);
      alert("File download failed");
    }
  };

  const updateDirectoryStructure = (
    targetFolder: IFileStructure,
    newChildren: IFileStructure[]
  ) => {
    const updateStructure = (structure: IFileStructure[]): IFileStructure[] => {
      return structure.map((folder) => {
        if (
          folder.name === targetFolder.name &&
          folder.path === targetFolder.path
        ) {
          return { ...folder, children: newChildren, isOpen: !folder.isOpen };
        }

        if (folder.children) {
          return {
            ...folder,
            children: updateStructure(folder.children),
          };
        }

        return folder;
      });
    };

    setDirStructure((prevState) => updateStructure(prevState));
  };

  return {
    dirStructure,
    selectedUploadFolder,
    sdOverUsbEnabled,
    setDirStructure,
    setSelectedUploadFolder,
    refreshFileSystem,
    createNewFolder,
    takeScreenshot,
    toggleSdOverUsb,
    handleFileUpload,
    downloadFile,
    updateDirectoryStructure,
  };
};
