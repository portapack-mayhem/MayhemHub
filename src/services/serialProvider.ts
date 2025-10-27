import { useCallback, useEffect, useRef, useState } from "react";
import { IDataPacket } from "@/types";

// Web Serial API type extensions
interface IWebSerialPort extends SerialPort {
  cancelRequested: boolean;
}

type BaudRate =
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

type DataBits = 7 | 8;
type StopBits = 1 | 2;

export type PortState = "closed" | "closing" | "open" | "opening";

interface ISerialContext {
  initialized: boolean;
  ports: IWebSerialPort[];
}

interface ISerialOptions {
  baudRate: BaudRate;
  bufferSize: number;
  dataBits: DataBits;
  stopBits: StopBits;
  flowControl: FlowControlType;
  parity: ParityType;
}

interface ISerialSignals {
  break: boolean;
  dataTerminalReady: boolean;
  requestToSend: boolean;
  clearToSend: boolean;
  dataCarrierDetect: boolean;
  dataSetReady: boolean;
  ringIndicator: boolean;
}

interface IPortInfo {
  usbVendorId: number;
  usbProductId: number;
  usbId: string;
}

export interface ISerialProvider {
  ports: IWebSerialPort[];
  isOpen: boolean;
  isReading: boolean;
  canUseSerial: boolean;
  portState: PortState;
  hasTriedAutoconnect: boolean;
  commandResponseMap: IDataPacket[];
  portInfo: (port: IWebSerialPort) => IPortInfo | null;
  manualConnectToPort: (options?: SerialPortRequestOptions) => Promise<boolean>;
  openPort: (newPort: IWebSerialPort) => Promise<void>;
  closePort: () => Promise<void>;
  startReading: () => Promise<void>;
  stopReading: () => Promise<void>;
  write: () => Promise<void>;
  queueWrite: (message: string) => number;
  queueWriteAndResponse: (message: string) => Promise<IDataPacket>;
  queueWriteAndResponseBinary: (message: Uint8Array) => Promise<IDataPacket>;
  options: {
    baudRate: BaudRate;
    bufferSize: number;
    dataBits: DataBits;
    stopBits: StopBits;
    flowControl: FlowControlType;
    parity: ParityType;
    setBaudRate: (baudRate: BaudRate) => void;
    setBufferSize: (bufferSize: number) => void;
    setDataBits: (dataBits: DataBits) => void;
    setStopBits: (stopBits: StopBits) => void;
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

interface IUseWebSerialProps {
  onConnect?: (port: IWebSerialPort) => void;
  onDisconnect?: (port: IWebSerialPort) => void;
  onData: (data: string) => void;
}

// Global serial context (singleton pattern for port management)
const serialContext: ISerialContext = {
  initialized: false,
  ports: [],
};

// Constants
const SIGNAL_POLL_INTERVAL = 100;
const COMMAND_POLL_INTERVAL = 50;
const DEFAULT_BAUD_RATE: BaudRate = 115200;
const DEFAULT_BUFFER_SIZE = 30;
const DEFAULT_DATA_BITS: DataBits = 8;
const DEFAULT_STOP_BITS: StopBits = 1;

// Utility: Interval hook
const useInterval = (callback: () => void, delay: number) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => savedCallback.current();
    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
};

// Utility: Check if message is complete
const isMessageComplete = (message: string): boolean => {
  return message.endsWith("ch> ") || message.endsWith(" bytes\r\n");
};

// Utility: Format USB ID
const formatUsbId = (vendorId: number, productId: number): string => {
  return `${vendorId.toString(16).padStart(4, "0")}:${productId
    .toString(16)
    .padStart(4, "0")}`;
};

/**
 * Custom hook for Web Serial API integration
 * Provides complete serial port management with queue-based command handling
 */
const useWebSerial = ({
  onConnect,
  onDisconnect,
  onData,
}: IUseWebSerialProps): ISerialProvider => {
  // Connection state
  const [hasTriedAutoconnect, setHasTriedAutoconnect] = useState(false);
  const [canUseSerial] = useState(() => "serial" in navigator);
  const [isOpen, setIsOpen] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [ports, setPorts] = useState<IWebSerialPort[]>(serialContext.ports);

  // Port references
  const portState = useRef<PortState>("closed");
  const portRef = useRef<IWebSerialPort | null>(null);
  const isIncomingMessage = useRef(false);

  // Serial configuration
  const [baudRate, setBaudRate] = useState<BaudRate>(DEFAULT_BAUD_RATE);
  const [bufferSize, setBufferSize] = useState(DEFAULT_BUFFER_SIZE);
  const [dataBits, setDataBits] = useState<DataBits>(DEFAULT_DATA_BITS);
  const [stopBits, setStopBits] = useState<StopBits>(DEFAULT_STOP_BITS);
  const [flowControl, setFlowControl] = useState<FlowControlType>("none");
  const [parity, setParity] = useState<ParityType>("none");

  // Signal state
  const [dataTerminalReady, setDataTerminalReady] = useState(false);
  const [requestToSend, setRequestToSend] = useState(false);
  const [breakSignal, setBreak] = useState(false);
  const [clearToSend, setClearToSend] = useState(false);
  const [dataCarrierDetect, setDataCarrierDetect] = useState(false);
  const [dataSetReady, setDataSetReady] = useState(false);
  const [ringIndicator, setRingIndicator] = useState(false);

  // Command queue management
  const [messageQueue, setMessageQueue] = useState<Uint8Array[]>([]);
  const commandResponseMap = useRef<IDataPacket[]>([]);
  const commandCounter = useRef(0);

  // Poll serial signals
  useInterval(() => {
    const port = portRef.current;
    if (!port?.readable) return;

    port.getSignals().then((signals) => {
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
  }, SIGNAL_POLL_INTERVAL);

  // Connection handlers
  const handleConnect = useCallback(() => {
    const port = portRef.current;
    if (onConnect && port) {
      onConnect(port);
    }
  }, [onConnect]);

  const handleDisconnect = useCallback(() => {
    const port = portRef.current;
    if (onDisconnect && port) {
      portState.current = "closed";
      onDisconnect(port);
    }
  }, [onDisconnect]);

  // Get port information
  const portInfo = useCallback((port: IWebSerialPort): IPortInfo | null => {
    const info = port.getInfo();
    if (!info.usbVendorId || !info.usbProductId) {
      return null;
    }

    return {
      usbVendorId: info.usbVendorId,
      usbProductId: info.usbProductId,
      usbId: formatUsbId(info.usbVendorId, info.usbProductId),
    };
  }, []);

  // Manual port connection
  const manualConnectToPort = useCallback(
    async (options?: SerialPortRequestOptions): Promise<boolean> => {
      if (!canUseSerial || portState.current !== "closed") {
        return false;
      }

      portState.current = "opening";

      try {
        const port = await navigator.serial.requestPort(options);
        await openPort(port as IWebSerialPort);
        return true;
      } catch (error) {
        portState.current = "closed";
        console.error("User did not select port");
        return false;
      }
    },
    [canUseSerial]
  );

  // Auto-connect to available port
  const autoConnectToPort = useCallback(async (): Promise<boolean> => {
    if (!canUseSerial || portState.current !== "closed") {
      return false;
    }

    portState.current = "opening";

    try {
      const availablePorts = await navigator.serial.getPorts();
      if (availablePorts.length > 0) {
        const port = availablePorts[0];
        await openPort(port as IWebSerialPort);
        setHasTriedAutoconnect(true);
        return true;
      }
    } catch (error) {
      console.error("Auto-connect failed:", error);
    }

    portState.current = "closed";
    setHasTriedAutoconnect(true);
    return false;
  }, [canUseSerial]);

  // Open serial port
  const openPort = useCallback(
    async (newPort: IWebSerialPort): Promise<void> => {
      if (!newPort) {
        throw new Error("No port provided");
      }

      // Port already open
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
        console.error("Could not open port:", error);
        throw new Error("Could not open port");
      }
    },
    [baudRate, bufferSize, dataBits, flowControl, parity, stopBits]
  );

  // Close serial port
  const closePort = useCallback(async (): Promise<void> => {
    const port = portRef.current;

    if (!port) {
      throw new Error("No port selected");
    }

    if (!port.readable) {
      throw new Error("Port not opened");
    }

    if (port.readable.locked) {
      throw new Error("Port is locked (stop reading first)");
    }

    await port.close();
    setIsOpen(false);
  }, []);

  // Start reading from serial port
  const startReading = useCallback(async (): Promise<void> => {
    const port = portRef.current;

    if (!port) {
      throw new Error("No port selected");
    }

    if (!port.readable) {
      throw new Error("Port not opened");
    }

    setIsReading(true);
    port.cancelRequested = false;

    const reader = port.readable.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let lastProcessedCommand = 0;

    try {
      while (!port.cancelRequested) {
        const { done, value } = await reader.read();

        isIncomingMessage.current = true;
        buffer += decoder.decode(value, { stream: !done });

        if (done || isMessageComplete(buffer)) {
          onData(buffer);

          // Match response to command
          const lastCommand = commandResponseMap.current.find(
            (item) => item.id === lastProcessedCommand
          );

          if (lastCommand) {
            const isMatch =
              buffer.startsWith(lastCommand.command) ||
              lastCommand.command === "binary";

            if (isMatch) {
              lastCommand.response = buffer;
              lastProcessedCommand++;
            } else {
              console.warn(
                "Command/response mismatch:",
                lastCommand.command,
                buffer.substring(0, 50)
              );
            }
          }

          buffer = "";
          isIncomingMessage.current = false;
        }
      }
    } finally {
      reader.releaseLock();
    }
  }, [onData]);

  // Stop reading from serial port
  const stopReading = useCallback(async (): Promise<void> => {
    const port = portRef.current;

    if (!port) {
      throw new Error("No port selected");
    }

    if (!port.readable) {
      throw new Error("Port not opened");
    }

    setIsReading(false);
    port.cancelRequested = true;
  }, []);

  // Write data to serial port
  const write = useCallback(async (): Promise<void> => {
    if (messageQueue.length === 0 || isIncomingMessage.current) {
      return;
    }

    const port = portRef.current;
    const data = messageQueue[0];

    const writer = port?.writable?.getWriter();
    if (!writer) return;

    try {
      await writer.write(data);
      setMessageQueue((prevQueue) => prevQueue.slice(1));
    } finally {
      writer.releaseLock();
    }
  }, [messageQueue]);

  // Queue a write command
  const queueWrite = useCallback((message: string): number => {
    const id = commandCounter.current++;
    const commandWithTerminator = message + "\r";

    commandResponseMap.current = [
      ...commandResponseMap.current,
      {
        id,
        command: commandWithTerminator,
        response: null,
      },
    ];

    const encoder = new TextEncoder();
    const data = encoder.encode(commandWithTerminator);

    setMessageQueue((prevQueue) => [...prevQueue, data]);

    return id;
  }, []);

  // Queue a write command and wait for response
  const queueWriteAndResponse = useCallback(
    async (message: string): Promise<IDataPacket> => {
      const id = commandCounter.current++;
      const commandWithTerminator = message + "\r";

      commandResponseMap.current = [
        ...commandResponseMap.current,
        {
          id,
          command: commandWithTerminator,
          response: null,
        },
      ];

      const encoder = new TextEncoder();
      const data = encoder.encode(commandWithTerminator);

      setMessageQueue((prevQueue) => [...prevQueue, data]);

      // Poll for response
      let commandResponse: IDataPacket | undefined;
      while (
        !(commandResponse = commandResponseMap.current.find(
          (item) => item.id === id && item.response !== null
        ))
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, COMMAND_POLL_INTERVAL)
        );
      }

      return commandResponse;
    },
    []
  );

  // Queue a binary write command and wait for response
  const queueWriteAndResponseBinary = useCallback(
    async (message: Uint8Array): Promise<IDataPacket> => {
      const id = commandCounter.current++;

      commandResponseMap.current = [
        ...commandResponseMap.current,
        {
          id,
          command: "binary",
          response: null,
        },
      ];

      setMessageQueue((prevQueue) => [...prevQueue, message]);

      // Poll for response
      let commandResponse: IDataPacket | undefined;
      while (
        !(commandResponse = commandResponseMap.current.find(
          (item) => item.id === id && item.response !== null
        ))
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, COMMAND_POLL_INTERVAL)
        );
      }

      return commandResponse;
    },
    []
  );

  // Effect: Process message queue
  useEffect(() => {
    if (messageQueue.length > 0) {
      write();
    }
  }, [messageQueue, write]);

  // Effect: Update serial signals
  useEffect(() => {
    const port = portRef.current;
    if (port?.readable) {
      port.setSignals({
        break: breakSignal,
        dataTerminalReady,
        requestToSend,
      });
    }
  }, [breakSignal, dataTerminalReady, requestToSend]);

  // Effect: Register connection event listeners
  useEffect(() => {
    if (!canUseSerial) return;

    navigator.serial.addEventListener("connect", handleConnect);
    navigator.serial.addEventListener("disconnect", handleDisconnect);

    return () => {
      navigator.serial.removeEventListener("connect", handleConnect);
      navigator.serial.removeEventListener("disconnect", handleDisconnect);
    };
  }, [canUseSerial, handleConnect, handleDisconnect]);

  // Effect: Initialize serial context
  useEffect(() => {
    if (serialContext.initialized || !canUseSerial) {
      return;
    }

    serialContext.initialized = true;

    navigator.serial.getPorts().then((availablePorts) => {
      if (availablePorts.length >= 1) {
        serialContext.ports = availablePorts as IWebSerialPort[];
        setPorts(availablePorts as IWebSerialPort[]);
        portRef.current = availablePorts[0] as IWebSerialPort;
      }
    });
  }, [canUseSerial]);

  // Effect: Auto-connect on mount
  useEffect(() => {
    if (
      canUseSerial &&
      !hasTriedAutoconnect &&
      portState.current === "closed"
    ) {
      autoConnectToPort();
    }
  }, [canUseSerial, hasTriedAutoconnect, autoConnectToPort]);

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
