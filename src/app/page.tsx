"use client";

import Controller from "./components/Controller/Controller";
import dynamic from "next/dynamic";

export default function Home() {
  const SerialLoader = dynamic(
    async () => await import("./components/SerialLoader/SerialLoader"),
    {
      loading: () => <p>Loading...</p>,
      ssr: false,
    }
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <SerialLoader>
          <Controller />
        </SerialLoader>
      </div>
    </main>
  );
}
