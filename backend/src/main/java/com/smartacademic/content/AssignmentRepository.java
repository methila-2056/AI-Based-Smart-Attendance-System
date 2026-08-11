package com.smartacademic.content;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    List<Assignment> findBySectionIdAndSemesterIdOrderByDueDateAsc(Long sectionId, Long semesterId);

    List<Assignment> findBySectionIdAndSemesterIdAndDueDateGreaterThanEqualOrderByDueDateAsc(Long sectionId,
            Long semesterId, java.time.LocalDate from);
}
