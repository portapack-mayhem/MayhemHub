"use client";

import dynamic from "next/dynamic";
import SerialLoader from "./components/SerialLoader/SerialLoader";
import { useWebSerial } from "./components/SerialThing/SerialThing";

export default function Home() {
  // const SerialProvider = dynamic(
  //   async () => await import("./components/SerialProvider/SerialProvider"),
  //   {
  //     loading: () => <p>Loading...</p>,
  //     ssr: false,
  //   }
  // );

  const filters =
    // Can identify the vendor and product IDs by plugging in the device and visiting: chrome://device-log/
    // the IDs will be labeled `vid` and `pid`, respectively
    {
      usbVendorId: 0x1d50,
      usbProductId: 0x6018,
    };

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

  const selectHackRf = async () => {
    await serial.requestPort(filters);
    await serial.openPort();
  };

  return (
    <>
      <div>Hello</div>
      {!serial.isOpen && (
        <button onClick={() => selectHackRf()}>Connect</button>
      )}
      <br />
      {!serial.isReading && (
        <button onClick={() => serial.startReading()}>Start reading</button>
      )}
      <br />
      <button onClick={() => serial.write("info")}>Write!</button>
      {/* <SerialProvider>
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
          <div>
            <SerialLoader>
              <p>Connected to HackRF!</p>
            </SerialLoader>
          </div>
        </main>
      </SerialProvider> */}
    </>
  );
}
