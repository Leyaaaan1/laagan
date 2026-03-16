package leyans.RidersHub.Service;


import leyans.RidersHub.DTO.Response.RideResponseDTO;
import leyans.RidersHub.DTO.Request.RidesDTO.StopPointDTO;
import leyans.RidersHub.Service.InteractionRequest.RideParticipantService;
import leyans.RidersHub.Service.MapService.MapBox.MapboxService;
import leyans.RidersHub.Service.MapService.RouteService;
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



    @Autowired
    private final LocationService locationService;
    private final RiderService riderService;
    private final MapboxService mapboxService;
    private final RideParticipantService rideParticipantService;
    private final RouteService routeService;

    private final RidesUtil ridesUtil;

    @Qualifier("externalApiExecutor")
    private final Executor externalApiExecutor;

    @Autowired
    public RidesService(LocationService locationService, RiderService riderService, MapboxService mapboxService,
                        RideParticipantService rideParticipantService, RouteService routeService, RidesUtil ridesUtil, Executor externalApiExecutor) {

        this.riderService = riderService;
        this.locationService = locationService;
        this.mapboxService = mapboxService;
        this.rideParticipantService = rideParticipantService;
        this.routeService = routeService;
        this.ridesUtil = ridesUtil;
        this.externalApiExecutor = externalApiExecutor;
    }
    private static class ApiFutures {
        CompletableFuture<String> mainImageFuture;
        CompletableFuture<String> startImageFuture;
        CompletableFuture<String> endImageFuture;
        CompletableFuture<String> routeFuture;
        CompletableFuture<String> mainLocationFuture;
        CompletableFuture<String> startLocationFuture;
        CompletableFuture<String> endLocationFuture;
        List<CompletableFuture<RidesUtil.GeocodeResult>> stopPointFutures;
    }

    public RideResponseDTO createRide(
            Integer generatedRidesId, String creatorUsername, String ridesName,
            String locationName, String riderType, LocalDateTime date,
            List<String> participantUsernames, String description,
            double latitude, double longitude,
            double startLatitude, double startLongitude,
            double endLatitude, double endLongitude,
            List<StopPointDTO> stopPointsDto) {

        List<StopPointDTO> validStopPoints = stopPointsDto.stream()
                .filter(stop -> stop.getStopLongitude() != 0.0 && stop.getStopLatitude() != 0.0)
                .collect(Collectors.toList());

        ApiFutures futures = prepareApiFutures(validStopPoints, latitude, longitude, startLatitude, startLongitude, endLatitude, endLongitude, locationName);

        awaitApiFuturesAndCollect(futures);

        return buildAndSaveRide(
                generatedRidesId, creatorUsername, ridesName, riderType, date, participantUsernames,
                description, latitude, longitude, startLatitude, startLongitude, endLatitude, endLongitude,
                futures
        );
    }

    private ApiFutures prepareApiFutures(List<StopPointDTO> validStopPoints,
                                         double latitude, double longitude,
                                         double startLatitude, double startLongitude,
                                         double endLatitude, double endLongitude,
                                         String locationName) {
        ApiFutures f = new ApiFutures();

        f.mainImageFuture = CompletableFuture.supplyAsync(
                () -> mapboxService.getStaticMapImageUrl(longitude, latitude),
                externalApiExecutor
        );
        f.startImageFuture = CompletableFuture.supplyAsync(
                () -> mapboxService.getStaticMapImageUrl(startLongitude, startLatitude),
                externalApiExecutor
        );
        f.endImageFuture = CompletableFuture.supplyAsync(
                () -> mapboxService.getStaticMapImageUrl(endLongitude, endLatitude),
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
        f.mainLocationFuture = CompletableFuture.supplyAsync(
                () -> locationService.resolveLandMark(locationName, latitude, longitude),
                externalApiExecutor
        );
        f.startLocationFuture = CompletableFuture.supplyAsync(
                () -> locationService.resolveBarangayName(null, startLatitude, startLongitude),
                externalApiExecutor
        );
        f.endLocationFuture = CompletableFuture.supplyAsync(
                () -> locationService.resolveBarangayName(null, endLatitude, endLongitude),
                externalApiExecutor
        );

        f.stopPointFutures = validStopPoints.stream()
                .map(dto -> CompletableFuture.supplyAsync(
                        () -> new RidesUtil.GeocodeResult(
                                dto.getStopLatitude(),
                                dto.getStopLongitude(),
                                locationService.resolveBarangayName(null, dto.getStopLatitude(), dto.getStopLongitude())
                        ),
                        externalApiExecutor
                ))
                .collect(Collectors.toList());

        return f;
    }

    private void awaitApiFuturesAndCollect(ApiFutures f) {
        try {
            CompletableFuture<Void> allApiCalls = CompletableFuture.allOf(
                    f.mainImageFuture, f.startImageFuture, f.endImageFuture,
                    f.routeFuture, f.mainLocationFuture, f.startLocationFuture, f.endLocationFuture,
                    CompletableFuture.allOf(f.stopPointFutures.toArray(new CompletableFuture[0]))
            );

            allApiCalls.get(30, TimeUnit.SECONDS);
        } catch (TimeoutException e) {
            throw new RuntimeException("API calls timed out after 30 seconds", e);
        } catch (Exception e) {
            throw new RuntimeException("Error during parallel API calls: " + e.getMessage(), e);
        }
    }

    // 3) Build Rides object from futures results and save
    private RideResponseDTO buildAndSaveRide(
            Integer generatedRidesId, String creatorUsername, String ridesName,
            String riderType, LocalDateTime date, List<String> participantUsernames, String description,
            double latitude, double longitude,
            double startLatitude, double startLongitude,
            double endLatitude, double endLongitude,
            ApiFutures f) {

        String imageUrl = f.mainImageFuture.join();
        String startImageUrl = f.startImageFuture.join();
        String endImageUrl = f.endImageFuture.join();
        String routeCoordinates = f.routeFuture.join();
        String resolvedLocationName = f.mainLocationFuture.join();
        String startLocationName = f.startLocationFuture.join();
        String endLocationName = f.endLocationFuture.join();

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
        newRide.setMagImageStartingLocation(startImageUrl);
        newRide.setMagImageEndingLocation(endImageUrl);
        newRide.setRouteCoordinates(routeCoordinates);
        newRide.setActive(false);

        Rides savedRide = ridesUtil.saveRideWithTransaction(newRide, creator);

        return ridesUtil.mapToResponseDTO(savedRide);
    }





}
