import React, { createContext, FC, ReactNode, useState } from "react";

type SharedStateContextType = {
  sharedState: boolean;
  setSharedState: React.Dispatch<React.SetStateAction<boolean>>;
};

// Initialized with an empty object but will be set in our provider
export const SharedStateContext = createContext<SharedStateContextType>({
  sharedState: false,
  setSharedState: () => {}, // Add a default empty function for setSharedState
});

const SharedStateProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [sharedState, setSharedState] = useState<boolean>(false);

  return (
    <SharedStateContext.Provider value={{ sharedState, setSharedState }}>
      {children}
    </SharedStateContext.Provider>
  );
};

export default SharedStateProvider;
