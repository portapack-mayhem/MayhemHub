import { Fragment, PropsWithChildren, useRef } from "react";
import { useSerial } from "../SerialProvider/SerialProvider";

interface SerialLoaderProps {}

const SerialLoader = ({ children }: PropsWithChildren<SerialLoaderProps>) => {
  const { canUseSerial, portState, hasTriedAutoconnect, connect } = useSerial();

  const pairButtonRef = useRef<HTMLButtonElement>(null);

  const onPairButtonClick = async () => {
    const hasConnected = await connect();
    if (!hasConnected) {
      pairButtonRef.current?.focus();
    }
  };

  // If can't use serial, return error message
  if (!canUseSerial) {
    return (
      <div
        className="absolute inset-0 w-full h-full flex flex-col flex-1 min-h-screen items-center justify-center"
      >
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
  if (portState === "open") {
    return <Fragment>{children}</Fragment>;
  }

  // If autoconnect hasn't run its course yet, wait for that...
  if (!hasTriedAutoconnect) {
    return null;
  }

  // If autoconnect fails, then show manual connect button

  let buttonText = "";
  if (portState === "closed") {
    buttonText = "Connect device";
  } else if (portState === "opening") {
    buttonText = "Connecting...";
  } else if (portState === "closing") {
    buttonText = "Disconnecting...";
  }

  return (
    <div
      className="absolute inset-0 w-full h-full flex flex-col flex-1 items-center justify-center text-black"
    >
      <div className="flex flex-col w-full max-w-4xl p-10 bg-white rounded-3xl">
        <h1 className="text-4xl font-semibold mb-5">Get Started</h1>

        <p className="text-3xl mb-10 leading-snug">
          Connect your HackRF via USB to get started.
        </p>

        <button
          className="text-3xl text-white bg-green-800 p-5 pb-6 rounded-xl transition-all ring-green-800 ring-0 ring-opacity-50 hocus:bg-green-900 focus:(outline-none ring-8) disabled:(text-gray-500 cursor-not-allowed)"
          ref={pairButtonRef}
          disabled={portState === "opening" || portState === "closing"}
          onClick={onPairButtonClick}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default SerialLoader;