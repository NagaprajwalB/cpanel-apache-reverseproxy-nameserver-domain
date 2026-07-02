# Ashvayana Backend

Admin Panel Backend for Ashvayana — a Spring Boot REST API for managing enquiries, properties, projects, materials, team members, testimonials, amenities, and site settings, secured with JWT authentication.

## Tech Stack

- **Java 21**
- **Spring Boot 4.1.0**
  - Spring Web (MVC)
  - Spring Data JPA
  - Spring Security
  - Spring Validation
- **PostgreSQL** — primary database
- **JWT (jjwt 0.12.5)** — stateless authentication
- **Cloudinary** — media/image upload and storage
- **Lombok** — boilerplate reduction
- **Maven** (with Maven Wrapper — no local Maven install required)

## Prerequisites

- Java 21 JDK
- PostgreSQL 14+ (local or remote)
- A Cloudinary account (for file/image uploads)
- Docker & Docker Compose (optional, for containerized setup)

## Project Structure

```
.
├── mvnw, mvnw.cmd        # Maven wrapper scripts
├── pom.xml               # Project dependencies & build config
├── src/
│   ├── main/java/...     # Application source
│   └── main/resources/   # application.properties/yml, static resources
├── Dockerfile
├── docker-compose.yml
└── Ashvayana_Postman_Collection.json   # API collection for testing
```

## Configuration

Set the following either in `src/main/resources/application.properties` or as environment variables:

| Variable | Description | Example |
|---|---|---|
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC URL | `jdbc:postgresql://localhost:5432/ashvayana` |
| `SPRING_DATASOURCE_USERNAME` | DB username | `ashvayana` |
| `SPRING_DATASOURCE_PASSWORD` | DB password | `ashvayana_password` |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | Schema handling strategy | `update` |
| `JWT_SECRET` | Secret key used to sign JWTs | *(long random string)* |
| `CLOUDINARY_URL` | Cloudinary connection string | `cloudinary://<api_key>:<api_secret>@<cloud_name>` |

> Never commit real secrets. Use a `.env` file (excluded via `.gitignore`) or your deployment platform's secret manager.

## Running Locally (without Docker)

1. **Create the database:**
   ```bash
   psql -U postgres -c "CREATE DATABASE ashvayana;"
   psql -U postgres -c "CREATE USER ashvayana WITH PASSWORD 'ashvayana_password';"
   psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ashvayana TO ashvayana;"
   ```

2. **Set environment variables** (see table above), or edit `application.properties` directly.

3. **Run the app:**
   ```bash
   ./mvnw spring-boot:run
   ```
   *(Windows: `mvnw.cmd spring-boot:run`)*

4. The API will be available at `http://localhost:8080`.

### Build a runnable JAR

```bash
./mvnw clean package -DskipTests
java -jar target/ashvayana-backend-0.0.1-SNAPSHOT.jar
```

## Running with Docker

```bash
docker compose up --build
```

This starts the app (port `8080`) alongside a PostgreSQL container. See `docker-compose.yml` for service configuration and `Dockerfile` for the build.

To run the app image standalone against an external database:
```bash
docker build -t ashvayana-backend .
docker run -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:5432/ashvayana \
  -e SPRING_DATASOURCE_USERNAME=ashvayana \
  -e SPRING_DATASOURCE_PASSWORD=ashvayana_password \
  ashvayana-backend
```

## API Overview

Base URL: `{{baseUrl}}` (e.g. `http://localhost:8080`). Full request/response examples are in [`Ashvayana_Postman_Collection.json`](./Ashvayana_Postman_Collection.json) — import it into Postman to explore and test.

### Auth
| Method | Endpoint |
|---|---|
| POST | `/api/auth/login` |

### Enquiries
| Method | Endpoint |
|---|---|
| GET | `/api/enquiries?page=0&size=10` |
| GET | `/api/enquiries/{id}` |
| PATCH | `/api/enquiries/{id}/status?status=Contacted` |
| DELETE | `/api/enquiries/{id}` |

### Materials
| Method | Endpoint |
|---|---|
| GET | `/api/materials?page=0&size=10` |
| GET | `/api/materials/{id}` |
| POST | `/api/materials` |
| PUT | `/api/materials/{id}` |
| DELETE | `/api/materials/{id}` |

### Projects
| Method | Endpoint |
|---|---|
| GET | `/api/projects?page=0&size=10` |
| GET | `/api/projects/{id}` |
| POST | `/api/projects` |
| PUT | `/api/projects/{id}` |
| DELETE | `/api/projects/{id}` |

### Users
| Method | Endpoint |
|---|---|
| GET | `/api/users` |
| GET | `/api/users/{id}` |
| POST | `/api/users` |
| PUT | `/api/users/{id}` |
| PATCH | `/api/users/{id}/toggle-active` |
| DELETE | `/api/users/{id}` |

### Team
| Method | Endpoint |
|---|---|
| GET | `/api/team?page=0&size=10` |
| GET | `/api/team/{id}` |
| POST | `/api/team` |
| PUT | `/api/team/{id}` |
| DELETE | `/api/team/{id}` |

### Testimonials
| Method | Endpoint |
|---|---|
| GET | `/api/testimonials?page=0&size=10` |
| GET | `/api/testimonials/{id}` |
| POST | `/api/testimonials` |
| PUT | `/api/testimonials/{id}` |
| DELETE | `/api/testimonials/{id}` |

### Properties
| Method | Endpoint |
|---|---|
| GET | `/api/properties?page=0&size=10` |
| GET | `/api/properties/{id}` |
| POST | `/api/properties` |
| PUT | `/api/properties/{id}` |
| DELETE | `/api/properties/{id}` |

### Amenities
| Method | Endpoint |
|---|---|
| GET | `/api/amenities?page=0&size=10` |
| GET | `/api/amenities/{id}` |
| POST | `/api/amenities` |
| PUT | `/api/amenities/{id}` |
| DELETE | `/api/amenities/{id}` |

### Settings
| Method | Endpoint |
|---|---|
| GET | `/api/settings` |
| POST | `/api/settings` |

### Uploads
| Method | Endpoint |
|---|---|
| POST | `/api/upload` |

Most endpoints require a valid JWT in the `Authorization: Bearer <token>` header, obtained via `/api/auth/login`.

## Testing the API

Import `Ashvayana_Postman_Collection.json` into Postman, set the `baseUrl` collection variable (e.g. `http://localhost:8080`), log in via `/api/auth/login`, and use the returned token for subsequent requests.

## License

*(Add license information here.)*