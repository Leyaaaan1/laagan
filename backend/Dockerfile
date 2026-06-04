# ── Stage 1: Build ────────────────────────────────────────────
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Copy Maven wrapper first — dependency download layer is cached
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -q

# Build the JAR
COPY src ./src
RUN ./mvnw package -DskipTests -q

# ── Stage 2: Runtime ──────────────────────────────────────────
FROM eclipse-temurin:17-jre
WORKDIR /app

RUN mkdir -p logs
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# -Xms128m  start small — Render free tier has only 512 MB total
# -Xmx400m  cap heap at 400 MB, leaving ~100 MB for OS + JVM overhead
ENTRYPOINT ["java", "-Xms128m", "-Xmx400m", "-jar", "app.jar"]