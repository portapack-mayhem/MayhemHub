"use client";

// ToDo: Auto connect when its connected (But have a select toggle to be able to turn this off)
// Can identify the vendor and product IDs by plugging in the device and visiting: chrome://device-log/
// the IDs will be labeled `vid` and `pid`, respectively

import {
  faRotate,
  faCheckCircle,
  faClipboard,
  faGear,
} from "@fortawesome/free-solid-svg-icons";
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
import { useUIConfig } from "@/hooks/useUIConfig";
import { ILatestVersions } from "@/types";
import { downloadFileFromUrl, useWriteCommand } from "@/utils/serialUtils";
import {
  getVersionType,
  nightlyVersionFormat,
  stableVersionFormat,
} from "@/utils/versionUtils";
import UIConfigurationModal from "../UIConfigurationModal/UIConfigurationModal";

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
  
  // Upload progress state for file manager
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [currentUploadFileName, setCurrentUploadFileName] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const firmwareFileInputRef = useRef<HTMLInputElement>(null);
  const scriptFileInputRef = useRef<HTMLInputElement>(null);

  const [UIConfigurationOpen, setUIConfigurationOpen] =
    useState<boolean>(false);

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
  const { canvasRef, renderFrame, screenDimensions, needsRefresh, setNeedsRefresh } = useScreenFrame();
  const { UIConfig, setUiConfig, handleUpdateUiHide } = useUIConfig();

  const sendCommand = async () => {
    await write(command, false);
    setCommand("");
  };

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
    setCurrentUploadFileName(file.name);
    setIsUploading(true);
    // Don't set initial status - let uploadFile handle all status updates
    
    let reader = new FileReader();
  
    reader.onloadend = async () => {
      const arrayBuffer = reader.result;
      if (arrayBuffer instanceof ArrayBuffer) {
        let bytes = new Uint8Array(arrayBuffer);
        
        // uploadFile will handle all status updates through setUploadStatus
        await uploadFile(path + file.name, bytes, setUploadStatus);
        
        // Wait a bit after upload completes before closing modal
        setTimeout(() => {
          setIsUploading(false);
          setUploadStatus("");
          setCurrentUploadFileName("");
        }, 5000);
      }
    };
  
    reader.onerror = () => {
      console.error("A problem occurred while reading the file.");
      setUploadStatus("❌ Error: Failed to read file");
      setTimeout(() => {
        setIsUploading(false);
        setUploadStatus("");
        setCurrentUploadFileName("");
      }, 3000);
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
        await uploadFile(path + file.name, bytes, setUpdateStatus);
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

    // not necessary after #2155 in main repo. (but not harmful)
    await write(`mkdir /APPS`, false, true);
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
        const lines = content.split(/\r?\n/);

        for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
          // the await for write func seems is still too fast. TODO
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const line = lines[lineNumber];
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith("--") || trimmedLine === "") {
            continue;
          }
          const writeMatch = trimmedLine.match(/^write\((.*)\);?$/);
          if (writeMatch) {
            const argsString = writeMatch[1];
            const argsRegex =
              /["'](.+?)["']\s*,\s*(true|false)\s*,\s*(true|false)/;
            /* ^match str surronded by' and "
                               ^ match bool        ^ match bool   */
            const argsMatch = argsString.match(argsRegex);
            if (argsMatch) {
              const command = argsMatch[1];
              const updateFrame = argsMatch[2] === "true";
              const awaitResponse = argsMatch[3] === "true";

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
  
  const copyScreenToClipboard = async () => {
    const screenGroup = document.getElementById("screenGroup");
    const screenCanvas = screenGroup?.querySelector("canvas");

    if (!screenCanvas) {
      alert("No screen is available to copy.");
      return;
    }

    try {
      if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
        throw new Error("Clipboard image copy not supported");
      }

      const screenBlob = await new Promise<Blob | null>((resolve) => {
        screenCanvas.toBlob(resolve, "image/png");
      });

      if (!screenBlob) {
        throw new Error("Failed to create screen image");
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          [screenBlob.type]: screenBlob,
        }),
      ]);

      alert("Screen copied to clipboard");
    } catch (error) {
      console.error("Failed to copy screen to clipboard", error);
      alert("Failed to copy screen to clipboard");
    }
  };

  const toggleLiveScreen = (shouldUpdate: boolean) => {
    if (!shouldUpdate) write("screenframeshort", false);
    setAutoUpdateFrame(!shouldUpdate);
  };

  useEffect(() => {
    if (needsRefresh && !disableTransmitAction) {
      console.log("Executing refresh");
      write("screenframeshort", false);
      setNeedsRefresh(false);
    }
  }, [needsRefresh]);

  useEffect(() => {
    // We dont add this to the console as its not needed. This may change in the future
    if (consoleMessage.startsWith("screenframe")) {
      if (!UIConfig.screenHide) renderFrame(consoleMessage);
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

  return (
    <>
      {setupComplete ? (
        <div className="flex size-full flex-col items-center justify-center">
          <h1 className="m-6 p-2">
            HackRF Connected
            <FontAwesomeIcon
              className="pl-2 text-green-500"
              icon={faCheckCircle}
            />
          </h1>
          {!serial.isReading &&
            "Please enable the console, so the buttons can also be enabled!"}
          {(!UIConfig.screenHide || !UIConfig.controlButtonsHide) && (
            <div
              id="ControllerSection"
              className="bg-component flex h-full max-w-[80%] flex-col items-center justify-center gap-24 rounded-lg p-10 outline-none focus:ring-0 md:flex-row md:items-start"
              onWheel={handleScroll}
              tabIndex={0}
              onKeyDown={(e) => {
                handleKeyDown(e);
              }}
            >
              {!UIConfig.screenHide && (
                <div
                  className="flex flex-col items-center justify-center gap-5"
                  id="screenGroup"
                >
                  <Screen
                    canvasRef={canvasRef}
                    disableTransmitAction={disableTransmitAction}
                    autoUpdateFrame={autoUpdateFrame}
                    write={write}
                    screenDimensions={screenDimensions}
                  />

                  <div className="flex flex-col items-center justify-center rounded-md bg-opacity-20 bg-slate-600 p-3 backdrop-blur-sm">
                    <p className="pb-4 text-white font-medium drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]">
                      Live Screen
                    </p>
                    <div className="flex flex-row items-center justify-center gap-5">
                      <ToggleSwitch
                        isToggle={autoUpdateFrame}
                        toggleSwitch={() => {
                          toggleLiveScreen(autoUpdateFrame);
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
                        className={
                          "size-6 min-w-6 rounded-sm bg-slate-700 hover:bg-slate-600 text-white p-1 transition-colors duration-150 hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.4)] flex items-center justify-center"
                        }
                        shortcutKeys={"mod+R"}
                      />
                      <HotkeyButton
                        label={<FontAwesomeIcon icon={faClipboard} />}
                        disabled={disableTransmitAction}
                        onClickFunction={copyScreenToClipboard}
                        className={
                          "size-6 min-w-6 rounded-sm bg-slate-700 hover:bg-slate-600 text-white p-1 transition-colors duration-150 hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.4)] flex items-center justify-center"
                        }
                        shortcutKeys={""}
                      />
                    </div>
                  </div>
                </div>
              )}

              {!UIConfig.controlButtonsHide && (
                <DeviceControls
                  disableTransmitAction={disableTransmitAction}
                  write={write}
                  autoUpdateFrame={autoUpdateFrame}
                />
              )}
            </div>
          )}

          {!serial.isReading ? (
            <button
              className="rounded bg-component p-2 text-white disabled:opacity-50"
              onClick={() => serial.startReading()}
            >
              Start Reading Console
            </button>
          ) : (
            <>
              {(!UIConfig.fileSystemHide || !UIConfig.serialConsoleHide) && (
                <div className="mt-10 flex h-[434px] w-4/5 flex-row items-start justify-center gap-5 rounded-md bg-component p-5">
                  {!UIConfig.fileSystemHide && (
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
                  )}
                  {!UIConfig.serialConsoleHide && (
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
                  )}
                </div>
              )}
              {!UIConfig.firmwareManagerHide && (
                <div className="m-5 flex w-[20%] flex-col items-center justify-center rounded-md bg-component p-5">
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
              )}
              <div className="mt-3 flex w-4/5 justify-end">
                <button
                  onClick={() => setUIConfigurationOpen(true)}
                  className="btn btn-primary btn-sm size-10"
                >
                  <FontAwesomeIcon icon={faGear} />
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
        className="w-2/5"
      >
        {deviceVersion === "" ||
        (getVersionType(deviceVersion) === "nightly" &&
          nightlyVersionFormat(deviceVersion) < 240114 &&
          stableVersionFormat(deviceVersion) !== 2) ||
        (getVersionType(deviceVersion) === "stable" &&
          stableVersionFormat(deviceVersion) < 200 &&
          stableVersionFormat(deviceVersion) !== 2) ? ( // This check is for the shipping firmware version
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
      <UIConfigurationModal
        isOpen={UIConfigurationOpen}
        onClose={() => setUIConfigurationOpen(false)}
        UIConfig={UIConfig}
        setUiConfig={setUiConfig}
        handleUpdateUiHide={handleUpdateUiHide}
        toggleLiveScreen={toggleLiveScreen}
      />
      {/* Upload Progress Modal for File Manager */}
      <Modal
        title={`Uploading: ${currentUploadFileName}`}
        isModalOpen={isUploading}
        closeModal={() => {
          // Allow closing when upload is complete
          if (!uploadStatus.includes("Complete!")) return;
          setIsUploading(false);
          setUploadStatus("");
        }}
        className="w-96"
      >
        <div className="space-y-2">
          {uploadStatus.includes("Progress") && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-blue-400 h-2.5 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${uploadStatus.split('Progress: ')[1]?.split('%')[0] || 0}%` 
                }}
              />
            </div>
          )}
          <p className="whitespace-pre-wrap text-sm">{uploadStatus}</p>
        </div>
      </Modal>
    </>
  );
};

export default Controller;

