import { ILatestVersions } from "@/types";
import { getVersionLink, getVersionType } from "@/utils/versionUtils";

interface IFirmwareManager {
  deviceVersion: string;
  latestVersion: ILatestVersions | undefined;
  disableTransmitAction: boolean;
  firmwareFileInputRef: React.RefObject<HTMLInputElement>;
  updateStatus: string;
  setSelectedUploadFolder: (folder: string) => void;
  flashLatestStableFirmware: () => Promise<void>;
  flashLatestNightlyFirmware: () => Promise<void>;
}

export const FirmwareManager: React.FC<IFirmwareManager> = ({
  deviceVersion,
  latestVersion,
  disableTransmitAction,
  firmwareFileInputRef,
  updateStatus,
  setSelectedUploadFolder,
  flashLatestStableFirmware,
  flashLatestNightlyFirmware,
}) => (
  <div className="flex flex-col gap-3">
    <p>
      Currently installed version:{" "}
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

    <p className="mt-3">Select from the available options:</p>
    <button
      onClick={() => flashLatestStableFirmware()}
      disabled={disableTransmitAction}
      className="rounded bg-blue-400 p-2 text-white disabled:opacity-50"
    >
      Update to latest stable release
    </button>
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
        setSelectedUploadFolder("/FIRMWARE/");
        firmwareFileInputRef.current?.click();
      }}
      className="rounded bg-blue-400 p-2 text-white disabled:opacity-50"
    >
      Flash custom firmware
    </button>
    <p>{updateStatus}</p>
  </div>
);
