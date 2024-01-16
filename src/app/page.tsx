"use client";

import { faGithubAlt } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
      <header className="w-[100%] bg-gray-700 p-4 text-left text-2xl">
        Mayhem Hub
      </header>
      <main className="flex h-full min-h-screen flex-col items-center justify-between p-1">
        <SerialLoader>
          <Controller />
        </SerialLoader>
      </main>
      <footer className="text-center text-sm text-white">
        <a href="https://github.com/portapack-mayhem/MayhemHub" target="_blank">
          <FontAwesomeIcon
            icon={faGithubAlt}
            className="mr-2 text-2xl text-white"
          />
        </a>
      </footer>
    </>
  );
};
export default Home;
