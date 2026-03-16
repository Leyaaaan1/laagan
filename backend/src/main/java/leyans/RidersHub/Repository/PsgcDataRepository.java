package leyans.RidersHub.Repository;

import leyans.RidersHub.model.PsgcData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PsgcDataRepository extends JpaRepository<PsgcData, String> {


     List<PsgcData> findByNameIgnoreCase(String name);

    /**
     * Optimized single lookup with index hint
     * Changed from List to Optional - more efficient
     */
//    @Query(value = "SELECT * FROM psgc_data WHERE LOWER(name) = LOWER(:name) LIMIT 1",
//            nativeQuery = true)
//    Optional<PsgcData> findByNameIgnoreCase(@Param("name") String name);

    /**
     * Batch lookup for multiple barangay names
     * Used for stop points processing
     */
   /* @Query(value = "SELECT * FROM psgc_data WHERE LOWER(name) IN " +
            "(SELECT LOWER(name) FROM unnest(CAST(:names AS text[])) AS name)",
            nativeQuery = true)
    List<PsgcData> findByNameIgnoreCase(@Param("names") String[] names);*/




}
