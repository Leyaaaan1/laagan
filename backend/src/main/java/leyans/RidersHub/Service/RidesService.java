package leyans.RidersHub.Service;


import leyans.RidersHub.DTO.Response.RideDetailDTO;
import leyans.RidersHub.DTO.Response.RideResponseDTO;
import leyans.RidersHub.DTO.Request.RidesDTO.StopPointDTO;
import leyans.RidersHub.Service.InteractionRequest.RideParticipantService;
import leyans.RidersHub.Service.MapService.MapBox.MapboxService;
import leyans.RidersHub.Service.MapService.RouteService;
import leyans.RidersHub.Utility.AppLogger;
import leyans.RidersHub.Utility.RidesUtil;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.RiderType;
import leyans.RidersHub.model.Rides;
import leyans.RidersHub.model.StopPoint;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;

@Service
public class RidesService {

    private final LocationService locationService;
    private final RiderService riderService;
    private final MapboxService mapboxService;
    private final RideParticipantService rideParticipantService;
    private final RouteService routeService;

    private final RidesUtil ridesUtil;
    private final RideStatusService rideStatusService;

    @Qualifier("externalApiExecutor")
    private final Executor externalApiExecutor;

    public RidesService(LocationService locationService, RiderService riderService, MapboxService mapboxService,
                        RideParticipantService rideParticipantService, RouteService routeService, RidesUtil ridesUtil, RideStatusService rideStatusService, Executor externalApiExecutor) {

        this.riderService = riderService;
        this.locationService = locationService;
        this.mapboxService = mapboxService;
        this.rideParticipantService = rideParticipantService;
        this.routeService = routeService;
        this.ridesUtil = ridesUtil;
        this.rideStatusService = rideStatusService;
        this.externalApiExecutor = externalApiExecutor;
    }
    private static class ApiFutures {
        CompletableFuture<String> mainImageFuture;
        CompletableFuture<String> routeFuture;
        CompletableFuture<String> mainLocationFuture;
        CompletableFuture<String> startLocationFuture;
        CompletableFuture<String> endLocationFuture;
        List<CompletableFuture<RidesUtil.GeocodeResult>> stopPointFutures;
    }

    public RideDetailDTO createRide(
            String generatedRidesId, String creatorUsername, String ridesName,
            String locationName, String riderType, LocalDateTime date,
            List<String> participantUsernames, String description,
            double latitude, double longitude,
            double startLatitude, double startLongitude,
            double endLatitude, double endLongitude,
            boolean isLocationFromSearch,
            boolean isStartingPointFromSearch,      //
            boolean isEndingPointFromSearch,
            String startingPointName,
            String endingPointName,
            List<Boolean> stopPointsFromSearch,     //
            List<StopPointDTO> stopPointsDto) {
        AppLogger.info(this.getClass(), "createRide called", "generatedRidesId", generatedRidesId, "creatorUsername", creatorUsername, "ridesName", ridesName);

        List<StopPointDTO> validStopPoints = stopPointsDto.stream()
                .filter(stop -> stop.getStopLongitude() != 0.0 && stop.getStopLatitude() != 0.0)
                .collect(Collectors.toList());

        ApiFutures futures = prepareApiFutures(validStopPoints, latitude, longitude, startLatitude,
                startLongitude, endLatitude, endLongitude, locationName, isLocationFromSearch,
                isStartingPointFromSearch,
                isEndingPointFromSearch,
                startingPointName,
                endingPointName,
                stopPointsFromSearch);

        awaitApiFuturesAndCollect(futures);



        return buildAndSaveRide(
                generatedRidesId, creatorUsername, ridesName, riderType, date, participantUsernames,
                description, latitude, longitude, startLatitude, startLongitude, endLatitude, endLongitude,
                isStartingPointFromSearch,
                isEndingPointFromSearch,
                startingPointName,
                endingPointName,
                futures
        );    }

    private ApiFutures prepareApiFutures(List<StopPointDTO> validStopPoints,
                                         double latitude, double longitude,
                                         double startLatitude, double startLongitude,
                                         double endLatitude, double endLongitude,
                                         String locationName ,
                                         boolean isLocationFromSearch, boolean isStartingPointFromSearch,
                                         boolean isEndingPointFromSearch,    String startingPointName,
                                         String endingPointName,
                                         List<Boolean> stopPointsFromSearch) {
        ApiFutures f = new ApiFutures();

        f.mainImageFuture = CompletableFuture.supplyAsync(
                () -> mapboxService.getStaticMapImageUrl(longitude, latitude),
                externalApiExecutor
        );
        f.routeFuture = CompletableFuture.supplyAsync(
                () -> routeService.getRouteDirections(
                        startLongitude, startLatitude,
                        endLongitude, endLatitude,
                        validStopPoints,
                        "driving-car"
                ),
                externalApiExecutor
        );
        if (isLocationFromSearch) {
            // Use the locationName as-is from search result
            f.mainLocationFuture = CompletableFuture.completedFuture(locationName);
        } else {
            // Georeverse only if from map tap
            f.mainLocationFuture = CompletableFuture.supplyAsync(
                    () -> locationService.resolveLandMark(locationName, latitude, longitude),
                    externalApiExecutor
            );
        }
        if (isStartingPointFromSearch) {
            // Use the name from search result
            f.startLocationFuture = CompletableFuture.completedFuture(startingPointName);
        } else {
            f.startLocationFuture = CompletableFuture.supplyAsync(
                    () -> locationService.resolveBarangayName(null, startLatitude, startLongitude),
                    externalApiExecutor
            );
        }

        if (isEndingPointFromSearch) {
            // Use the name from search result
            f.endLocationFuture = CompletableFuture.completedFuture(endingPointName);
        } else {
            f.endLocationFuture = CompletableFuture.supplyAsync(
                    () -> locationService.resolveBarangayName(null, endLatitude, endLongitude),
                    externalApiExecutor
            );
        }


        f.stopPointFutures = java.util.stream.IntStream.range(0, validStopPoints.size())
                .mapToObj(index -> {
                    StopPointDTO dto = validStopPoints.get(index);
                    boolean fromSearch = (stopPointsFromSearch != null && index < stopPointsFromSearch.size())
                            ? stopPointsFromSearch.get(index)
                            : false;

                    if (fromSearch) {
                        // Use the stop name as-is from search
                        return CompletableFuture.completedFuture(
                                new RidesUtil.GeocodeResult(
                                        dto.getStopLatitude(),
                                        dto.getStopLongitude(),
                                        dto.getStopName()  // Use the name from request
                                )
                        );
                    } else {
                        // Georeverse only if from map tap
                        return CompletableFuture.supplyAsync(
                                () -> new RidesUtil.GeocodeResult(
                                        dto.getStopLatitude(),
                                        dto.getStopLongitude(),
                                        locationService.resolveBarangayName(null, dto.getStopLatitude(), dto.getStopLongitude())
                                ),
                                externalApiExecutor
                        );
                    }
                })
                .collect(Collectors.toList());

        return f;
    }


    private void awaitApiFuturesAndCollect(ApiFutures f) {
        AppLogger.info(this.getClass(), "Awaiting parallel API futures");
        try {
            CompletableFuture<Void> allApiCalls = CompletableFuture.allOf(
                    f.mainImageFuture,
                    f.routeFuture, f.mainLocationFuture, f.startLocationFuture, f.endLocationFuture,
                    CompletableFuture.allOf(f.stopPointFutures.toArray(new CompletableFuture[0]))
            );

            allApiCalls.get(60, TimeUnit.SECONDS);
            AppLogger.info(this.getClass(), "All API futures completed successfully");

        } catch (TimeoutException e) {
            // API call took too long — likely network issue or service overload
            AppLogger.error(this.getClass(),
                    "API calls timed out after 60 seconds | Check network connectivity and external service health", e);
            throw new RuntimeException("API timeout: External service did not respond within 60 seconds", e);

        } catch (InterruptedException e) {
            // Thread was interrupted — restore interrupt status and fail
            AppLogger.error(this.getClass(),
                    "API future await was interrupted", e);
            Thread.currentThread().interrupt();
            throw new RuntimeException("API call interrupted", e);

        } catch (java.util.concurrent.ExecutionException e) {
            // ExecutionException wraps the actual error from the API call
            // Unwrap it to get the root cause (auth error, network error, etc.)
            Throwable cause = e.getCause();
            if (cause != null) {
                AppLogger.error(this.getClass(),
                        "API call failed with: " + cause.getClass().getSimpleName() + " - " + cause.getMessage(), cause);

                // Rethrow with original cause preserved
                if (cause instanceof RuntimeException) {
                    throw (RuntimeException) cause;
                } else {
                    throw new RuntimeException("API call failed: " + cause.getMessage(), cause);
                }
            } else {
                AppLogger.error(this.getClass(),
                        "API call failed with unknown error", e);
                throw new RuntimeException("API call failed with ExecutionException", e);
            }
        }
    }

    // 3) Build Rides object from futures results and save
    private RideDetailDTO buildAndSaveRide(
            String generatedRidesId, String creatorUsername, String ridesName,
            String riderType, LocalDateTime date, List<String> participantUsernames, String description,
            double latitude, double longitude,
            double startLatitude, double startLongitude,
            double endLatitude, double endLongitude,
            boolean isStartingPointFromSearch,    //
            boolean isEndingPointFromSearch,      //
            String startingPointName,             //
            String endingPointName,               //
            ApiFutures f) {

        String imageUrl = f.mainImageFuture.join();
        String routeCoordinates = f.routeFuture.join();
        String resolvedLocationName = f.mainLocationFuture.join(

        );
        String startLocationName = (isStartingPointFromSearch && startingPointName != null && !startingPointName.isEmpty())
                ? startingPointName
                : f.startLocationFuture.join();

        String endLocationName = (isEndingPointFromSearch && endingPointName != null && !endingPointName.isEmpty())
                ? endingPointName
                : f.endLocationFuture.join();

        List<RidesUtil.GeocodeResult> geocodedStops = f.stopPointFutures.stream()
                .map(CompletableFuture::join)
                .collect(Collectors.toList());

        Rider creator = riderService.getRiderByUsername(creatorUsername);
        RiderType rideType = riderService.getRiderTypeByName(riderType);
        List<Rider> participants = rideParticipantService.addRiderParticipants(participantUsernames);

        Point rideLocation = locationService.createPoint(longitude, latitude);
        Point startPoint = locationService.createPoint(startLongitude, startLatitude);
        Point endPoint = locationService.createPoint(endLongitude, endLatitude);

        List<StopPoint> stopPoints = geocodedStops.stream()
                .map(result -> new StopPoint(
                        result.name(),
                        locationService.createPoint(result.longitude(), result.latitude())
                ))
                .collect(Collectors.toList());

        int calculatedDistance = locationService.calculateDistance(startPoint, endPoint);

        Rides newRide = new Rides();
        newRide.setGeneratedRidesId(generatedRidesId != null ? generatedRidesId : ridesUtil.generateUniqueRideId());
        newRide.setStopPoints(stopPoints);
        newRide.setRidesName(ridesName);
        newRide.setDescription(description);
        newRide.setRiderType(rideType);
        newRide.setUsername(creator);
        newRide.setDistance(calculatedDistance);
        newRide.setLocationName(resolvedLocationName);
        newRide.setLocation(rideLocation);
        newRide.setStartingLocation(startPoint);
        newRide.setStartingPointName(startLocationName);
        newRide.setEndingLocation(endPoint);
        newRide.setEndingPointName(endLocationName);
        newRide.setDate(date);
        newRide.setMapImageUrl(imageUrl);
        newRide.setRouteCoordinates(routeCoordinates);
        newRide.setActive(false);

        Rides savedRide = ridesUtil.saveRideWithTransaction(newRide, creator);
        rideStatusService.markInactive(savedRide.getGeneratedRidesId());

        AppLogger.info(this.getClass(), "Ride created successfully", "rideId", savedRide.getGeneratedRidesId(), "rideName", savedRide.getRidesName());

        return ridesUtil.mapToDetailDTO(savedRide);

    }





}