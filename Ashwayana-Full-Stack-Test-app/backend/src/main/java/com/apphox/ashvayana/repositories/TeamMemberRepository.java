package com.apphox.ashvayana.repositories;

import com.apphox.ashvayana.entities.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
}
