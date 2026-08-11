package com.smartacademic.master;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TimetableEntryRepository extends JpaRepository<TimetableEntry, Long> {
    List<TimetableEntry> findAllByOrderByIdAsc();

    List<TimetableEntry> findBySectionIdAndSemesterId(Long sectionId, Long semesterId);

    List<TimetableEntry> findBySectionIdAndSemesterIdAndDayOrderByPeriodAsc(Long sectionId, Long semesterId, Day day);

    List<TimetableEntry> findByStaffId(Long staffId);

    List<TimetableEntry> findByStaffIdAndDayOrderByPeriodAsc(Long staffId, Day day);

    List<TimetableEntry> findBySecondaryStaffIdAndDayOrderByPeriodAsc(Long staffId, Day day);

    long countByStaffIsNull();
}
