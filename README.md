# RidersHub — Real-Time Ride Sharing System

A mobile ride creation and discovery app built for Mindanao riders. Create rides, set routes with stops, invite others, track participants in real time, and explore locations with map snapshots and photos.

---

## Project Structure

```
RidersHub/
├── backend/    # Spring Boot REST API
└── frontend/   # React Native mobile app
```

---

## What's Working

**Ride Management**
- Create rides with starting point, ending point, and stop points
- Route generation via **GraphHopper API** (replaces ORS), returned as GeoJSON
- Parallel API calls using `CompletableFuture` for faster ride creation
- View ride details, participants, and route on an interactive map
- Ride distance calculated using **PostGIS** spatial queries

**Map & Location**
- **Mapbox** static map snapshots captured on ride creation for start, end, and main location
- **Cloudinary** stores all map images
- **Nominatim API** for location search and reverse geocoding (barangay-level)
- **PSGC data** from the Philippine Statistics Authority converts coordinates into barangay, city, province, and region
- WebView-based interactive route map rendered in the mobile app
- Real-time participant location tracking — stores and retrieves latest location per rider

**Location Images**
- **Wikimedia Commons API** fetches location photos based on ride destination
- Results are cached in **Redis** to avoid redundant API calls
- Rate-limited with **Bucket4j** (1 req/sec, Redis-backed) for Nominatim, Mapbox, and Wikimedia

**Join & Invite System**
- QR code generation per ride using **ZXing**, uploaded to Cloudinary
- Invite link flow: generate → share → join request → approve/reject
- Direct join requests without invite link also supported
- Ride owner approves or rejects join requests
- Participants stored and managed per ride

**Authentication**
- **JWT-based** stateless authentication
- Login returns a token; all protected endpoints require `Authorization: Bearer <token>`
- Role-based access via **Spring Security**

**Rider Profiles**
- Profile creation on first access (auto-seeded from registration rider type)
- Update display name, bio, profile picture, and rider types
- Add or remove multiple rider types per profile

---

## Planned / In Progress

- **WebSocket** — live ride updates and real-time location broadcasting
- **Redis** — real-time user location pub/sub and caching layer expansion
- Unit and integration tests for core service layer
- Improved mobile UX for ride discovery and navigation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile frontend | React Native |
| Backend | Spring Boot (Java) |
| Database | PostgreSQL + PostGIS |
| ORM | Spring Data JPA + Hibernate Spatial |
| Authentication | Spring Security + JWT |
| Maps | Mapbox (snapshots), WebView (interactive) |
| Routing | GraphHopper API |
| Image hosting | Cloudinary |
| Location search | Nominatim API |
| Location photos | Wikimedia Commons API |
| Geocoding data | PSGC (Philippine Statistics Authority) |
| Rate limiting | Bucket4j (Redis-backed) |
| Caching | Redis |
| QR codes | ZXing |

---

## Setup Guide

### Prerequisites
- Java 17+
- Node.js + React Native CLI
- PostgreSQL with PostGIS extension
- Redis
- Android emulator or physical device

### 1. Clone and navigate

```bash
git clone <your-repo-url>
cd RidersHub
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# Database
POSTGRES_DB_URL=your_database_host
POSTGRES_DB_USERNAME=your_database_user
POSTGRES_DB_PASSWORD=your_database_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=86400000

CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name

REACT_APP_MAPBOX_TOKENyour_mapbox_api_key
REACT_APP_API_BASE_URL=your_mapbox_token

GRASS_HOPPER_KEY=your_graphhopper_api_key

NOMINATIM_API_BASE=https://nominatim.openstreetmap.org
AGENT=${}

WIKIMEDIA_API_USERAGENT=RidersHub/1.0 (your@email.com)
wikimedia.api.useragent=${WIKIMEDIA_API_USERAGENT}
WIKIMEDIA_API_BASE
baseUrl=https://riders
```

> **Do not commit your `.env` file.**

### 3. Enable PostGIS

In your PostgreSQL client or pgAdmin:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 4. Import PSGC Data

Download the official PSGC dataset from [psa.gov.ph/classification/psgc](https://psa.gov.ph/classification/psgc) and import it into your database or use the current data in the backend
```backend\psgc_data.csv'```
### 5. Start the backend

```bash
cd backend
./mvnw spring-boot:run
```

### 6. Install frontend dependencies

```bash
cd frontend
npm install
```

### 7. Start Metro

```bash
npx react-native start
```

### 8. Run on Android

```bash
npx react-native run-android
```

---

## Contact

Personal learning project — built by a developer from Davao City.  
Suggestions and ideas welcome. Email: paninsorolean@gmail.com