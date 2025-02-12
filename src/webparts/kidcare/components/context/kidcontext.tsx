import * as React from "react"
import { createContext, useContext, useState, ReactNode } from "react";

// Define the type for selected kid data
interface Kid {
  kidId: string;
  selectedKidName: string;
  kidPhoto: string;
  parentName: string;
}

// Define the shape of the context data
interface KidContextType {
  selectedKid: Kid | null;
  setSelectedKidData: (
    kidId: string,
    selectedKidName: string,
    kidPhoto: string,
    parentName: string
  ) => void;
}

const defaultContextValue: KidContextType = {
  selectedKid: null,
  setSelectedKidData: () => {},
};


// Create the context with the default value (null)
 export const KidContext = createContext<KidContextType>(defaultContextValue);

// Create a provider component
export const KidProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null);

  const setSelectedKidData = (
    kidId: string,
    selectedKidName: string,
    kidPhoto: string,
    parentName: string
  ) => {
    setSelectedKid({ kidId, selectedKidName, kidPhoto, parentName });
  };

  return (
    <KidContext.Provider value={{ selectedKid, setSelectedKidData }}>
      {children}
    </KidContext.Provider>
  );
};

// Create a custom hook to access the context
export const useKidContext = (): KidContextType => {
  const context = useContext(KidContext);
  if (!context) {
    throw new Error("useKidContext must be used within a KidProvider");
  }
  return context;
};
