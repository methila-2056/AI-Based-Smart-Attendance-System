package com.smartacademic.content;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findBySectionIdAndSemesterIdOrderByDueDateAsc(Long sectionId, Long semesterId);

    List<Task> findBySectionIdAndSemesterIdAndDueDateGreaterThanEqualOrderByDueDateAsc(Long sectionId,
            Long semesterId, java.time.LocalDate from);
}
