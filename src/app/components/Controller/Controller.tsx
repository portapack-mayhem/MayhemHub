"use client";

import { useEffect } from "react";
import { useSerial } from "../SerialLoader/SerialLoader";

export default function Controller() {
  const { serial } = useSerial();

  useEffect(() => {
    console.log(serial);
  }, [serial]);

  return (
    <>
      <div>Hellow from controller</div>
    </>
  );
}
