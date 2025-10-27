import {
  faRotate,
  faUpload,
  faSdCard,
  faFolderPlus,
  faCamera,
  faPlug,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChangeEvent } from "react";
import FileBrowser from "@/features/fileSystem/components/FileBrowser";
import { IFileStructure } from "@/types";

interface IFileInputsProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
  dirStructure: IFileStructure[];
  sdOverUsbEnabled: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRefresh: () => void;
  onCreateFolder: () => void;
  onUploadToRoot: () => void;
  onTakeScreenshot: () => void;
  onToggleSdOverUsb: () => void;
  onFolderToggle: (folder: IFileStructure) => Promise<void>;
  onFileDownload: (filePath: string) => Promise<void>;
  onUploadToFolder: (folderPath: string) => void;
  disabled: boolean;
}

const FileInputs = ({
  fileInputRef,
  dirStructure,
  sdOverUsbEnabled,
  onFileChange,
  onRefresh,
  onCreateFolder,
  onUploadToRoot,
  onTakeScreenshot,
  onToggleSdOverUsb,
  onFolderToggle,
  onFileDownload,
  onUploadToFolder,
  disabled,
}: IFileInputsProps) => {
  return (
    <div className="flex h-full w-[35%] flex-col gap-1">
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        onClick={(e) => {
          e.currentTarget.value = "";
        }}
        onChange={onFileChange}
      />

      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faSdCard} className="text-white" />
          <h3 className="font-semibold text-white">SD Card</h3>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onCreateFolder}
            disabled={disabled}
            className="rounded bg-gray-700 px-2 py-1 text-white hover:bg-gray-600 disabled:opacity-50"
            title="Create new folder"
          >
            <FontAwesomeIcon icon={faFolderPlus} className="text-sm" />
          </button>
          <button
            onClick={onUploadToRoot}
            disabled={disabled}
            className="rounded bg-gray-700 px-2 py-1 text-white hover:bg-gray-600 disabled:opacity-50"
            title="Upload to root"
          >
            <FontAwesomeIcon icon={faUpload} className="text-sm" />
          </button>
          <button
            onClick={onTakeScreenshot}
            disabled={disabled}
            className="rounded bg-gray-700 px-2 py-1 text-white hover:bg-gray-600 disabled:opacity-50"
            title="Take screenshot"
          >
            <FontAwesomeIcon icon={faCamera} className="text-sm" />
          </button>
          <button
            onClick={onToggleSdOverUsb}
            disabled={disabled}
            className={`rounded px-2 py-1 text-white ${
              sdOverUsbEnabled
                ? "bg-blue-600 hover:bg-blue-500"
                : "bg-gray-700 hover:bg-gray-600"
            } disabled:opacity-50`}
            title={
              sdOverUsbEnabled ? "Disable SD over USB" : "Enable SD over USB"
            }
          >
            <FontAwesomeIcon icon={faPlug} className="text-sm" />
          </button>
          <button
            onClick={onRefresh}
            disabled={disabled}
            className="rounded bg-gray-700 px-2 py-1 text-white hover:bg-gray-600 disabled:opacity-50"
            title="Refresh file system"
          >
            <FontAwesomeIcon icon={faRotate} className="text-sm" />
          </button>
        </div>
      </div>

      <FileBrowser
        dirStructure={dirStructure}
        disabled={disabled}
        onFolderToggle={onFolderToggle}
        onFileDownload={onFileDownload}
        onUploadToFolder={onUploadToFolder}
      />
    </div>
  );
};

export default FileInputs;
