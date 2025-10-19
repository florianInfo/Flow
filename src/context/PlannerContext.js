import React, { createContext, useContext } from 'react';

const PlannerContext = createContext();

export const PlannerProvider = ({ children, value }) => {
  return (
    <PlannerContext.Provider value={value}>
      {children}
    </PlannerContext.Provider>
  );
};

export const usePlanner = () => {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error('usePlanner doit être utilisé dans un PlannerProvider');
  }
  return context;
};
