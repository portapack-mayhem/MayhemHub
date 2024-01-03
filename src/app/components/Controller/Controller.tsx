"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSerial } from "../SerialLoader/SerialLoader";
import ToggleSwitch from "../ToggleSwitch/ToggleSwitch";

const Controller = () => {
  const { serial, consoleMessage } = useSerial();
  const [consoleMessageList, setConsoleMessageList] = useState<string>("");
  const [command, setCommand] = useState<string>("");
  const [autoUpdateFrame, setAutoUpdateFrame] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const started = useRef<boolean>(false);

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const write = async (command: string, updateFrame: boolean) => {
    await serial.write(command).then(async (data) => {
      if (updateFrame) {
        await delay(50);
        serial.write("screenframeshort");
      }
    });
  };

  const sendCommand = () => {
    write(command, false);
    setCommand("");
  };

  useEffect(() => {
    // We dont add this to the console as its not needed. This may change in the future
    if (consoleMessage.includes("screenframe")) {
      renderFrame();
    } else {
      setConsoleMessageList(
        (prevConsoleMessageList) => prevConsoleMessageList + consoleMessage
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consoleMessage]);

  useEffect(() => {
    if (serial.isOpen && !serial.isReading && !started.current) {
      started.current = true;
      serial.startReading();
      write("screenframeshort", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serial]);

  const renderFrame = () => {
    const width = 241;
    const height = 321;
    if (!consoleMessage.includes("screenframe")) return;

    const lines = consoleMessage.split("\r\n");
    const ctx = canvasRef.current?.getContext("2d");

    if (!ctx) return false;

    for (let y = 0; y < lines.length; y++) {
      let line = lines[y];
      if (line.startsWith("screenframe")) continue;
      for (let o = 0, x = 0; o < line.length && x < 240; o++, x++) {
        try {
          let by = line.charCodeAt(o) - 32;
          let r = ((by >> 4) & 3) << 6;
          let g = ((by >> 2) & 3) << 6;
          let b = (by & 3) << 6;

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx?.fillRect(x, y, 1, 1);
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  const handleScroll = (e: React.WheelEvent) => {
    // Disabled for the moment
    // e.preventDefault();
    // if (e.deltaY < 0) {
    //   console.log("Scrolled up");
    //   // Add your scroll up Logic here
    //   write("button 7", false)
    // } else {
    //   console.log("Scrolled down");
    //   // Add your scroll down Logic here
    //   write("button 8", false)
    // }
  };

  return (
    <>
      <div className="flex h-full w-full flex-col items-center justify-center gap-5 p-5">
        <h1>Connected to HackRF!</h1>
        {!serial.isReading && "Enable console for buttons to enable"}
        <div
          id="ControllerSection"
          className="flex h-full w-full flex-col items-center justify-center gap-5 p-5"
          onWheel={handleScroll}
        >
          <div>
            <p>Live Screen</p>
            <ToggleSwitch
              isToggle={autoUpdateFrame}
              toggleSwitch={() => {
                if (!autoUpdateFrame) write("screenframeshort", false);
                setAutoUpdateFrame(!autoUpdateFrame);
              }}
            />
          </div>
          <canvas
            ref={canvasRef}
            width={241}
            height={321}
            className="cursor-pointer shadow-glow shadow-neutral-500"
            onClick={() => write("screenframeshort", false)}
          />

          <div className="flex flex-col items-center justify-center">
            <div className="grid grid-flow-col grid-rows-3 gap-4">
              <div></div>
              <button
                onClick={() => write("button 2", autoUpdateFrame)}
                className="h-16 w-16 rounded bg-green-500 text-white"
              >
                Left
              </button>
              <button
                onClick={() => write("button 7", autoUpdateFrame)}
                className="h-12 w-12 self-end justify-self-start rounded bg-blue-400 text-white"
              >
                ←
              </button>
              <button
                onClick={() => write("button 4", autoUpdateFrame)}
                className="h-16 w-16 rounded bg-green-500 text-white"
              >
                Up
              </button>
              <button
                onClick={() => write("button 5", autoUpdateFrame)}
                className="h-16 w-16 rounded bg-blue-500 text-white"
              >
                OK
              </button>
              <button
                onClick={() => write("button 3", autoUpdateFrame)}
                className="h-16 w-16 rounded bg-green-500 text-white"
              >
                Down
              </button>
              <div></div>
              <button
                onClick={() => write("button 1", autoUpdateFrame)}
                className="h-16 w-16 rounded bg-green-500 text-white"
              >
                Right
              </button>
              <button
                onClick={() => write("button 8", autoUpdateFrame)}
                className="h-12 w-12 self-end justify-self-end rounded bg-blue-400 text-white"
              >
                →
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => write("button 6", autoUpdateFrame)}
              className="h-16 w-16 rounded bg-slate-400 text-white"
            >
              DFU
            </button>
            <button
              onClick={() => write("reboot", autoUpdateFrame)}
              className="h-16 w-16 rounded bg-slate-400 text-white"
            >
              Reboot
            </button>
          </div>
        </div>

        {!serial.isReading ? (
          <button
            className="rounded bg-orange-300 p-2 text-white"
            onClick={() => serial.startReading()}
          >
            Start reading console
          </button>
        ) : (
          <>
            <div className="mt-10 flex w-[80%] items-center justify-center gap-1">
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
                className="w-full rounded-md border-2 border-blue-500 p-2 text-black"
              />
              <button
                type="submit"
                className="rounded-md bg-blue-500 p-2 text-white"
                onClick={() => {
                  sendCommand();
                }}
              >
                Send
              </button>
              <button
                type="submit"
                className="rounded-md bg-red-500 p-2 text-white"
                onClick={() => {
                  setConsoleMessageList("");
                }}
              >
                Clear
              </button>
            </div>
            <textarea
              className="h-[350px] w-[80%] rounded bg-gray-200 p-2 text-black"
              readOnly
              value={consoleMessageList}
            />
          </>
        )}
      </div>
    </>
  );
};

export default Controller;
