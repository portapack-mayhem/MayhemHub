import { faGear } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRef, useState, useEffect, ChangeEvent } from "react";
import Console from "@/components/Console/Console";
import { Loader } from "@/components/Loader/Loader";
import Modal from "@/components/Modal/Modal";
import { useSerial } from "@/components/SerialLoader/SerialLoader";
import ToggleSwitch from "@/components/ToggleSwitch/ToggleSwitch";
import { useConsole } from "@/features/console/hooks/useConsole";
import { useScriptRunner } from "@/features/console/hooks/useScriptRunner";
import DeviceControls from "@/features/device/components/DeviceControls";
import { useDeviceCommands } from "@/features/device/hooks/useDeviceCommands";
import { useDeviceSetup } from "@/features/device/hooks/useDeviceSetup";
import FileInputs from "@/features/fileSystem/components/FileInputs";
import { useFileOperations } from "@/features/fileSystem/hooks/useFileOperations";
import { useFileUpload } from "@/features/fileSystem/hooks/useFileUpload";
import { createFileService } from "@/features/fileSystem/services/fileService";
import FirmwareManager from "@/features/firmware/components/FirmwareManager";
import { useFirmwareUpdate } from "@/features/firmware/hooks/useFirmwareUpdate";
import DeviceScreen from "@/features/screen/components/DeviceScreen";
import { useScreenFrame } from "@/features/screen/hooks/useScreenFrame";
import UIConfigurationModal from "@/features/ui/components/UIConfigurationModal";
import { useUIConfig } from "@/hooks/useUIConfig";
import { IFileStructure } from "@/types";
import { parseDirectories } from "@/utils/parsers";
import { isVersionOutdated } from "@/utils/versionUtils";

const Controller = () => {
  const [autoUpdateFrame, setAutoUpdateFrame] = useState(true);
  const [firmwareModalOpen, setFirmwareModalOpen] = useState(false);
  const [UIConfigurationOpen, setUIConfigurationOpen] = useState(false);
  const [loadingFrame, setLoadingFrame] = useState(true);
  const [fileUploadBlocker, setFileUploadBlocker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const firmwareFileInputRef = useRef<HTMLInputElement>(null);
  const scriptFileInputRef = useRef<HTMLInputElement>(null);

  const { serial, consoleMessage } = useSerial();
  const { UIConfig, setUiConfig, handleUpdateUiHide } = useUIConfig();
  const {
    canvasRef,
    renderFrame,
    screenDimensions,
    needsRefresh,
    setNeedsRefresh,
  } = useScreenFrame();

  const {
    sendCommand,
    sendButton,
    sendTouch,
    sendKeyboard,
    requestScreenFrame,
  } = useDeviceCommands(serial, setLoadingFrame);

  const { setupComplete, deviceVersion, dirStructure, latestVersion } =
    useDeviceSetup({ serial, sendCommand });

  const {
    consoleMessages,
    command,
    setCommand,
    clearConsole,
    sendCommand: sendConsoleCommand,
    appendMessage,
  } = useConsole({
    onSendCommand: async (cmd) => {
      await sendCommand(cmd, false, false);
    },
  });

  const { scriptStatus, scriptRunning, handleScriptFile } = useScriptRunner({
    sendCommand,
  });

  const fileUpload = useFileUpload();

  const uploadFileWrapper = async (
    filePath: string,
    bytes: Uint8Array,
    onProgress: (progress: any) => void
  ) => {
    setFileUploadBlocker(true);
    const fileService = createFileService();

    try {
      await fileService.uploadFile(
        filePath,
        bytes,
        sendCommand,
        serial.queueWriteAndResponseBinary,
        onProgress
      );
    } finally {
      setFileUploadBlocker(false);
    }
  };

  const fileOps = useFileOperations({
    sendCommand,
    uploadFile: uploadFileWrapper,
    onUploadStart: fileUpload.startUpload,
    onUploadProgress: fileUpload.updateProgress,
    onUploadComplete: fileUpload.completeUpload,
  });

  const firmwareUpdate = useFirmwareUpdate({
    sendCommand,
    uploadFile: uploadFileWrapper,
  });

  const disableTransmitAction = loadingFrame || fileUploadBlocker;

  const toggleLiveScreen = (shouldUpdate: boolean) => {
    if (!shouldUpdate) {
      sendCommand("screenframeshort", false, false);
    }
    setAutoUpdateFrame(!shouldUpdate);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      (e.key.length === 1 && /[a-zA-Z0-9 \\.]/.test(e.key)) ||
      e.key === "Backspace"
    ) {
      e.preventDefault();
      const keyCode = e.key.length === 1 ? e.key.charCodeAt(0) : e.keyCode;
      sendKeyboard(keyCode, autoUpdateFrame);
    }
  };

  const handleFolderToggle = async (folder: IFileStructure) => {
    let fileStructures: IFileStructure[] = folder.children || [];

    if (!folder.isOpen) {
      const childDirs = await sendCommand(
        `ls ${folder.path}${folder.name}`,
        false,
        true
      );

      if (childDirs.response) {
        const childItems = childDirs.response.split("\r\n").slice(1, -1);
        fileStructures = parseDirectories(
          childItems,
          `${folder.path}${folder.name}/`
        );
      }
    }

    fileOps.updateDirectoryStructure(folder, fileStructures);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    fileOps.handleFileUpload(event);
  };

  const handleFirmwareFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await firmwareUpdate.flashCustomFirmware(file);
    }
  };

  useEffect(() => {
    if (needsRefresh && !disableTransmitAction) {
      requestScreenFrame();
      setNeedsRefresh(false);
    }
  }, [
    needsRefresh,
    disableTransmitAction,
    requestScreenFrame,
    setNeedsRefresh,
  ]);

  useEffect(() => {
    if (consoleMessage.startsWith("screenframe")) {
      if (!UIConfig.screenHide) {
        renderFrame(consoleMessage);
      }
      setLoadingFrame(false);
    } else {
      appendMessage(consoleMessage);
    }
  }, [consoleMessage, UIConfig.screenHide, renderFrame, appendMessage]);

  if (!setupComplete) {
    return <Loader />;
  }

  const isDeviceOutdated = isVersionOutdated(deviceVersion, 240114, 200);

  return (
    <div className="flex size-full flex-col items-center justify-center">
      <h1 className="m-6 p-2">HackRF Connected ✓</h1>

      {!serial.isReading && (
        <p>Please enable the console, so the buttons can also be enabled!</p>
      )}

      {(!UIConfig.screenHide || !UIConfig.controlButtonsHide) && (
        <div
          id="ControllerSection"
          className="bg-component flex h-full max-w-[80%] flex-col items-center justify-center gap-24 rounded-lg p-10 outline-none focus:ring-0 md:flex-row md:items-start"
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          {!UIConfig.screenHide && (
            <div className="flex flex-col items-center justify-center gap-5">
              <DeviceScreen
                canvasRef={canvasRef}
                disableTransmitAction={disableTransmitAction}
                autoUpdateFrame={autoUpdateFrame}
                onTouch={(x, y) => sendTouch(x, y, autoUpdateFrame)}
                screenDimensions={screenDimensions}
              />

              <div className="flex flex-col items-center justify-center rounded-md bg-slate-600 bg-opacity-20 p-3 backdrop-blur-sm">
                <p className="pb-4 font-medium text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]">
                  Live Screen
                </p>
                <div className="flex flex-row items-center justify-center gap-5">
                  <ToggleSwitch
                    isToggle={autoUpdateFrame}
                    toggleSwitch={() => toggleLiveScreen(autoUpdateFrame)}
                  />
                  <button
                    disabled={disableTransmitAction}
                    onClick={requestScreenFrame}
                    className="flex size-6 min-w-6 items-center justify-center rounded-sm bg-slate-700 p-1 text-white transition-colors duration-150 hover:bg-slate-600 hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]"
                  >
                    ↻
                  </button>
                </div>
              </div>
            </div>
          )}

          {!UIConfig.controlButtonsHide && (
            <DeviceControls
              disableTransmitAction={disableTransmitAction}
              onButtonPress={(buttonNumber) =>
                sendButton(buttonNumber, autoUpdateFrame)
              }
              onReboot={() => sendCommand("reboot", autoUpdateFrame, false)}
            />
          )}
        </div>
      )}

      {serial.isReading && (
        <>
          {(!UIConfig.fileSystemHide || !UIConfig.serialConsoleHide) && (
            <div className="bg-component mt-10 flex h-[434px] w-4/5 flex-row items-start justify-center gap-5 rounded-md p-5">
              {!UIConfig.fileSystemHide && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  <FileInputs
                    fileInputRef={fileInputRef}
                    dirStructure={fileOps.dirStructure}
                    sdOverUsbEnabled={fileOps.sdOverUsbEnabled}
                    onFileChange={handleFileChange}
                    onRefresh={fileOps.refreshFileSystem}
                    onCreateFolder={fileOps.createNewFolder}
                    onUploadToRoot={() => {
                      fileOps.setSelectedUploadFolder("/");
                      fileInputRef.current?.click();
                    }}
                    onTakeScreenshot={fileOps.takeScreenshot}
                    onToggleSdOverUsb={fileOps.toggleSdOverUsb}
                    onFolderToggle={handleFolderToggle}
                    onFileDownload={fileOps.downloadFile}
                    onUploadToFolder={(folder) => {
                      fileOps.setSelectedUploadFolder(folder);
                      fileInputRef.current?.click();
                    }}
                    disabled={disableTransmitAction}
                  />
                </>
              )}

              {!UIConfig.serialConsoleHide && (
                <>
                  <input
                    ref={scriptFileInputRef}
                    type="file"
                    accept=".ppsc"
                    style={{ display: "none" }}
                    onChange={handleScriptFile}
                  />
                  <Console
                    consoleMessageList={consoleMessages}
                    command={command}
                    setCommand={setCommand}
                    setConsoleMessageList={clearConsole}
                    sendCommand={sendConsoleCommand}
                    scriptStatus={scriptStatus}
                    scriptRunning={scriptRunning}
                    scriptFileInputRef={scriptFileInputRef}
                  />
                </>
              )}
            </div>
          )}

          {!UIConfig.firmwareManagerHide && (
            <div className="bg-component m-5 flex w-[20%] flex-col items-center justify-center rounded-md p-5">
              <p className="pb-5 text-center text-sm">
                Firmware Version: {deviceVersion}
              </p>
              <button
                onClick={() => setFirmwareModalOpen(true)}
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

      <Modal
        title="Firmware Update"
        isModalOpen={firmwareModalOpen}
        closeModal={() => setFirmwareModalOpen(false)}
        className="w-2/5"
      >
        {isDeviceOutdated ? (
          <p>
            Sorry, your firmware version is too old to support this feature.
            Please manually update to the latest stable or nightly build!
          </p>
        ) : (
          <>
            <input
              ref={firmwareFileInputRef}
              type="file"
              accept=".tar"
              style={{ display: "none" }}
              onChange={handleFirmwareFileChange}
            />
            <FirmwareManager
              deviceVersion={deviceVersion}
              latestVersion={latestVersion}
              disabled={disableTransmitAction || firmwareUpdate.isUpdating}
              updateStatus={firmwareUpdate.updateStatus}
              onFlashStable={firmwareUpdate.flashLatestStable}
              onFlashNightly={firmwareUpdate.flashLatestNightly}
              onFlashCustom={() => firmwareFileInputRef.current?.click()}
            />
          </>
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

      <Modal
        title={`Uploading: ${fileUpload.currentFileName}`}
        isModalOpen={fileUpload.isUploading}
        closeModal={() => {
          if (fileUpload.uploadStatus.includes("Complete")) {
            fileUpload.clearStatus();
          }
        }}
        className="w-96"
      >
        <div className="space-y-2">
          {fileUpload.uploadStatus.includes("Progress") && (
            <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-2.5 rounded-full bg-blue-400 transition-all duration-300"
                style={{
                  width: `${
                    fileUpload.uploadStatus
                      .split("Progress: ")[1]
                      ?.split("%")[0] || 0
                  }%`,
                }}
              />
            </div>
          )}
          <p className="whitespace-pre-wrap text-sm">
            {fileUpload.uploadStatus}
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Controller;
