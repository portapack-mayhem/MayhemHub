"use client";

import dynamic from "next/dynamic";
import Controller from "@/components/Controller/Controller";
import { Loader } from "@/components/Loader/Loader";

const Home = () => {
  const SerialLoader = dynamic(
    async () => await import("@/components/SerialLoader/SerialLoader"),
    {
      loading: () => <Loader />,
      ssr: false,
    }
  );

  return (
    <>
      <main className="flex h-full min-h-screen flex-col items-center justify-between p-1">
        <SerialLoader>
          <Controller />
        </SerialLoader>
      </main>
      <footer className="text-center text-blue-500">
        <a href="https://github.com/portapack-mayhem/MayhemHub" target="_blank">
          GitHub Repo
        </a>
      </footer>
    </>
  );
};
export default Home;
