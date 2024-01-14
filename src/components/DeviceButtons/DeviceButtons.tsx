import { useEffect } from "react";
import { useWriteCommand } from "@/utils/serialUtils";
import HotkeyButton from "../HotkeyButton/HotkeyButton";

export const DeviceButtons = ({
  autoUpdateFrame,
}: {
  autoUpdateFrame: boolean;
}) => {
  const { write, disableTransmitAction, loadingFrame } = useWriteCommand();
  // const { write } = useWriteCommand();

  // const disableTransmitAction = false;

  useEffect(() => {
    // Why is this not updating?
    console.log(disableTransmitAction);
  }, [disableTransmitAction]);

  return (
    <div
      className="flex flex-col items-center justify-center gap-5"
      id="controlGroup"
    >
      <div className="flex flex-col items-center justify-center">
        <div className="grid grid-flow-col grid-rows-3 gap-4">
          <div></div>
          <HotkeyButton
            label="Left"
            disabled={loadingFrame}
            onClickFunction={() => write("button 2", autoUpdateFrame)}
            className="h-16 w-16 bg-green-500"
            shortcutKeys={"ArrowLeft"}
          />
          <button
            disabled={disableTransmitAction}
            onClick={() => write("button 7", autoUpdateFrame)}
            className="h-12 w-12 self-end justify-self-start rounded bg-blue-400 text-white disabled:opacity-50"
          >
            ↪️
          </button>
          <HotkeyButton
            label="Up"
            disabled={disableTransmitAction}
            onClickFunction={() => write("button 4", autoUpdateFrame)}
            className="h-16 w-16 bg-green-500"
            shortcutKeys={"ArrowUp"}
          />
          <HotkeyButton
            label="Ok"
            disabled={disableTransmitAction}
            onClickFunction={() => write("button 5", autoUpdateFrame)}
            className="h-16 w-16 bg-blue-500"
            shortcutKeys={"Enter"}
          />
          <HotkeyButton
            label="Down"
            disabled={disableTransmitAction}
            onClickFunction={() => write("button 3", autoUpdateFrame)}
            className="h-16 w-16 bg-green-500"
            shortcutKeys={"ArrowDown"}
          />
          <div></div>
          <HotkeyButton
            label="Right"
            disabled={disableTransmitAction}
            onClickFunction={() => write("button 1", autoUpdateFrame)}
            className="h-16 w-16 bg-green-500"
            shortcutKeys={"ArrowRight"}
          />
          <button
            disabled={disableTransmitAction}
            onClick={() => write("button 8", autoUpdateFrame)}
            className="h-12 w-12 self-end justify-self-end rounded bg-blue-400 text-white disabled:opacity-50"
          >
            ↩️
          </button>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4">
        <HotkeyButton
          label="DFU"
          disabled={disableTransmitAction}
          onClickFunction={() => write("button 6", autoUpdateFrame)}
          className="h-16 w-16 bg-slate-400"
          shortcutKeys={"mod+D"}
        />
        <button
          disabled={disableTransmitAction}
          onClick={() => write("reboot", autoUpdateFrame)}
          className="h-16 w-16 rounded bg-slate-400 text-white disabled:opacity-50"
        >
          Reboot
        </button>
      </div>
    </div>
  );
};
