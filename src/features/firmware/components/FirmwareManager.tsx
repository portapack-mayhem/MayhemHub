import { ILatestVersions } from "@/types";
import { getVersionLink, getVersionType } from "@/utils/versionUtils";

interface IFirmwareManagerProps {
  deviceVersion: string;
  latestVersion: ILatestVersions | null;
  disabled: boolean;
  updateStatus: string;
  onFlashStable: () => void;
  onFlashNightly: () => void;
  onFlashCustom: () => void;
}

const FirmwareManager = ({
  deviceVersion,
  latestVersion,
  disabled,
  updateStatus,
  onFlashStable,
  onFlashNightly,
  onFlashCustom,
}: IFirmwareManagerProps) => {
  return (
    <div className="flex flex-col gap-3">
      <p>
        Currently installed version:{" "}
        <a
          className="text-blue-300 underline transition-colors duration-200 hover:text-blue-400"
          href={getVersionLink(deviceVersion)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {deviceVersion} - {getVersionType(deviceVersion)}
        </a>
      </p>

      {latestVersion && (
        <div className="flex flex-col gap-1">
          <p>
            Latest Stable:{" "}
            <a
              className="text-blue-300 underline transition-colors duration-200 hover:text-blue-400"
              href={getVersionLink(latestVersion.stable.version)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {latestVersion.stable.version}
            </a>
          </p>
          <p>
            Latest Nightly:{" "}
            <a
              className="text-blue-300 underline transition-colors duration-200 hover:text-blue-400"
              href={getVersionLink(latestVersion.nightly.version)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {latestVersion.nightly.version}
            </a>
          </p>
        </div>
      )}

      <p className="mt-3">Select from the available options:</p>

      <button
        onClick={onFlashStable}
        disabled={disabled}
        className="rounded bg-blue-400 p-2 text-white transition-opacity disabled:opacity-50"
      >
        Update to latest stable release
      </button>

      <button
        onClick={onFlashNightly}
        disabled={disabled}
        className="rounded bg-blue-400 p-2 text-white transition-opacity disabled:opacity-50"
      >
        Update to latest nightly release
      </button>

      <button
        onClick={onFlashCustom}
        disabled={disabled}
        className="rounded bg-blue-400 p-2 text-white transition-opacity disabled:opacity-50"
      >
        Flash custom firmware
      </button>

      {updateStatus && (
        <div className="mt-3 space-y-2">
          {updateStatus.includes("Uploading") && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-blue-400 h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    updateStatus.split("Uploading: ")[1]?.split("%")[0] || 0
                  }%`,
                }}
              />
            </div>
          )}
          <p className="whitespace-pre-wrap text-sm">{updateStatus}</p>
        </div>
      )}
    </div>
  );
};

export default FirmwareManager;
