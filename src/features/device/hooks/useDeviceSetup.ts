import { useState, useEffect, useRef } from "react";
import { createDeviceService } from "@/features/device/services/deviceService";
import { getCurrentDeviceTimeCommand } from "@/services/dateTimeService";
import { ISerialProvider } from "@/services/serialProvider";
import { IFileStructure, ILatestVersions } from "@/types";
import { getLatestVersions } from "@/utils/versionUtils";

interface IUseDeviceSetupProps {
  serial: ISerialProvider;
  sendCommand: (
    command: string,
    updateFrame: boolean,
    awaitResponse?: boolean
  ) => Promise<any>;
}

interface IUseDeviceSetupReturn {
  setupComplete: boolean;
  deviceVersion: string;
  dirStructure: IFileStructure[];
  latestVersion: ILatestVersions | null;
}

export const useDeviceSetup = ({
  serial,
  sendCommand,
}: IUseDeviceSetupProps): IUseDeviceSetupReturn => {
  const [setupComplete, setSetupComplete] = useState(false);
  const [deviceVersion, setDeviceVersion] = useState("");
  const [dirStructure, setDirStructure] = useState<IFileStructure[]>([]);
  const [latestVersion, setLatestVersion] = useState<ILatestVersions | null>(
    null
  );

  const hasStarted = useRef(false);
  const deviceService = useRef(createDeviceService());

  useEffect(() => {
    if (!serial.isOpen || serial.isReading || hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    serial.startReading();

    const initializeDevice = async () => {
      try {
        // Sync device time
        await sendCommand(getCurrentDeviceTimeCommand(), false, false);

        // Get device info
        const infoResponse = await sendCommand("info", false, true);
        if (infoResponse.response) {
          const version = deviceService.current.getDeviceInfo(
            infoResponse.response
          );
          setDeviceVersion(version);
        }

        // Fetch file system structure
        const fileSystemResponse = await sendCommand("ls /", false, true);
        if (fileSystemResponse.response) {
          const structure = deviceService.current.getFileSystem(
            fileSystemResponse.response
          );
          setDirStructure(structure);
        }

        // Request initial screen frame
        await sendCommand("screenframeshort", false, false);

        // Fetch latest versions
        const versions = await getLatestVersions();
        setLatestVersion(versions);

        setSetupComplete(true);
      } catch (error) {
        console.error("Device setup failed:", error);
        hasStarted.current = false;
        setSetupComplete(false);
      }
    };

    initializeDevice();
  }, [serial.isOpen]);

  return {
    setupComplete,
    deviceVersion,
    dirStructure,
    latestVersion,
  };
};
