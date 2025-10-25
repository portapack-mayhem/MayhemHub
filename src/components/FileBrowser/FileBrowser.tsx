import {
  faFolderOpen,
  faFolder,
  faUpload,
  faFile,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dispatch, RefObject, SetStateAction, useState, useRef } from "react";
import Modal from "@/components/Modal/Modal";
import { parseDirectories, hexToBytes } from "@/utils/fileUtils";
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
  const { write } = useWriteCommand();
  const [downloadStatus, setDownloadStatus] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [currentFileName, setCurrentFileName] = useState<string>("");
  const cancelDownload = useRef(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const downloadFile = async (filePath: string) => {
    const fileName = filePath.substring(filePath.lastIndexOf("/") + 1);
    setCurrentFileName(fileName);
    setIsDownloading(true);
    setDownloadStatus(`📊 Preparing to download ${fileName}...`);
    cancelDownload.current = false;

    await write("fclose", false);
    let sizeResponse = await write(`filesize ${filePath}`, false, true);
    if (!sizeResponse.response) {
      console.error("Error downloading (size) file");
      setDownloadStatus("❌ Error: Could not get file size");
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadStatus("");
      }, 3000);
      return;
    }

    let size = parseInt(sizeResponse.response?.split("\r\n")[1] || "0");
    await write(`fopen ${filePath}`, false);
    await write(`fseek 0`, false);

    let rem = size;
    let chunk = 62 * 15;
    let dataObject: Uint8Array = new Uint8Array();
    
    let startTime = Date.now();
    let totalTime = 0;
    let lastProgressUpdate = Date.now();
    let successfulChunks = 0;
    let bytesDownloaded = 0;

    while (rem > 0 && !cancelDownload.current) {
      if (rem < chunk) {
        chunk = rem;
      }
      
      let lines =
        (await write(`fread ${chunk.toString()}`, false, true)).response
          ?.split("\r\n")
          .slice(1)
          .slice(0, -2)
          .join("") || "";

      let bArr = hexToBytes(lines);
      rem -= bArr.length;
      bytesDownloaded += bArr.length;
      dataObject = new Uint8Array([...dataObject, ...Array.from(bArr)]);
      successfulChunks++;

      // Calculate progress metrics
      let elapsed = Date.now() - startTime;
      totalTime += elapsed;
      
      // Update progress display every 500ms
      if (Date.now() - lastProgressUpdate > 500 || rem === 0) {
        const percentComplete = ((bytesDownloaded / size) * 100);
        const transferSpeed = (bytesDownloaded / (totalTime / 1000)) / 1024; // KB/s
        const estRemainingTime = rem > 0 ? (rem / (bytesDownloaded / (totalTime / 1000))) : 0;
        
        setDownloadStatus(
          `📊 Download Progress\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `⚡ Progress: ${percentComplete.toFixed(1)}%\n` +
          `📦 Downloaded: ${(bytesDownloaded / 1024).toFixed(1)}KB / ${(size / 1024).toFixed(1)}KB\n` +
          `🚀 Speed: ${transferSpeed.toFixed(1)} KB/s\n` +
          `⏱️ Time Elapsed: ${formatTime(totalTime/1000)}\n` +
          `⌛ Time Remaining: ${formatTime(estRemainingTime)}\n` +
          `✅ Chunks: ${successfulChunks}`
        );
        lastProgressUpdate = Date.now();
      }

      // Reset start time for next iteration
      startTime = Date.now();
    }

    // Check if download was cancelled
    if (cancelDownload.current) {
      await write("fclose", false);
      setDownloadStatus("❌ Download cancelled");
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadStatus("");
      }, 2000);
      return;
    }

    // Download complete - save the file
    downloadFileFromBytes(dataObject, fileName);
    await write("fclose", false);
    
    setDownloadStatus(
      `✅ Download Complete!\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 File: ${fileName}\n` +
      `📦 Total Size: ${(size / 1024).toFixed(1)}KB\n` +
      `⏱️ Total Time: ${formatTime(totalTime/1000)}\n` +
      `✅ Successful Chunks: ${successfulChunks}`
    );
    
    // Clear status after 5 seconds
    setTimeout(() => {
      setIsDownloading(false);
      setDownloadStatus("");
    }, 5000);
  };

  const downloadFileFromBytes = (
    bytes: Uint8Array,
    fileName: string = "output.txt"
  ) => {
    let blob = new Blob([bytes]);
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
            className="mr-2 cursor-pointer text-white"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
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
      className={`flex cursor-pointer items-center ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => {
        if (!isDownloading) {
          downloadFile(file.path + file.name);
        }
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
      
      {/* Download Progress Modal */}
      <Modal
        title={`Downloading: ${currentFileName}`}
        isModalOpen={isDownloading}
        closeModal={() => {
          if (!downloadStatus.includes("Complete")) {
            // Cancel the download
            cancelDownload.current = true;
          } else {
            // Download is complete, just close
            setIsDownloading(false);
            setDownloadStatus("");
          }
        }}
        className="w-96"
      >
        <div className="space-y-2">
          {downloadStatus.includes("Progress") && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-blue-400 h-2.5 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${downloadStatus.split('Progress: ')[1]?.split('%')[0] || 0}%` 
                }}
              />
            </div>
          )}
          <p className="whitespace-pre-wrap text-sm">{downloadStatus}</p>
        </div>
      </Modal>
    </>
  );
};
