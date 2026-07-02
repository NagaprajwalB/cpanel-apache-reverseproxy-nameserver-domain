package com.apphox.ashvayana.repositories;

import com.apphox.ashvayana.entities.Amenity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AmenityRepository extends JpaRepository<Amenity, Long> {
    Optional<Amenity> findByName(String name);
}
