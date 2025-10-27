import { ReactNode } from "react";
import { useHotkeys } from "react-hotkeys-hook";

interface IHotkeyButtonProps {
  onClickFunction: () => void;
  label?: string | ReactNode;
  shortcutKeys: string;
  disabled?: boolean;
  hidden?: boolean;
  className?: string;
}

const HotkeyButton = ({
  onClickFunction,
  label = "",
  shortcutKeys,
  disabled = false,
  hidden = false,
  className = "",
}: IHotkeyButtonProps) => {
  useHotkeys(
    shortcutKeys,
    () => {
      if (!disabled) {
        onClickFunction();
      }
    },
    { preventDefault: true },
    [disabled, onClickFunction]
  );

  if (hidden) return null;

  return (
    <button
      disabled={disabled}
      onClick={onClickFunction}
      className={`${className} disabled:bg-slate-500`}
    >
      {label}
    </button>
  );
};

export default HotkeyButton;
