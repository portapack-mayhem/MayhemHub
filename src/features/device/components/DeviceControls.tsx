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
import HotkeyButton from "@/components/HotkeyButton/HotkeyButton";

interface IDeviceControlsProps {
  disableTransmitAction: boolean;
  onButtonPress: (buttonNumber: number) => void;
  onReboot: () => void;
}

const DeviceControls = ({
  disableTransmitAction,
  onButtonPress,
  onReboot,
}: IDeviceControlsProps) => {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4"
      id="controlGroup"
    >
      <div className="flex flex-col items-center justify-center rounded-lg">
        <div className="grid grid-flow-col grid-rows-3 gap-4">
          <div />
          <HotkeyButton
            label={<FontAwesomeIcon icon={faArrowLeft} />}
            disabled={disableTransmitAction}
            onClickFunction={() => onButtonPress(2)}
            className="btn btn-success h-16 w-16"
            shortcutKeys="ArrowLeft"
          />
          <button
            disabled={disableTransmitAction}
            onClick={() => onButtonPress(7)}
            className="btn btn-info h-12 w-12 self-end justify-self-start"
          >
            <FontAwesomeIcon icon={faRotateLeft} />
          </button>
          <HotkeyButton
            label={<FontAwesomeIcon icon={faArrowUp} />}
            disabled={disableTransmitAction}
            onClickFunction={() => onButtonPress(4)}
            className="btn btn-success h-16 w-16"
            shortcutKeys="ArrowUp"
          />
          <HotkeyButton
            label={<FontAwesomeIcon icon={faCheckCircle} />}
            disabled={disableTransmitAction}
            onClickFunction={() => onButtonPress(5)}
            className="btn btn-info h-16 w-16"
            shortcutKeys="Enter"
          />
          <HotkeyButton
            label={<FontAwesomeIcon icon={faArrowDown} />}
            disabled={disableTransmitAction}
            onClickFunction={() => onButtonPress(3)}
            className="btn btn-success h-16 w-16"
            shortcutKeys="ArrowDown"
          />
          <div />
          <HotkeyButton
            label={<FontAwesomeIcon icon={faArrowRight} />}
            disabled={disableTransmitAction}
            onClickFunction={() => onButtonPress(1)}
            className="btn btn-success h-16 w-16"
            shortcutKeys="ArrowRight"
          />
          <button
            disabled={disableTransmitAction}
            onClick={() => onButtonPress(8)}
            className="btn btn-info h-12 w-12 self-end justify-self-end"
          >
            <FontAwesomeIcon icon={faRotateRight} />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 rounded-lg p-5">
        <HotkeyButton
          label="DFU"
          disabled={disableTransmitAction}
          onClickFunction={() => onButtonPress(6)}
          className="btn btn-warning h-16 w-20"
          shortcutKeys="mod+D"
        />
        <button
          disabled={disableTransmitAction}
          onClick={onReboot}
          className="btn btn-error h-16 w-20"
        >
          REBOOT
        </button>
      </div>
    </div>
  );
};

export default DeviceControls;
