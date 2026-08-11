package com.smartacademic.content;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TestRepository extends JpaRepository<Test, Long> {

    List<Test> findBySectionIdAndSemesterIdOrderByTestDateAsc(Long sectionId, Long semesterId);

    List<Test> findBySectionIdAndSemesterIdAndTestDateGreaterThanEqualOrderByTestDateAsc(Long sectionId,
            Long semesterId, java.time.LocalDate from);
}
