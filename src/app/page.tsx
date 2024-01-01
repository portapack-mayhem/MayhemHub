"use client";

import dynamic from "next/dynamic";
import SerialLoader from "./components/SerialLoader/SerialLoader";

export default function Home() {
  const SerialProvider = dynamic(
    async () => await import("./components/SerialProvider/SerialProvider"),
    {
      loading: () => <p>Loading...</p>,
      ssr: false,
    }
  );

  return (
    <SerialProvider>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div>
          <SerialLoader>
            <p>Connected to HackRF!</p>
          </SerialLoader>
        </div>
      </main>
    </SerialProvider>
  );
}
