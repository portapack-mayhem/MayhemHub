import {
  Fragment,
  PropsWithChildren,
  createContext,
  useContext,
  useRef,
  useState,
} from "react";
import Modal from "@/components/Modal/Modal";
import useWebSerial, {
  ISerialProvider,
} from "@/components/SerialProvider/SerialProvider";
import { ISerialContextValue } from "@/types";

interface ISerialLoader {}

export const SerialContext = createContext<ISerialContextValue>({
  serial: {} as ISerialProvider,
  consoleMessage: "",
});

// custom hook to use the context
export const useSerial = () => useContext(SerialContext);

const SerialLoader = ({ children }: PropsWithChildren<ISerialLoader>) => {
  const pairButtonRef = useRef<HTMLButtonElement>(null);
  const [consoleMessage, setConsoleMessage] = useState<string>();
  const [isLinuxUserModalOpen, setIsLinuxUserModalOpen] =
    useState<boolean>(false);

  const serial: ISerialProvider = useWebSerial({
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

  const toggleLinuxUserModal = () => {
    setIsLinuxUserModalOpen(!isLinuxUserModalOpen);
  };

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

  const ErrorMessage = () => (
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

  const ConnectScreen = () => {
    const isLinux = /linux/i.test(navigator.userAgent);

    return (
      <div className="flex flex-1 flex-col items-center justify-center px-5 text-center text-neutral">
        <div className="flex w-full max-w-4xl flex-col rounded-3xl bg-white p-10">
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
          <div className="pt-5">
            <i>No device found or cannot connect? </i>
            <ul className="list-inside list-disc">
              <li>
                Keep your PortaPack in normal mode (instead of HackRF mode)
              </li>
              <li>
                Make sure you are running at least stable v2.0.0, nightly
                n_240114 or newer.
              </li>
              {isLinux && (
                <li>
                  Linux user?{" "}
                  <span
                    className="cursor-pointer text-blue-600"
                    onClick={toggleLinuxUserModal}
                  >
                    Permission help
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const TitleMessage = () => (
    <div className="mt-7 flex flex-col justify-center rounded-3xl bg-neutral p-5">
      <h1 className="text-center text-2xl font-semibold">
        Welcome to the Mayhem Hub!
        <br />
        <span className="text-center text-xl font-normal italic opacity-70">
          Your one-stop-shop for everything related to Mayhem HackRF/Portapack.
        </span>
      </h1>
    </div>
  );

  const AboutMessage = () => (
    <div className="collapse collapse-arrow max-w-[80%] bg-neutral">
      <input type="checkbox" />
      <div className="collapse-title text-xl font-medium">
        What is the Mayhem Hub?
      </div>
      <div className="collapse-content flex flex-col gap-5">
        <p>
          This app is devoted to enabling you to control your HackRF/Portapack
          remotely using your computer, streamlining your experience, and
          amplifying the functionality of your device, plus a few extras...
        </p>

        <p>
          <b>One Click Firmware Upgrades:</b> No longer do you need to wade
          through complicated procedures to update your device. With a single
          click, we will manage all the hard stuff, leaving you to enjoy the new
          features and improved performance.
        </p>

        <p>
          <b>Remote File Upload and Download:</b> You can upload or download
          files to and from your HackRF/Portapack device, without needing to
          remove your Micro SD card or putting your HackRF into mass storage
          mode.
        </p>

        <p>
          <b>Live Streaming the Screen:</b> View your HackRF/Portapack screen in
          real-time. With the live streaming feature, you can monitor your
          devices screen remotely.
        </p>

        <p>
          And these are just the tip of the iceberg! Mayhem Hub is continuously
          expanding its array of utilities and features!
        </p>
      </div>
    </div>
  );

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
        <div className="flex flex-col items-center justify-center gap-10">
          <TitleMessage />
          {!serial.canUseSerial ? <ErrorMessage /> : <ConnectScreen />}
          <AboutMessage />
          <Modal
            title="Linux Permisson Guide"
            isModalOpen={isLinuxUserModalOpen}
            closeModal={toggleLinuxUserModal}
          >
            <div>
              <ol>
                <strong>Method 1:</strong>
                <ol>
                  <li>Plug in your PortaPack.</li>
                  <li>
                    Find the specific name of your Portapack device, it usually
                    is /dev/ttyUSBx or /dev/ttyACMx.
                  </li>
                  <li>
                    Run the following command: sudo chmod a+rw YOUR_DEVICE_NAME
                  </li>
                </ol>
                <strong>Method 2:</strong>
                <ol>
                  <li>Plug in your PortaPack.</li>
                  <li>
                    Run the following command: sudo usermod -a -G dialout $USER
                  </li>
                </ol>
              </ol>
            </div>
          </Modal>
        </div>
      )}
    </SerialContext.Provider>
  );
};

export default SerialLoader;
