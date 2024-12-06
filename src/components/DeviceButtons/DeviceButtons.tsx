import { faRotateLeft, faRotateRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import HotkeyButton from "@/components/HotkeyButton/HotkeyButton";
import { useWriteCommand } from "@/utils/serialUtils";

export const DeviceButtons = ({
  autoUpdateFrame,
  disableTransmitAction,
}: {
  autoUpdateFrame: boolean;
  disableTransmitAction: boolean;
}) => {
  const { write } = useWriteCommand();

  return (
    <div
      className="flex flex-col items-center justify-center gap-5"
      id="controlGroup"
    >
      {/* Test Buttons ==================================================================================================== */}
      <button
        disabled={disableTransmitAction}
        onClick={() => write("button 7", true, true)}
        className="h-12 w-12 self-end justify-self-start rounded bg-blue-400 text-white disabled:opacity-50"
      >
        T1
      </button>
      <button
        disabled={disableTransmitAction}
        onClick={() => write("button 7", true, false)}
        className="h-12 w-12 self-end justify-self-start rounded bg-blue-400 text-white disabled:opacity-50"
      >
        T2
      </button>
      <button
        disabled={disableTransmitAction}
        onClick={async () => await write("button 7", true, true)}
        className="h-12 w-12 self-end justify-self-start rounded bg-blue-400 text-white disabled:opacity-50"
      >
        T3
      </button>
      <button
        disabled={disableTransmitAction}
        onClick={async () => await write("button 7", true, false)}
        className="h-12 w-12 self-end justify-self-start rounded bg-blue-400 text-white disabled:opacity-50"
      >
        T4
      </button>
      {/* ==================================================================================================== */}
      <div className="flex flex-col items-center justify-center">
        <div className="grid grid-flow-col grid-rows-3 gap-4">
          <div></div>
          <HotkeyButton
            label="Left"
            disabled={disableTransmitAction}
            onClickFunction={() => write("button 2", autoUpdateFrame)}
            className="h-16 w-16 bg-green-500"
            shortcutKeys={"ArrowLeft"}
          />
          <button
            disabled={disableTransmitAction}
            onClick={() => write("button 7", autoUpdateFrame)}
            className="h-12 w-12 self-end justify-self-start rounded bg-blue-400 text-white disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faRotateLeft} />
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
            <FontAwesomeIcon icon={faRotateRight} />
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
