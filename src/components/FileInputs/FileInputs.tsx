import { ChangeEvent, Dispatch, SetStateAction } from "react";
import {
  FileBrowser,
  FileStructure,
} from "@/components/FileBrowser/FileBrowser";

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
