package com.apphox.ashvayana.services;

import com.apphox.ashvayana.dtos.ProjectDto;
import com.apphox.ashvayana.entities.Project;
import com.apphox.ashvayana.repositories.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;

    public Page<Project> findAll(Pageable pageable) {
        return projectRepository.findAll(pageable);
    }

    public Project findById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Project not found with id: " + id));
    }

    public Project create(ProjectDto dto) {
        Project project = mapToEntity(dto, new Project());
        return projectRepository.save(project);
    }

    public Project update(Long id, ProjectDto dto) {
        Project project = findById(id);
        mapToEntity(dto, project);
        return projectRepository.save(project);
    }

    public void delete(Long id) {
        projectRepository.deleteById(id);
    }

    private Project mapToEntity(ProjectDto dto, Project project) {
        project.setTitle(dto.getTitle());
        project.setSlug(dto.getSlug() != null ? dto.getSlug() : generateSlug(dto.getTitle()));
        project.setDescription(dto.getDescription());
        project.setShortDescription(dto.getShortDescription());
        project.setLocation(dto.getLocation());
        project.setStatus(dto.getStatus());
        project.setThumbnailUrl(dto.getThumbnailUrl());
        project.setCompletionYear(dto.getCompletionYear());
        project.setTotalUnits(dto.getTotalUnits());
        project.setFeatured(dto.getFeatured() != null && dto.getFeatured());
        project.setMetaTitle(dto.getMetaTitle());
        project.setMetaDescription(dto.getMetaDescription());
        return project;
    }

    private String generateSlug(String title) {
        if (title == null) return "";
        return title.toLowerCase().trim()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("[\\s-]+", "-");
    }
}
