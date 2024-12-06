import {
  faRotateLeft,
  faRotateRight,
  faArrowUp,
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import HotkeyButton from "@/components/HotkeyButton/HotkeyButton";

interface IDeviceControls {
  disableTransmitAction: boolean;
  autoUpdateFrame: boolean;
  write: any;
}

export const DeviceControls: React.FC<IDeviceControls> = ({
  disableTransmitAction,
  autoUpdateFrame,
  write,
}) => {
  /* 

    Attention!
    For some reason, when I use <DeviceButtons />, once the buttons are clicked, the 
    buttons never disable. I have spent hours trying to fix this, but I cannot. So 
    for now I have moved them back out of their own compoent which "Solves" the problem.

    Basically the issue is it seems to be setting the state of disableTransmitAction, but 
    not rerendering.

    If someone else could fix this, that would be great <3

    */

  return (
    /* <DeviceButtons
              autoUpdateFrame={autoUpdateFrame}
              disableTransmitAction={disableTransmitAction}
            /> */
    <div
      className="flex flex-col items-center justify-center gap-4"
      id="controlGroup"
    >
      <div className="flex flex-col items-center justify-center rounded-lg bg-gray-800">
        <div className="grid grid-flow-col grid-rows-3 gap-4">
          <div></div>
          <HotkeyButton
            label={<FontAwesomeIcon icon={faArrowLeft} />}
            disabled={disableTransmitAction}
            onClickFunction={() => write("button 2", autoUpdateFrame)}
            className="btn btn-success h-16 w-16"
            shortcutKeys={"ArrowLeft"}
          />
          <button
            disabled={disableTransmitAction}
            onClick={() => write("button 7", autoUpdateFrame)}
            className="btn btn-info h-12 w-12 self-end justify-self-start"
          >
            <FontAwesomeIcon icon={faRotateLeft} />
          </button>
          <HotkeyButton
            label={<FontAwesomeIcon icon={faArrowUp} />}
            disabled={disableTransmitAction}
            onClickFunction={() => write("button 4", autoUpdateFrame)}
            className="btn btn-success h-16 w-16"
            shortcutKeys={"ArrowUp"}
          />
          <HotkeyButton
            label={<FontAwesomeIcon icon={faCheckCircle} />}
            disabled={disableTransmitAction}
            onClickFunction={() => write("button 5", autoUpdateFrame)}
            className="btn btn-info h-16 w-16"
            shortcutKeys={"Enter"}
          />
          <HotkeyButton
            label={<FontAwesomeIcon icon={faArrowDown} />}
            disabled={disableTransmitAction}
            onClickFunction={() => write("button 3", autoUpdateFrame)}
            className="btn btn-success h-16 w-16"
            shortcutKeys={"ArrowDown"}
          />
          <div></div>
          <HotkeyButton
            label={<FontAwesomeIcon icon={faArrowRight} />}
            disabled={disableTransmitAction}
            onClickFunction={() => write("button 1", autoUpdateFrame)}
            className="btn btn-success h-16 w-16"
            shortcutKeys={"ArrowRight"}
          />
          <button
            disabled={disableTransmitAction}
            onClick={() => write("button 8", autoUpdateFrame)}
            className="btn btn-info h-12 w-12 self-end justify-self-end"
          >
            <FontAwesomeIcon icon={faRotateRight} />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 rounded-lg bg-gray-800 p-5">
        <HotkeyButton
          label="DFU"
          disabled={disableTransmitAction}
          onClickFunction={() => write("button 6", autoUpdateFrame)}
          className="btn btn-warning h-16 w-20"
          shortcutKeys={"mod+D"}
        />
        <button
          disabled={disableTransmitAction}
          onClick={() => write("reboot", autoUpdateFrame)}
          className="btn btn-error h-16 w-20"
        >
          REBOOT
        </button>
      </div>
    </div>
  );
};
