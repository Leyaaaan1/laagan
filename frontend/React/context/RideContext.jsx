// React/context/RideContext.jsx
import React, {createContext, useState, useCallback} from 'react';

export const RideContext = createContext();

export const RideProvider = ({children}) => {
  const [activeRide, setActiveRide] = useState(null);

  const updateRideParticipants = useCallback(newParticipants => {
    setActiveRide(prev => {
      // Safety: only update if activeRide exists
      if (!prev) return null;
      return {
        ...prev,
        participants: newParticipants,
      };
    });
  }, []);
  return (
    <RideContext.Provider
      value={{activeRide, setActiveRide, updateRideParticipants}}>
      {children}
    </RideContext.Provider>
  );
};
