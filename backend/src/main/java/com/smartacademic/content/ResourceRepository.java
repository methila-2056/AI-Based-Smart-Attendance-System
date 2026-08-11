package com.smartacademic.content;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ResourceRepository extends JpaRepository<Resource, Long> {

    List<Resource> findBySectionIdAndSemesterIdOrderByCreatedAtDesc(Long sectionId, Long semesterId);
}
