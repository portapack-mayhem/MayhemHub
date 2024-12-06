import { ILatestVersions } from "@/types";

type Version = "stable" | "nightly" | "custom" | "unknown";

export const nightlyVersionFormat = (input: string): number => {
  const removedPrefix = input.replace("n_", "");
  const number = parseInt(removedPrefix);
  return number;
};

export const stableVersionFormat = (input: string): number => {
  const number = parseInt(input.replace(/\D/g, ""));
  return number;
};

const nightlyToDate = (input: string): string => {
  const prefixRemoved = input.replace("n_", "");

  const year = "20" + prefixRemoved.slice(0, 2);
  const month = prefixRemoved.slice(2, 4);
  const day = prefixRemoved.slice(4, 8);

  return `${year}-${month}-${day}`;
};

export const getVersionType = (versionString: string): Version => {
  const stableRegex = /^v?\d+\.\d+\.\d+$/;
  const nightlyRegex = /^n_\d+$/;
  const customRegex = /^[a-f0-9]+$/;

  if (stableRegex.test(versionString)) {
    return "stable";
  } else if (nightlyRegex.test(versionString)) {
    return "nightly";
  } else if (customRegex.test(versionString)) {
    return "custom";
  } else {
    return "unknown";
  }
};

export const getVersionLink = (versionString: string = ""): string => {
  const type = getVersionType(versionString);
  if (type === "stable") {
    return `https://github.com/portapack-mayhem/mayhem-firmware/releases/tag/${versionString}`;
  } else if (type === "nightly") {
    return `https://github.com/portapack-mayhem/mayhem-firmware/releases/tag/nightly-tag-${nightlyToDate(
      versionString
    )}`;
  } else if (type === "custom") {
    return `https://github.com/portapack-mayhem/mayhem-firmware/commit/${versionString}`;
  }
  return "";
};

export const getLatestVersions = async (): Promise<ILatestVersions> => {
  const apiResponse = await fetch("https://hackrf.app/api/get_versions");
  if (!apiResponse.ok) throw new Error("Failed to fetch versions");
  return await apiResponse.json();
};
