import { useState, ChangeEvent } from "react";

interface IUseScriptRunnerProps {
  sendCommand: (
    command: string,
    updateFrame: boolean,
    awaitResponse?: boolean
  ) => Promise<any>;
}

interface IUseScriptRunnerReturn {
  scriptStatus: string;
  scriptRunning: boolean;
  handleScriptFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export const useScriptRunner = ({
  sendCommand,
}: IUseScriptRunnerProps): IUseScriptRunnerReturn => {
  const [scriptStatus, setScriptStatus] = useState(
    "Type single command above or pick a script"
  );
  const [scriptRunning, setScriptRunning] = useState(false);

  const parseScriptCommand = (
    line: string
  ): {
    command: string;
    updateFrame: boolean;
    awaitResponse: boolean;
  } | null => {
    const writeMatch = line.match(/^write\((.*)\);?$/);
    if (!writeMatch) return null;

    const argsString = writeMatch[1];
    const argsRegex = /["'](.+?)["']\s*,\s*(true|false)\s*,\s*(true|false)/;
    const argsMatch = argsString.match(argsRegex);

    if (!argsMatch) return null;

    return {
      command: argsMatch[1],
      updateFrame: argsMatch[2] === "true",
      awaitResponse: argsMatch[3] === "true",
    };
  };

  const handleScriptFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setScriptStatus(`Picked script: ${file.name}`);
    setScriptRunning(true);

    try {
      const content = await file.text();
      const lines = content.split(/\r?\n/);

      for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const line = lines[lineNumber].trim();

        if (line.startsWith("--") || line === "") {
          continue;
        }

        const parsedCommand = parseScriptCommand(line);

        if (!parsedCommand) {
          setScriptStatus(`Script syntax invalid: line ${lineNumber + 1}`);
          break;
        }

        setScriptStatus(`Sending: ${parsedCommand.command}`);
        await sendCommand(
          parsedCommand.command,
          parsedCommand.updateFrame,
          parsedCommand.awaitResponse
        );
      }

      setScriptStatus("Script execution completed");
    } catch (error) {
      console.error("Script execution failed:", error);
      setScriptStatus("Failed to read script file");
    } finally {
      setScriptRunning(false);
    }
  };

  return {
    scriptStatus,
    scriptRunning,
    handleScriptFile,
  };
};
