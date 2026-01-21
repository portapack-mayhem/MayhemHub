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

  const uploadFile = async (
    filePath: string,
    bytes: Uint8Array,
    setUpdateStatus: Dispatch<SetStateAction<string>>
  ) => {
    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}m ${secs}s`;
    };
  
    setFileUploadBlocker(true);
    await write("fclose", false);
    await write(`fopen ${filePath}`, false);
  
    await write(`fseek 0`, false);
  
    let blob = new Blob([bytes]);
    const arrayBuffer = await blob.arrayBuffer();
  
    // macOS needs smaller chunks to prevent serial buffer overflow
    const isMac = typeof navigator !== 'undefined' && /Macintosh/.test(navigator.userAgent);
    const chunkSize = isMac ? 4096 : 100000;
    let successfulChunks = 0;
    let failedChunks = 0;
  
    console.log("Total length: ", arrayBuffer.byteLength);
  
    let startTime = Date.now();
    let totalTime = 0;
    let lastProgressUpdate = Date.now();
  
    for (let i = 0; i < arrayBuffer.byteLength; i += chunkSize) {
      const chunk = arrayBuffer.slice(i, i + chunkSize);
  
      await write(`fwb ${chunk.byteLength}`, false, true);
      await serial.queueWriteAndResponseBinary(new Uint8Array(chunk));
      successfulChunks++;
  
      // calculate elapsed time and average time per chunk
      let elapsed = Date.now() - startTime;
      totalTime += elapsed;
      let avgTimePerChunk = totalTime / (i / chunkSize + 1);
  
      // estimate remaining time in seconds
      let remainingChunks = (arrayBuffer.byteLength - i) / chunkSize;
      let estRemainingTime = (remainingChunks * avgTimePerChunk) / 1000;
  
      console.log(
        "Chunk done",
        i,
        arrayBuffer.byteLength,
        ((i / arrayBuffer.byteLength) * 100).toFixed(2) + "%",
        "Estimated time remaining: " + estRemainingTime.toFixed(0) + " seconds"
      );
      
      if (Date.now() - lastProgressUpdate > 500) {
        const percentComplete = (i / arrayBuffer.byteLength) * 100;
        const transferSpeed = (i / totalTime) * 1000 / 1024; // KB/s
        
        setUpdateStatus(
          `📊 Upload Progress\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `⚡ Progress: ${percentComplete.toFixed(1)}%\n` +
          `📦 Transferred: ${(i / 1024).toFixed(1)}KB / ${(arrayBuffer.byteLength / 1024).toFixed(1)}KB\n` +
          `🚀 Speed: ${transferSpeed.toFixed(1)} KB/s\n` +
          `⏱️ Time Elapsed: ${formatTime(totalTime/1000)}\n` +
          `⌛ Time Remaining: ${formatTime(estRemainingTime)}\n` +
          `✅ Chunks: ${successfulChunks}\n` +
          `❌ Retries: ${failedChunks}`
        );
        lastProgressUpdate = Date.now();
      }
  
      // reset start time for next iteration
      startTime = Date.now();
    }
    console.log("FILE DONE");
    
    setUpdateStatus(
      `✅ Upload Complete!\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 Total Size: ${(arrayBuffer.byteLength / 1024).toFixed(1)}KB\n` +
      `⏱️ Total Time: ${formatTime(totalTime/1000)}\n` +
      `✅ Successful Chunks: ${successfulChunks}\n` +
      `❌ Failed Attempts: ${failedChunks}`
    );
  
    await write("fclose", false);
    setFileUploadBlocker(false);
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
