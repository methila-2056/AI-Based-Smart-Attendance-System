package com.smartacademic.master;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByUsername(String username);

    List<Student> findAllByOrderByRegisterNumberAsc();

    List<Student> findBySectionIdOrderByRegisterNumberAsc(Long sectionId);
}
