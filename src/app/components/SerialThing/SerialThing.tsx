import { useEffect, useState } from "react";

interface WebSerialPort extends SerialPort {
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

interface WebSerialContext {
  initialized: boolean;
  ports: WebSerialPort[];
}

const webSerialContext: WebSerialContext = {
  initialized: false,
  ports: [],
};

/**
 *
 * @param {() => void} callback
 * @param {number} delay
 */
function useInterval(callback: () => void, delay: number) {
  useEffect(() => {
    const id = setInterval(callback, delay);
    return () => clearInterval(id);
  }, [callback, delay]);
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
export function useWebSerial({
  onConnect,
  onDisconnect,
  onData,
}: {
  onConnect?: (port: WebSerialPort) => void;
  onDisconnect?: (port: WebSerialPort) => void;
  onData: (data: string) => void;
}) {
  if (!navigator.serial) {
    throw new Error("WebSerial is not available");
  }

  const [port, setPort] = useState<WebSerialPort | undefined>();
  const [ports, setPorts] = useState<WebSerialPort[]>(webSerialContext.ports);
  const [isOpen, setIsOpen] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [baudRate, setBaudRate] = useState<BaudRatesType>(115200);
  const [bufferSize, setBufferSize] = useState(255);
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

  useInterval(() => {
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

  useEffect(() => {}, [
    baudRate,
    bufferSize,
    dataBits,
    stopBits,
    flowControl,
    parity,
  ]);

  useEffect(() => {
    if (port && port.readable) {
      port.setSignals({
        break: breakSignal,
        dataTerminalReady,
        requestToSend,
      });
    }
  }, [port, dataTerminalReady, requestToSend, breakSignal]);

  const _onConnect = () => {
    if (onConnect && port) {
      onConnect(port);
    }
  };

  const _onDisconnect = () => {
    if (onDisconnect && port) {
      onDisconnect(port);
    }
  };

  useEffect(() => {
    navigator.serial.addEventListener("connect", _onConnect);
    navigator.serial.addEventListener("disconnect", _onDisconnect);
    return () => {
      navigator.serial.removeEventListener("connect", _onConnect);
      navigator.serial.removeEventListener("disconnect", _onDisconnect);
    };
  });

  useEffect(() => {
    if (webSerialContext.initialized) {
      return;
    }

    webSerialContext.initialized = true;

    navigator.serial.getPorts().then((ports) => {
      if (ports.length >= 1) {
        webSerialContext.ports = ports as WebSerialPort[];
        setPorts(ports as WebSerialPort[]);
        setPort(ports[0] as WebSerialPort);
      }
    });
  }, []);

  /**
   *
   * @param {SerialPortFilter} [filters]
   */
  const requestPort = async (filters?: SerialPortFilter) => {
    await navigator.serial
      .requestPort({ filters: filters ? [filters] : [] })
      .then((port) => {
        setPort(port as WebSerialPort);
      });
  };

  /**
   *
   * @param {WebSerialPort} port
   */
  const portInfo = (port: WebSerialPort) => {
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

  const openPort = async () => {
    if (!port) {
      throw new Error("useWebSerial: No port selected");
    }

    if (port.readable) {
      throw new Error("useWebSerial: Port already opened");
    }

    await port.open({
      baudRate,
      bufferSize,
      dataBits,
      flowControl,
      parity,
      stopBits,
    });

    setIsOpen(true);
  };

  const closePort = async () => {
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
    if (!port) {
      throw new Error("no port selected");
    }

    if (!port.readable) {
      throw new Error("port not opened");
    }

    setIsReading(true);
    port.cancelRequested = false;
    const reader = port.readable.getReader();

    //===================

    let decoder = new TextDecoder();
    let completeString = "";

    try {
      do {
        await reader.read().then(({ done, value }) => {
          completeString += decoder.decode(value);
          if (done || completeString.endsWith("ch> ")) {
            onData(completeString);
            completeString = "";
            return;
          }
        });
      } while (!port.cancelRequested);
    } finally {
      reader.releaseLock();
    }
  };

  const stopReading = async () => {
    if (!port) {
      throw new Error("no port selected");
    }

    if (!port.readable) {
      throw new Error("port not opened");
    }

    setIsReading(false);
    port.cancelRequested = true;
  };

  /**
   *
   * @param {string} message
   */
  const write = async (message: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(message + "\r\n");
    console.log(message);

    const writer = port?.writable?.getWriter();
    try {
      await writer?.write(data);
    } finally {
      writer?.releaseLock();
    }
  };

  return {
    port,
    ports,
    isOpen,
    isReading,
    setPort,
    portInfo,
    requestPort,
    openPort,
    closePort,
    startReading,
    stopReading,
    write,
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
}
