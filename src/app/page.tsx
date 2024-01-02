"use client";

import SerialLoader from "./components/SerialLoader/SerialLoader";
import Controller from "./components/Controller/Controller";

export default function Home() {
  // const SerialProvider = dynamic(
  //   async () => await import("./components/SerialProvider/SerialProvider"),
  //   {
  //     loading: () => <p>Loading...</p>,
  //     ssr: false,
  //   }
  // );

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <SerialLoader>
          <Controller />
          <p>Connected to HackRF!</p>
        </SerialLoader>
      </div>
    </main>
  );
}
