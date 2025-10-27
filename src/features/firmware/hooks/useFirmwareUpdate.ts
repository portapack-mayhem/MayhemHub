import { useState } from "react";
import { ILatestVersions } from "@/types";
import { ITransferProgress } from "@/types";
import { downloadFileFromUrl } from "@/utils/downloadUtils";

interface IUseFirmwareUpdateProps {
  sendCommand: (
    command: string,
    updateFrame: boolean,
    awaitResponse?: boolean
  ) => Promise<any>;
  uploadFile: (
    filePath: string,
    bytes: Uint8Array,
    onProgress: (progress: ITransferProgress) => void
  ) => Promise<void>;
}

interface IUseFirmwareUpdateReturn {
  updateStatus: string;
  isUpdating: boolean;
  flashLatestStable: () => Promise<void>;
  flashLatestNightly: () => Promise<void>;
  flashCustomFirmware: (file: File) => Promise<void>;
}

const FIRMWARE_DIR = "/FIRMWARE/";

export const useFirmwareUpdate = ({
  sendCommand,
  uploadFile,
}: IUseFirmwareUpdateProps): IUseFirmwareUpdateReturn => {
  const [updateStatus, setUpdateStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const ensureFirmwareDirectory = async () => {
    await sendCommand(`mkdir ${FIRMWARE_DIR}`, false, true);
  };

  const flashFirmware = async (fileName: string) => {
    await sendCommand(`flash ${FIRMWARE_DIR}${fileName}`, false, true);
  };

  const handleFirmwareUpdate = async (
    fetchFirmware: () => Promise<{ blob: Blob; filename: string }>
  ) => {
    try {
      setIsUpdating(true);
      setUpdateStatus("📥 Downloading firmware...");

      const { blob, filename } = await fetchFirmware();

      setUpdateStatus("📦 Preparing upload...");
      await ensureFirmwareDirectory();

      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      await uploadFile(`${FIRMWARE_DIR}${filename}`, bytes, (progress) => {
        setUpdateStatus(
          `📤 Uploading: ${progress.percentage.toFixed(1)}%\n` +
            `Speed: ${(progress.speed / 1024).toFixed(1)} KB/s`
        );
      });

      setUpdateStatus("⚡ Flashing firmware...");
      await flashFirmware(filename);

      setUpdateStatus("✅ Firmware update complete! Device will reboot.");

      setTimeout(() => {
        setIsUpdating(false);
        setUpdateStatus("");
      }, 5000);
    } catch (error) {
      console.error("Firmware update failed:", error);
      setUpdateStatus("❌ Firmware update failed");
      setTimeout(() => {
        setIsUpdating(false);
        setUpdateStatus("");
      }, 3000);
    }
  };

  const flashLatestStable = async () => {
    await handleFirmwareUpdate(() =>
      downloadFileFromUrl("https://hackrf.app/api/fetch_stable_firmware")
    );
  };

  const flashLatestNightly = async () => {
    await handleFirmwareUpdate(() =>
      downloadFileFromUrl("https://hackrf.app/api/fetch_nightly_firmware")
    );
  };

  const flashCustomFirmware = async (file: File) => {
    try {
      setIsUpdating(true);
      await ensureFirmwareDirectory();

      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      await uploadFile(`${FIRMWARE_DIR}${file.name}`, bytes, (progress) => {
        setUpdateStatus(
          `📤 Uploading: ${progress.percentage.toFixed(1)}%\n` +
            `Speed: ${(progress.speed / 1024).toFixed(1)} KB/s`
        );
      });

      setUpdateStatus("⚡ Flashing firmware...");
      await flashFirmware(file.name);

      setUpdateStatus("✅ Firmware update complete! Device will reboot.");

      setTimeout(() => {
        setIsUpdating(false);
        setUpdateStatus("");
      }, 5000);
    } catch (error) {
      console.error("Custom firmware flash failed:", error);
      setUpdateStatus("❌ Firmware update failed");
      setTimeout(() => {
        setIsUpdating(false);
        setUpdateStatus("");
      }, 3000);
    }
  };

  return {
    updateStatus,
    isUpdating,
    flashLatestStable,
    flashLatestNightly,
    flashCustomFirmware,
  };
};
