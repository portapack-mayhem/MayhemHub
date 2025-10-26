interface IDownloadedFile {
  blob: Blob;
  filename: string;
}

export const downloadFileFromUrl = async (
  url: string
): Promise<IDownloadedFile> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const contentDispositionHeader = response.headers.get("Content-Disposition");
  const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
  const matches = contentDispositionHeader?.match(filenameRegex);
  const filename = matches?.[1]?.replace(/['"]/g, "") ?? "unknown.fail";

  const blob = await response.blob();

  return { blob, filename };
};
