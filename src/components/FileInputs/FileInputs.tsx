import { faRotate, faUpload, faSdCard, faFolderPlus, faCamera, faPlug } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChangeEvent, Dispatch, SetStateAction, useState } from "react";
import {
  FileBrowser,
  FileStructure,
} from "@/components/FileBrowser/FileBrowser";
import { parseDirectories } from "@/utils/fileUtils";
import { useWriteCommand } from "@/utils/serialUtils";

interface IFileInputs {
  fileInputRef: React.RefObject<HTMLInputElement>;
  firmwareFileInputRef: React.RefObject<HTMLInputElement>;
  scriptFileInputRef: React.RefObject<HTMLInputElement>;
  selectedUploadFolder: string;
  dirStructure: FileStructure[] | undefined;
  setDirStructure: Dispatch<SetStateAction<FileStructure[] | undefined>>;
  setSelectedUploadFolder: Dispatch<SetStateAction<string>>;
  onFileChange: (event: ChangeEvent<HTMLInputElement>, path: string) => void;
  onFirmwareFileChange: (
    event: ChangeEvent<HTMLInputElement>,
    path: string
  ) => void;
  onScriptFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const FileInputs: React.FC<IFileInputs> = ({
  fileInputRef,
  firmwareFileInputRef,
  scriptFileInputRef,
  selectedUploadFolder,
  dirStructure,
  setDirStructure,
  setSelectedUploadFolder,
  onFileChange,
  onFirmwareFileChange,
  onScriptFileChange,
}) => {
  const { write } = useWriteCommand();
  const [sdOverUsbEnabled, setSdOverUsbEnabled] = useState(false);

  const refreshFileSystem = async () => {
    const rootDirs = await write(`ls /`, false, true);
    if (rootDirs.response) {
      const rootItems = rootDirs.response.split("\r\n").slice(1, -1);
      const fileStructures = parseDirectories(rootItems, "/");
      setDirStructure(fileStructures);
    }
  };

  const uploadToRoot = () => {
    setSelectedUploadFolder("/");
    fileInputRef.current?.click();
  };

  const createNewFolder = async () => {
    const folderName = prompt("Enter new folder name:");
    if (folderName && folderName.trim()) {
      // Remove spaces and special characters for safety
      const safeFolderName = folderName.trim().replace(/[^a-zA-Z0-9-_]/g, '');
      if (safeFolderName) {
        await write(`mkdir /${safeFolderName}`, false, true);
        // Refresh to show the new folder
        refreshFileSystem();
      } else {
        alert("Invalid folder name. Please use only letters, numbers, hyphens and underscores.");
      }
    }
  };

  const takeScreenshot = async () => {
    const timestamp = Date.now();
    const filename = `screenshot_${timestamp}.png`;
    const result = await write(`screenshot /${filename}`, false, true);
    if (result.response && result.response.includes("ok")) {
      alert(`Screenshot saved as ${filename}`);
      refreshFileSystem();
    } else {
      alert("Failed to take screenshot");
    }
  };

  const toggleSdOverUsb = async () => {
    const newState = !sdOverUsbEnabled;
    const command = newState ? "sd_over_usb on" : "sd_over_usb off";
    const result = await write(command, false, true);
    if (result.response && result.response.includes("ok")) {
      setSdOverUsbEnabled(newState);
      alert(`SD over USB ${newState ? 'enabled' : 'disabled'}. ${newState ? 'SD card is now accessible via USB.' : 'SD card USB access disabled.'}`);
    } else {
      alert("Failed to toggle SD over USB");
    }
  };

  return (
    <div className="flex h-full w-[35%] flex-col gap-1">
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        onClick={() => {
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }}
        onChange={(e) => {
          onFileChange(e, selectedUploadFolder);
        }}
      />
      <input
        ref={firmwareFileInputRef}
        type="file"
        accept=".tar"
        style={{ display: "none" }}
        onClick={() => {
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }}
        onChange={(e) => {
          onFirmwareFileChange(e, selectedUploadFolder);
        }}
      />
      <input
        ref={scriptFileInputRef}
        type="file"
        accept=".ppsc"
        style={{ display: "none" }}
        onClick={() => {
          if (scriptFileInputRef.current) {
            scriptFileInputRef.current.value = "";
          }
        }}
        onChange={(e) => {
          onScriptFileChange(e);
        }}
      />
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faSdCard} className="text-white" />
          <h3 className="font-semibold text-white">SD Card</h3>
        </div>
        <div className="flex gap-1">
          <button
            onClick={createNewFolder}
            className="rounded bg-gray-700 px-2 py-1 text-white hover:bg-gray-600"
            title="Create new folder"
          >
            <FontAwesomeIcon icon={faFolderPlus} className="text-sm" />
          </button>
          <button
            onClick={uploadToRoot}
            className="rounded bg-gray-700 px-2 py-1 text-white hover:bg-gray-600"
            title="Upload to root"
          >
            <FontAwesomeIcon icon={faUpload} className="text-sm" />
          </button>
          <button
            onClick={takeScreenshot}
            className="rounded bg-gray-700 px-2 py-1 text-white hover:bg-gray-600"
            title="Take screenshot"
          >
            <FontAwesomeIcon icon={faCamera} className="text-sm" />
          </button>
          <button
            onClick={toggleSdOverUsb}
            className={`rounded px-2 py-1 text-white ${
              sdOverUsbEnabled 
                ? 'bg-blue-600 hover:bg-blue-500' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={sdOverUsbEnabled ? "Disable SD over USB" : "Enable SD over USB"}
          >
            <FontAwesomeIcon icon={faPlug} className="text-sm" />
          </button>
          <button
            onClick={refreshFileSystem}
            className="rounded bg-gray-700 px-2 py-1 text-white hover:bg-gray-600"
            title="Refresh file system"
          >
            <FontAwesomeIcon icon={faRotate} className="text-sm" />
          </button>
        </div>
      </div>
      <div className="flex h-full flex-col overflow-y-auto">
        <FileBrowser
          fileInputRef={fileInputRef}
          setSelectedUploadFolder={setSelectedUploadFolder}
          dirStructure={dirStructure}
          setDirStructure={setDirStructure}
        />
      </div>
    </div>
  );
};
