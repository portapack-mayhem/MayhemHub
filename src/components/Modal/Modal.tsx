import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState, MouseEvent } from "react";
import { IModal } from "@/types";

const Modal = ({
  title,
  footer,
  isModalOpen = false,
  closeModal,
  children,
  className,
  ...props
}: IModal) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setPosition({ x: 0, y: 0 });
    }
  }, [isModalOpen]);

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
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
    });
  };

  const stopDragging = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      stopDragging();
    };

    window.addEventListener("mousemove", handleMouseMove as any);
    window.addEventListener("mouseup", handleMouseUp as any);
    window.addEventListener("mouseleave", stopDragging);
    window.addEventListener("blur", stopDragging);
    window.addEventListener("keydown", stopDragging);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove as any);
      window.removeEventListener("mouseup", handleMouseUp as any);
      window.removeEventListener("mouseleave", stopDragging);
      window.removeEventListener("blur", stopDragging);
      window.removeEventListener("keydown", stopDragging);
    };
  }, [isDragging, dragStart.x, dragStart.y, position.x, position.y]);

  return (
    <>
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-start justify-center pt-[5vh]">
          <div className="fixed inset-0 bg-overlay"></div>
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
              cursor: isDragging ? "grabbing" : "grab",
              userSelect: "none",
            }}
            className={`z-50 mx-auto overflow-auto rounded-lg border border-modal-border bg-component shadow-[0_0_15px_rgba(31,41,55,0.4)] ${className}`}
            {...props}
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
      )}
    </>
  );
};

export default Modal;