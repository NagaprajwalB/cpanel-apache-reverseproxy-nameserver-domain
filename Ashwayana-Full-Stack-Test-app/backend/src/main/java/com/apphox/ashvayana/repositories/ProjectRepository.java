package com.apphox.ashvayana.repositories;

import com.apphox.ashvayana.entities.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    Optional<Project> findBySlug(String slug);
}
