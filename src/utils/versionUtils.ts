import { ILatestVersions } from "@/types";

type VersionType = "stable" | "nightly" | "custom" | "unknown";

export const nightlyVersionFormat = (input: string): number => {
  const removedPrefix = input.replace("n_", "");
  return parseInt(removedPrefix, 10);
};

export const stableVersionFormat = (input: string): number => {
  return parseInt(input.replace(/\D/g, ""), 10);
};

const nightlyToDate = (input: string): string => {
  const prefixRemoved = input.replace("n_", "");
  const year = "20" + prefixRemoved.slice(0, 2);
  const month = prefixRemoved.slice(2, 4);
  const day = prefixRemoved.slice(4, 6);
  return `${year}-${month}-${day}`;
};

export const getVersionType = (versionString: string): VersionType => {
  const stableRegex = /^v?\d+\.\d+\.\d+$/;
  const nightlyRegex = /^n_\d+$/;
  const customRegex = /^[a-f0-9]+$/;

  if (stableRegex.test(versionString)) {
    return "stable";
  }
  if (nightlyRegex.test(versionString)) {
    return "nightly";
  }
  if (customRegex.test(versionString)) {
    return "custom";
  }
  return "unknown";
};

export const getVersionLink = (versionString: string = ""): string => {
  const type = getVersionType(versionString);

  if (type === "stable") {
    return `https://github.com/portapack-mayhem/mayhem-firmware/releases/tag/${versionString}`;
  }

  if (type === "nightly") {
    return `https://github.com/portapack-mayhem/mayhem-firmware/releases/tag/nightly-tag-${nightlyToDate(
      versionString
    )}`;
  }

  if (type === "custom") {
    return `https://github.com/portapack-mayhem/mayhem-firmware/commit/${versionString}`;
  }

  return "";
};

export const getLatestVersions = async (): Promise<ILatestVersions> => {
  const response = await fetch("https://hackrf.app/api/get_versions");
  if (!response.ok) {
    throw new Error("Failed to fetch versions");
  }
  return await response.json();
};

export const isVersionOutdated = (
  currentVersion: string,
  minNightly: number,
  minStable: number
): boolean => {
  const versionType = getVersionType(currentVersion);

  if (versionType === "nightly") {
    return nightlyVersionFormat(currentVersion) < minNightly;
  }

  if (versionType === "stable") {
    const stableVersion = stableVersionFormat(currentVersion);
    return stableVersion < minStable && stableVersion !== 2;
  }

  return true;
};
