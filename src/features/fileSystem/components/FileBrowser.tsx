import {
  faFolderOpen,
  faFolder,
  faUpload,
  faFile,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IFileStructure } from "@/types";

interface IFileBrowserProps {
  dirStructure: IFileStructure[];
  disabled: boolean;
  onFolderToggle: (folder: IFileStructure) => Promise<void>;
  onFileDownload: (filePath: string) => Promise<void>;
  onUploadToFolder: (folderPath: string) => void;
}

const FileBrowser = ({
  dirStructure,
  disabled,
  onFolderToggle,
  onFileDownload,
  onUploadToFolder,
}: IFileBrowserProps) => {
  const FileItem = ({ file }: { file: IFileStructure }) => (
    <div
      className={`flex cursor-pointer items-center ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      onClick={() => {
        if (!disabled) {
          onFileDownload(file.path + file.name);
        }
      }}
    >
      <FontAwesomeIcon icon={faFile} className="mr-2" />
      <p>{file.name}</p>
    </div>
  );

  const FolderItem = ({
    folder,
    indent,
  }: {
    folder: IFileStructure;
    indent: number;
  }) => (
    <div style={{ marginLeft: `${indent}em` }}>
      <div
        className="flex cursor-pointer items-center justify-between"
        onClick={() => onFolderToggle(folder)}
      >
        <div className="flex items-center">
          <FontAwesomeIcon
            icon={folder.isOpen ? faFolderOpen : faFolder}
            className="mr-2 text-yellow-500"
          />
          <h3>{folder.name}</h3>
        </div>

        <FontAwesomeIcon
          icon={faUpload}
          className="mr-2 cursor-pointer text-white"
          onClick={(e) => {
            e.stopPropagation();
            onUploadToFolder(folder.path + folder.name + "/");
          }}
        />
      </div>

      {folder.isOpen &&
        folder.children?.map((child, index) => (
          <ListItem
            key={`${child.name}-${index}`}
            item={child}
            indent={indent + 1}
          />
        ))}
    </div>
  );

  const ListItem = ({
    item,
    indent,
  }: {
    item: IFileStructure;
    indent: number;
  }) => {
    if (item.type === "folder") {
      return <FolderItem folder={item} indent={indent} />;
    }

    return (
      <div style={{ marginLeft: `${indent}em` }}>
        <FileItem file={item} />
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {dirStructure.map((item, index) => (
        <ListItem key={`${item.name}-${index}`} item={item} indent={0} />
      ))}
    </div>
  );
};

export default FileBrowser;
