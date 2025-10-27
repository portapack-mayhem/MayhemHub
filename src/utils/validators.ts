export const isValidFolderName = (name: string): boolean => {
  const safeName = name.trim().replace(/[^a-zA-Z0-9-_]/g, "");
  return safeName.length > 0;
};

export const sanitizeFolderName = (name: string): string => {
  return name.trim().replace(/[^a-zA-Z0-9-_]/g, "");
};

export const isScreenFrameMessage = (message: string): boolean => {
  return message.startsWith("screenframe");
};

export const isCommandResponse = (message: string): boolean => {
  return message.endsWith("ch> ") || message.endsWith(" bytes\r\n");
};
