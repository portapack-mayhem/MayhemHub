import Modal from "@/components/Modal/Modal";
import ToggleSwitch from "@/components/ToggleSwitch/ToggleSwitch";
import { ConfigItem, IUIConfig } from "@/types";

interface IUIConfigurationModal {
  isOpen: boolean;
  onClose: () => void;
  UIConfig: IUIConfig;
  setUiConfig: (config: IUIConfig) => void;
  handleUpdateUiHide: (
    value: boolean,
    key: keyof IUIConfig,
    setInState: (stateValue: boolean) => void
  ) => void;
  toggleLiveScreen: (shouldUpdate: boolean) => void;
}

const UIConfigurationModal: React.FC<IUIConfigurationModal> = ({
  isOpen,
  onClose,
  UIConfig,
  setUiConfig,
  handleUpdateUiHide,
  toggleLiveScreen,
}) => {
  const uiConfigItems: ConfigItem[] = [
    {
      key: "controlButtonsHide",
      label: "Hide Control Buttons",
    },
    {
      key: "screenHide",
      label: "Hide Screen",
      onToggle: () => toggleLiveScreen(!UIConfig.screenHide),
    },
    {
      key: "fileSystemHide",
      label: "Hide File System",
    },
    {
      key: "serialConsoleHide",
      label: "Hide Serial Console",
    },
    {
      key: "firmwareManagerHide",
      label: "Hide Firmware Manager",
    },
  ];

  return (
    <Modal
      title="UI Configuration"
      isModalOpen={isOpen}
      closeModal={onClose}
      className="w-[20%]"
    >
      <div className="mb-3 flex flex-col items-center justify-center rounded-lg p-4 font-medium text-white outline-none focus:ring-0 md:items-start">
        <div className="flex w-full flex-col items-start justify-start gap-5">
          {uiConfigItems.map((item) => (
            <ToggleSwitch
              key={item.key}
              toggleLabel={item.label}
              isToggle={UIConfig[item.key]}
              toggleSwitch={() => {
                handleUpdateUiHide(
                  UIConfig[item.key],
                  item.key,
                  (updatedValue) => {
                    setUiConfig({ ...UIConfig, [item.key]: updatedValue });
                    item.onToggle?.();
                  }
                );
              }}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default UIConfigurationModal;
