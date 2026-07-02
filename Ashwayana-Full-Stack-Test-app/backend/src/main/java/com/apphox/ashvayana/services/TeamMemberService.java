package com.apphox.ashvayana.services;

import com.apphox.ashvayana.dtos.TeamMemberDto;
import com.apphox.ashvayana.entities.TeamMember;
import com.apphox.ashvayana.repositories.TeamMemberRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class TeamMemberService {

    private final TeamMemberRepository teamMemberRepository;

    public Page<TeamMember> findAll(Pageable pageable) {
        return teamMemberRepository.findAll(pageable);
    }

    public TeamMember findById(Long id) {
        return teamMemberRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Team member not found with id: " + id));
    }

    public TeamMember create(TeamMemberDto dto) {
        TeamMember member = mapToEntity(dto, new TeamMember());
        return teamMemberRepository.save(member);
    }

    public TeamMember update(Long id, TeamMemberDto dto) {
        TeamMember member = findById(id);
        mapToEntity(dto, member);
        return teamMemberRepository.save(member);
    }

    public void delete(Long id) {
        teamMemberRepository.deleteById(id);
    }

    private TeamMember mapToEntity(TeamMemberDto dto, TeamMember member) {
        member.setName(dto.getName());
        member.setDesignation(dto.getDesignation());
        member.setBio(dto.getBio());
        member.setImageUrl(dto.getImageUrl());
        member.setEmail(dto.getEmail());
        member.setPhone(dto.getPhone());
        member.setLinkedin(dto.getLinkedin());
        member.setDisplayOrder(dto.getDisplayOrder());
        member.setActive(dto.getActive() == null || dto.getActive());
        return member;
    }
}
