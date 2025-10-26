import { getCurrentDeviceTimeCommand } from "@/services/dateTimeService";
import { IFileStructure } from "@/types";
import {
  parseDirectories,
  parseDeviceVersion,
  parseFileSize,
} from "@/utils/parsers";

export interface IDeviceService {
  syncTime: () => string;
  getDeviceInfo: (response: string) => string;
  getFileSystem: (response: string) => IFileStructure[];
  getFileSize: (response: string) => number;
}

export const createDeviceService = (): IDeviceService => ({
  syncTime: () => getCurrentDeviceTimeCommand(),

  getDeviceInfo: (response: string) => parseDeviceVersion(response),

  getFileSystem: (response: string) => {
    const rootItems = response.split("\r\n").slice(1, -1);
    return parseDirectories(rootItems, "/");
  },

  getFileSize: (response: string) => parseFileSize(response),
});
