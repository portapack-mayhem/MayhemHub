import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect } from "react";
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
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isModalOpen]);
  return (
    <>
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div
            className={`z-50 overflow-auto rounded-lg border border-gray-900 bg-gray-500 shadow-xl ${className}`}
            {...props}
          >
            {title && (
              <div className="flex gap-4 border-b border-gray-500 p-4">
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
