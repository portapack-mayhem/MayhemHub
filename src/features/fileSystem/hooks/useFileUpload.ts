import { useState, useRef } from "react";
import { ITransferProgress } from "@/types";
import {
  formatTransferProgress,
  formatCompleteMessage,
} from "@/utils/formatters";

interface IUseFileUpload {
  uploadStatus: string;
  isUploading: boolean;
  currentFileName: string;
  startUpload: (fileName: string) => void;
  updateProgress: (progress: ITransferProgress) => void;
  completeUpload: (progress: ITransferProgress) => void;
  cancelUpload: () => void;
  clearStatus: () => void;
}

export const useFileUpload = (): IUseFileUpload => {
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [currentFileName, setCurrentFileName] = useState("");
  const lastUpdate = useRef(Date.now());

  const startUpload = (fileName: string) => {
    setCurrentFileName(fileName);
    setIsUploading(true);
    setUploadStatus("");
  };

  const updateProgress = (progress: ITransferProgress) => {
    const now = Date.now();
    if (now - lastUpdate.current > 500) {
      setUploadStatus(
        formatTransferProgress(
          progress.bytesTransferred,
          progress.totalBytes,
          progress.timeElapsed,
          progress.chunksCompleted,
          progress.chunksFailed
        )
      );
      lastUpdate.current = now;
    }
  };

  const completeUpload = (progress: ITransferProgress) => {
    setUploadStatus(
      formatCompleteMessage(
        progress.totalBytes,
        progress.timeElapsed,
        progress.chunksCompleted,
        progress.chunksFailed
      )
    );
  };

  const cancelUpload = () => {
    setUploadStatus("❌ Upload cancelled");
    setTimeout(clearStatus, 2000);
  };

  const clearStatus = () => {
    setIsUploading(false);
    setUploadStatus("");
    setCurrentFileName("");
  };

  return {
    uploadStatus,
    isUploading,
    currentFileName,
    startUpload,
    updateProgress,
    completeUpload,
    cancelUpload,
    clearStatus,
  };
};
