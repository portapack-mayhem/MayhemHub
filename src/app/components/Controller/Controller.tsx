"use client";

import { useEffect, useState } from "react";
import { useSerial } from "../SerialLoader/SerialLoader";

export default function Controller() {
  const { serial, consoleMessage } = useSerial();
  const [consoleMessageList, setConsoleMessageList] = useState<string>("");

  useEffect(() => {
    setConsoleMessageList(
      (prevConsoleMessageList) => prevConsoleMessageList + consoleMessage
    );
  }, [consoleMessage]);

  return (
    <>
      <div className="flex flex-col items-center justify-center gap-5 p-5 w-full h-full">
        <h1>Connected to HackRF!</h1>
        <div className="flex flex-col items-center justify-center">
          <div className="grid grid-rows-3 grid-flow-col gap-4">
            <div></div>
            <button
              onClick={() => serial.write("button 2")}
              className="w-16 h-16 bg-green-500 text-white rounded"
            >
              Left
            </button>
            <div></div>
            <button
              onClick={() => serial.write("button 4")}
              className="w-16 h-16 bg-green-500 text-white rounded"
            >
              Up
            </button>
            <button
              onClick={() => serial.write("button 5")}
              className="w-16 h-16 bg-blue-500 text-white rounded"
            >
              OK
            </button>
            <button
              onClick={() => serial.write("button 3")}
              className="w-16 h-16 bg-green-500 text-white rounded"
            >
              Down
            </button>
            <div></div>
            <button
              onClick={() => serial.write("button 1")}
              className="w-16 h-16 bg-green-500 text-white rounded"
            >
              Right
            </button>
            <div></div>
          </div>
        </div>

        <button
          className="p-2 bg-slate-400 text-white rounded"
          onClick={() => serial.write("info")}
        >
          Send info command
        </button>
        {!serial.isReading && (
          <button
            className="p-2 bg-orange-300 text-white rounded"
            onClick={() => serial.startReading()}
          >
            Start reading console
          </button>
        )}

        <textarea
          className="w-[80%] h-[350px] p-2 bg-gray-200 rounded text-black"
          readOnly
          value={consoleMessageList}
        />
      </div>
    </>
  );
}
