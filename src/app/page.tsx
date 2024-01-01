"use client";

import SerialLoader from "./components/SerialLoader/SerialLoader";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <SerialLoader>
          <p>Hello world!</p>
        </SerialLoader>
      </div>
    </main>
  );
}
