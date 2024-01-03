import { useState } from "react";

type ToggleSwitchProps = {
  isToggle: boolean;
  toggleSwitch: () => void;
};

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  isToggle,
  toggleSwitch,
}) => {
  return (
    <label className="flex items-center cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className="hidden"
          checked={isToggle}
          onChange={toggleSwitch}
        />
        <div
          className={`toggle__line w-10 h-6 bg-gray-400 rounded-full shadow-inner ${
            isToggle ? " bg-green-400" : " bg-gray-400"
          }`}
        ></div>
        <div
          className={`toggle__dot absolute w-6 h-6 bg-white rounded-full shadow inset-y-0 left-0 transform ${
            isToggle ? "translate-x-full" : ""
          }`}
        ></div>
      </div>
      <div className="ml-3 text-white font-medium">
        {isToggle ? "On" : "Off"}
      </div>
    </label>
  );
};

export default ToggleSwitch;
