import {
  Fragment,
  PropsWithChildren,
  createContext,
  useContext,
  useRef,
  useState,
} from "react";
import useWebSerial, {
  UseWebSerialReturn,
} from "../SerialProvider/SerialProvider";

interface SerialLoaderProps {}

export interface SerialContextValue {
  serial: UseWebSerialReturn;
  consoleMessage: string;
}
export const SerialContext = createContext<SerialContextValue>({
  serial: {} as UseWebSerialReturn,
  consoleMessage: "",
});

// custom hook to use the context
export const useSerial = () => useContext(SerialContext);

const SerialLoader = ({ children }: PropsWithChildren<SerialLoaderProps>) => {
  const pairButtonRef = useRef<HTMLButtonElement>(null);
  const [consoleMessage, setConsoleMessage] = useState<string>();

  const serial: UseWebSerialReturn = useWebSerial({
    onConnect: (data: any) => {
      // ToDo: Auto connect when its connected (But have a select toggle to be able to turn this off)
      console.log("onConnect", data);
    },
    onDisconnect: (data: any) => {
      console.log("onDisconnect", data);
    },
    onData: (data: string) => {
      // console.log(data);
      setConsoleMessage(data);
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

  const errorMessage = () => (
    <div className="flex flex-1 flex-col items-center justify-center text-black">
      <div className="flex w-full max-w-lg flex-col rounded-xl bg-white p-6">
        <h1 className="-mt-1 mb-2 text-xl font-medium">😔 Uh oh... </h1>
        <p className="mb-1 pb-5">
          Looks like your browser doesn&apos;t support the{" "}
          <a
            className="text-green-800 underline"
            href="https://caniuse.com/web-serial"
            target="_blank"
            rel="noopener noreferrer"
          >
            Web Serial API
          </a>
          .
        </p>
        <p>Please try switching to a browser that supports the API.</p>
        <p className="italic opacity-70">(e.g.: Chrome, Edge, Opera...)</p>
      </div>
    </div>
  );

  const connectScreen = () => (
    <div className="absolute inset-0 flex h-full w-full flex-1 flex-col items-center justify-center text-black">
      <div className="flex w-full max-w-4xl flex-col rounded-3xl bg-white p-10">
        <h1 className="mb-5 text-4xl font-semibold">Get Started</h1>

        <p className="mb-10 text-3xl leading-snug">
          Connect your HackRF/Portapack via USB to get started.
        </p>

        <button
          className="btn btn-success btn-lg"
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
  // If can't use serial, return error message
  if (!serial.canUseSerial) {
    return errorMessage();
  }

  // If autoconnect fails, then show manual connect button
  let buttonText = "";
  if (serial.portState === "closed") {
    buttonText = "Connect Device";
  } else if (serial.portState === "opening") {
    buttonText = "Connecting...";
  } else if (serial.portState === "closing") {
    buttonText = "Disconnecting...";
  }

  return (
    <SerialContext.Provider
      value={{ serial, consoleMessage: consoleMessage || "" }}
    >
      {serial.portState === "open" ? (
        <Fragment>{children}</Fragment>
      ) : (
        connectScreen()
      )}
    </SerialContext.Provider>
  );
};

export default SerialLoader;
