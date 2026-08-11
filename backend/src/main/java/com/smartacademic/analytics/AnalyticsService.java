package com.smartacademic.analytics;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartacademic.analytics.dto.AnalyticsDtos.AnalyticsOverviewDto;
import com.smartacademic.analytics.dto.AnalyticsDtos.MonthlyPointDto;
import com.smartacademic.analytics.dto.AnalyticsDtos.SectionStatDto;
import com.smartacademic.analytics.dto.AnalyticsDtos.StudentStatDto;
import com.smartacademic.analytics.dto.AnalyticsDtos.SubjectStatDto;
import com.smartacademic.attendance.AttendanceRecord;
import com.smartacademic.attendance.AttendanceRecordRepository;
import com.smartacademic.attendance.AttendanceSession;
import com.smartacademic.attendance.AttendanceSessionRepository;
import com.smartacademic.attendance.AttendanceStatus;
import com.smartacademic.common.ClockService;
import com.smartacademic.common.NotFoundException;
import com.smartacademic.master.Staff;
import com.smartacademic.master.StaffRepository;
import com.smartacademic.master.StaffRole;
import com.smartacademic.master.StaffRoleRepository;
import com.smartacademic.master.StaffRoleType;
import com.smartacademic.master.StaffSubjectAssignmentRepository;
import com.smartacademic.master.Student;
import com.smartacademic.master.StudentRepository;
import com.smartacademic.master.Subject;

@Service
public class AnalyticsService {

    private final StaffRepository staffRepository;
    private final StaffRoleRepository staffRoleRepository;
    private final StaffSubjectAssignmentRepository assignmentRepository;
    private final StudentRepository studentRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceRecordRepository recordRepository;
    private final ClockService clock;

    public AnalyticsService(StaffRepository staffRepository, StaffRoleRepository staffRoleRepository,
                            StaffSubjectAssignmentRepository assignmentRepository, StudentRepository studentRepository,
                            AttendanceSessionRepository sessionRepository, AttendanceRecordRepository recordRepository,
                            ClockService clock) {
        this.staffRepository = staffRepository;
        this.staffRoleRepository = staffRoleRepository;
        this.assignmentRepository = assignmentRepository;
        this.studentRepository = studentRepository;
        this.sessionRepository = sessionRepository;
        this.recordRepository = recordRepository;
        this.clock = clock;
    }

    private Staff requireCoordinator(String username) {
        Staff staff = staffRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Staff profile not found for " + username));
        boolean coordinator = staffRoleRepository.findByStaffId(staff.getId()).stream()
                .map(StaffRole::getRole).anyMatch(r -> r == StaffRoleType.ATTENDANCE_COORDINATOR);
        if (!coordinator) {
            throw new IllegalArgumentException("Only an attendance coordinator can view analytics");
        }
        return staff;
    }

    private List<Long> scopeSectionIds(Staff coordinator) {
        List<Long> ids = assignmentRepository.findByStaffId(coordinator.getId()).stream()
                .map(a -> a.getSection().getId()).distinct().collect(Collectors.toList());
        if (ids.isEmpty()) {
            return studentRepository.findAllByOrderByRegisterNumberAsc().stream()
                    .map(s -> s.getSection().getId()).distinct().collect(Collectors.toList());
        }
        return ids;
    }

    private List<Student> scopeStudents(List<Long> sectionIds) {
        return sectionIds.stream()
                .flatMap(id -> studentRepository.findBySectionIdOrderByRegisterNumberAsc(id).stream())
                .collect(Collectors.toList());
    }

    private List<AttendanceSession> allSessions(List<Long> sectionIds) {
        return sessionRepository.findBySectionIdInAndSessionDateBetween(sectionIds, LocalDate.of(1900, 1, 1),
                clock.today());
    }

    private List<AttendanceRecord> recordsOf(List<AttendanceSession> sessions) {
        List<Long> ids = sessions.stream().map(AttendanceSession::getId).collect(Collectors.toList());
        return ids.isEmpty() ? List.of() : recordRepository.findBySession_IdIn(ids);
    }

    // ------------------------------------------------------------------ Overview

    @Transactional(readOnly = true)
    public AnalyticsOverviewDto overview(String username) {
        Staff coordinator = requireCoordinator(username);
        List<Long> sectionIds = scopeSectionIds(coordinator);
        List<Student> students = scopeStudents(sectionIds);
        Map<Long, Long> studentCountBySection = students.stream()
                .collect(Collectors.groupingBy(s -> s.getSection().getId(), Collectors.counting()));

        List<AttendanceSession> sessions = allSessions(sectionIds);
        long totalSlots = sessions.stream()
                .mapToLong(s -> studentCountBySection.getOrDefault(s.getSection().getId(), 0L))
                .sum();
        List<AttendanceRecord> records = recordsOf(sessions);
        long present = records.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
        long od = records.stream().filter(r -> r.getStatus() == AttendanceStatus.OD_PRESENT).count();
        long absent = Math.max(0, totalSlots - (present + od));

        Map<Long, long[]> subjectCounts = new LinkedHashMap<>(); // [0]=total, [1]=present, [2]=od
        Map<String, long[]> sectionCounts = new LinkedHashMap<>(); // [0]=total, [1]=present, [2]=od
        for (AttendanceRecord r : records) {
            AttendanceSession s = r.getSession();
            long[] sv = subjectCounts.computeIfAbsent(s.getSubject().getId(), k -> new long[3]);
            sv[0]++;
            if (r.getStatus() == AttendanceStatus.PRESENT) {
                sv[1]++;
            } else if (r.getStatus() == AttendanceStatus.OD_PRESENT) {
                sv[2]++;
            }
            long[] sec = sectionCounts.computeIfAbsent(s.getSection().getDisplayName(), k -> new long[3]);
            sec[0]++;
            if (r.getStatus() == AttendanceStatus.PRESENT) {
                sec[1]++;
            } else if (r.getStatus() == AttendanceStatus.OD_PRESENT) {
                sec[2]++;
            }
        }

        List<SubjectStatDto> subjectStats = new ArrayList<>();
        for (AttendanceSession s : sessions) {
            if (s.getSubject() != null) {
                long[] v = subjectCounts.computeIfAbsent(s.getSubject().getId(), k -> new long[3]);
                long sAbs = Math.max(0, v[0] - (v[1] + v[2]));
                subjectStats.add(new SubjectStatDto(s.getSubject().getCode() + " - " + s.getSubject().getName(), v[0],
                        v[1], v[2], sAbs, pct(v[1] + v[2], v[0])));
            }
        }
        Map<String, SubjectStatDto> dedup = new LinkedHashMap<>();
        for (SubjectStatDto dto : subjectStats) {
            dedup.putIfAbsent(dto.subjectLabel(), dto);
        }
        List<SubjectStatDto> subjectList = new ArrayList<>(dedup.values());
        subjectList.sort(Comparator.comparing(SubjectStatDto::subjectLabel));

        List<SectionStatDto> sectionList = sectionCounts.entrySet().stream()
                .map(e -> {
                    long[] v = e.getValue();
                    long secAbs = Math.max(0, v[0] - (v[1] + v[2]));
                    return new SectionStatDto(e.getKey(), v[0], v[1], v[2], secAbs, pct(v[1] + v[2], v[0]));
                })
                .sorted(Comparator.comparing(SectionStatDto::sectionLabel))
                .collect(Collectors.toList());

        double classHourHours = 50.0 / 60.0;
        double totalHours = round1(totalSlots * classHourHours);
        double presentHours = round1(present * classHourHours);
        double odHours = round1(od * classHourHours);
        double absentHours = round1(absent * classHourHours);

        return new AnalyticsOverviewDto(students.size(), totalSlots, present, od, absent, totalHours, presentHours,
                odHours, absentHours, pct(present + od, totalSlots), subjectList, sectionList);
    }

    // ------------------------------------------------------------------ Students

    @Transactional(readOnly = true)
    public List<StudentStatDto> students(String username) {
        Staff coordinator = requireCoordinator(username);
        List<Long> sectionIds = scopeSectionIds(coordinator);
        List<Student> students = scopeStudents(sectionIds);

        List<AttendanceSession> sessions = allSessions(sectionIds);
        Map<Long, List<AttendanceSession>> sessionsBySection = sessions.stream()
                .collect(Collectors.groupingBy(s -> s.getSection().getId()));
        Map<Long, List<AttendanceRecord>> recordsByStudent = recordsOf(sessions).stream()
                .collect(Collectors.groupingBy(r -> r.getStudent().getId()));

        List<StudentStatDto> result = new ArrayList<>();
        for (Student student : students) {
            long total = sessionsBySection.getOrDefault(student.getSection().getId(), List.of()).size();
            long present = 0;
            long od = 0;
            for (AttendanceRecord r : recordsByStudent.getOrDefault(student.getId(), List.of())) {
                if (r.getStatus() == AttendanceStatus.PRESENT) {
                    present++;
                } else if (r.getStatus() == AttendanceStatus.OD_PRESENT) {
                    od++;
                }
            }
            long absent = Math.max(0, total - (present + od));
            result.add(new StudentStatDto(student.getId(), student.getName(), student.getRegisterNumber(),
                    student.getSection().getDisplayName(), total, present, od, absent, pct(present + od, total)));
        }
        result.sort(Comparator.comparing(StudentStatDto::registerNumber));
        return result;
    }

    // ------------------------------------------------------------------ Subjects

    @Transactional(readOnly = true)
    public List<SubjectStatDto> subjects(String username) {
        Staff coordinator = requireCoordinator(username);
        List<Long> sectionIds = scopeSectionIds(coordinator);
        List<AttendanceSession> sessions = allSessions(sectionIds);
        Map<Long, Set<Long>> sessionIdsBySubject = sessions.stream().collect(Collectors.groupingBy(
                s -> s.getSubject().getId(), Collectors.mapping(AttendanceSession::getId, Collectors.toSet())));
        Map<Long, String> labelsBySubject = sessions.stream().collect(Collectors.toMap(
                s -> s.getSubject().getId(), s -> s.getSubject().getCode() + " - " + s.getSubject().getName(),
                (a, b) -> a));

        Map<Long, Long> presentBySubject = recordsOf(sessions).stream()
                .filter(r -> r.getStatus() == AttendanceStatus.PRESENT)
                .collect(Collectors.groupingBy(r -> r.getSession().getSubject().getId(), Collectors.counting()));
        Map<Long, Long> odBySubject = recordsOf(sessions).stream()
                .filter(r -> r.getStatus() == AttendanceStatus.OD_PRESENT)
                .collect(Collectors.groupingBy(r -> r.getSession().getSubject().getId(), Collectors.counting()));

        List<SubjectStatDto> result = new ArrayList<>();
        for (Map.Entry<Long, Set<Long>> e : sessionIdsBySubject.entrySet()) {
            long total = e.getValue().size();
            long present = presentBySubject.getOrDefault(e.getKey(), 0L);
            long od = odBySubject.getOrDefault(e.getKey(), 0L);
            long absent = Math.max(0, total - (present + od));
            result.add(new SubjectStatDto(labelsBySubject.get(e.getKey()), total, present, od, absent, pct(present + od, total)));
        }
        result.sort(Comparator.comparing(SubjectStatDto::subjectLabel));
        return result;
    }

    // ------------------------------------------------------------------ Monthly

    @Transactional(readOnly = true)
    public List<MonthlyPointDto> monthly(String username) {
        Staff coordinator = requireCoordinator(username);
        List<Long> sectionIds = scopeSectionIds(coordinator);
        LocalDate today = clock.today();
        LocalDate from = today.minusDays(29);

        List<AttendanceSession> sessions = sessionRepository.findBySectionIdInAndSessionDateBetween(sectionIds, from,
                today);
        Map<LocalDate, long[]> byDate = new LinkedHashMap<>(); // [0]=total, [1]=present, [2]=od
        for (AttendanceSession s : sessions) {
            byDate.computeIfAbsent(s.getSessionDate(), k -> new long[3])[0]++;
        }
        for (AttendanceRecord r : recordsOf(sessions)) {
            if (r.getStatus() == AttendanceStatus.PRESENT) {
                byDate.computeIfAbsent(r.getSession().getSessionDate(), k -> new long[3])[1]++;
            } else if (r.getStatus() == AttendanceStatus.OD_PRESENT) {
                byDate.computeIfAbsent(r.getSession().getSessionDate(), k -> new long[3])[2]++;
            }
        }

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM d");
        List<MonthlyPointDto> result = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(today); d = d.plusDays(1)) {
            long[] v = byDate.getOrDefault(d, new long[] {0, 0, 0});
            long absent = Math.max(0, v[0] - (v[1] + v[2]));
            result.add(new MonthlyPointDto(d, fmt.format(d), v[0], v[1], v[2], absent, pct(v[1] + v[2], v[0])));
        }
        return result;
    }

    // ------------------------------------------------------------------ Helpers

    private double pct(long part, long total) {
        return total == 0 ? 0 : Math.round(part * 1000.0 / total) / 10.0;
    }

    private double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
