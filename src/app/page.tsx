"use client";

import dynamic from "next/dynamic";
import Controller from "./components/Controller/Controller";

const Home = () => {
  const SerialLoader = dynamic(
    async () => await import("./components/SerialLoader/SerialLoader"),
    {
      loading: () => <p>Loading...</p>,
      ssr: false,
    }
  );

  return (
    <main className="flex h-full min-h-screen flex-col items-center justify-between p-1">
      <SerialLoader>
        <Controller />
      </SerialLoader>
    </main>
  );
};
export default Home;
