import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useSerial } from "@/components/SerialLoader/SerialLoader";
import { IDataPacket } from "@/types";
import { hexToBytes } from "./fileUtils";

interface IDownloadedFile {
  blob: Blob;
  filename: string;
}

export const useWriteCommand = () => {
  const { serial } = useSerial();
  const [loadingFrame, setLoadingFrame] = useState<boolean>(true);
  const [fileUploadBlocker, setFileUploadBlocker] = useState<boolean>(false);
  const [disableTransmitAction, setDisableTransmitAction] =
    useState<boolean>(true);

  useEffect(() => {
    const disableTransmitActionUpdating = loadingFrame || fileUploadBlocker;
    // Triggers an immediate rerender with updated state
    setDisableTransmitAction(disableTransmitActionUpdating);
  }, [loadingFrame, fileUploadBlocker, disableTransmitAction]);

  const write = async (
    command: string,
    updateFrame: boolean,
    awaitResponse: boolean = true
  ) => {
    let data: IDataPacket = {
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

  const isMac = () => {
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent;
      return userAgent.includes("Mac");
    }
    return false;
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${remainingSeconds}s`);

    return parts.join(" ");
  };

  const uploadFile = async (
    filePath: string,
    bytes: Uint8Array,
    setUpdateStatus: Dispatch<SetStateAction<string>>
  ) => {
    const logDebug = (message: string) => {
      console.log(message);
    };

    setFileUploadBlocker(true);
    logDebug(`Starting upload for ${filePath}`);
    const uploadStartTime = Date.now();

    try {
      await write("fclose", false);
      await write(`fopen ${filePath}`, false);
      await write(`fseek 0`, false);

      const blob = new Blob([bytes]);
      const arrayBuffer = await blob.arrayBuffer();
      const chunkSize = isMac() ? 64 : 100000;
      const totalChunks = Math.ceil(arrayBuffer.byteLength / chunkSize);

      let position = 0;
      let startTime = Date.now();
      let totalTime = 0;
      let successfulChunks = 0;
      let failedChunks = 0;

      logDebug(
        `Starting transfer of ${totalChunks} chunks with chunk size ${chunkSize}`
      );

      while (position < arrayBuffer.byteLength) {
        const chunk = new Uint8Array(
          arrayBuffer.slice(position, position + chunkSize)
        );

        try {
          await write(`fwb ${chunk.length}`, false, true);
          await serial.queueWriteAndResponseBinary(chunk);

          position += chunk.length;
          successfulChunks++;

          const elapsed = Date.now() - startTime;
          totalTime += elapsed;
          const avgTimePerByte = totalTime / position;
          const remainingBytes = arrayBuffer.byteLength - position;
          const estRemainingTime = (remainingBytes * avgTimePerByte) / 1000;
          const percentComplete = (position / arrayBuffer.byteLength) * 100;
          const transferSpeed = (position / totalTime) * 1000;
          const totalElapsed = (Date.now() - uploadStartTime) / 1000;

          if (successfulChunks % 10 === 0) {
            logDebug(
              `Transfer status: ${percentComplete.toFixed(2)}% complete, ${(
                transferSpeed / 1024
              ).toFixed(2)} KB/s`
            );
          }

          setUpdateStatus(
            `📊 Upload Progress\n` +
              `━━━━━━━━━━━━━━━━━━━━━\n` +
              `⚡ Progress: ${percentComplete.toFixed(1)}%\n` +
              `📦 Chunks: ${successfulChunks} of ${totalChunks}\n` +
              `🚀 Speed: ${(transferSpeed / 1024).toFixed(1)} KB/s\n` +
              `⏱️ Time Elapsed: ${formatTime(totalElapsed)}\n` +
              `⌛ Time Remaining: ${formatTime(estRemainingTime)}\n` +
              `📈 Transferred: ${(position / 1024).toFixed(1)}KB / ${(
                arrayBuffer.byteLength / 1024
              ).toFixed(1)}KB`
          );
        } catch (error) {
          failedChunks++;
          logDebug(
            `Error at chunk ${successfulChunks + 1}/${totalChunks}: ${error}`
          );
          await new Promise((resolve) => setTimeout(resolve, 100));
          continue;
        }

        startTime = Date.now();
      }

      const totalElapsed = (Date.now() - uploadStartTime) / 1000;
      await write("fclose", false);
      setUpdateStatus(
        `✅ Upload Complete!\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `📦 Total Size: ${(arrayBuffer.byteLength / 1024).toFixed(1)}KB\n` +
          `⏱️ Total Time: ${formatTime(totalElapsed)}\n` +
          `🔄 Total Chunks: ${totalChunks}\n` +
          `❌ Failed Attempts: ${failedChunks}`
      );

      logDebug(
        `Upload finished. Successful chunks: ${successfulChunks}, Failed attempts: ${failedChunks}`
      );
    } catch (error) {
      logDebug(`Upload failed: ${error}`);
      await write("fclose", false).catch(() => {});
      throw error;
    } finally {
      setFileUploadBlocker(false);
    }
  };

  return {
    write,
    downloadFile,
    uploadFile,
    disableTransmitAction,
    loadingFrame,
    fileUploadBlocker,
    setLoadingFrame,
  };
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

export const downloadFileFromUrl = async (
  url: string
): Promise<IDownloadedFile> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const contentDispositionHeader = response.headers.get("Content-Disposition");
  const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
  let matches = contentDispositionHeader?.match(filenameRegex);
  let filename =
    matches && matches[1] ? matches[1].replace(/['"]/g, "") : "unknown.fail";

  const blob = await response.blob();

  return { blob, filename };
};
