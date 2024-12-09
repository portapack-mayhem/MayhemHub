import { useEffect, useState } from "react";
import { IUIConfig } from "@/types";

export const useUIConfig = () => {
  const [UIConfig, setUiConfig] = useState<IUIConfig>({
    screenHide: false,
    controlButtonsHide: false,
    fileSystemHide: false,
    serialConsoleHide: false,
    firmwareManagerHide: false,
  });

  const handleUpdateUiHide = (
    value: boolean,
    key: keyof IUIConfig,
    setInState: (stateValue: boolean) => void
  ) => {
    const updatedValue = !value;
    const newConfig = { ...UIConfig, [key]: updatedValue };
    localStorage.setItem("uiConfig", JSON.stringify(newConfig));
    setInState(updatedValue);
  };

  useEffect(() => {
    const storedConfig = localStorage.getItem("uiConfig");
    if (storedConfig) {
      setUiConfig(JSON.parse(storedConfig));
    }
  }, []);

  return { UIConfig, setUiConfig, handleUpdateUiHide };
};
