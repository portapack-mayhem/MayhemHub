import {
  faPaperPlane,
  faCircleXmark,
  faCode,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IConsole {
  consoleMessageList: string;
  command: string;
  setCommand: (value: string) => void;
  setConsoleMessageList: (value: string) => void;
  sendCommand: () => Promise<void>;
  scriptStatus: string;
  scriptRunning: boolean;
  scriptFileInputRef: React.RefObject<HTMLInputElement>;
}

export const Console: React.FC<IConsole> = ({
  consoleMessageList,
  command,
  setCommand,
  setConsoleMessageList,
  sendCommand,
  scriptStatus,
  scriptRunning,
  scriptFileInputRef,
}) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1">
      <textarea
        className="h-full w-full rounded bg-gray-600 p-2 font-mono text-white"
        readOnly
        value={consoleMessageList}
        id="serial_console"
      />
      {scriptRunning && (
        <div className="flex w-full flex-row items-center justify-center gap-1">
          <p className="w-full rounded-md bg-blue-700 p-2 font-mono text-white">
            {scriptStatus}
          </p>
        </div>
      )}
      <div className="flex w-full flex-row items-center justify-center gap-1">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendCommand();
            }
          }}
          placeholder="Enter command"
          className="w-full rounded-md bg-gray-600 p-2 font-mono text-white"
        />
        <button
          type="submit"
          className="btn btn-success btn-sm size-10 text-white"
          onClick={() => {
            sendCommand();
          }}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
        <button
          type="submit"
          className="btn btn-error btn-sm size-10 text-white"
          onClick={() => {
            setConsoleMessageList("");
          }}
        >
          <FontAwesomeIcon icon={faCircleXmark} />
        </button>
        <button
          type="button"
          className="btn btn-info btn-sm size-10 text-white"
          onClick={() => {
            scriptFileInputRef.current?.click();
          }}
        >
          <FontAwesomeIcon icon={faCode} />
        </button>
      </div>
    </div>
  );
};
