"use client";

import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { parseDirectories } from "@/app/utils/fileUtils";
import {
  UploadFile,
  Write,
  downloadFileFromUrl,
} from "@/app/utils/serialUtils";
import { DeviceButtons } from "../DeviceButtons/DeviceButtons";
import { FileBrowser, FileStructure } from "../FileBrowser/FileBrowser";
import HotkeyButton from "../HotkeyButton/HotkeyButton";
import { useSerial } from "../SerialLoader/SerialLoader";
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

  const sendCommand = async () => {
    await Write(command, false);
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
        await Write(setDeviceTime(), false);

        await fetchFolderStructure();

        await Write("screenframeshort", false);
      };

      const fetchFolderStructure = async () => {
        const rootStructure = await Write(`ls /`, false, true); // get the children directories

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
      Write(`keyboard ${keyHex}`, autoUpdateFrame);
    }
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
        UploadFile(path + file.name, bytes, setUpdateStatus); // ToDo: This should possibly be some sort of callback
      }
    };

    reader.onerror = () => {
      console.error("A problem occurred while reading the file.");
    };

    if (file) {
      reader.readAsArrayBuffer(file);
    }
  };

  const flashLatestFirmware = async () => {
    const fileBlob = await downloadFileFromUrl(
      "https://hackrf.app/api/fetch_nightly_firmware"
    );

    console.log("Downloading firmware update...", fileBlob.filename);

    await UploadFile(
      `/FIRMWARE/${fileBlob.filename}`,
      new Uint8Array(await fileBlob.blob.arrayBuffer()),
      setUpdateStatus
    );

    await Write(`flash /FIRMWARE/${fileBlob.filename}`, false, true);
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

  useEffect(() => {
    console.log(dirStructure);
  }, [dirStructure]);

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
                    if (!autoUpdateFrame) Write("screenframeshort", false);
                    setAutoUpdateFrame(!autoUpdateFrame);
                  }}
                />
                <HotkeyButton
                  label="🔄"
                  disabled={loadingFrame}
                  onClickFunction={() => {
                    if (!loadingFrame) {
                      setLoadingFrame(true);
                      Write("screenframeshort", false);
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

                Write(`touch ${x} ${y}`, autoUpdateFrame);
              }}
            />
          </div>

          <DeviceButtons
            loadingFrame={loadingFrame}
            autoUpdateFrame={autoUpdateFrame}
          />
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
                <FileBrowser
                  fileInputRef={fileInputRef}
                  setSelectedUploadFolder={setSelectedUploadFolder}
                />
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
