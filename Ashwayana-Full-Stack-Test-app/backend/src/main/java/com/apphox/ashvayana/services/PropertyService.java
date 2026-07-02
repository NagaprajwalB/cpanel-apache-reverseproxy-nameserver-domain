package com.apphox.ashvayana.services;

import com.apphox.ashvayana.dtos.PropertyDto;
import com.apphox.ashvayana.entities.*;
import com.apphox.ashvayana.repositories.AmenityRepository;
import com.apphox.ashvayana.repositories.PropertyRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final AmenityRepository amenityRepository;

    public Page<Property> findAll(Pageable pageable) {
        return propertyRepository.findAll(pageable);
    }

    public Property findById(Long id) {
        return propertyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Property not found with id: " + id));
    }

    public Property create(PropertyDto dto) {
        Property property = mapToEntity(dto, new Property());
        return propertyRepository.save(property);
    }

    public Property update(Long id, PropertyDto dto) {
        Property property = findById(id);
        mapToEntity(dto, property);
        return propertyRepository.save(property);
    }

    public void delete(Long id) {
        propertyRepository.deleteById(id);
    }

    private Property mapToEntity(PropertyDto dto, Property property) {
        property.setTitle(dto.getTitle());
        property.setSlug(dto.getSlug() != null ? dto.getSlug() : generateSlug(dto.getTitle()));
        property.setDescription(dto.getDescription());
        property.setPrice(dto.getPrice());
        property.setPriceLabel(dto.getPriceLabel());
        property.setType(dto.getType());
        property.setStatus(dto.getStatus());
        property.setAddress(dto.getAddress());
        property.setCity(dto.getCity());
        property.setState(dto.getState());
        property.setPincode(dto.getPincode());
        property.setBedrooms(dto.getBedrooms());
        property.setBathrooms(dto.getBathrooms());
        property.setArea(dto.getArea());
        property.setAreaUnit(dto.getAreaUnit());
        property.setFloor(dto.getFloor());
        property.setTotalFloors(dto.getTotalFloors());
        property.setParkingSpaces(dto.getParkingSpaces());
        property.setThumbnailUrl(dto.getThumbnailUrl());
        property.setMetaTitle(dto.getMetaTitle());
        property.setMetaDescription(dto.getMetaDescription());
        property.setKeywords(dto.getKeywords());
        property.setOpenGraphImage(dto.getOpenGraphImage());
        property.setBrochureUrl(dto.getBrochureUrl());
        property.setVideoUrl(dto.getVideoUrl());
        property.setFeatured(dto.getFeatured() != null && dto.getFeatured());

        if (dto.getAmenityIds() != null) {
            List<Amenity> amenities = amenityRepository.findAllById(dto.getAmenityIds());
            property.setAmenities(amenities);
        }

        return property;
    }

    private String generateSlug(String title) {
        if (title == null) return "";
        return title.toLowerCase().trim()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("[\\s-]+", "-");
    }
}
