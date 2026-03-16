package leyans.RidersHub.model;

import jakarta.persistence.*;
import org.locationtech.jts.geom.Geometry;

@Entity
@Table(name = "psgc_data")
public class PsgcData {

    @Id
    @Column(name = "psgc_code", length = 12)
    private String psgcCode;

    @Column(name = "name")
    private String name;

    @Column(name = "correspondence_code", length = 12)
    private String correspondenceCode;

    @Column(name = "geographic_level")
    private String geographicLevel;

    public String getGeographicLevel() {
        return geographicLevel;
    }

    public void setGeographicLevel(String geographicLevel) {
        this.geographicLevel = geographicLevel;
    }

    public String getCorrespondenceCode() {
        return correspondenceCode;
    }

    public void setCorrespondenceCode(String correspondenceCode) {
        this.correspondenceCode = correspondenceCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPsgcCode() {
        return psgcCode;
    }

    public void setPsgcCode(String psgcCode) {
        this.psgcCode = psgcCode;
    }
}