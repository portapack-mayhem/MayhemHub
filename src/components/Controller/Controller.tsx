"use client";

import { faRotate, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { Console } from "@/components/Console/Console";
import { DeviceControls } from "@/components/DeviceControls/DeviceControls";
import { FileStructure } from "@/components/FileBrowser/FileBrowser";
import { FileInputs } from "@/components/FileInputs/FileInputs";
import { FirmwareManager } from "@/components/FirmwareManager/FirmwareManager";
import HotkeyButton from "@/components/HotkeyButton/HotkeyButton";
import { Loader } from "@/components/Loader/Loader";
import Modal from "@/components/Modal/Modal";
import { Screen } from "@/components/Screen/Screen";
import { useSerial } from "@/components/SerialLoader/SerialLoader";
import ToggleSwitch from "@/components/ToggleSwitch/ToggleSwitch";
import { useDeviceSetup } from "@/hooks/useDeviceSetup";
import { useScreenFrame } from "@/hooks/useScreenFrame";
import { ILatestVersions } from "@/types";
import { downloadFileFromUrl, useWriteCommand } from "@/utils/serialUtils";
import {
  getVersionType,
  nightlyVersionFormat,
  stableVersionFormat,
} from "@/utils/versionUtils";

const Controller = () => {
  const [consoleMessageList, setConsoleMessageList] = useState<string>("");
  const [updateStatus, setUpdateStatus] = useState<string>("");
  const [command, setCommand] = useState<string>("");
  const [selectedUploadFolder, setSelectedUploadFolder] = useState<string>("/");
  const [scriptStatus, setScriptStatus] = useState<string>(
    "Type single command above or pick a script"
  );
  const [autoUpdateFrame, setAutoUpdateFrame] = useState<boolean>(true);
  const [firmwarModalOpen, setFirmwarModalOpen] = useState<boolean>(false);
  const [scriptRunning, setScriptRunning] = useState<boolean>(false);
  const [dirStructure, setDirStructure] = useState<FileStructure[]>();
  const [latestVersion, setLatestVersion] = useState<ILatestVersions>();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const firmwareFileInputRef = useRef<HTMLInputElement>(null);
  const scriptFileInputRef = useRef<HTMLInputElement>(null);

  const { serial, consoleMessage } = useSerial();
  const { write, uploadFile, disableTransmitAction, setLoadingFrame } =
    useWriteCommand();
  const { setupComplete, deviceVersion } = useDeviceSetup({
    serial,
    write,
    setConsoleMessageList,
    setDirStructure,
    setLatestVersion,
  });
  const { canvasRef, renderFrame } = useScreenFrame();

  const sendCommand = async () => {
    await write(command, false);
    setCommand("");
  };

  useEffect(() => {
    // We dont add this to the console as its not needed. This may change in the future
    if (consoleMessage.startsWith("screenframe")) {
      renderFrame(consoleMessage);
      setLoadingFrame(false);
    } else {
      setConsoleMessageList(
        (prevConsoleMessageList) => prevConsoleMessageList + consoleMessage
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consoleMessage]);

  useEffect(() => {
    let serial_console = document.getElementById(
      "serial_console"
    ) as HTMLElement;

    if (!!serial_console) {
      serial_console.scrollTop = serial_console.scrollHeight;
    }
  }, [consoleMessageList]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      (e.key.length === 1 && /[a-zA-Z0-9 \\.]/.test(e.key)) ||
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
      await write(`mkdir /FIRMWARE`, false, true);
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

    await write(`mkdir /FIRMWARE`, false, true);
    await uploadFile(
      `/FIRMWARE/${fileBlob.filename}`,
      new Uint8Array(await fileBlob.blob.arrayBuffer()),
      setUpdateStatus
    );

    await write(`mkdir /APPS`, false, true); // not necessary after #2155 in main repo. (but not harmful)
    await write(`flash /FIRMWARE/${fileBlob.filename}`, false, true);
    console.log("DONE! firmware complete. Rebooting...");
    alert("Firmware update complete! Please wait for your device to reboot.");
  };

  const flashLatestStableFirmware = async () => {
    const fileBlob = await downloadFileFromUrl(
      "https://hackrf.app/api/fetch_stable_firmware"
    );

    console.log("Downloading firmware update...", fileBlob.filename);

    await write(`mkdir /FIRMWARE`, false, true);
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

  const onScriptFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;

    let file = fileList[0];
    setScriptStatus(`Picked script: ${file.name}`);

    let reader = new FileReader();

    reader.onloadend = async () => {
      setScriptRunning(true);
      const content = reader.result;
      if (typeof content === "string") {
        const lines = content.split(/\r?\n/); // split lines

        for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // the await for write func seems is still too fast. TODO
          const line = lines[lineNumber];
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith("--") || trimmedLine === "") {
            continue;
          }
          const writeMatch = trimmedLine.match(/^write\((.*)\);?$/); // match write command
          if (writeMatch) {
            const argsString = writeMatch[1];
            const argsRegex =
              /["'](.+?)["']\s*,\s*(true|false)\s*,\s*(true|false)/;
            /* ^match str surronded by' and "
                               ^ match bool        ^ match bool   */
            const argsMatch = argsString.match(argsRegex);
            if (argsMatch) {
              const command = argsMatch[1];
              const updateFrame = argsMatch[2] === "true"; //cast to bool
              const awaitResponse = argsMatch[3] === "true"; // cast to bool

              setScriptStatus(`sending: ${command}`);
              await write(command, updateFrame, awaitResponse);
            } else {
              setScriptStatus(`script syntax invalid: line ${lineNumber + 1}`);
              break;
            }
          } else {
            setScriptStatus(`script syntax invalid: line ${lineNumber + 1}`);
            break;
          }
        }
        setScriptStatus("script execution completed");
      } else {
        setScriptStatus("failed to read script file");
      }
      setScriptRunning(false);
    };

    reader.onerror = () => {
      setScriptStatus("error reading script file");
      setScriptRunning(false);
    };

    if (file) {
      reader.readAsText(file);
    }
  };

  return (
    <>
      {setupComplete ? (
        <div className="flex h-full w-full flex-col items-center justify-center">
          <h1 className="m-6 p-2">
            HackRF Connected
            <FontAwesomeIcon
              className="pl-2 text-green-500"
              icon={faCheckCircle}
            />
          </h1>
          {!serial.isReading &&
            "Please enable the console, so the buttons can also be enabled!"}
          <div
            id="ControllerSection"
            className="flex h-full max-w-[80%] flex-col items-center justify-center gap-24 rounded-lg bg-slate-800 p-10 outline-none focus:ring-0 md:flex-row md:items-start"
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
              <Screen
                canvasRef={canvasRef}
                disableTransmitAction={disableTransmitAction}
                autoUpdateFrame={autoUpdateFrame}
                write={write}
              />

              <div className="flex flex-col items-center justify-center rounded-md bg-gray-700 p-3">
                <p className="pb-4">Live Screen</p>
                <div className="flex flex-row items-center justify-center gap-5">
                  <ToggleSwitch
                    isToggle={autoUpdateFrame}
                    toggleSwitch={() => {
                      if (!autoUpdateFrame) write("screenframeshort", false);
                      setAutoUpdateFrame(!autoUpdateFrame);
                    }}
                  />
                  <HotkeyButton
                    label={<FontAwesomeIcon icon={faRotate} />}
                    disabled={disableTransmitAction}
                    onClickFunction={() => {
                      if (!disableTransmitAction) {
                        setLoadingFrame(true);
                        write("screenframeshort", false);
                      }
                    }}
                    className={"h-6 w-6 rounded-sm bg-green-500"}
                    shortcutKeys={"mod+R"}
                  />
                </div>
              </div>
            </div>

            <DeviceControls
              disableTransmitAction={disableTransmitAction}
              write={write}
              autoUpdateFrame={autoUpdateFrame}
            />
          </div>

          {!serial.isReading ? (
            <button
              className="rounded bg-orange-300 p-2 text-white disabled:opacity-50"
              onClick={() => serial.startReading()}
            >
              Start Reading Console
            </button>
          ) : (
            <>
              <div className="mt-10 flex h-[434px] w-[80%] flex-row items-start justify-center gap-5 rounded-md bg-gray-700 p-5">
                <FileInputs
                  fileInputRef={fileInputRef}
                  firmwareFileInputRef={firmwareFileInputRef}
                  scriptFileInputRef={scriptFileInputRef}
                  selectedUploadFolder={selectedUploadFolder}
                  dirStructure={dirStructure}
                  setDirStructure={setDirStructure}
                  setSelectedUploadFolder={setSelectedUploadFolder}
                  onFileChange={onFileChange}
                  onFirmwareFileChange={onFirmwareFileChange}
                  onScriptFileChange={onScriptFileChange}
                />
                <Console
                  consoleMessageList={consoleMessageList}
                  command={command}
                  setCommand={setCommand}
                  setConsoleMessageList={setConsoleMessageList}
                  sendCommand={sendCommand}
                  scriptStatus={scriptStatus}
                  scriptRunning={scriptRunning}
                  scriptFileInputRef={scriptFileInputRef}
                />
              </div>
              <div className="m-5 flex w-[20%] flex-col items-center justify-center rounded-md bg-gray-700 p-5">
                <p className="pb-5 text-center text-sm">
                  Firmware Version: {deviceVersion}
                </p>
                <button
                  onClick={() => setFirmwarModalOpen(true)}
                  className="btn btn-info"
                >
                  Manage Firmware
                </button>
              </div>
            </>
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
        {(nightlyVersionFormat(deviceVersion) < 240114 &&
          getVersionType(deviceVersion) == "nightly") ||
        (stableVersionFormat(deviceVersion) < 200 &&
          getVersionType(deviceVersion) == "stable") ||
        deviceVersion === "" ? (
          <p>
            Sorry, your firmware version is too old to support this feature.
            Please manually update to the latest stable or nightly build!
          </p>
        ) : (
          <FirmwareManager
            deviceVersion={deviceVersion}
            latestVersion={latestVersion}
            disableTransmitAction={disableTransmitAction}
            firmwareFileInputRef={firmwareFileInputRef}
            updateStatus={updateStatus}
            setSelectedUploadFolder={setSelectedUploadFolder}
            flashLatestStableFirmware={flashLatestStableFirmware}
            flashLatestNightlyFirmware={flashLatestNightlyFirmware}
          />
        )}
      </Modal>
    </>
  );
};

export default Controller;
