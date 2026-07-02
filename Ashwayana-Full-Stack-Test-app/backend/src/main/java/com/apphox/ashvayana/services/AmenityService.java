package com.apphox.ashvayana.services;

import com.apphox.ashvayana.dtos.AmenityDto;
import com.apphox.ashvayana.entities.Amenity;
import com.apphox.ashvayana.repositories.AmenityRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AmenityService {

    private final AmenityRepository amenityRepository;

    public Page<Amenity> findAll(Pageable pageable) {
        return amenityRepository.findAll(pageable);
    }

    public Amenity findById(Long id) {
        return amenityRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Amenity not found with id: " + id));
    }

    public Amenity create(AmenityDto dto) {
        Amenity amenity = mapToEntity(dto, new Amenity());
        return amenityRepository.save(amenity);
    }

    public Amenity update(Long id, AmenityDto dto) {
        Amenity amenity = findById(id);
        mapToEntity(dto, amenity);
        return amenityRepository.save(amenity);
    }

    public void delete(Long id) {
        amenityRepository.deleteById(id);
    }

    private Amenity mapToEntity(AmenityDto dto, Amenity amenity) {
        amenity.setName(dto.getName());
        amenity.setIcon(dto.getIcon());
        amenity.setDescription(dto.getDescription());
        amenity.setActive(dto.getActive() == null || dto.getActive());
        return amenity;
    }
}
