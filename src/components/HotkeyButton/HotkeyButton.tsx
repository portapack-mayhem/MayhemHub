import { ReactNode } from "react";
import { useHotkeys } from "react-hotkeys-hook";

interface IHotkeyButton {
  /**
   * Function to execute when hotkey is used.
   */
  onClickFunction: () => void;
  /**
   * Text to display on button
   */
  label?: string | ReactNode;
  /**
   * Comma-separated string of shortcutkeys
   */
  shortcutKeys: string;
  disabled?: boolean;
  hidden?: boolean;
  className?: string;
}

/**
 * Button that displays a shortcut key combination and executes a function when the shortcut is used.
 */
const HotkeyButton = ({
  onClickFunction,
  label = "", // Refactor this to accept fontAwesome icon references?
  shortcutKeys,
  disabled = false,
  hidden = false,
  className = "",
}: IHotkeyButton) => {
  useHotkeys(
    shortcutKeys,
    (e) => {
      if (disabled) return;
      onClickFunction();
    },
    { preventDefault: true }
  );

  return (
    <>
      {!hidden && (
        <button
          disabled={disabled}
          onClick={() => onClickFunction()}
          className={`rounded text-white disabled:opacity-50 ${className}`}
        >
          {label}
        </button>
      )}
    </>
  );
};
export default HotkeyButton;
