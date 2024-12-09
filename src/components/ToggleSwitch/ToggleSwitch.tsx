type IToggleSwitch = {
  isToggle: boolean;
  toggleLabel?: string;
  toggleSwitch: () => void;
};

const ToggleSwitch: React.FC<IToggleSwitch> = ({
  isToggle,
  toggleLabel,
  toggleSwitch,
}) => {
  return (
    <label
      className={`flex w-full cursor-pointer flex-row justify-between gap-4`}
    >
      {toggleLabel && (
        <div className="font-medium text-white">{toggleLabel}</div>
      )}
      <div className="relative">
        <input
          type="checkbox"
          className="hidden"
          checked={isToggle}
          onChange={() => {
            toggleSwitch();
          }}
        />
        <div
          className={`h-6 w-10 rounded-full bg-gray-400 shadow-inner ${
            isToggle ? "bg-green-400" : "bg-gray-400"
          }`}
        ></div>
        <div
          className={`absolute inset-y-0 left-0 h-6 w-6 rounded-full bg-white shadow ${
            isToggle ? "translate-x-full" : ""
          }`}
        ></div>
      </div>
      {!toggleLabel && (
        <div className="font-medium text-white">{isToggle ? "On" : "Off"}</div>
      )}
    </label>
  );
};

export default ToggleSwitch;
