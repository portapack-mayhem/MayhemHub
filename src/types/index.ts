import { ISerialProvider } from "@/services/serialProvider";

// Domain Types
export type DeviceVersion = string;
export type FilePath = string;
export type CommandResponse = string;

export interface IDeviceInfo {
  version: DeviceVersion;
  isConnected: boolean;
  isReading: boolean;
}

export interface IScreenDimensions {
  width: number;
  height: number;
}

export interface ILatestVersions {
  stable: IVersionDetails;
  nightly: IVersionDetails;
}

export interface IVersionDetails {
  version: string;
  published_at: string;
}

// File System Types
export type FileType = "file" | "folder";

export interface IFileStructure {
  name: string;
  path: FilePath;
  type: FileType;
  children?: IFileStructure[];
  isOpen: boolean;
}

// Serial Communication Types
export interface IDataPacket {
  id: number;
  command: string;
  response: CommandResponse | null;
}

export interface ISerialMessage {
  content: string;
  timestamp: number;
}

export interface ISerialContextValue {
  serial: ISerialProvider;
  consoleMessage: string;
}

// Upload/Download Progress Types
export interface ITransferProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
  speed: number;
  timeElapsed: number;
  timeRemaining: number;
  chunksCompleted: number;
  chunksFailed: number;
}

// UI Configuration Types
export interface IUIConfig {
  screenHide: boolean;
  controlButtonsHide: boolean;
  fileSystemHide: boolean;
  serialConsoleHide: boolean;
  firmwareManagerHide: boolean;
}

export interface IConfigItem {
  key: keyof IUIConfig;
  label: string;
  onToggle?: () => void;
}

// Modal Types
export interface IModalProps {
  title?: string;
  footer?: React.ReactNode;
  isModalOpen?: boolean;
  closeModal: () => void;
  children: React.ReactNode;
  className?: string;
}

// Serial Provider Types
export type PortState = "closed" | "closing" | "open" | "opening";

export interface ISerialOptions {
  baudRate: number;
  bufferSize: number;
  dataBits: 7 | 8;
  stopBits: 1 | 2;
  flowControl: FlowControlType;
  parity: ParityType;
}
