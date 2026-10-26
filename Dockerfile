# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /app

# Copy Maven wrapper and pom first (layer cache: only re-downloads deps if pom changes)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -q

# Copy source and build the JAR
COPY src ./src
RUN ./mvnw clean package -DskipTests -q

# ── Stage 2: Runtime ────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Copy only the fat JAR from the builder stage
COPY --from=builder /app/target/campusPlacementSystem-0.0.1-SNAPSHOT.jar app.jar

# Render injects PORT at runtime; Spring Boot reads it via server.port=${PORT:8081}
EXPOSE 8081

ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]
