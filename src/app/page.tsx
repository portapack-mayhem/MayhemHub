"use client";

import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dynamic from "next/dynamic";
import { Footer } from "@/components/Footer/Footer";
import { Loader } from "@/components/Loader/Loader";
import { NavBar } from "@/components/NavBar/NavBar";
import Controller from "@/features/device/components/Controller";

const isMacOS = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.navigator.userAgent.includes("Mac");
};

const Home = () => {
  const SerialLoader = dynamic(
    () => import("@/components/SerialLoader/SerialLoader"),
    {
      loading: () => <Loader />,
      ssr: false,
    }
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header>
        <NavBar />
      </header>
      <main className="flex min-h-0 grow flex-col items-center justify-between p-1">
        <SerialLoader>
          {isMacOS() && (
            <div role="alert" className="alert m-5 mb-0 w-[50%]">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              <span>
                <p>
                  Looks like you are using a Mac! If you come across any issues,
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
              </span>
            </div>
          )}
          <Controller />
        </SerialLoader>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
