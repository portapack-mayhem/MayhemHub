export const getCurrentDeviceTimeCommand = (): string => {
  const currentDateTime = new Date();
  currentDateTime.setSeconds(currentDateTime.getSeconds() + 3);

  const year = currentDateTime.getFullYear();
  const month = String(currentDateTime.getMonth() + 1).padStart(2, "0");
  const day = String(currentDateTime.getDate()).padStart(2, "0");
  const hours = String(currentDateTime.getHours()).padStart(2, "0");
  const minutes = String(currentDateTime.getMinutes()).padStart(2, "0");
  const seconds = String(currentDateTime.getSeconds()).padStart(2, "0");

  return `rtcset ${year} ${month} ${day} ${hours} ${minutes} ${seconds}`;
};
