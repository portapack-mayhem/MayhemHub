import { IScreenDimensions } from "@/types";

interface IDeviceScreenProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  disableTransmitAction: boolean;
  autoUpdateFrame: boolean;
  onTouch: (x: number, y: number) => void;
  screenDimensions: IScreenDimensions;
}

const DeviceScreen = ({
  canvasRef,
  disableTransmitAction,
  autoUpdateFrame,
  onTouch,
  screenDimensions,
}: IDeviceScreenProps) => {
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || disableTransmitAction) return;

    const bounds = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    onTouch(x, y);
  };

  return (
    <canvas
      ref={canvasRef}
      width={screenDimensions.width}
      height={screenDimensions.height}
      className={`${
        !disableTransmitAction && "cursor-pointer"
      } shadow-glow shadow-neutral-500 outline-none focus:ring-0`}
      onMouseDown={handleMouseDown}
    />
  );
};

export default DeviceScreen;
