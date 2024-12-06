import { useCallback, useEffect, useRef, useState } from "react";
import { IDataPacket } from "@/types";

// Needing to do this as the typescript definitions for the Web Serial API are not yet complete
interface IWebSerialPort extends SerialPort {
  cancelRequested: boolean;
}

type BaudRatesType =
  | 1200
  | 2400
  | 4800
  | 9600
  | 14400
  | 31250
  | 38400
  | 56000
  | 57600
  | 76800
  | 115200;

type DataBitsType = 7 | 8;

type StopBitsType = 1 | 2;

export type PortState = "closed" | "closing" | "open" | "opening";

interface IWebSerialContext {
  initialized: boolean;
  ports: IWebSerialPort[];
}

const webSerialContext: IWebSerialContext = {
  initialized: false,
  ports: [],
};

/**
 *
 * @param {() => void} callback
 * @param {number} delay
 */
const useInterval = (callback: () => void, delay: number) => {
  useEffect(() => {
    const id = setInterval(callback, delay);
    return () => clearInterval(id);
  }, [callback, delay]);
};

export interface ISerialProvider {
  ports: IWebSerialPort[];
  isOpen: boolean;
  isReading: boolean;
  canUseSerial: boolean;
  portState: PortState;
  hasTriedAutoconnect: boolean;
  portInfo: (port: IWebSerialPort) => {
    usbVendorId: number;
    usbProductId: number;
    usbId: string;
  } | null;
  manualConnectToPort: (options?: SerialPortRequestOptions) => Promise<boolean>;
  openPort: (newPort: IWebSerialPort) => Promise<void>;
  closePort: () => Promise<void>;
  startReading: () => Promise<void>;
  stopReading: () => Promise<void>;
  write: () => Promise<void>;
  queueWrite: (message: string) => number;
  queueWriteAndResponse: (message: string) => Promise<IDataPacket>;
  queueWriteAndResponseBinary: (message: Uint8Array) => Promise<IDataPacket>;
  commandResponseMap: IDataPacket[];
  options: {
    baudRate: BaudRatesType;
    bufferSize: number;
    dataBits: DataBitsType;
    stopBits: StopBitsType;
    flowControl: FlowControlType;
    parity: ParityType;
    setBaudRate: (baudRate: BaudRatesType) => void;
    setBufferSize: (bufferSize: number) => void;
    setDataBits: (dataBits: DataBitsType) => void;
    setStopBits: (stopBits: StopBitsType) => void;
    setFlowControl: (flowControl: FlowControlType) => void;
    setParity: (parity: ParityType) => void;
  };
  signals: {
    break: boolean;
    dataTerminalReady: boolean;
    requestToSend: boolean;
    clearToSend: boolean;
    dataCarrierDetect: boolean;
    dataSetReady: boolean;
    ringIndicator: boolean;
    setBreak: (value: boolean) => void;
    setDataTerminalReady: (value: boolean) => void;
    setRequestToSend: (value: boolean) => void;
  };
}
/**
 *
 * @param {{
 *  onConnect?: (WebSerialPort) => undefined
 *  onDisconnect?: (WebSerialPort) => undefined
 *  onData: (Uint8Array) => undefined
 * }}
 * @returns
 */
const useWebSerial = ({
  onConnect,
  onDisconnect,
  onData,
}: {
  onConnect?: (port: IWebSerialPort) => void;
  onDisconnect?: (port: IWebSerialPort) => void;
  onData: (data: string) => void;
}): ISerialProvider => {
  const [hasTriedAutoconnect, setHasTriedAutoconnect] = useState(false);

  const [canUseSerial] = useState(() => "serial" in navigator);
  const portState = useRef<PortState>("closed");
  const portRef = useRef<IWebSerialPort | null>(null);
  const [ports, setPorts] = useState<IWebSerialPort[]>(webSerialContext.ports);
  const [isOpen, setIsOpen] = useState(false);
  const [isReading, setIsReading] = useState<boolean>(false);
  const isIncomingMessage = useRef<boolean>(false);
  const [baudRate, setBaudRate] = useState<BaudRatesType>(115200);
  const [bufferSize, setBufferSize] = useState(30);
  const [dataBits, setDataBits] = useState<DataBitsType>(8);
  const [stopBits, setStopBits] = useState<StopBitsType>(1);
  const [flowControl, setFlowControl] = useState<FlowControlType>("none");
  const [parity, setParity] = useState<ParityType>("none");
  const [dataTerminalReady, setDataTerminalReady] = useState(false);
  const [requestToSend, setRequestToSend] = useState(false);
  const [breakSignal, setBreak] = useState(false);
  const [clearToSend, setClearToSend] = useState(false);
  const [dataCarrierDetect, setDataCarrierDetect] = useState(false);
  const [dataSetReady, setDataSetReady] = useState(false);
  const [ringIndicator, setRingIndicator] = useState(false);

  const [messageQueue, setMessageQueue] = useState<Array<Uint8Array>>([]);
  const commandResponseMap = useRef<IDataPacket[]>([]);
  const commandCounter = useRef(0);

  useInterval(() => {
    const port = portRef.current;
    if (port?.readable) {
      port.getSignals().then((signals: any) => {
        if (signals.clearToSend !== clearToSend) {
          setClearToSend(signals.clearToSend);
        }
        if (signals.dataCarrierDetect !== dataCarrierDetect) {
          setDataCarrierDetect(signals.dataCarrierDetect);
        }
        if (signals.dataSetReady !== dataSetReady) {
          setDataSetReady(signals.dataSetReady);
        }
        if (signals.ringIndicator !== ringIndicator) {
          setRingIndicator(signals.ringIndicator);
        }
      });
    }
  }, 100);

  const _onConnect = () => {
    const port = portRef.current;
    if (onConnect && port) {
      onConnect(port);
      autoConnectToPort();
    }
  };

  const _onDisconnect = () => {
    const port = portRef.current;
    if (onDisconnect && port) {
      portState.current = "closed";
      onDisconnect(port);
    }
  };

  /**
   *
   * @param {SerialPortRequestOptions} [options]
   */
  const manualConnectToPort = async (options?: SerialPortRequestOptions) => {
    if (canUseSerial && portState.current === "closed") {
      portState.current = "opening";

      try {
        const port = await navigator.serial.requestPort(options);
        openPort(port as IWebSerialPort);
        return true;
      } catch (error) {
        portState.current = "closed";
        console.error("User did not select port");
      }
    }
    return false;
  };

  const autoConnectToPort = async () => {
    if (canUseSerial && portState.current === "closed") {
      portState.current = "opening";

      const availablePorts = await navigator.serial.getPorts();
      if (availablePorts.length) {
        const port = availablePorts[0];
        await openPort(port as IWebSerialPort);
        return true;
      } else {
        portState.current = "closed";
      }
      setHasTriedAutoconnect(true);
    }
    return false;
  };

  /**
   *
   * @param {IWebSerialPort} port
   */
  const portInfo = (port: IWebSerialPort) => {
    const info = port.getInfo();
    if (info.usbVendorId && info.usbProductId) {
      return {
        usbVendorId: info.usbVendorId,
        usbProductId: info.usbProductId,
        usbId: `${info.usbVendorId
          .toString(16)
          .padStart(4, "0")}:${info.usbProductId
          .toString(16)
          .padStart(4, "0")}`,
      };
    }
    return null;
  };

  const openPort = async (newPort: IWebSerialPort) => {
    if (!newPort) {
      throw new Error("useWebSerial: No port selected");
    }

    if (newPort.readable) {
      console.log("Port already opened, reconnecting...");
      portRef.current = newPort;
      portState.current = "open";
      setIsOpen(true);
      return;
    }

    try {
      await newPort.open({
        baudRate,
        bufferSize,
        dataBits,
        flowControl,
        parity,
        stopBits,
      });
      portRef.current = newPort;
      portState.current = "open";
      setIsOpen(true);
    } catch (error) {
      portState.current = "closed";
      setIsOpen(false);
      console.error("Could not open port");
      throw new Error("Could not open port");
    }
  };

  const closePort = async () => {
    const port = portRef.current;
    if (!port) {
      throw new Error("useWebSerial: No port selected");
    }

    if (!port.readable) {
      throw new Error("useWebSerial: Port not opened");
    }

    if (port.readable.locked) {
      throw new Error("useWebSerial: Port is locked (stopReading first)");
    }

    await port.close();

    setIsOpen(false);
  };

  const startReading = async () => {
    const port = portRef.current;

    if (!port) {
      throw new Error("no port selected");
    }

    if (!port.readable) {
      throw new Error("port not opened");
    }

    setIsReading(true);
    port.cancelRequested = false;
    const reader = port.readable.getReader();

    let decoder = new TextDecoder();
    let completeString = "";

    try {
      let lastProcessedCommand = 0;
      do {
        await reader.read().then(({ done, value }) => {
          isIncomingMessage.current = true;
          completeString += decoder.decode(value);
          if (
            done ||
            completeString.endsWith("ch> ") ||
            completeString.endsWith(" bytes\r\n") // This is to handle fwb as it ends with "send x bytes"
          ) {
            onData(completeString);

            let lastCommandIndex = commandResponseMap.current.find(
              (item) => item.id === lastProcessedCommand
            );

            if (lastCommandIndex) {
              if (
                completeString.startsWith(lastCommandIndex.command) ||
                lastCommandIndex.command === "binary"
              ) {
                lastCommandIndex.response = completeString;
                lastProcessedCommand = lastProcessedCommand + 1;
              } else {
                console.log(
                  "Command does not match the response, skipping",
                  lastCommandIndex.command,
                  lastCommandIndex.response
                );
              }
            }
            completeString = "";
            isIncomingMessage.current = false;
            return;
          }
        });
      } while (!port.cancelRequested);
    } finally {
      reader.releaseLock();
    }
  };

  const stopReading = async () => {
    const port = portRef.current;
    if (!port) {
      throw new Error("no port selected");
    }

    if (!port.readable) {
      throw new Error("port not opened");
    }

    setIsReading(false);
    port.cancelRequested = true;
  };

  const delay = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  /**
   *
   * @param {string} message
   */
  const write = useCallback(async () => {
    if (messageQueue.length === 0 || isIncomingMessage.current) {
      return;
    }

    const port = portRef.current;
    let data = messageQueue[0]; // Fetch the oldest message (the first one in the array)

    const writer = port?.writable?.getWriter();
    if (writer) {
      try {
        // Once speed is fixed, this can be swapped in for the loop below
        await writer.write(data);

        // let blob = new Blob([data]);
        // const arrayBuffer = await blob.arrayBuffer();
        // const chunkSize = 350;

        // for (let i = 0; i < arrayBuffer.byteLength; i += chunkSize) {
        //   const chunk = arrayBuffer.slice(i, i + chunkSize);
        //   await delay(5);
        //   await writer.write(new Uint8Array(chunk));
        // }
        writer.releaseLock();

        setMessageQueue((prevQueue) => prevQueue.slice(1)); // Remove the message we just wrote from the queue
      } finally {
        writer.releaseLock();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageQueue, isIncomingMessage.current]);

  useEffect(() => {
    if (messageQueue.length > 0) {
      write();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageQueue, write, isIncomingMessage.current]); // This effect will run every time `messageQueue` changes

  const queueWrite = (message: string) => {
    const id = commandCounter.current++;
    message = message + "\r";
    commandResponseMap.current = [
      ...commandResponseMap.current,
      {
        id: id,
        command: message,
        response: null,
      },
    ];

    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    setMessageQueue((prevQueue) => [...prevQueue, data]); // Add the new message to the end of the queue

    return id;
  };

  // useEffect(() => {
  //   console.log(commandResponseMap.current);
  // }, [commandResponseMap.current]);

  const queueWriteAndResponse = async (message: string) => {
    const id = commandCounter.current++;
    message = message + "\r";
    commandResponseMap.current = [
      ...commandResponseMap.current,
      {
        id: id,
        command: message,
        response: null,
      },
    ];

    const encoder = new TextEncoder();
    const data = await encoder.encode(message);

    setMessageQueue((prevQueue) => [...prevQueue, data]); // Add the new message to the end of the queue

    let commandResponse;
    while (
      !(commandResponse = commandResponseMap.current.find(
        (item) => item.id === id && item.response !== null
      ))
    ) {
      await new Promise((r) => setTimeout(r, 50));
    }

    return commandResponse;
  };

  const queueWriteAndResponseBinary = async (message: Uint8Array) => {
    const id = commandCounter.current++;

    const messageString = "binary";
    // const messageString = String.fromCharCode.apply(
    //   null,
    //   Array.from(new Uint8Array(message))
    // );
    commandResponseMap.current = [
      ...commandResponseMap.current,
      {
        id: id,
        command: messageString,
        response: null,
      },
    ];

    setMessageQueue((prevQueue) => [...prevQueue, message]); // Add the new message to the end of the queue

    let commandResponse;
    while (
      !(commandResponse = commandResponseMap.current.find(
        (item) => item.id === id && item.response !== null
      ))
    ) {
      await new Promise((r) => setTimeout(r, 50));
    }

    return commandResponse;
  };

  useEffect(() => {
    if (canUseSerial) {
      navigator.serial.addEventListener("connect", _onConnect);
      navigator.serial.addEventListener("disconnect", _onDisconnect);
      return () => {
        navigator.serial.removeEventListener("connect", _onConnect);
        navigator.serial.removeEventListener("disconnect", _onDisconnect);
      };
    }
  });

  useEffect(() => {
    if (webSerialContext.initialized || !canUseSerial) {
      return;
    }

    webSerialContext.initialized = true;

    navigator.serial.getPorts().then((ports) => {
      if (ports.length >= 1) {
        webSerialContext.ports = ports as IWebSerialPort[];
        setPorts(ports as IWebSerialPort[]);
        portRef.current = ports[0] as IWebSerialPort;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {}, [
    baudRate,
    bufferSize,
    dataBits,
    stopBits,
    flowControl,
    parity,
  ]);

  useEffect(() => {
    const port = portRef.current;
    if (port && port.readable) {
      port.setSignals({
        break: breakSignal,
        dataTerminalReady,
        requestToSend,
      });
    }
  }, [portRef, dataTerminalReady, requestToSend, breakSignal]);

  // Tries to auto-connect to a port, if possible
  useEffect(() => {
    if (
      canUseSerial &&
      !hasTriedAutoconnect &&
      portState.current === "closed"
    ) {
      autoConnectToPort();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseSerial, hasTriedAutoconnect, portState]);

  return {
    ports,
    isOpen,
    isReading,
    canUseSerial,
    portState: portState.current,
    hasTriedAutoconnect,
    commandResponseMap: commandResponseMap.current,
    portInfo,
    manualConnectToPort,
    openPort,
    closePort,
    startReading,
    stopReading,
    write,
    queueWrite,
    queueWriteAndResponse,
    queueWriteAndResponseBinary,
    options: {
      baudRate,
      bufferSize,
      dataBits,
      stopBits,
      flowControl,
      parity,
      setBaudRate,
      setBufferSize,
      setDataBits,
      setStopBits,
      setFlowControl,
      setParity,
    },
    signals: {
      break: breakSignal,
      dataTerminalReady,
      requestToSend,
      clearToSend,
      dataCarrierDetect,
      dataSetReady,
      ringIndicator,
      setBreak,
      setDataTerminalReady,
      setRequestToSend,
    },
  };
};
export default useWebSerial;

const getString: () => string = () => {
  return "Hello, world!";
};
