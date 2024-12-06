interface IScreen {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  disableTransmitAction: boolean;
  autoUpdateFrame: boolean;
  write: any;
}

export const Screen: React.FC<IScreen> = ({
  canvasRef,
  disableTransmitAction,
  autoUpdateFrame,
  write,
}) => {
  return (
    <canvas
      ref={canvasRef}
      width={241}
      height={321}
      className={`${
        !disableTransmitAction && "cursor-pointer"
      } shadow-glow shadow-neutral-500 outline-none focus:ring-0`}
      onMouseDown={(event) => {
        if (!canvasRef.current || disableTransmitAction) return;
        const bounds = canvasRef.current.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        const y = event.clientY - bounds.top;
        write(`touch ${x} ${y}`, autoUpdateFrame);
      }}
    />
  );
};
