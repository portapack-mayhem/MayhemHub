"use client";

import {
  faFile,
  faFolder,
  faFolderOpen,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, {
  ChangeEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { FileStructure } from "../FileStructure/FileStructure";
import HotkeyButton from "../HotkeyButton/HotkeyButton";
import { useSerial } from "../SerialLoader/SerialLoader";
import { DataPacket } from "../SerialProvider/SerialProvider";
import ToggleSwitch from "../ToggleSwitch/ToggleSwitch";

const Controller = () => {
  const { serial, consoleMessage } = useSerial();
  const [consoleMessageList, setConsoleMessageList] = useState<string>("");
  const [updateStatus, setUpdateStatus] = useState<string>("");
  const [selectedUploadFolder, setSelectedUploadFolder] = useState<string>("/");
  const [command, setCommand] = useState<string>("");
  const [autoUpdateFrame, setAutoUpdateFrame] = useState<boolean>(true);
  const [loadingFrame, setLoadingFrame] = useState<boolean>(true);
  const [dirStructure, setDirStructure] = useState<FileStructure[]>();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Create a reference

  const started = useRef<boolean>(false);

  const write = async (
    command: string,
    updateFrame: boolean,
    awaitResponse: boolean = true
  ) => {
    let data: DataPacket = {
      id: 0,
      command: "",
      response: null,
    };
    if (awaitResponse) data = await serial.queueWriteAndResponse(command);
    else serial.queueWrite(command);
    if (updateFrame) {
      serial.queueWrite("screenframeshort");
      setLoadingFrame(true);
    }

    return data;
  };

  const sendCommand = async () => {
    await write(command, false);
    setCommand("");
  };

  useEffect(() => {
    // We dont add this to the console as its not needed. This may change in the future
    if (consoleMessage.includes("screenframe")) {
      renderFrame();
      setLoadingFrame(false);
    } else {
      setConsoleMessageList(
        (prevConsoleMessageList) => prevConsoleMessageList + consoleMessage
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consoleMessage]);

  useEffect(() => {
    if (serial.isOpen && !serial.isReading && !started.current) {
      started.current = true;
      serial.startReading();

      const initSerialSetupCalls = async () => {
        await write(setDeviceTime(), false);

        await fetchFolderStructure();

        await write("screenframeshort", false);
      };

      const fetchFolderStructure = async () => {
        const rootStructure = await write(`ls /`, false, true); // get the children directories

        if (rootStructure.response) {
          const rootItems = rootStructure.response.split("\r\n").slice(1, -1);

          const fileStructures = parseDirectories(rootItems);
          setDirStructure(fileStructures);
        }
      };

      initSerialSetupCalls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serial]);

  // Helper function to parse the directories into FileStructure
  const parseDirectories = (
    dirList: string[],
    parentPath: string = "/"
  ): FileStructure[] => {
    return dirList.map((path) => {
      const isFolder = path.endsWith("/");
      const name = isFolder ? path.slice(0, -1) : path;

      return {
        name,
        path: parentPath,
        type: isFolder ? "folder" : "file",
        children: isFolder ? [] : undefined,
        isOpen: false,
      };
    });
  };

  const renderFrame = () => {
    const width = 241;
    const height = 321;
    if (!consoleMessage.includes("screenframe")) return;

    const lines = consoleMessage.split("\r\n");
    const ctx = canvasRef.current?.getContext("2d");

    if (!ctx) return false;

    for (let y = 0; y < lines.length; y++) {
      let line = lines[y];
      if (line.startsWith("screenframe")) continue;
      for (let o = 0, x = 0; o < line.length && x < 240; o++, x++) {
        try {
          let by = line.charCodeAt(o) - 32;
          let r = ((by >> 4) & 3) << 6;
          let g = ((by >> 2) & 3) << 6;
          let b = (by & 3) << 6;

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx?.fillRect(x, y, 1, 1);
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  const setDeviceTime = () => {
    const currentDateTime: Date = new Date();
    // Add 3 seconds to the current time to account for the time it takes to send the command
    currentDateTime.setSeconds(currentDateTime.getSeconds() + 3);
    const year: number = currentDateTime.getFullYear();
    let month: string | number = currentDateTime.getMonth() + 1; // JavaScript months are 0-11
    let day: string | number = currentDateTime.getDate();
    let hours: string | number = currentDateTime.getHours();
    let minutes: string | number = currentDateTime.getMinutes();
    let seconds: string | number = currentDateTime.getSeconds();

    // Making sure we have two digit representation
    month = month < 10 ? "0" + month : month;
    day = day < 10 ? "0" + day : day;
    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    return `rtcset ${year} ${month} ${day} ${hours} ${minutes} ${seconds}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      (e.key.length === 1 && /[a-zA-Z0-9 ]/.test(e.key)) ||
      e.key === "Backspace"
    ) {
      e.preventDefault();
      let key_code = e.key.length === 1 ? e.key.charCodeAt(0) : e.keyCode;
      const keyHex = key_code.toString(16).padStart(2, "0").toUpperCase();
      write(`keyboard ${keyHex}`, autoUpdateFrame);
    }
  };

  const uploadFile = async (filePath: string, bytes: Uint8Array) => {
    await write("fclose", false);
    await write(`fopen ${filePath}`, false);

    await write(`fseek 0`, false);

    let blob = new Blob([bytes]);
    const arrayBuffer = await blob.arrayBuffer();

    const chunkSize = 100000;

    console.log("Total length: ", arrayBuffer.byteLength);

    let startTime = Date.now();
    let totalTime = 0;

    for (let i = 0; i < arrayBuffer.byteLength; i += chunkSize) {
      const chunk = arrayBuffer.slice(i, i + chunkSize);

      await write(`fwb ${chunk.byteLength}`, false, true);
      await serial.queueWriteAndResponseBinary(new Uint8Array(chunk));

      // calculate elapsed time and average time per chunk
      let elapsed = Date.now() - startTime;
      totalTime += elapsed;
      let avgTimePerChunk = totalTime / (i / chunkSize + 1);

      // estimate remaining time in seconds
      let remainingChunks = (arrayBuffer.byteLength - i) / chunkSize;
      let estRemainingTime = (remainingChunks * avgTimePerChunk) / 1000;

      console.log(
        "Chunk done",
        i,
        arrayBuffer.byteLength,
        ((i / arrayBuffer.byteLength) * 100).toFixed(2) + "%",
        "Estimated time remaining: " + estRemainingTime.toFixed(0) + " seconds"
      );
      setUpdateStatus(
        `${((i / arrayBuffer.byteLength) * 100).toFixed(
          2
        )}% Estimated time remaining: ${estRemainingTime.toFixed(0)} seconds`
      );

      // reset start time for next iteration
      startTime = Date.now();
    }
    console.log("FILE DONE");
    setUpdateStatus(`File upload complete!`);

    await write("fclose", false);
  };

  const downloadFile = async (filePath: string) => {
    await write("fclose", false);
    let sizeResponse = await write(`filesize ${filePath}`, false, true);
    if (!sizeResponse.response) {
      console.error("Error downloading (size) file");
    }
    let size = parseInt(sizeResponse.response?.split("\r\n")[1] || "0");
    await write(`fopen ${filePath}`, false);

    await write(`fseek 0`, false);

    let rem = size;
    let chunk = 62 * 15;

    let dataObject: Uint8Array = new Uint8Array();

    while (rem > 0) {
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
      dataObject = new Uint8Array([...dataObject, ...Array.from(bArr)]);
    }
    downloadFileFromBytes(
      dataObject,
      filePath.substring(filePath.lastIndexOf("/") + 1)
    );
    await write("fclose", false);
  };

  const hexToBytes = (hex: string) => {
    let bytes = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < bytes.length; i++)
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    return bytes;
  };

  const bytesToHex = (bytes: Uint8Array) => {
    return bytes
      .map((byte: any) => byte.toString(16).padStart(2, "0"))
      .join("");
  };

  const downloadFileFromBytes = (
    bytes: Uint8Array | string,
    fileName: string = "output.txt"
  ) => {
    let blob = new Blob([bytes]);
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = fileName; // Filename
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>, path: string) => {
    console.log("HIT!");
    const fileList = event.target.files;
    if (!fileList) return;

    let file = fileList[0];
    let reader = new FileReader();

    reader.onloadend = () => {
      const arrayBuffer = reader.result;
      if (arrayBuffer instanceof ArrayBuffer) {
        let bytes = new Uint8Array(arrayBuffer);
        console.log(path + file.name);
        // uploadFile(path + file.name, bytes);
      }
    };

    reader.onerror = () => {
      console.error("A problem occurred while reading the file.");
    };

    if (file) {
      reader.readAsArrayBuffer(file);
    }
  };

  interface DownloadedFile {
    blob: Blob;
    filename: string;
  }

  const downloadFileFromUrl = async (url: string): Promise<DownloadedFile> => {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const contentDispositionHeader = response.headers.get(
      "Content-Disposition"
    );
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    let matches = contentDispositionHeader?.match(filenameRegex);
    let filename =
      matches && matches[1] ? matches[1].replace(/['"]/g, "") : "unknown.fail";

    const blob = await response.blob();

    return { blob, filename };
  };

  const flashLatestFirmware = async () => {
    const fileBlob = await downloadFileFromUrl(
      "https://hackrf.app/api/fetch_nightly_firmware"
    );

    console.log("Downloading firmware update...", fileBlob.filename);

    await uploadFile(
      `/FIRMWARE/${fileBlob.filename}`,
      new Uint8Array(await fileBlob.blob.arrayBuffer())
    );

    await write(`flash /FIRMWARE/${fileBlob.filename}`, false, true);
    console.log("DONE! firmware complete. Rebooting...");
    alert("Firmware update complete! Please wait for your device to reboot.");
  };

  const handleScroll = (e: React.WheelEvent) => {
    // Disabled for the moment
    // e.preventDefault();
    // if (e.deltaY < 0) {
    //   console.log("Scrolled up");
    //   // Add your scroll up Logic here
    //   write("button 7", false)
    // } else {
    //   console.log("Scrolled down");
    //   // Add your scroll down Logic here
    //   write("button 8", false)
    // }
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
            className="mr-2 cursor-pointer text-blue-500"
            onClick={(e) => {
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

  useEffect(() => {
    console.log(dirStructure);
  }, [dirStructure]);

  // File Component
  const File = ({ file }: { file: FileStructure }) => (
    <div
      className="flex cursor-pointer items-center"
      onClick={() => {
        console.log(file.path + file.name);
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
      <div className="flex h-full w-full flex-col items-center justify-center gap-5 p-5">
        <h1>Connected to HackRF!</h1>
        {!serial.isReading && "Enable console for buttons to enable"}
        <div
          id="ControllerSection"
          className="flex h-full w-full flex-col items-center justify-center gap-5 p-5 outline-none focus:ring-0 md:flex-row md:items-end"
          onWheel={handleScroll}
          tabIndex={0}
          onKeyDown={(e) => {
            handleKeyDown(e);
          }}
        >
          <div
            className="flex flex-col items-center justify-center gap-5"
            id="screenGroup"
          >
            <div className="flex flex-col items-center justify-center">
              <p>Live Screen</p>
              <div className="flex flex-row items-center justify-center gap-5">
                <ToggleSwitch
                  isToggle={autoUpdateFrame}
                  toggleSwitch={() => {
                    if (!autoUpdateFrame) write("screenframeshort", false);
                    setAutoUpdateFrame(!autoUpdateFrame);
                  }}
                />
                <HotkeyButton
                  label="🔄"
                  disabled={loadingFrame}
                  onClickFunction={() => {
                    if (!loadingFrame) {
                      setLoadingFrame(true);
                      write("screenframeshort", false);
                    }
                  }}
                  className="h-6 w-6 bg-blue-500"
                  shortcutKeys={"mod+R"}
                />
              </div>
            </div>
            <canvas
              ref={canvasRef}
              width={241}
              height={321}
              className={`${
                !loadingFrame && "cursor-pointer"
              } shadow-glow shadow-neutral-500 outline-none focus:ring-0`}
              onMouseDown={(
                event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
              ) => {
                if (!canvasRef.current) return;
                const bounds = canvasRef.current.getBoundingClientRect();
                const x = event.clientX - bounds.left;
                const y = event.clientY - bounds.top;

                write(`touch ${x} ${y}`, autoUpdateFrame);
              }}
            />
          </div>

          <div
            className="flex flex-col items-center justify-center gap-5"
            id="controlGroup"
          >
            <div className="flex flex-col items-center justify-center">
              <div className="grid grid-flow-col grid-rows-3 gap-4">
                <div></div>
                <HotkeyButton
                  label="Left"
                  disabled={loadingFrame}
                  onClickFunction={() => write("button 2", autoUpdateFrame)}
                  className="h-16 w-16 bg-green-500"
                  shortcutKeys={"ArrowLeft"}
                />
                <button
                  disabled={loadingFrame}
                  onClick={() => write("button 7", autoUpdateFrame)}
                  className="h-12 w-12 self-end justify-self-start rounded bg-blue-400 text-white disabled:opacity-50"
                >
                  ↪️
                </button>
                <HotkeyButton
                  label="Up"
                  disabled={loadingFrame}
                  onClickFunction={() => write("button 4", autoUpdateFrame)}
                  className="h-16 w-16 bg-green-500"
                  shortcutKeys={"ArrowUp"}
                />
                <HotkeyButton
                  label="Ok"
                  disabled={loadingFrame}
                  onClickFunction={() => write("button 5", autoUpdateFrame)}
                  className="h-16 w-16 bg-blue-500"
                  shortcutKeys={"Enter"}
                />
                <HotkeyButton
                  label="Down"
                  disabled={loadingFrame}
                  onClickFunction={() => write("button 3", autoUpdateFrame)}
                  className="h-16 w-16 bg-green-500"
                  shortcutKeys={"ArrowDown"}
                />
                <div></div>
                <HotkeyButton
                  label="Right"
                  disabled={loadingFrame}
                  onClickFunction={() => write("button 1", autoUpdateFrame)}
                  className="h-16 w-16 bg-green-500"
                  shortcutKeys={"ArrowRight"}
                />
                <button
                  disabled={loadingFrame}
                  onClick={() => write("button 8", autoUpdateFrame)}
                  className="h-12 w-12 self-end justify-self-end rounded bg-blue-400 text-white disabled:opacity-50"
                >
                  ↩️
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <HotkeyButton
                label="DFU"
                disabled={loadingFrame}
                onClickFunction={() => write("button 6", autoUpdateFrame)}
                className="h-16 w-16 bg-slate-400"
                shortcutKeys={"mod+D"}
              />
              <button
                disabled={loadingFrame}
                onClick={() => write("reboot", autoUpdateFrame)}
                className="h-16 w-16 rounded bg-slate-400 text-white disabled:opacity-50"
              >
                Reboot
              </button>
            </div>
          </div>
        </div>

        {!serial.isReading ? (
          <button
            className="rounded bg-orange-300 p-2 text-white disabled:opacity-50"
            onClick={() => serial.startReading()}
          >
            Start reading console
          </button>
        ) : (
          <div className="mt-10 flex w-[80%] flex-row items-center justify-center gap-5">
            <div className="flex h-full flex-col gap-1 self-start">
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
                  console.log("HIT THE TIHGN");
                  onFileChange(e, selectedUploadFolder);
                }}
              />
              {/* <button
                // onClick={() => downloadFile("PLAYLIST.TXT")}
                onClick={() => flashLatestFirmware()}
                className="self-end justify-self-end rounded bg-blue-400 text-white disabled:opacity-50"
              >
                Update Firmware to latest nightly
              </button>
              <textarea
                className="h-full w-full rounded bg-gray-200 p-2 text-black"
                readOnly
                value={updateStatus}
              /> */}
              <div className="flex max-h-96 flex-col overflow-y-auto">
                {dirStructure &&
                  dirStructure.map((file, index) => (
                    <ListItem key={index} item={file} indent={0} />
                  ))}
              </div>
            </div>
            <div className="flex w-full flex-col items-center justify-center gap-1">
              <div className="flex w-full flex-row items-center justify-center gap-1">
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendCommand();
                    }
                  }}
                  className="w-full rounded-md border-2 border-blue-500 p-2 text-black"
                />
                <button
                  type="submit"
                  className="rounded-md bg-blue-500 p-2 text-white"
                  onClick={() => {
                    sendCommand();
                  }}
                >
                  Send
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-red-500 p-2 text-white"
                  onClick={() => {
                    setConsoleMessageList("");
                  }}
                >
                  Clear
                </button>
              </div>
              <textarea
                className="h-[350px] w-full rounded bg-gray-200 p-2 text-black"
                readOnly
                value={consoleMessageList}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Controller;
7;
