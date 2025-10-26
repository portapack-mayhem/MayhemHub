import {
  faPaperPlane,
  faCircleXmark,
  faCode,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IConsoleProps {
  consoleMessageList: string;
  command: string;
  setCommand: (value: string) => void;
  setConsoleMessageList: (value: string) => void;
  sendCommand: () => Promise<void>;
  scriptStatus: string;
  scriptRunning: boolean;
  scriptFileInputRef: React.RefObject<HTMLInputElement>;
}

const Console = ({
  consoleMessageList,
  command,
  setCommand,
  setConsoleMessageList,
  sendCommand,
  scriptStatus,
  scriptRunning,
  scriptFileInputRef,
}: IConsoleProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendCommand();
    }
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1">
      <textarea
        className="h-full w-full rounded-md bg-component p-2 font-mono text-white resize-none"
        readOnly
        value={consoleMessageList}
        id="serial_console"
      />
      {scriptRunning && (
        <div className="flex w-full flex-row items-center justify-center gap-1">
          <p className="w-full rounded-md bg-component p-2 font-mono text-white">
            {scriptStatus}
          </p>
        </div>
      )}
      <div className="flex w-full flex-row items-center justify-center gap-1">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command"
          className="w-full rounded-md bg-component p-2 font-mono text-white shadow-[0_0_10px_rgba(255,255,255,0.3)] focus:shadow-[0_0_15px_rgba(255,255,255,0.5)] outline-none transition-shadow duration-300"
        />
        <button
          type="button"
          className="btn btn-success btn-sm size-10 text-white"
          onClick={sendCommand}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
        <button
          type="button"
          className="btn btn-error btn-sm size-10 text-white"
          onClick={() => setConsoleMessageList("")}
        >
          <FontAwesomeIcon icon={faCircleXmark} />
        </button>
        <button
          type="button"
          className="btn btn-info btn-sm size-10 text-white"
          onClick={() => scriptFileInputRef.current?.click()}
        >
          <FontAwesomeIcon icon={faCode} />
        </button>
      </div>
    </div>
  );
};

export default Console;
