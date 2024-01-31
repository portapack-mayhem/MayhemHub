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
              <div role="alert" className="alert alert-warning m-5 w-[70%]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 shrink-0 stroke-current"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>
                  <p>
                    <p className="text-2xl">Whoa there, cowpoke!</p>
                    Looks like you are using a Mac! If you come across any
                    issues, please let us know{" "}
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
                </span>
              </div>
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
