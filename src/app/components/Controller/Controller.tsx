"use client";

import React, { useEffect, useRef, useState } from "react";
import HotkeyButton from "../HotkeyButton/HotkeyButton";
import { useSerial } from "../SerialLoader/SerialLoader";
import { DataPacket } from "../SerialProvider/SerialProvider";
import ToggleSwitch from "../ToggleSwitch/ToggleSwitch";

const Controller = () => {
  const { serial, consoleMessage } = useSerial();
  const [consoleMessageList, setConsoleMessageList] = useState<string>("");
  const [command, setCommand] = useState<string>("");
  const [autoUpdateFrame, setAutoUpdateFrame] = useState<boolean>(true);
  const [loadingFrame, setLoadingFrame] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const started = useRef<boolean>(false);

  const write = async (
    command: string,
    updateFrame: boolean,
    awaitResponse: boolean = true
  ) => {
    let data: DataPacket = {
      id: 0,
      command: "",
      response: null,
    };
    if (awaitResponse) data = await serial.queueWriteAndResponse(command);
    else serial.queueWrite(command);
    if (updateFrame) {
      serial.queueWrite("screenframeshort");
      setLoadingFrame(true);
    }

    return data;
  };

  const sendCommand = async () => {
    await write(command, false);
    setCommand("");
  };

  useEffect(() => {
    // We dont add this to the console as its not needed. This may change in the future
    if (consoleMessage.includes("screenframe")) {
      renderFrame();
      setLoadingFrame(false);
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
      write(setDeviceTime(), false);
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

  const setDeviceTime = () => {
    const currentDateTime: Date = new Date();
    // Add 3 seconds to the current time to account for the time it takes to send the command
    currentDateTime.setSeconds(currentDateTime.getSeconds() + 3);
    const year: number = currentDateTime.getFullYear();
    let month: string | number = currentDateTime.getMonth() + 1; // JavaScript months are 0-11
    let day: string | number = currentDateTime.getDate();
    let hours: string | number = currentDateTime.getHours();
    let minutes: string | number = currentDateTime.getMinutes();
    let seconds: string | number = currentDateTime.getSeconds();

    // Making sure we have two digit representation
    month = month < 10 ? "0" + month : month;
    day = day < 10 ? "0" + day : day;
    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    return `rtcset ${year} ${month} ${day} ${hours} ${minutes} ${seconds}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      (e.key.length === 1 && /[a-zA-Z0-9 ]/.test(e.key)) ||
      e.key === "Backspace"
    ) {
      e.preventDefault();
      let key_code = e.key.length === 1 ? e.key.charCodeAt(0) : e.keyCode;
      const keyHex = key_code.toString(16).padStart(2, "0").toUpperCase();
      write(`keyboard ${keyHex}`, autoUpdateFrame);
    }
  };

  const downloadFile = async (filePath: string) => {
    await write("fclose", false);
    let sizeResponse = await write(`filesize ${filePath}`, false, true);
    if (!sizeResponse.response) {
      console.error("Error downloading (size) file");
    }
    let size = parseInt(sizeResponse.response?.split("\r\n")[1] || "0");
    await write(`fopen ${filePath}`, false);

    await write(`fseek 0`, false);

    let rem = size;
    let chunk = 62 * 15;

    let dataObject: Uint8Array = new Uint8Array();

    while (rem > 0) {
      if (rem < chunk) {
        chunk = rem;
      }
      let lines =
        (await write(`fread ${chunk.toString()}`, false, true)).response
          ?.split("\r\n")
          .slice(1)
          .slice(0, -2)
          .join("") || "";

      let bArr = hexToBytes(lines);
      rem -= bArr.length;
      dataObject = new Uint8Array([...dataObject, ...Array.from(bArr)]);
    }
    downloadFileFromBytes(
      dataObject,
      filePath.substring(filePath.lastIndexOf("/") + 1)
    );
    await write("fclose", false);
  };

  const hexToBytes = (hex: string) => {
    let bytes = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < bytes.length; i++)
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    return bytes;
  };

  const downloadFileFromBytes = (
    bytes: Uint8Array,
    fileName: string = "output.txt"
  ) => {
    let blob = new Blob([bytes]);
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = fileName; // Filename
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          className="flex h-full w-full flex-col items-center justify-center gap-5 p-5 outline-none focus:ring-0 md:flex-row md:items-end"
          onWheel={handleScroll}
          tabIndex={0}
          onKeyDown={(e) => {
            handleKeyDown(e);
          }}
        >
          <div
            className="flex flex-col items-center justify-center gap-5"
            id="screenGroup"
          >
            <div className="flex flex-col items-center justify-center">
              <p>Live Screen</p>
              <div className="flex flex-row items-center justify-center gap-5">
                <ToggleSwitch
                  isToggle={autoUpdateFrame}
                  toggleSwitch={() => {
                    if (!autoUpdateFrame) write("screenframeshort", false);
                    setAutoUpdateFrame(!autoUpdateFrame);
                  }}
                />
                <HotkeyButton
                  label="🔄"
                  disabled={loadingFrame}
                  onClickFunction={() => {
                    if (!loadingFrame) {
                      setLoadingFrame(true);
                      write("screenframeshort", false);
                    }
                  }}
                  className="h-6 w-6 bg-blue-500"
                  shortcutKeys={"mod+R"}
                />
              </div>
            </div>
            <canvas
              ref={canvasRef}
              width={241}
              height={321}
              className={`${
                !loadingFrame && "cursor-pointer"
              } shadow-glow shadow-neutral-500 outline-none focus:ring-0`}
              onMouseDown={(
                event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
              ) => {
                if (!canvasRef.current) return;
                const bounds = canvasRef.current.getBoundingClientRect();
                const x = event.clientX - bounds.left;
                const y = event.clientY - bounds.top;

                write(`touch ${x} ${y}`, autoUpdateFrame);
              }}
            />
          </div>

          <div
            className="flex flex-col items-center justify-center gap-5"
            id="controlGroup"
          >
            <div className="flex flex-col items-center justify-center">
              <div className="grid grid-flow-col grid-rows-3 gap-4">
                <div></div>
                <HotkeyButton
                  label="Left"
                  disabled={loadingFrame}
                  onClickFunction={() => write("button 2", autoUpdateFrame)}
                  className="h-16 w-16 bg-green-500"
                  shortcutKeys={"ArrowLeft"}
                />
                <button
                  disabled={loadingFrame}
                  onClick={() => write("button 7", autoUpdateFrame)}
                  className="h-12 w-12 self-end justify-self-start rounded bg-blue-400 text-white disabled:opacity-50"
                >
                  ↪️
                </button>
                <HotkeyButton
                  label="Up"
                  disabled={loadingFrame}
                  onClickFunction={() => write("button 4", autoUpdateFrame)}
                  className="h-16 w-16 bg-green-500"
                  shortcutKeys={"ArrowUp"}
                />
                <HotkeyButton
                  label="Ok"
                  disabled={loadingFrame}
                  onClickFunction={() => write("button 5", autoUpdateFrame)}
                  className="h-16 w-16 bg-blue-500"
                  shortcutKeys={"Enter"}
                />
                <HotkeyButton
                  label="Down"
                  disabled={loadingFrame}
                  onClickFunction={() => write("button 3", autoUpdateFrame)}
                  className="h-16 w-16 bg-green-500"
                  shortcutKeys={"ArrowDown"}
                />
                <div></div>
                <HotkeyButton
                  label="Right"
                  disabled={loadingFrame}
                  onClickFunction={() => write("button 1", autoUpdateFrame)}
                  className="h-16 w-16 bg-green-500"
                  shortcutKeys={"ArrowRight"}
                />
                <button
                  disabled={loadingFrame}
                  onClick={() => write("button 8", autoUpdateFrame)}
                  className="h-12 w-12 self-end justify-self-end rounded bg-blue-400 text-white disabled:opacity-50"
                >
                  ↩️
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <HotkeyButton
                label="DFU"
                disabled={loadingFrame}
                onClickFunction={() => write("button 6", autoUpdateFrame)}
                className="h-16 w-16 bg-slate-400"
                shortcutKeys={"mod+D"}
              />
              <button
                disabled={loadingFrame}
                onClick={() => write("reboot", autoUpdateFrame)}
                className="h-16 w-16 rounded bg-slate-400 text-white disabled:opacity-50"
              >
                Reboot
              </button>
            </div>
          </div>
        </div>

        {!serial.isReading ? (
          <button
            className="rounded bg-orange-300 p-2 text-white disabled:opacity-50"
            onClick={() => serial.startReading()}
          >
            Start reading console
          </button>
        ) : (
          <>
            <div className="mt-10 flex w-[80%] items-center justify-center gap-1">
              {/* <button
                onClick={() => downloadFile("test.txt")}
                className="h-12 w-12 self-end justify-self-end rounded bg-blue-400 text-white disabled:opacity-50"
              >
                Test
              </button> */}
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
