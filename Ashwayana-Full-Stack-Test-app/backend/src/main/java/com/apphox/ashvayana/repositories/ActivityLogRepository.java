package com.apphox.ashvayana.repositories;

import com.apphox.ashvayana.entities.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
}
