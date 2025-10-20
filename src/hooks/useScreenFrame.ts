import { useRef, useState } from "react";

export const useScreenFrame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screenDimensions, setScreenDimensions] = useState({ width: 240, height: 320 });
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const lastWidth = useRef(240);

  const renderFrame = (consoleMessage: string) => {
    if (!consoleMessage.includes("screenframe")) return;

    const lines = consoleMessage.split("\r\n");
    const ctx = canvasRef.current?.getContext("2d");

    if (!ctx) return false;

    // Find first data line
    let dataLineIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith("screenframe") && lines[i].length > 0) {
        dataLineIndex = i;
        break;
      }
    }

    const firstDataLine = lines[dataLineIndex];
    if (!firstDataLine) return;
    
    // Determine required dimensions based on line length
    const requiredWidth = firstDataLine.length >= 320 ? 320 : 240;
    const requiredHeight = firstDataLine.length >= 320 ? 480 : 320;
    
    // Check if dimensions need to change
    if (lastWidth.current !== requiredWidth) {
      console.log(`Dimension change: ${lastWidth.current} -> ${requiredWidth}`);
      lastWidth.current = requiredWidth;
      setScreenDimensions({ width: requiredWidth, height: requiredHeight });
      
      if (canvasRef.current) {
        canvasRef.current.width = requiredWidth;
        canvasRef.current.height = requiredHeight;
      }
      
      // Set flag for refresh with a delay
      setTimeout(() => {
        setNeedsRefresh(true);
      }, 500); // Give time for current operations to complete
      
      return; // Don't render this frame
    }

    // Render the frame
    let y = 0;
    for (let lineIndex = dataLineIndex; lineIndex < lines.length; lineIndex++) {
      let line = lines[lineIndex];
      if (line.startsWith("screenframe")) continue;
      
      for (let x = 0; x < line.length; x++) {
        try {
          let by = line.charCodeAt(x) - 32;
          
          let r = ((by >> 4) & 3) << 6;
          let g = ((by >> 2) & 3) << 6;
          let b = (by & 3) << 6;

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, y, 1, 1);
        } catch (err) {
          console.error(err);
        }
      }
      y++;
    }
  };

  return { canvasRef, renderFrame, screenDimensions, needsRefresh, setNeedsRefresh };
};
