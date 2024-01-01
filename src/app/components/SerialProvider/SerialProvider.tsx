import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";


// RESOURCES:
// https://web.dev/serial/
// https://reillyeon.github.io/serial/#onconnect-attribute-0
// https://codelabs.developers.google.com/codelabs/web-serial

export type PortState = "closed" | "closing" | "open" | "opening";

export type SerialMessage = {
  value: string;
  timestamp: number;
};

type SerialMessageCallback = (message: SerialMessage) => void;

export interface SerialContextValue {
  canUseSerial: boolean;
  hasTriedAutoconnect: boolean;
  portState: PortState;
  connect(): Promise<boolean>;
  disconnect(): void;
  subscribe(callback: SerialMessageCallback): () => void;
}
export const SerialContext = createContext<SerialContextValue>({
  canUseSerial: false,
  hasTriedAutoconnect: false,
  connect: () => Promise.resolve(false),
  disconnect: () => {},
  portState: "closed",
  subscribe: () => () => {},
});

export const useSerial = () => useContext(SerialContext);

interface SerialProviderProps {}
const SerialProvider = ({
  children,
}: PropsWithChildren<SerialProviderProps>) => {
  const [canUseSerial] = useState(() => "serial" in navigator);

  const [portState, setPortState] = useState<PortState>("closed");
  const [hasTriedAutoconnect, setHasTriedAutoconnect] = useState(false);
  const [hasManuallyDisconnected, setHasManuallyDisconnected] = useState(false);

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const readerClosedPromiseRef = useRef<Promise<void>>(Promise.resolve());

  const currentSubscriberIdRef = useRef<number>(0);
  const subscribersRef = useRef<Map<number, SerialMessageCallback>>(new Map());
  /**
   * Subscribes a callback function to the message event.
   *
   * @param callback the callback function to subscribe
   * @returns an unsubscribe function
   */
  const subscribe = (callback: SerialMessageCallback) => {
    const id = currentSubscriberIdRef.current;
    subscribersRef.current.set(id, callback);
    currentSubscriberIdRef.current++;

    return () => {
      subscribersRef.current.delete(id);
    };
  };

  /**
   * Reads from the given port until it's been closed.
   *
   * @param port the port to read from
   */
  const readUntilClosed = async (port: SerialPort) => {
    if (port.readable) {
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      readerRef.current = textDecoder.readable.getReader();

      try {
        while (true) {
          const { value, done } = await readerRef.current.read();
          if (done) {
            break;
          }
          const timestamp = Date.now();
          Array.from(subscribersRef.current).forEach(([name, callback]) => {
            callback({ value, timestamp });
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        readerRef.current.releaseLock();
      }

      await readableStreamClosed.catch(() => {}); // Ignore the error
    }
  };

  /**
   * Attempts to open the given port.
   */
  const openPort = async (port: SerialPort) => {
    try {
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      setPortState("open");
      setHasManuallyDisconnected(false);
    } catch (error) {
      setPortState("closed");
      console.error("Could not open port");
    }
  };

  const manualConnectToPort = async () => {
    if (canUseSerial && portState === "closed") {
      setPortState("opening");
      const filters = [
        // Can identify the vendor and product IDs by plugging in the device and visiting: chrome://device-log/
        // the IDs will be labeled `vid` and `pid`, respectively
        {
          usbVendorId: 0x1d50,
          usbProductId: 0x6018,
        },
      ];
      try {
        const port = await navigator.serial.requestPort({ filters });
        await openPort(port);
        return true;
      } catch (error) {
        setPortState("closed");
        console.error("User did not select port");
      }
    }
    return false;
  };

  const autoConnectToPort = async () => {
    if (canUseSerial && portState === "closed") {
      setPortState("opening");
      const availablePorts = await navigator.serial.getPorts();
      if (availablePorts.length) {
        const port = availablePorts[0];
        await openPort(port);
        return true;
      } else {
        setPortState("closed");
      }
      setHasTriedAutoconnect(true);
    }
    return false;
  };

  const manualDisconnectFromPort = async () => {
    if (canUseSerial && portState === "open") {
      const port = portRef.current;
      if (port) {
        setPortState("closing");

        // Cancel any reading from port
        readerRef.current?.cancel();
        await readerClosedPromiseRef.current;
        readerRef.current = null;

        // Close and nullify the port
        await port.close();
        portRef.current = null;

        // Update port state
        setHasManuallyDisconnected(true);
        setHasTriedAutoconnect(false);
        setPortState("closed");
      }
    }
  };

  /**
   * Event handler for when the port is disconnected unexpectedly.
   */
  const onPortDisconnect = async () => {
    // Wait for the reader to finish it's current loop
    await readerClosedPromiseRef.current;
    // Update state
    readerRef.current = null;
    readerClosedPromiseRef.current = Promise.resolve();
    portRef.current = null;
    setHasTriedAutoconnect(false);
    setPortState("closed");
  };

  // Handles attaching the reader and disconnect listener when the port is open
  useEffect(() => {
    const port = portRef.current;
    if (portState === "open" && port) {
      // When the port is open, read until closed
      const aborted = { current: false };
      readerRef.current?.cancel();
      readerClosedPromiseRef.current.then(() => {
        if (!aborted.current) {
          readerRef.current = null;
          readerClosedPromiseRef.current = readUntilClosed(port);
        }
      });

      // Attach a listener for when the device is disconnected
      navigator.serial.addEventListener("disconnect", onPortDisconnect);

      return () => {
        aborted.current = true;
        navigator.serial.removeEventListener("disconnect", onPortDisconnect);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portState]);

  // Tries to auto-connect to a port, if possible
  useEffect(() => {
    if (
      canUseSerial &&
      !hasManuallyDisconnected &&
      !hasTriedAutoconnect &&
      portState === "closed"
    ) {
      autoConnectToPort();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseSerial, hasManuallyDisconnected, hasTriedAutoconnect, portState]);

  return (
    <SerialContext.Provider
      value={{
        canUseSerial,
        hasTriedAutoconnect,
        subscribe,
        portState,
        connect: manualConnectToPort,
        disconnect: manualDisconnectFromPort,
      }}
    >
      {children}
    </SerialContext.Provider>
  );
};

export default SerialProvider;
