"use client";

import dynamic from "next/dynamic";
import Controller from "@/components/Controller/Controller";
import { Footer } from "@/components/Footer/Footer";
import { Loader } from "@/components/Loader/Loader";
import { NavBar } from "@/components/NavBar/NavBar";

const Home = () => {
  const SerialLoader = dynamic(
    async () => await import("@/components/SerialLoader/SerialLoader"),
    {
      loading: () => <Loader />,
      ssr: false,
    }
  );

  const isMac = () => {
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent;

      if (userAgent.includes("Mac")) {
        return true;
      }
    }
    return false;
  };

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <header>
          <NavBar />
        </header>
        <main className="flex min-h-0 grow flex-col items-center justify-between p-1">
          <SerialLoader>
            {isMac() && (
              <p>
                Looks like you are using a Mac. If you come across any issues,
                please let us know{" "}
                <a
                  className="text-blue-400 underline"
                  href="https://github.com/portapack-mayhem/MayhemHub/issues/43"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  here
                </a>
                .
              </p>
            )}
            <Controller />
          </SerialLoader>
        </main>
        <Footer />
      </div>
    </>
  );
};
export default Home;
