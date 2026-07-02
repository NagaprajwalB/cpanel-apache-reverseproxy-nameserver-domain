package com.apphox.ashvayana.services;

import com.apphox.ashvayana.dtos.TestimonialDto;
import com.apphox.ashvayana.entities.Testimonial;
import com.apphox.ashvayana.repositories.TestimonialRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class TestimonialService {

    private final TestimonialRepository testimonialRepository;

    public Page<Testimonial> findAll(Pageable pageable) {
        return testimonialRepository.findAll(pageable);
    }

    public Testimonial findById(Long id) {
        return testimonialRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Testimonial not found with id: " + id));
    }

    public Testimonial create(TestimonialDto dto) {
        Testimonial testimonial = mapToEntity(dto, new Testimonial());
        return testimonialRepository.save(testimonial);
    }

    public Testimonial update(Long id, TestimonialDto dto) {
        Testimonial testimonial = findById(id);
        mapToEntity(dto, testimonial);
        return testimonialRepository.save(testimonial);
    }

    public void delete(Long id) {
        testimonialRepository.deleteById(id);
    }

    private Testimonial mapToEntity(TestimonialDto dto, Testimonial testimonial) {
        testimonial.setAuthorName(dto.getAuthorName());
        testimonial.setAuthorDesignation(dto.getAuthorDesignation());
        testimonial.setAuthorImage(dto.getAuthorImage());
        testimonial.setContent(dto.getContent());
        testimonial.setRating(dto.getRating());
        testimonial.setPropertyName(dto.getPropertyName());
        testimonial.setActive(dto.getActive() == null || dto.getActive());
        return testimonial;
    }
}
