import { useCallback } from "react";
import { IDataPacket } from "@/types";

interface ISerialWriter {
  queueWrite: (message: string) => number;
  queueWriteAndResponse: (message: string) => Promise<IDataPacket>;
  queueWriteAndResponseBinary: (message: Uint8Array) => Promise<IDataPacket>;
}

interface IUseDeviceCommands {
  sendCommand: (
    command: string,
    updateFrame: boolean,
    awaitResponse?: boolean
  ) => Promise<IDataPacket>;
  sendButton: (buttonNumber: number, updateFrame: boolean) => Promise<void>;
  sendTouch: (x: number, y: number, updateFrame: boolean) => Promise<void>;
  sendKeyboard: (keyCode: number, updateFrame: boolean) => Promise<void>;
  requestScreenFrame: () => Promise<void>;
}

export const useDeviceCommands = (
  serial: ISerialWriter,
  setLoadingFrame: (loading: boolean) => void
): IUseDeviceCommands => {
  const sendCommand = useCallback(
    async (
      command: string,
      updateFrame: boolean,
      awaitResponse: boolean = true
    ): Promise<IDataPacket> => {
      let data: IDataPacket = {
        id: 0,
        command: "",
        response: null,
      };

      if (awaitResponse) {
        data = await serial.queueWriteAndResponse(command);
      } else {
        serial.queueWrite(command);
      }

      if (updateFrame) {
        serial.queueWrite("screenframeshort");
        setLoadingFrame(true);
      }

      return data;
    },
    [serial, setLoadingFrame]
  );

  const sendButton = useCallback(
    async (buttonNumber: number, updateFrame: boolean) => {
      await sendCommand(`button ${buttonNumber}`, updateFrame, false);
    },
    [sendCommand]
  );

  const sendTouch = useCallback(
    async (x: number, y: number, updateFrame: boolean) => {
      await sendCommand(`touch ${x} ${y}`, updateFrame, false);
    },
    [sendCommand]
  );

  const sendKeyboard = useCallback(
    async (keyCode: number, updateFrame: boolean) => {
      const keyHex = keyCode.toString(16).padStart(2, "0").toUpperCase();
      await sendCommand(`keyboard ${keyHex}`, updateFrame, false);
    },
    [sendCommand]
  );

  const requestScreenFrame = useCallback(async () => {
    setLoadingFrame(true);
    await sendCommand("screenframeshort", false, false);
  }, [sendCommand, setLoadingFrame]);

  return {
    sendCommand,
    sendButton,
    sendTouch,
    sendKeyboard,
    requestScreenFrame,
  };
};
