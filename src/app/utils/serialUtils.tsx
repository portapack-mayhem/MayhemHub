import { Dispatch, SetStateAction } from "react";
import { hexToBytes } from "./fileUtils";
import { useSerial } from "../components/SerialLoader/SerialLoader";
import { DataPacket } from "../components/SerialProvider/SerialProvider";

interface DownloadedFile {
  blob: Blob;
  filename: string;
}

export const Write = async (
  command: string,
  updateFrame: boolean,
  awaitResponse: boolean = true
) => {
  const { serial, consoleMessage } = useSerial();

  let data: DataPacket = {
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

export const DownloadFile = async (filePath: string) => {
  const { serial, consoleMessage } = useSerial();

  await Write("fclose", false);
  let sizeResponse = await Write(`filesize ${filePath}`, false, true);
  if (!sizeResponse.response) {
    console.error("Error downloading (size) file");
  }
  let size = parseInt(sizeResponse.response?.split("\r\n")[1] || "0");
  await Write(`fopen ${filePath}`, false);

  await Write(`fseek 0`, false);

  let rem = size;
  let chunk = 62 * 15;

  let dataObject: Uint8Array = new Uint8Array();

  while (rem > 0) {
    if (rem < chunk) {
      chunk = rem;
    }
    let lines =
      (await Write(`fread ${chunk.toString()}`, false, true)).response
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
  await Write("fclose", false);
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
): Promise<DownloadedFile> => {
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

export const UploadFile = async (
  filePath: string,
  bytes: Uint8Array,
  setUpdateStatus: Dispatch<SetStateAction<string>>
) => {
  const { serial, consoleMessage } = useSerial();

  await Write("fclose", false);
  await Write(`fopen ${filePath}`, false);

  await Write(`fseek 0`, false);

  let blob = new Blob([bytes]);
  const arrayBuffer = await blob.arrayBuffer();

  const chunkSize = 100000;

  console.log("Total length: ", arrayBuffer.byteLength);

  let startTime = Date.now();
  let totalTime = 0;

  for (let i = 0; i < arrayBuffer.byteLength; i += chunkSize) {
    const chunk = arrayBuffer.slice(i, i + chunkSize);

    await Write(`fwb ${chunk.byteLength}`, false, true);
    await serial.queueWriteAndResponseBinary(new Uint8Array(chunk));

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
    setUpdateStatus(
      `${((i / arrayBuffer.byteLength) * 100).toFixed(
        2
      )}% Estimated time remaining: ${estRemainingTime.toFixed(0)} seconds`
    );

    // reset start time for next iteration
    startTime = Date.now();
  }
  console.log("FILE DONE");
  setUpdateStatus(`File upload complete!`);

  await Write("fclose", false);
};
