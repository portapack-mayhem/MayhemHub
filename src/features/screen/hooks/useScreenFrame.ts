import { useRef, useState, useCallback } from "react";
import { IScreenDimensions } from "@/types";

interface IUseScreenFrame {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  renderFrame: (message: string) => void;
  screenDimensions: IScreenDimensions;
  needsRefresh: boolean;
  setNeedsRefresh: (value: boolean) => void;
}

const DEFAULT_DIMENSIONS: IScreenDimensions = { width: 240, height: 320 };

export const useScreenFrame = (): IUseScreenFrame => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screenDimensions, setScreenDimensions] = useState(DEFAULT_DIMENSIONS);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const lastWidth = useRef(240);

  const determineRequiredDimensions = (
    lineLength: number
  ): IScreenDimensions => {
    return lineLength >= 320
      ? { width: 320, height: 480 }
      : { width: 240, height: 320 };
  };

  const updateDimensions = useCallback((newDimensions: IScreenDimensions) => {
    lastWidth.current = newDimensions.width;
    setScreenDimensions(newDimensions);

    if (canvasRef.current) {
      canvasRef.current.width = newDimensions.width;
      canvasRef.current.height = newDimensions.height;
    }

    setTimeout(() => setNeedsRefresh(true), 500);
  }, []);

  const renderPixel = (
    ctx: CanvasRenderingContext2D,
    charCode: number,
    x: number,
    y: number
  ) => {
    const byte = charCode - 32;
    const r = ((byte >> 4) & 3) << 6;
    const g = ((byte >> 2) & 3) << 6;
    const b = (byte & 3) << 6;

    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, y, 1, 1);
  };

  const renderFrame = useCallback(
    (consoleMessage: string) => {
      if (!consoleMessage.includes("screenframe")) return;

      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      const lines = consoleMessage.split("\r\n");
      const dataLineIndex = lines.findIndex(
        (line) => !line.startsWith("screenframe") && line.length > 0
      );

      if (dataLineIndex === -1) return;

      const firstDataLine = lines[dataLineIndex];
      const requiredDimensions = determineRequiredDimensions(
        firstDataLine.length
      );

      if (lastWidth.current !== requiredDimensions.width) {
        updateDimensions(requiredDimensions);
        return;
      }

      let y = 0;
      for (
        let lineIndex = dataLineIndex;
        lineIndex < lines.length;
        lineIndex++
      ) {
        const line = lines[lineIndex];
        if (line.startsWith("screenframe")) continue;

        for (let x = 0; x < line.length; x++) {
          try {
            renderPixel(ctx, line.charCodeAt(x), x, y);
          } catch (err) {
            console.error("Error rendering pixel:", err);
          }
        }
        y++;
      }
    },
    [updateDimensions]
  );

  return {
    canvasRef,
    renderFrame,
    screenDimensions,
    needsRefresh,
    setNeedsRefresh,
  };
};
