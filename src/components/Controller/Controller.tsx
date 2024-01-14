"use client";

import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { LatestVersions } from "@/app/models";
import { parseDirectories } from "@/utils/fileUtils";
import { downloadFileFromUrl, useWriteCommand } from "@/utils/serialUtils";
import {
  getVersionLink,
  getVersionType,
  nightlyVersionFormat,
} from "@/utils/versionUtils";
import { DeviceButtons } from "../DeviceButtons/DeviceButtons";
import { FileBrowser, FileStructure } from "../FileBrowser/FileBrowser";
import HotkeyButton from "../HotkeyButton/HotkeyButton";
import { Loader } from "../Loader/Loader";
import Modal from "../Modal/Modal";
import { useSerial } from "../SerialLoader/SerialLoader";
import ToggleSwitch from "../ToggleSwitch/ToggleSwitch";

const Controller = () => {
  const { serial, consoleMessage } = useSerial();
  const { write, uploadFile, disableTransmitAction, setLoadingFrame } =
    useWriteCommand();

  const [consoleMessageList, setConsoleMessageList] = useState<string>("");
  const [updateStatus, setUpdateStatus] = useState<string>("");
  const [selectedUploadFolder, setSelectedUploadFolder] = useState<string>("/");
  const [command, setCommand] = useState<string>("");
  const [deviceVersion, setDeviceVersion] = useState<string>("");
  const [autoUpdateFrame, setAutoUpdateFrame] = useState<boolean>(true);
  const [firmwarModalOpen, setFirmwarModalOpen] = useState<boolean>(false);
  const [setupComplete, setSetupComplete] = useState<boolean>(false);
  const [dirStructure, setDirStructure] = useState<FileStructure[]>();
  const [latestVersion, setLatestVersion] = useState<LatestVersions>();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firmwareFileInputRef = useRef<HTMLInputElement>(null);

  const started = useRef<boolean>(false);

  const sendCommand = async () => {
    await write(command, false);
    setCommand("");
  };

  useEffect(() => {
    // We dont add this to the console as its not needed. This may change in the future
    if (consoleMessage.startsWith("screenframe")) {
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

        const infoCmd = (await write("info", false, true)).response;
        const matches = infoCmd?.match(/Mayhem Version:\s*(.*)/i);

        if (matches && matches.length > 1) {
          const mayhemVersion = matches[1];
          setDeviceVersion(mayhemVersion);
        } else {
          console.log("Mayhem Version not found");
        }

        await fetchFolderStructure();

        write("screenframeshort", false);

        setConsoleMessageList("");
        setSetupComplete(true);

        setLatestVersion(await getLatestVersions());
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

  const getLatestVersions = async () => {
    const apiResponse = await fetch("https://hackrf.app/api/get_versions");

    if (!apiResponse.ok) {
      console.error("Network response was not ok");
    }

    return await apiResponse.json<LatestVersions>();
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

  const onFileChange = (event: ChangeEvent<HTMLInputElement>, path: string) => {
    const fileList = event.target.files;
    if (!fileList) return;

    let file = fileList[0];
    let reader = new FileReader();

    reader.onloadend = async () => {
      const arrayBuffer = reader.result;
      if (arrayBuffer instanceof ArrayBuffer) {
        let bytes = new Uint8Array(arrayBuffer);
        await uploadFile(path + file.name, bytes, setUpdateStatus); // ToDo: This should possibly be some sort of callback
      }
    };

    reader.onerror = () => {
      console.error("A problem occurred while reading the file.");
    };

    if (file) {
      reader.readAsArrayBuffer(file);
    }
  };

  const onFirmwareFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    path: string
  ) => {
    const fileList = event.target.files;
    if (!fileList) return;

    let file = fileList[0];
    let reader = new FileReader();

    reader.onloadend = async () => {
      const arrayBuffer = reader.result;
      if (arrayBuffer instanceof ArrayBuffer) {
        let bytes = new Uint8Array(arrayBuffer);
        await uploadFile(path + file.name, bytes, setUpdateStatus); // ToDo: This should possibly be some sort of callback
        await write(`flash ${path + file.name}`, false, true);
        console.log("DONE! firmware complete. Rebooting...");
        alert(
          "Firmware update complete! Please wait for your device to reboot."
        );
      }
    };

    reader.onerror = () => {
      console.error("A problem occurred while reading the file.");
    };

    if (file) {
      reader.readAsArrayBuffer(file);
    }
  };

  const flashLatestNightlyFirmware = async () => {
    const fileBlob = await downloadFileFromUrl(
      "https://hackrf.app/api/fetch_nightly_firmware"
    );

    console.log("Downloading firmware update...", fileBlob.filename);

    await uploadFile(
      `/FIRMWARE/${fileBlob.filename}`,
      new Uint8Array(await fileBlob.blob.arrayBuffer()),
      setUpdateStatus
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

  return (
    <>
      {setupComplete ? (
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
                    disabled={disableTransmitAction}
                    onClickFunction={() => {
                      if (!disableTransmitAction) {
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
                  !disableTransmitAction && "cursor-pointer"
                } shadow-glow shadow-neutral-500 outline-none focus:ring-0`}
                onMouseDown={(
                  event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
                ) => {
                  if (!canvasRef.current || disableTransmitAction) return;
                  const bounds = canvasRef.current.getBoundingClientRect();
                  const x = event.clientX - bounds.left;
                  const y = event.clientY - bounds.top;

                  write(`touch ${x} ${y}`, autoUpdateFrame);
                }}
              />
            </div>

            <DeviceButtons autoUpdateFrame={autoUpdateFrame} />
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
                <div className="flex max-h-96 flex-col overflow-y-auto">
                  <FileBrowser
                    fileInputRef={fileInputRef}
                    setSelectedUploadFolder={setSelectedUploadFolder}
                    dirStructure={dirStructure}
                    setDirStructure={setDirStructure}
                  />
                </div>
              </div>
              <div className="flex h-full flex-col gap-1 self-start">
                <p>Version: {deviceVersion}</p>
                <button
                  onClick={() => setFirmwarModalOpen(true)}
                  className="self-end justify-self-end rounded bg-blue-400 text-white disabled:opacity-50"
                >
                  Manage Firmware
                </button>
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
      ) : (
        <Loader />
      )}
      <Modal
        title="Firmware Update"
        isModalOpen={firmwarModalOpen}
        closeModal={() => setFirmwarModalOpen(false)}
        className="w-[40%]"
      >
        {nightlyVersionFormat(deviceVersion) < 240114 &&
        getVersionType(deviceVersion) == "nightly" ? (
          <p>
            sorry your version is too old. Please manually update to the latest
            nightly
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p>
              Current installed version:{" "}
              <a
                className="text-blue-300 underline transition-colors duration-200 hover:text-blue-400"
                href={getVersionLink(deviceVersion)}
                target="_blank"
              >
                {deviceVersion} - {getVersionType(deviceVersion)}
              </a>
            </p>
            <div className="flex flex-col gap-1">
              <p>
                Latest Stable:{" "}
                <a
                  className="text-blue-300 underline transition-colors duration-200 hover:text-blue-400"
                  href={getVersionLink(latestVersion?.stable.version)}
                  target="_blank"
                >
                  {latestVersion?.stable.version}
                </a>
              </p>
              <p>
                Latest Nightly:{" "}
                <a
                  className="text-blue-300 underline transition-colors duration-200 hover:text-blue-400"
                  href={getVersionLink(latestVersion?.nightly.version)}
                  target="_blank"
                >
                  {latestVersion?.nightly.version}
                </a>
              </p>
            </div>

            <p>Select from the available options</p>
            <button
              disabled={disableTransmitAction}
              onClick={() => flashLatestNightlyFirmware()}
              className="rounded bg-blue-400 p-2 text-white disabled:opacity-50"
            >
              Update to latest nightly release
            </button>
            <button
              disabled={disableTransmitAction}
              onClick={() => {
                setSelectedUploadFolder("/FIRMWARE");
                firmwareFileInputRef.current?.click();
              }}
              className="rounded bg-blue-400 p-2 text-white disabled:opacity-50"
            >
              Flash custom firmware
            </button>
            <button
              onClick={() => flashLatestNightlyFirmware()}
              // disabled={disableTransmitAction}
              disabled={true} // This is disabled as there is no stable firmware that will work with the current version of the webapp
              className="rounded bg-blue-400 p-2 text-white disabled:opacity-50"
            >
              Update to latest stable release
            </button>
            <p>{updateStatus}</p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default Controller;
