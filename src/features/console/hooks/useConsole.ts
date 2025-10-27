import { useState, useCallback } from "react";

interface IUseConsoleProps {
  onSendCommand: (command: string) => Promise<void>;
}

interface IUseConsoleReturn {
  consoleMessages: string;
  command: string;
  setCommand: (command: string) => void;
  clearConsole: () => void;
  sendCommand: () => Promise<void>;
  appendMessage: (message: string) => void;
}

export const useConsole = ({
  onSendCommand,
}: IUseConsoleProps): IUseConsoleReturn => {
  const [consoleMessages, setConsoleMessages] = useState("");
  const [command, setCommand] = useState("");

  const appendMessage = useCallback((message: string) => {
    setConsoleMessages((prev) => prev + message);
  }, []);

  const clearConsole = useCallback(() => {
    setConsoleMessages("");
  }, []);

  const sendCommand = useCallback(async () => {
    if (!command.trim()) return;

    await onSendCommand(command);
    setCommand("");
  }, [command, onSendCommand]);

  return {
    consoleMessages,
    command,
    setCommand,
    clearConsole,
    sendCommand,
    appendMessage,
  };
};
