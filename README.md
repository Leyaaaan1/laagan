# laagan — Real-Time Ride Sharing Group Rides System

Group ride coordination, built for riders. Create a ride, bring your crew, and stay connected in real time — live location, checkpoints, route snapshots, and ride summaries, all in one app.

---

Homepage:
https://www.leanpaninsoro.dev/laagan/homepage/

---


## Features

**Ride Sharing**
- Group ride sharing app — create and join rides with your crew or ride solo
- Share rides on social media
- Free to use
- Currently in closed testing on Android

**Everything you need for a shared ride**
Built for the way riders actually travel — whether you're joining a group or riding solo, Laagan keeps everyone connected.

- **Live location sharing** — See every rider on the map in real time. No more "where are you?" messages, just open the app.
- **Group & solo rides** — Create a group ride for your crew or join as a solo rider. Flexible for any commute or trip type.
- **Checkpoint tracking** — Set checkpoints along your route and track who has passed them. Perfect for long-distance group rides.
- **Ride summaries** — Duration, total distance, average speed, and checkpoints, with detailed insights for each checkpoint including time, distance, and performance at every stage of the route.
- **Offline support** — Lost signal? Laagan keeps your GPS running and syncs back up automatically when you're reconnected.
- **Share ride stats**, photos, and route details with others or in social media.


---

## Engineering Highlights

### Laagan — Real-Time Group Ride Tracker
**Personal** · Full-Stack (Backend Lead) · In Progress
Sole Developer · Java · React Native

**The Hard Problem**
Reverse geocoding in Mindanao needs real barangay-level precision — something commercial APIs either don't support or charge for at scale. The fix: a custom geocoding pipeline that matches Nominatim coordinates against the official PSGC dataset, cached locally to stay fully offline-capable with zero paid API dependency.

**Key Engineering Work**
- Real-time location broadcasting to all ride participants via WebSocket
- Checkpoint tracking that records each rider's arrival per checkpoint, sequenced from route data
- Full ride lifecycle management — start, pause, force-finish, and ownership transfer on creator exit
- Auth system with Google OAuth + email/password, rate-limited login, and token rotation & blacklisting

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile frontend | React Native |
| Backend | Spring Boot (Java) |
| Database | PostgreSQL + PostGIS |
| ORM | Spring Data JPA + Hibernate Spatial |
| Authentication | Spring Security + JWT, Google OAuth |
| Maps | Mapbox (snapshots), WebView (interactive) |
| Routing | GraphHopper API |
| Caching | Redis (reroute cache) |
| Image hosting | Cloudinary |
| Geocoding | PSGC dataset + Nominatim API |
| Rate limiting | Bucket4j (Redis-backed) |
| QR codes | ZXing |

---

## Contact

Personal learning project — built by a developer from Davao City.
Suggestions and ideas welcome. Email: paninsorolean@gmail.com
