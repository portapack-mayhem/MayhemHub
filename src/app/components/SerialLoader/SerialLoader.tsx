import { Fragment, PropsWithChildren, useRef } from "react";
import { useWebSerial } from "../SerialProvider/SerialProvider";

interface SerialLoaderProps {}

const SerialLoader = ({ children }: PropsWithChildren<SerialLoaderProps>) => {
  // const { canUseSerial, portState, hasTriedAutoconnect, connect } = useSerial();

  const pairButtonRef = useRef<HTMLButtonElement>(null);

  const serial = useWebSerial({
    onConnect: (data: any) => {
      // ToDo: Auto connect when its connected (But have a select toggle to be able to turn this off)
      console.log("onConnect", data);
    },
    onDisconnect: (data: any) => {
      console.log("onDisconnect", data);
    },
    onData: (data: string) => {
      console.log(data);
    },
  });

  const onPairButtonClick = async () => {
    // Can identify the vendor and product IDs by plugging in the device and visiting: chrome://device-log/
    // the IDs will be labeled `vid` and `pid`, respectively
    const options: SerialPortRequestOptions = {
      filters: [
        {
          usbVendorId: 0x1d50,
          usbProductId: 0x6018,
        },
      ],
    };

    // const hasConnected = await connect();
    const hasConnected = await serial.manualConnectToPort(options);
    if (!hasConnected) {
      pairButtonRef.current?.focus();
    }
  };

  // If can't use serial, return error message
  if (!serial.canUseSerial) {
    return (
      <div className="absolute inset-0 w-full h-full flex flex-col flex-1 min-h-screen items-center justify-center text-black">
        <div className="flex flex-col w-full max-w-lg p-6 bg-white rounded-xl">
          <h1 className="text-xl font-medium -mt-1 mb-2">Error</h1>
          <p className="mb-1">
            Your browser doesn&apos;t support the{" "}
            <a
              className="text-green-900 hocus:underline"
              href="https://web.dev/serial/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Web Serial API
            </a>
            !
          </p>
          <p>Please try switching to a supported browser (e.g., Chrome 89).</p>
        </div>
      </div>
    );
  }

  // If port is open, show the children!
  if (serial.portState.current === "open") {
    return (
      <Fragment>
        {!serial.isReading && (
          <button onClick={() => serial.startReading()}>Start reading</button>
        )}
        <br />
        <button onClick={() => serial.write("info")}>Info!</button>
        <br />
        <button onClick={() => serial.write("button 3")}>Button Down</button>
        <br />
        <button onClick={() => serial.write("button 5")}>Button OK</button>
        {children}
      </Fragment>
    );
  }

  // If autoconnect hasn't run its course yet, wait for that...
  if (!serial.hasTriedAutoconnect) {
    return null;
  }

  // If autoconnect fails, then show manual connect button

  let buttonText = "";
  if (serial.portState === "closed") {
    buttonText = "Connect device";
  } else if (serial.portState === "opening") {
    buttonText = "Connecting...";
  } else if (serial.portState === "closing") {
    buttonText = "Disconnecting...";
  }

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col flex-1 items-center justify-center text-black">
      <div className="flex flex-col w-full max-w-4xl p-10 bg-white rounded-3xl">
        <h1 className="text-4xl font-semibold mb-5">Get Started</h1>

        <p className="text-3xl mb-10 leading-snug">
          Connect your HackRF via USB to get started.
        </p>

        <button
          className="text-3xl text-white bg-green-800 p-5 pb-6 rounded-xl transition-all ring-green-800 ring-0 ring-opacity-50 hocus:bg-green-900 focus:(outline-none ring-8) disabled:(text-gray-500 cursor-not-allowed)"
          ref={pairButtonRef}
          disabled={
            serial.portState === "opening" || serial.portState === "closing"
          }
          onClick={onPairButtonClick}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default SerialLoader;
