package com.apphox.ashvayana.services;

import com.apphox.ashvayana.dtos.MaterialDto;
import com.apphox.ashvayana.entities.Material;
import com.apphox.ashvayana.repositories.MaterialRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class MaterialService {

    private final MaterialRepository materialRepository;

    public Page<Material> findAll(Pageable pageable) {
        return materialRepository.findAll(pageable);
    }

    public Material findById(Long id) {
        return materialRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Material not found with id: " + id));
    }

    public Material create(MaterialDto dto) {
        Material material = mapToEntity(dto, new Material());
        return materialRepository.save(material);
    }

    public Material update(Long id, MaterialDto dto) {
        Material material = findById(id);
        mapToEntity(dto, material);
        return materialRepository.save(material);
    }

    public void delete(Long id) {
        materialRepository.deleteById(id);
    }

    private Material mapToEntity(MaterialDto dto, Material material) {
        material.setName(dto.getName());
        material.setDescription(dto.getDescription());
        material.setCategory(dto.getCategory());
        material.setImageUrl(dto.getImageUrl());
        material.setBrand(dto.getBrand());
        material.setActive(dto.getActive() == null || dto.getActive());
        return material;
    }
}
