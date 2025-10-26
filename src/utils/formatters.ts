export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
};

export const formatBytes = (bytes: number): string => {
  return `${(bytes / 1024).toFixed(1)}KB`;
};

export const formatSpeed = (bytesPerSecond: number): string => {
  return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const formatTransferProgress = (
  bytesTransferred: number,
  totalBytes: number,
  timeElapsed: number,
  chunksCompleted: number,
  chunksFailed: number
): string => {
  const percentage = (bytesTransferred / totalBytes) * 100;
  const speed = (bytesTransferred / timeElapsed) * 1000;
  const remainingBytes = totalBytes - bytesTransferred;
  const timeRemaining = remainingBytes / (bytesTransferred / timeElapsed);

  return (
    `📊 Progress\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `⚡ Progress: ${formatPercentage(percentage)}\n` +
    `📦 Transferred: ${formatBytes(bytesTransferred)} / ${formatBytes(
      totalBytes
    )}\n` +
    `🚀 Speed: ${formatSpeed(speed)}\n` +
    `⏱️ Elapsed: ${formatTime(timeElapsed / 1000)}\n` +
    `⌛ Remaining: ${formatTime(timeRemaining / 1000)}\n` +
    `✅ Chunks: ${chunksCompleted}\n` +
    `❌ Retries: ${chunksFailed}`
  );
};

export const formatCompleteMessage = (
  totalBytes: number,
  totalTime: number,
  chunksCompleted: number,
  chunksFailed: number
): string => {
  return (
    `✅ Complete!\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `📦 Total: ${formatBytes(totalBytes)}\n` +
    `⏱️ Time: ${formatTime(totalTime / 1000)}\n` +
    `✅ Chunks: ${chunksCompleted}\n` +
    `❌ Retries: ${chunksFailed}`
  );
};
