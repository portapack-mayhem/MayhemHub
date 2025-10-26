import { useState, useEffect, useRef } from "react";

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
  const consoleRef = useRef<HTMLElement | null>(null);

  const appendMessage = (message: string) => {
    setConsoleMessages((prev) => prev + message);
  };

  const clearConsole = () => {
    setConsoleMessages("");
  };

  const sendCommand = async () => {
    if (!command.trim()) return;

    await onSendCommand(command);
    setCommand("");
  };

  useEffect(() => {
    const element = document.getElementById("serial_console");
    if (element) {
      consoleRef.current = element;
      element.scrollTop = element.scrollHeight;
    }
  }, [consoleMessages]);

  return {
    consoleMessages,
    command,
    setCommand,
    clearConsole,
    sendCommand,
    appendMessage,
  };
};
