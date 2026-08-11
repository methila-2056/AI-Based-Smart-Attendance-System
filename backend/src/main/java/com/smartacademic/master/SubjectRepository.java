package com.smartacademic.master;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
    Optional<Subject> findByCode(String code);
}
