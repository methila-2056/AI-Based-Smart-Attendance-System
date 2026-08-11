package com.smartacademic.attendance;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {

    Optional<AttendanceSession> findByTimetableEntryIdAndSessionDate(Long timetableEntryId, LocalDate sessionDate);

    List<AttendanceSession> findByStaffIdAndSessionDate(Long staffId, LocalDate sessionDate);

    List<AttendanceSession> findBySectionIdAndSessionDate(Long sectionId, LocalDate sessionDate);

    List<AttendanceSession> findByTimetableEntryIdInAndSessionDate(List<Long> timetableEntryIds, LocalDate sessionDate);

    List<AttendanceSession> findBySectionIdAndSessionDateBetween(Long sectionId, LocalDate from, LocalDate to);

    List<AttendanceSession> findBySectionIdInAndSessionDateBetween(List<Long> sectionIds, LocalDate from, LocalDate to);

    List<AttendanceSession> findByStaffIdAndSessionDateBetween(Long staffId, LocalDate from, LocalDate to);

    List<AttendanceSession> findBySectionId(Long sectionId);

    List<AttendanceSession> findBySectionIdOrderBySessionDateDesc(Long sectionId);

    Optional<AttendanceSession> findByCurrentToken(String currentToken);
}
