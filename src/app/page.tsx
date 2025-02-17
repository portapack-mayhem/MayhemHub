"use client";

import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
              <div role="alert" className="alert m-5 mb-0 w-[50%]">
                <FontAwesomeIcon icon={faTriangleExclamation} />
                <span>
                  <p>
                    It looks like youre using a Mac! Due to Web Serial API
                    limitations on macOS, file transfers will be significantly
                    slower than on Windows/Linux. Like an hour slow! For faster
                    firmware updates, consider using a Windows or Linux system.
                    If you encounter any issues, please report them{" "}
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
