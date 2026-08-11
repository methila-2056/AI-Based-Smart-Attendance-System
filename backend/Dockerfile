# --- Stage 1: Build ---
FROM maven:3.9-eclipse-temurin-25-alpine AS build
WORKDIR /app

# Copy POM first to cache dependency downloads
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests -B

# --- Stage 2: Runtime ---
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=60", "-jar", "app.jar"]
