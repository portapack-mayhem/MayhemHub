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

  return (
    <>
      <header>
        <NavBar />
      </header>
      <main className="flex h-full min-h-screen flex-col items-center justify-between p-1">
        <SerialLoader>
          <Controller />
        </SerialLoader>
      </main>
      <Footer />
    </>
  );
};
export default Home;
