package com.smartacademic.master;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AcademicYearRepository extends JpaRepository<AcademicYear, Long> {
    Optional<AcademicYear> findFirstByCurrentYearTrue();
}
