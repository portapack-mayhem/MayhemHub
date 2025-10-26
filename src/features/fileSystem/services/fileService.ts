import { ITransferProgress } from "@/types";
import { hexToBytes } from "@/utils/parsers";

type WriteCommand = (
  cmd: string,
  update: boolean,
  awaitResponse?: boolean
) => Promise<any>;

type QueueBinary = (data: Uint8Array) => Promise<any>;

type ProgressCallback = (progress: ITransferProgress) => void;

export interface IFileService {
  downloadFile: (filePath: string, write: WriteCommand) => Promise<Uint8Array>;

  uploadFile: (
    filePath: string,
    bytes: Uint8Array,
    write: WriteCommand,
    queueBinary: QueueBinary,
    onProgress: ProgressCallback
  ) => Promise<void>;
}

const CHUNK_SIZE = 100000;
const READ_CHUNK_SIZE = 62 * 15;

const downloadFile = async (
  filePath: string,
  write: WriteCommand
): Promise<Uint8Array> => {
  await write("fclose", false);

  const sizeResponse = await write(`filesize ${filePath}`, false, true);
  if (!sizeResponse.response) {
    throw new Error("Could not get file size");
  }

  const size = parseInt(sizeResponse.response.split("\r\n")[1] || "0", 10);
  await write(`fopen ${filePath}`, false);
  await write(`fseek 0`, false);

  let remaining = size;
  let dataArray = new Uint8Array();

  while (remaining > 0) {
    const chunkSize = Math.min(remaining, READ_CHUNK_SIZE);

    const response = await write(`fread ${chunkSize}`, false, true);
    const lines = response.response?.split("\r\n").slice(1, -2).join("") || "";

    const bytes = hexToBytes(lines);
    remaining -= bytes.length;
    dataArray = new Uint8Array([...dataArray, ...Array.from(bytes)]);
  }

  await write("fclose", false);
  return dataArray;
};

const uploadFile = async (
  filePath: string,
  bytes: Uint8Array,
  write: WriteCommand,
  queueBinary: QueueBinary,
  onProgress: ProgressCallback
): Promise<void> => {
  await write("fclose", false);
  await write(`fopen ${filePath}`, false);
  await write(`fseek 0`, false);

  const blob = new Blob([bytes]);
  const arrayBuffer = await blob.arrayBuffer();
  const totalBytes = arrayBuffer.byteLength;

  let chunksCompleted = 0;
  const chunksFailed = 0;
  const startTime = Date.now();

  for (let i = 0; i < totalBytes; i += CHUNK_SIZE) {
    const chunk = arrayBuffer.slice(i, i + CHUNK_SIZE);

    await write(`fwb ${chunk.byteLength}`, false, true);
    await queueBinary(new Uint8Array(chunk));

    chunksCompleted++;
    const timeElapsed = Date.now() - startTime;
    const bytesTransferred = i + chunk.byteLength;
    const remainingBytes = totalBytes - bytesTransferred;
    const bytesPerMs = bytesTransferred / timeElapsed;

    onProgress({
      bytesTransferred,
      totalBytes,
      percentage: (bytesTransferred / totalBytes) * 100,
      speed: bytesPerMs * 1000,
      timeElapsed,
      timeRemaining: remainingBytes / bytesPerMs,
      chunksCompleted,
      chunksFailed,
    });
  }

  await write("fclose", false);
};

export const createFileService = (): IFileService => ({
  downloadFile,
  uploadFile,
});
