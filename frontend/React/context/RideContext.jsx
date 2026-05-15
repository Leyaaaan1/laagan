// React/context/RideContext.jsx
import React, {createContext, useState, useCallback} from 'react';

export const RideContext = createContext();

export const RideProvider = ({children}) => {
  const [activeRide, setActiveRide] = useState(null);

  const updateRideParticipants = useCallback(newParticipants => {
    setActiveRide(prev => ({
      ...prev,
      participants: newParticipants,
    }));
  }, []);

  return (
    <RideContext.Provider
      value={{activeRide, setActiveRide, updateRideParticipants}}>
      {children}
    </RideContext.Provider>
  );
};
