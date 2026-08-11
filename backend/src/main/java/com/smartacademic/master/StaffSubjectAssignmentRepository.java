package com.smartacademic.master;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StaffSubjectAssignmentRepository extends JpaRepository<StaffSubjectAssignment, Long> {
    List<StaffSubjectAssignment> findAllByOrderByIdAsc();

    List<StaffSubjectAssignment> findByStaffId(Long staffId);

    List<StaffSubjectAssignment> findBySubjectIdAndSectionIdAndSemesterId(Long subjectId, Long sectionId, Long semesterId);

    java.util.Optional<StaffSubjectAssignment> findFirstByStaffIdAndSubjectIdAndSectionIdAndSemesterId(Long staffId,
            Long subjectId, Long sectionId, Long semesterId);
}
