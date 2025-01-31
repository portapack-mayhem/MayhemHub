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
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
              cursor: isDragging ? "grabbing" : "grab",
              userSelect: "none",
            }}
            className={`z-50 overflow-auto rounded-lg border border-gray-900 bg-gray-500 shadow-xl ${className}`}
            {...props}
          >
            {title && (
              <div
                className="flex gap-4 border-b border-gray-500 p-4 cursor-grab select-none"
                onMouseDown={handleMouseDown}
                onDragStart={(e) => e.preventDefault()}
              >
                <button onClick={closeModal} className="pr-3">
                  <FontAwesomeIcon
                    icon={faRectangleXmark}
                    className="text-2xl text-white"
                  />
                </button>
                <p>{title}</p>
              </div>
            )}
            <div className={`h-full w-full ${title && "p-4"}`}>{children}</div>
            {footer && (
              <div className="border-t border-gray-500 p-4">{footer}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Modal;
