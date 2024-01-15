import {
  faFolderOpen,
  faFolder,
  faUpload,
  faFile,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dispatch, RefObject, SetStateAction } from "react";
import { parseDirectories } from "@/utils/fileUtils";
import { useWriteCommand } from "@/utils/serialUtils";

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

// ToDo: Need to add the disableTransmitAction check here so we cant look though folder or upload files while we are already uploading a file

export const FileBrowser = ({
  fileInputRef,
  setSelectedUploadFolder,
  dirStructure,
  setDirStructure,
}: {
  fileInputRef: RefObject<HTMLInputElement>;
  setSelectedUploadFolder: Dispatch<SetStateAction<string>>;
  dirStructure: FileStructure[] | undefined;
  setDirStructure: Dispatch<SetStateAction<FileStructure[] | undefined>>;
}) => {
  const { write, downloadFile } = useWriteCommand();

  const updateDirectoryStructure = (
    structure: FileStructure[],
    targetFolder: FileStructure,
    newChildren: FileStructure[]
  ): FileStructure[] => {
    return structure.map((folder) => {
      if (folder.name === targetFolder.name) {
        return { ...folder, children: newChildren, isOpen: !folder.isOpen };
      }

      if (folder.children) {
        return {
          ...folder,
          children: updateDirectoryStructure(
            folder.children,
            targetFolder,
            newChildren
          ),
        };
      }

      return folder;
    });
  };

  const FolderToggle = ({
    folder,
    indent,
  }: {
    folder: FileStructure;
    indent: number;
  }) => {
    const toggleFolder = async () => {
      let fileStructures: FileStructure[] = folder.children || [];
      if (!folder.isOpen) {
        const childDirs = await write(
          `ls ${folder.path + folder.name}`,
          false,
          true
        );

        // Currently dirs with spaces in them are not valid
        if (childDirs.response) {
          const childItems = childDirs.response.split("\r\n").slice(1, -1);
          fileStructures = parseDirectories(
            childItems,
            `${folder.path}${folder.name}/`
          );
        }
      }
      setDirStructure(
        (prevState) =>
          prevState &&
          updateDirectoryStructure(prevState, folder, fileStructures)
      );
    };

    return (
      <div style={{ marginLeft: `${indent}em` }}>
        <div
          className="flex cursor-pointer items-center justify-between"
          onClick={toggleFolder}
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
            className="mr-2 cursor-pointer text-blue-500"
            onClick={(e) => {
              // ToDo: Complete this so the button does not get clicked
              // e.stopPropagation();
              // e.preventDefault();
              setSelectedUploadFolder(folder.path + folder.name + "/");
              fileInputRef.current?.click();
            }}
          />
        </div>

        {folder.isOpen &&
          folder.children &&
          folder.children.map((file, index) => (
            <ListItem key={index} item={file} indent={indent + 1} />
          ))}
      </div>
    );
  };

  // File Component
  const File = ({ file }: { file: FileStructure }) => (
    <div
      className="flex cursor-pointer items-center"
      onClick={() => {
        downloadFile(file.path + file.name);
      }}
    >
      <FontAwesomeIcon icon={faFile} className="mr-2" />
      <p>{file.name}</p>
    </div>
  );

  // ListItem Component
  const ListItem = ({
    item,
    indent,
  }: {
    item: FileStructure;
    indent: number;
  }) => {
    return (
      <div>
        {item.type === "folder" ? (
          <FolderToggle folder={item} indent={indent} />
        ) : (
          <div style={{ marginLeft: `${indent}em` }}>
            <File file={item} />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {dirStructure &&
        dirStructure.map((file, index) => (
          <ListItem key={index} item={file} indent={0} />
        ))}
    </>
  );
};
