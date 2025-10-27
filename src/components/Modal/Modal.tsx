import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState, MouseEvent } from "react";
import { IModalProps } from "@/types";

interface IPosition {
  x: number;
  y: number;
}

const useModalDrag = (isOpen: boolean) => {
  const [position, setPosition] = useState<IPosition>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<IPosition>({ x: 0, y: 0 });

  useEffect(() => {
    if (!isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    requestAnimationFrame(() => {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    });
  };

  const stopDragging = () => setIsDragging(false);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseUp = () => stopDragging();

    window.addEventListener("mousemove", handleMouseMove as any);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseleave", stopDragging);
    window.addEventListener("blur", stopDragging);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove as any);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseleave", stopDragging);
      window.removeEventListener("blur", stopDragging);
    };
  }, [isDragging, dragStart, position]);

  return {
    position,
    isDragging,
    handleMouseDown,
  };
};

const Modal = ({
  title,
  footer,
  isModalOpen = false,
  closeModal,
  children,
  className = "",
}: IModalProps) => {
  const { position, isDragging, handleMouseDown } = useModalDrag(isModalOpen);

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "unset";
  }, [isModalOpen]);

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
        }}
        className={`z-50 mx-auto overflow-auto rounded-lg border border-modal-border bg-component ${
          isDragging ? "modal-glow-dragging" : "modal-glow"
        } ${className}`}
      >
        {title && (
          <div
            className="flex cursor-grab select-none gap-4 border-b border-modal-border bg-component p-4"
            onMouseDown={handleMouseDown}
            onDragStart={(e) => e.preventDefault()}
          >
            <button
              onClick={closeModal}
              className="rounded-sm pr-3 transition-colors duration-200"
            >
              <FontAwesomeIcon
                icon={faRectangleXmark}
                className="hover:glow-sm text-2xl text-white/80 hover:text-white"
              />
            </button>
            <p className="text-white">{title}</p>
          </div>
        )}
        <div className={`h-full w-full bg-component ${title && "p-4"}`}>
          {children}
        </div>
        {footer && (
          <div className="border-t border-modal-border bg-component p-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
