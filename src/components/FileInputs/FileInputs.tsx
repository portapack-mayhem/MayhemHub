import { faRotate } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChangeEvent, Dispatch, SetStateAction } from "react";
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

  const refreshFileSystem = async () => {
    const rootDirs = await write(`ls /`, false, true);
    if (rootDirs.response) {
      const rootItems = rootDirs.response.split("\r\n").slice(1, -1);
      const fileStructures = parseDirectories(rootItems, "/");
      setDirStructure(fileStructures);
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
      <div className="mb-2 flex justify-between">
        <h3 className="font-semibold text-white">File System</h3>
        <button
          onClick={refreshFileSystem}
          className="rounded bg-gray-700 px-2 py-1 text-white hover:bg-gray-600"
          title="Refresh file system"
        >
          <FontAwesomeIcon icon={faRotate} className="text-sm" />
        </button>
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
