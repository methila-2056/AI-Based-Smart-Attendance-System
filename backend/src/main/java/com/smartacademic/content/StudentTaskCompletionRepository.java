package com.smartacademic.content;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentTaskCompletionRepository extends JpaRepository<StudentTaskCompletion, Long> {

    Optional<StudentTaskCompletion> findByStudentIdAndTaskId(Long studentId, Long taskId);

    void deleteByTaskId(Long taskId);
}
