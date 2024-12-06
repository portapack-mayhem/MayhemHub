import { useState, useEffect, useRef } from "react";
import { FileStructure } from "@/components/FileBrowser/FileBrowser";
import { ISerialProvider } from "@/components/SerialProvider/SerialProvider";
import { ILatestVersions } from "@/types";
import { parseDirectories } from "@/utils/fileUtils";
import { getLatestVersions } from "@/utils/versionUtils";

interface IDeviceSetup {
  serial: ISerialProvider;
  write: (
    command: string,
    updateFrame: boolean,
    awaitResponse?: boolean
  ) => Promise<any>;
  setConsoleMessageList: (value: string) => void;
  setDirStructure: (value: FileStructure[]) => void;
  setLatestVersion: (value: ILatestVersions) => void;
}

interface IDeviceSetupReturn {
  setupComplete: boolean;
  deviceVersion: string;
}

export const useDeviceSetup = ({
  serial,
  write,
  setConsoleMessageList,
  setDirStructure,
  setLatestVersion,
}: IDeviceSetup): IDeviceSetupReturn => {
  const [setupComplete, setSetupComplete] = useState(false);
  const [deviceVersion, setDeviceVersion] = useState("");

  const started = useRef<boolean>(false);

  const setDeviceTime = () => {
    const currentDateTime: Date = new Date();
    // Add 3 seconds to the current time to account for the time it takes to send the command
    currentDateTime.setSeconds(currentDateTime.getSeconds() + 3);
    const year: number = currentDateTime.getFullYear();
    let month: string | number = currentDateTime.getMonth() + 1; // JavaScript months are 0-11
    let day: string | number = currentDateTime.getDate();
    let hours: string | number = currentDateTime.getHours();
    let minutes: string | number = currentDateTime.getMinutes();
    let seconds: string | number = currentDateTime.getSeconds();

    // Making sure we have two digit representation
    month = month < 10 ? "0" + month : month;
    day = day < 10 ? "0" + day : day;
    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    return `rtcset ${year} ${month} ${day} ${hours} ${minutes} ${seconds}`;
  };

  useEffect(() => {
    if (serial.isOpen && !serial.isReading && !started.current) {
      started.current = true;
      serial.startReading();

      const initSerialSetupCalls = async () => {
        await write(setDeviceTime(), false);

        const infoCmd = (await write("info", false, true)).response;
        const matches = infoCmd?.match(/Mayhem Version:\s*(.*)/i);

        if (matches && matches.length > 1) {
          const mayhemVersion = matches[1];
          setDeviceVersion(mayhemVersion);
        } else {
          console.log("Mayhem version not found!");
        }

        await fetchFolderStructure();

        write("screenframeshort", false);

        setConsoleMessageList("");
        setSetupComplete(true);

        setLatestVersion(await getLatestVersions());
      };

      const fetchFolderStructure = async () => {
        const rootStructure = await write(`ls /`, false, true); // get the children directories

        if (rootStructure.response) {
          const rootItems = rootStructure.response.split("\r\n").slice(1, -1);

          const fileStructures = parseDirectories(rootItems);
          setDirStructure(fileStructures);
        }
      };

      initSerialSetupCalls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serial]);
  //   }, [serial, write, setConsoleMessageList, setDirStructure, setLatestVersion]);

  return { setupComplete, deviceVersion };
};
