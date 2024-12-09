import { ISerialProvider } from "@/components/SerialProvider/SerialProvider";

export interface ILatestVersions {
  stable: IVersionDetails;
  nightly: IVersionDetails;
}

export interface IVersionDetails {
  version: string;
  published_at: string;
}

export interface IModal {
  title?: string;
  footer?: React.ReactNode;
  isModalOpen?: boolean;
  closeModal: () => void;
  children: React.ReactNode;
  className?: string;
}

export interface IDataPacket {
  id: number;
  command: string;
  response: string | null;
}

export interface ISerialContextValue {
  serial: ISerialProvider;
  consoleMessage: string;
}

export interface IUIConfig {
  screenHide: boolean;
  controlButtonsHide: boolean;
  fileSystemHide: boolean;
  serialConsoleHide: boolean;
  firmwareManagerHide: boolean;
}

export type ConfigItem = {
  key: keyof IUIConfig;
  label: string;
  onToggle?: () => void;
};
