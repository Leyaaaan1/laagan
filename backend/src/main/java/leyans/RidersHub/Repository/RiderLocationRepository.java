package leyans.RidersHub.Repository;

import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.RiderLocation;
import leyans.RidersHub.model.StartedRide;
import org.locationtech.jts.geom.Point;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RiderLocationRepository extends JpaRepository<RiderLocation, Integer> {

    // ✅ FIXED: raw doubles instead of Point
    @Query(value = "SELECT ST_DistanceSphere(" +
            "ST_SetSRID(ST_MakePoint(:lng1, :lat1), 4326), " +
            "ST_SetSRID(ST_MakePoint(:lng2, :lat2), 4326))",
            nativeQuery = true)
    double getDistanceBetweenPoints(
            @Param("lat1") double lat1, @Param("lng1") double lng1,
            @Param("lat2") double lat2, @Param("lng2") double lng2);




}