import React from 'react';
import { View } from 'react-native';
import RideStep1 from '../components/ride/RideStep1';
import RideStep2 from '../components/ride/RideStep2';
import RideStep3 from '../components/ride/RideStep3';
import RideStep4 from '../components/ride/RideStep4';
import createRideUtils from '../components/ride/utilities/CreateRideUtils';

const CreateRide = ({ route, navigation }) => {
  const { token, username } = route.params;

  const ride = createRideUtils({ token, username });

  return (
    <View style={{ flex: 1 }}>

      {ride.currentStep === 1 && (
        <RideStep1
          error={ride.error}
          rideName={ride.rideName}
          setRideName={ride.setRideName}
          riderType={ride.riderType}
          setRiderType={ride.setRiderType}
          participants={ride.participants}
          setParticipants={ride.setParticipants}
          description={ride.description}
          setDescription={ride.setDescription}
          date={ride.date}
          setDate={ride.setDate}
          nextStep={ride.nextStep}
        />
      )}

      {ride.currentStep === 2 && (
        <RideStep2
          isSearching={ride.isSearching}
          searchResults={ride.searchResults}
          searchQuery={ride.searchQuery}
          setSearchQuery={ride.setSearchQuery}
          handleLocationSelect={ride.handleLocationSelect}
          handleSearchInputChange={ride.handleSearchInputChange}
          webViewRef={ride.webViewRef}
          latitude={ride.latitude}
          longitude={ride.longitude}
          handleMessage={ride.handleMessage}
          locationName={ride.locationName}
          setLocationName={ride.setLocationName}
          prevStep={ride.prevStep}
          nextStep={ride.nextStep}
          token={token}
        />
      )}

      {ride.currentStep === 3 && (
        <RideStep3
          stopPoints={ride.stopPoints}
          setStopPoints={ride.setStopPoints}
          mapMode={ride.mapMode}
          setMapMode={ride.setMapMode}
          isSearching={ride.isSearching}
          searchResults={ride.searchResults}
          searchQuery={ride.searchQuery}
          handleLocationSelect={ride.handleLocationSelect}
          handleSearchInputChange={ride.handleSearchInputChange}
          webViewRef={ride.webViewRef}
          startingLatitude={ride.startingLatitude}
          startingLongitude={ride.startingLongitude}
          endingLatitude={ride.endingLatitude}
          endingLongitude={ride.endingLongitude}
          handleMessage={ride.handleMessage}
          startingPoint={ride.startingPoint}
          setStartingPoint={ride.setStartingPoint}
          endingPoint={ride.endingPoint}
          setEndingPoint={ride.setEndingPoint}
          prevStep={ride.prevStep}
          nextStep={ride.nextStep}
          handleCreateRide={ride.handleCreateRide}
          loading={ride.loading}
          token={token}
        />
      )}

      {ride.currentStep === 4 && (ride.generatedRidesId || ride.pendingRideIdRef.current) && (
        <RideStep4
          generatedRidesId={ride.generatedRidesId || ride.pendingRideIdRef.current}
          rideName={ride.rideName}
          locationName={ride.locationName}
          riderType={ride.riderType}
          date={ride.date}
          startingPoint={ride.startingPoint}
          endingPoint={ride.endingPoint}
          participants={ride.participants}
          description={ride.description}
          token={token}
          username={username}
          stopPoints={ride.stopPoints}
          currentUsername={username}
          startLat={parseFloat(ride.startingLatitude) || 0}
          startLng={parseFloat(ride.startingLongitude) || 0}
          endLat={parseFloat(ride.endingLatitude) || 0}
          endLng={parseFloat(ride.endingLongitude) || 0}
        />
      )}

    </View>
  );
};

export default CreateRide;