package com.smartacademic.student;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartacademic.attendance.AttendanceSession;
import com.smartacademic.attendance.AttendanceSessionRepository;
import com.smartacademic.attendance.AttendanceSessionStatus;
import com.smartacademic.attendance.AttendanceRecord;
import com.smartacademic.attendance.AttendanceRecordRepository;
import com.smartacademic.attendance.AttendanceStatus;
import com.smartacademic.attendance.QrTokenService;
import com.smartacademic.attendance.dto.AttendanceDtos.AttendanceRecordDto;
import com.smartacademic.attendance.dto.AttendanceDtos.ScanResultDto;
import com.smartacademic.common.ClockService;
import com.smartacademic.common.NotFoundException;
import com.smartacademic.content.Assignment;
import com.smartacademic.content.AssignmentRepository;
import com.smartacademic.content.Resource;
import com.smartacademic.content.ResourceRepository;
import com.smartacademic.content.StudentTaskCompletionRepository;
import com.smartacademic.content.Task;
import com.smartacademic.content.TaskRepository;
import com.smartacademic.content.Test;
import com.smartacademic.content.TestRepository;
import com.smartacademic.content.dto.ContentDtos.TestDto;
import com.smartacademic.master.Day;
import com.smartacademic.master.Section;
import com.smartacademic.master.Semester;
import com.smartacademic.master.SemesterRepository;
import com.smartacademic.master.Student;
import com.smartacademic.master.StudentRepository;
import com.smartacademic.master.Subject;
import com.smartacademic.master.TimetableEntry;
import com.smartacademic.master.TimetableEntryRepository;
import com.smartacademic.student.dto.StudentDtos.AttendanceRecordViewDto;
import com.smartacademic.student.dto.StudentDtos.AttendanceSummaryDto;
import com.smartacademic.student.dto.StudentDtos.DayTimetableDto;
import com.smartacademic.student.dto.StudentDtos.PeriodInfoDto;
import com.smartacademic.student.dto.StudentDtos.PlannerDto;
import com.smartacademic.student.dto.StudentDtos.RecommendationDto;
import com.smartacademic.student.dto.StudentDtos.StudentDashboardDto;
import com.smartacademic.student.dto.StudentDtos.StudentSubjectDto;
import com.smartacademic.student.dto.StudentDtos.StudentSubjectDetailsDto;
import com.smartacademic.student.dto.StudentDtos.StudentTimetableDto;
import com.smartacademic.student.dto.StudentDtos.TodayPeriodDto;
import com.smartacademic.student.dto.StudentDtos.UpcomingItemDto;
import com.smartacademic.student.dto.StudentRequests.ScanRequest;
import com.smartacademic.user.UserService;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final TimetableEntryRepository timetableRepository;
    private final SemesterRepository semesterRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceRecordRepository recordRepository;
    private final AssignmentRepository assignmentContentRepository;
    private final TaskRepository taskContentRepository;
    private final TestRepository testContentRepository;
    private final ResourceRepository resourceContentRepository;
    private final StudentTaskCompletionRepository completionRepository;
    private final ClockService clock;
    private final QrTokenService qrTokenService;
    private final UserService userService;

    public StudentService(StudentRepository studentRepository, TimetableEntryRepository timetableRepository,
                          SemesterRepository semesterRepository, AttendanceSessionRepository sessionRepository,
                          AttendanceRecordRepository recordRepository, AssignmentRepository assignmentContentRepository,
                          TaskRepository taskContentRepository, TestRepository testContentRepository,
                          ResourceRepository resourceContentRepository,
                          StudentTaskCompletionRepository completionRepository, ClockService clock,
                          QrTokenService qrTokenService, UserService userService) {
        this.studentRepository = studentRepository;
        this.timetableRepository = timetableRepository;
        this.semesterRepository = semesterRepository;
        this.sessionRepository = sessionRepository;
        this.recordRepository = recordRepository;
        this.assignmentContentRepository = assignmentContentRepository;
        this.taskContentRepository = taskContentRepository;
        this.testContentRepository = testContentRepository;
        this.resourceContentRepository = resourceContentRepository;
        this.completionRepository = completionRepository;
        this.clock = clock;
        this.qrTokenService = qrTokenService;
        this.userService = userService;
    }

    // ------------------------------------------------------------------ Dashboard

    @Transactional(readOnly = true)
    public StudentDashboardDto dashboard(String username) {
        Student student = currentStudent(username);
        LocalDate today = clock.today();
        Day day = Day.valueOf(today.getDayOfWeek().name());
        int currentPeriod = clock.currentPeriod();

        List<TimetableEntry> weekEntries = weekEntries(student.getSection());
        Map<Long, AttendanceSession> todaySessions = todaySessions(student.getSection(), today);

        List<TodayPeriodDto> todayPeriods = new ArrayList<>();
        PeriodInfoDto current = null;
        PeriodInfoDto next = null;
        for (int period = 1; period <= 7; period++) {
            final int pn = period;
            TimetableEntry entry = weekEntries.stream()
                    .filter(e -> e.getDay() == day && e.getPeriod() == pn)
                    .findFirst().orElse(null);
            if (entry == null) {
                continue;
            }
            AttendanceSession session = todaySessions.get(entry.getId());
            AttendanceSessionStatus status = session == null ? null : session.getStatus();
            boolean free = status == AttendanceSessionStatus.ABSENT;
            int freeMinutes = free ? periodDuration(period) : 0;
            String staff = staffLabel(entry);
            TodayPeriodDto p = new TodayPeriodDto(entry.getId(), period, clock.formatTime(periodStart(period)),
                    clock.formatTime(periodEnd(period)), subjectLabel(entry), staff, status,
                    period == currentPeriod, period == currentPeriod + 1, entry.isTest(), entry.getTestTopic(), free,
                    freeMinutes);
            todayPeriods.add(p);
            if (period == currentPeriod) {
                current = new PeriodInfoDto(entry.getId(), period, clock.formatTime(periodStart(period)),
                        clock.formatTime(periodEnd(period)), subjectLabel(entry), staff, status, entry.isTest(),
                        entry.getTestTopic(), free, freeMinutes);
            } else if (period == currentPeriod + 1) {
                next = new PeriodInfoDto(entry.getId(), period, clock.formatTime(periodStart(period)),
                        clock.formatTime(periodEnd(period)), subjectLabel(entry), staff, status, entry.isTest(),
                        entry.getTestTopic(), free, freeMinutes);
            }
        }
        todayPeriods.sort(Comparator.comparingInt(TodayPeriodDto::period));

        boolean freePeriod = current != null && current.freePeriod();
        Integer freeMinutes = freePeriod ? current.freeMinutes() : null;

        AttendanceSummaryDto summary = summary(student);
        List<TestDto> upcomingTests = upcomingTests(student.getSection());
        List<UpcomingItemDto> pendingItems = pendingItems(student);

        return new StudentDashboardDto(student.getName(), student.getRegisterNumber(), student.getSection().getId(),
                student.getSection().getDisplayName(), today, greeting(today), currentPeriod, summary, current, next,
                todayPeriods, upcomingTests, pendingItems, freePeriod, freeMinutes);
    }

    // ------------------------------------------------------------------ Timetable

    @Transactional(readOnly = true)
    public StudentTimetableDto timetable(String username) {
        Student student = currentStudent(username);
        LocalDate today = clock.today();
        Day todayDay = Day.valueOf(today.getDayOfWeek().name());
        Map<Long, AttendanceSession> todaySessions = todaySessions(student.getSection(), today);
        List<TimetableEntry> weekEntries = weekEntries(student.getSection());

        List<DayTimetableDto> days = new ArrayList<>();
        for (Day d : Day.values()) {
            List<PeriodInfoDto> periods = new ArrayList<>();
            for (int period = 1; period <= 7; period++) {
                final int pn = period;
                TimetableEntry entry = weekEntries.stream()
                        .filter(e -> e.getDay() == d && e.getPeriod() == pn)
                        .findFirst().orElse(null);
                if (entry == null) {
                    continue;
                }
                AttendanceSession session = d == todayDay ? todaySessions.get(entry.getId()) : null;
                AttendanceSessionStatus status = d == todayDay ? (session == null ? null : session.getStatus()) : null;
                boolean free = status == AttendanceSessionStatus.ABSENT;
                periods.add(new PeriodInfoDto(entry.getId(), period, clock.formatTime(periodStart(period)),
                        clock.formatTime(periodEnd(period)), subjectLabel(entry), staffLabel(entry), status,
                        entry.isTest(), entry.getTestTopic(), free, free ? periodDuration(period) : null));
            }
            days.add(new DayTimetableDto(d, periods));
        }

        List<String> periodMeta = new ArrayList<>();
        for (int period = 1; period <= 7; period++) {
            periodMeta.add("Period " + period + " · " + clock.formatTime(periodStart(period)) + " – "
                    + clock.formatTime(periodEnd(period)));
        }
        return new StudentTimetableDto(days, periodMeta);
    }

    // ------------------------------------------------------------------ Attendance

    @Transactional(readOnly = true)
    public List<AttendanceRecordViewDto> attendance(String username) {
        Student student = currentStudent(username);
        List<AttendanceRecordViewDto> views = new ArrayList<>();
        for (AttendanceRecord r : recordRepository.findByStudentIdOrderByMarkedAtDesc(student.getId())) {
            AttendanceSession s = r.getSession();
            views.add(new AttendanceRecordViewDto(r.getId(), s.getSessionDate(), s.getSessionDate().getDayOfWeek().name(),
                    s.getTimetableEntry().getPeriod(),
                    s.getSubject().getCode() + " - " + s.getSubject().getName(), s.getSection().getDisplayName(),
                    r.getStatus()));
        }
        return views;
    }

    // ------------------------------------------------------------------ Subjects

    @Transactional(readOnly = true)
    public List<StudentSubjectDto> subjects(String username) {
        Student student = currentStudent(username);
        List<TimetableEntry> weekEntries = weekEntries(student.getSection());
        Map<Long, Subject> subjects = new LinkedHashMap<>();
        for (TimetableEntry e : weekEntries) {
            subjects.putIfAbsent(e.getSubject().getId(), e.getSubject());
        }

        List<AttendanceSession> sectionSessions = sessionRepository.findBySectionId(student.getSection().getId());
        Map<Long, List<AttendanceSession>> sessionsBySubject = sectionSessions.stream()
                .collect(Collectors.groupingBy(s -> s.getSubject().getId()));

        List<StudentSubjectDto> result = new ArrayList<>();
        for (Subject subject : subjects.values()) {
            List<AttendanceSession> subjectSessions = sessionsBySubject.getOrDefault(subject.getId(), List.of());
            List<Long> sessionIds = subjectSessions.stream().map(AttendanceSession::getId).collect(Collectors.toList());
            long present = sessionIds.isEmpty() ? 0
                    : recordRepository.countBySession_IdInAndStudentIdAndStatus(sessionIds, student.getId(), AttendanceStatus.PRESENT);
            long od = sessionIds.isEmpty() ? 0
                    : recordRepository.countBySession_IdInAndStudentIdAndStatus(sessionIds, student.getId(), AttendanceStatus.OD_PRESENT);
            long total = subjectSessions.size();
            long absent = Math.max(0, total - (present + od));
            double percent = total == 0 ? 0 : Math.round((present + od) * 1000.0 / total) / 10.0;

            Long sectionId = student.getSection().getId();
            Long semesterId = currentSemester().getId();
            long assignments = assignmentContentRepository.findBySectionIdAndSemesterIdOrderByDueDateAsc(sectionId,
                    semesterId).size();
            long tasks = taskContentRepository.findBySectionIdAndSemesterIdOrderByDueDateAsc(sectionId, semesterId)
                    .size();
            long tests = testContentRepository.findBySectionIdAndSemesterIdOrderByTestDateAsc(sectionId, semesterId)
                    .size();
            long resources = resourceContentRepository.findBySectionIdAndSemesterIdOrderByCreatedAtDesc(sectionId,
                    semesterId).size();
            long pendingTasks = pendingItems(student).stream()
                    .filter(i -> "task".equals(i.kind()) && i.subjectLabel().contains(subject.getCode()))
                    .count();

            result.add(new StudentSubjectDto(subject.getId(), subject.getCode() + " - " + subject.getName(),
                    subject.getCode(), present, od, absent, total, percent, assignments, tasks, tests, resources, pendingTasks));
        }
        result.sort(Comparator.comparing(StudentSubjectDto::subjectLabel));
        return result;
    }

    @Transactional(readOnly = true)
    public StudentSubjectDetailsDto subjectDetails(String username, Long subjectId) {
        Student student = currentStudent(username);
        Long sectionId = student.getSection().getId();
        Long semesterId = currentSemester().getId();

        List<AttendanceSession> sectionSessions = sessionRepository.findBySectionId(sectionId);
        List<AttendanceSession> subjectSessions = sectionSessions.stream()
                .filter(s -> s.getSubject().getId().equals(subjectId))
                .collect(Collectors.toList());
        List<Long> sessionIds = subjectSessions.stream().map(AttendanceSession::getId).collect(Collectors.toList());
        long present = sessionIds.isEmpty() ? 0
                : recordRepository.countBySession_IdInAndStudentIdAndStatus(sessionIds, student.getId(), AttendanceStatus.PRESENT);
        long od = sessionIds.isEmpty() ? 0
                : recordRepository.countBySession_IdInAndStudentIdAndStatus(sessionIds, student.getId(), AttendanceStatus.OD_PRESENT);
        long total = subjectSessions.size();
        long absent = Math.max(0, total - (present + od));
        double percent = total == 0 ? 0 : Math.round((present + od) * 1000.0 / total) / 10.0;

        var assignments = assignmentContentRepository.findBySectionIdAndSemesterIdOrderByDueDateAsc(sectionId, semesterId).stream()
                .filter(a -> a.getSubject().getId().equals(subjectId))
                .map(a -> new com.smartacademic.content.dto.ContentDtos.AssignmentDto(a.getId(), a.getSubject().getCode() + " - " + a.getSubject().getName(), a.getSection().getDisplayName(), a.getTitle(), a.getDescription(), a.getGivenDate(), a.getDueDate(), a.getEstimatedMinutes()))
                .collect(Collectors.toList());

        var tasks = taskContentRepository.findBySectionIdAndSemesterIdOrderByDueDateAsc(sectionId, semesterId).stream()
                .filter(t -> t.getSubject().getId().equals(subjectId))
                .map(t -> {
                    boolean completed = completionRepository.findByStudentIdAndTaskId(student.getId(), t.getId()).isPresent();
                    return new com.smartacademic.content.dto.ContentDtos.TaskDto(t.getId(), t.getSubject().getCode() + " - " + t.getSubject().getName(), t.getSection().getDisplayName(), t.getTitle(), t.getDescription(), t.getDueDate(), t.getEstimatedMinutes(), t.getPriority(), completed, null);
                })
                .collect(Collectors.toList());

        var tests = testContentRepository.findBySectionIdAndSemesterIdOrderByTestDateAsc(sectionId, semesterId).stream()
                .filter(t -> t.getSubject().getId().equals(subjectId))
                .map(t -> new com.smartacademic.content.dto.ContentDtos.TestDto(t.getId(), t.getSubject().getCode() + " - " + t.getSubject().getName(), t.getSection().getDisplayName(), t.getName(), t.getUnit(), t.getTestDate(), t.getDurationMinutes()))
                .collect(Collectors.toList());

        var resources = resourceContentRepository.findBySectionIdAndSemesterIdOrderByCreatedAtDesc(sectionId, semesterId).stream()
                .filter(r -> r.getSubject().getId().equals(subjectId))
                .map(r -> new com.smartacademic.content.dto.ContentDtos.ResourceDto(r.getId(), r.getSubject().getCode() + " - " + r.getSubject().getName(), r.getSection().getDisplayName(), r.getTitle(), r.getDescription(), r.getLink()))
                .collect(Collectors.toList());

        String label = "Subject " + subjectId;
        String code = "";
        if (!subjectSessions.isEmpty()) {
            label = subjectSessions.get(0).getSubject().getCode() + " - " + subjectSessions.get(0).getSubject().getName();
            code = subjectSessions.get(0).getSubject().getCode();
        } else {
            List<TimetableEntry> weekEntries = weekEntries(student.getSection());
            for (TimetableEntry e : weekEntries) {
                if (e.getSubject().getId().equals(subjectId)) {
                    label = e.getSubject().getCode() + " - " + e.getSubject().getName();
                    code = e.getSubject().getCode();
                    break;
                }
            }
        }

        return new StudentSubjectDetailsDto(subjectId, label, code, present, od, absent, total, percent, assignments, tasks, tests, resources);
    }

    // ------------------------------------------------------------------ Planner

    @Transactional(readOnly = true)
    public PlannerDto planner(String username) {
        Student student = currentStudent(username);
        LocalDate today = clock.today();
        Day day = Day.valueOf(today.getDayOfWeek().name());
        int currentPeriod = clock.currentPeriod();

        TimetableEntry entry = weekEntries(student.getSection()).stream()
                .filter(e -> e.getDay() == day && e.getPeriod() == currentPeriod)
                .findFirst().orElse(null);

        AttendanceSession session = entry == null ? null
                : todaySessions(student.getSection(), today).get(entry.getId());
        boolean free = entry != null && session != null
                && session.getStatus() == AttendanceSessionStatus.ABSENT;
        Integer freeMinutes = free ? periodDuration(currentPeriod) : null;
        String statusLabel = !free ? "No free period right now"
                : "Free period — " + freeMinutes + " minutes available";

        List<RecommendationDto> recommendations = free ? recommend(student, freeMinutes) : List.of();
        return new PlannerDto(free, freeMinutes, statusLabel, recommendations, upcomingTests(student.getSection()),
                pendingItems(student));
    }

    @Transactional(readOnly = true)
    public PlannerDto dummyPlanner() {
        LocalDate today = clock.today();
        LocalDate tomorrow = today.plusDays(1);
        LocalDate testDay = today.plusDays(2);
        LocalDate friday = today.plusDays(4);

        List<RecommendationDto> recommendations = List.of(
            new RecommendationDto("assignment", 901L, "DBMS Assignment 2 - ER Diagram & Normalization",
                    "CS301 - Database Management Systems", tomorrow, 40,
                    "Nearest deadline and its estimated 40 minutes fit your 50-minute free period."),
            new RecommendationDto("test", 902L, "Revise Operating System Concepts (Unit 2)",
                    "CS302 - Operating Systems", testDay, 10,
                    "Upcoming test \"OS Unit Test 2\" on " + testDay + " — use remaining 10 minutes to revise."),
            new RecommendationDto("task", 903L, "CN Task - Packet Subnetting Practice",
                    "CS303 - Computer Networks", friday, 30,
                    "Scheduled next priority item after immediate deadlines.")
        );

        List<TestDto> dummyTests = List.of(
            new TestDto(902L, "CS302 - Operating Systems", "Section A", "OS Unit Test 2", "Unit 2 - CPU Scheduling", testDay, 45)
        );

        List<UpcomingItemDto> dummyPending = List.of(
            new UpcomingItemDto("assignment", 901L, "DBMS Assignment 2 - ER Diagram & Normalization", "CS301 - Database Management Systems", tomorrow, 40, false),
            new UpcomingItemDto("task", 903L, "CN Task - Packet Subnetting Practice", "CS303 - Computer Networks", friday, 30, false)
        );

        return new PlannerDto(true, 50, "Free period — 50 minutes available (MD Specification Sample)", recommendations, dummyTests, dummyPending);
    }

    private List<RecommendationDto> recommend(Student student, int freeMinutes) {
        List<UpcomingItemDto> items = pendingItems(student);
        List<TestDto> tests = upcomingTests(student.getSection());

        List<RecommendationDto> result = new ArrayList<>();

        // Priority 1: nearest deadline that fits the free period.
        UpcomingItemDto fit = items.stream()
                .filter(i -> i.estimatedMinutes() != null && i.estimatedMinutes() <= freeMinutes)
                .min(Comparator.comparing(UpcomingItemDto::due))
                .orElse(null);
        if (fit != null) {
            result.add(new RecommendationDto(fit.kind(), fit.id(), fit.title(), fit.subjectLabel(), fit.due(),
                    fit.estimatedMinutes(), "Nearest deadline and its estimated " + fit.estimatedMinutes()
                            + " minutes fit your " + freeMinutes + "-minute free period."));
        }

        // Priority 2: nearest upcoming test.
        if (result.size() < 3 && !tests.isEmpty()) {
            TestDto nearest = tests.get(0);
            result.add(new RecommendationDto("test", nearest.id(), "Revise for " + nearest.name(), nearest.subjectLabel(),
                    nearest.testDate(), Math.min(freeMinutes, 40),
                    "Upcoming test \"" + nearest.name() + "\" on " + nearest.testDate() + (nearest.unit() == null
                            ? "" : " (" + nearest.unit() + ")") + " — use this free period to revise."));
        }

        // Priority 3: nearest deadline regardless of duration.
        if (result.size() < 3 && !items.isEmpty()) {
            UpcomingItemDto any = items.get(0);
            result.add(new RecommendationDto(any.kind(), any.id(), any.title(), any.subjectLabel(), any.due(),
                    any.estimatedMinutes(), "Nearest pending deadline; even partial progress is worth it."));
        }

        return result;
    }

    // ------------------------------------------------------------------ Scan

    @Transactional
    public ScanResultDto scan(String username, ScanRequest req) {
        Student student = currentStudent(username);
        Long sessionId = qrTokenService.validate(req.qrToken());
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Attendance session not found"));

        if (session.getStatus() != AttendanceSessionStatus.ACTIVE) {
            throw new IllegalArgumentException("This attendance session is no longer active");
        }
        if (!session.getSection().getId().equals(student.getSection().getId())) {
            throw new IllegalArgumentException("This QR is for " + session.getSection().getDisplayName()
                    + " — you are not part of this class");
        }

        AttendanceRecord existing = recordRepository.findBySessionIdAndStudentId(sessionId, student.getId())
                .orElse(null);
        if (existing != null) {
            return new ScanResultDto(false, "Attendance already marked for this period.",
                    new AttendanceRecordDto(existing.getId(), student.getId(), student.getName(),
                            student.getRegisterNumber(), existing.getStatus(), existing.getMarkedAt()));
        }

        AttendanceRecord record = new AttendanceRecord();
        record.setSession(session);
        record.setStudent(student);
        record.setStatus(AttendanceStatus.PRESENT);
        record.setMarkedAt(Instant.now());
        record = recordRepository.save(record);

        String message = "Attendance recorded for " + session.getSubject().getCode() + ".";
        return new ScanResultDto(true, message, new AttendanceRecordDto(record.getId(), student.getId(), student.getName(),
                student.getRegisterNumber(), record.getStatus(), record.getMarkedAt()));
    }

    // ------------------------------------------------------------------ Tasks

    @Transactional
    public com.smartacademic.content.dto.ContentDtos.TaskDto completeTask(String username, Long taskId) {
        Student student = currentStudent(username);
        Task task = taskContentRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Task not found: " + taskId));
        if (!task.getSection().getId().equals(student.getSection().getId())) {
            throw new IllegalArgumentException("This task is not assigned to your section");
        }
        completionRepository.findByStudentIdAndTaskId(student.getId(), taskId)
                .orElseGet(() -> {
                    com.smartacademic.content.StudentTaskCompletion c = new com.smartacademic.content.StudentTaskCompletion();
                    c.setTask(task);
                    c.setStudent(student);
                    c.setCompletedAt(Instant.now());
                    return completionRepository.save(c);
                });
        return new com.smartacademic.content.dto.ContentDtos.TaskDto(task.getId(),
                task.getSubject().getCode() + " - " + task.getSubject().getName(),
                task.getSection().getDisplayName(), task.getTitle(), task.getDescription(), task.getDueDate(),
                task.getEstimatedMinutes(), task.getPriority(), true, Instant.now());
    }

    // ------------------------------------------------------------------ Helpers

    private Semester currentSemester() {
        return semesterRepository.findFirstByCurrentSemesterTrue()
                .orElseThrow(() -> new NotFoundException("No current semester is configured"));
    }

    private AttendanceSummaryDto summary(Student student) {
        List<AttendanceSession> sectionSessions = sessionRepository.findBySectionId(student.getSection().getId());
        long total = sectionSessions.size();
        List<Long> sessionIds = sectionSessions.stream().map(AttendanceSession::getId).collect(Collectors.toList());
        long present = sessionIds.isEmpty() ? 0
                : recordRepository.countBySession_IdInAndStudentIdAndStatus(sessionIds, student.getId(),
                        AttendanceStatus.PRESENT);
        long od = sessionIds.isEmpty() ? 0
                : recordRepository.countBySession_IdInAndStudentIdAndStatus(sessionIds, student.getId(),
                        AttendanceStatus.OD_PRESENT);
        long absent = Math.max(0, total - (present + od));
        double percent = total == 0 ? 0 : Math.round((present + od) * 1000.0 / total) / 10.0;
        return new AttendanceSummaryDto(total, present, od, absent, percent);
    }

    private List<TestDto> upcomingTests(Section section) {
        LocalDate today = clock.today();
        return testContentRepository
                .findBySectionIdAndSemesterIdAndTestDateGreaterThanEqualOrderByTestDateAsc(section.getId(),
                        currentSemester().getId(), today)
                .stream().limit(7).map(this::toDto).collect(Collectors.toList());
    }

    private List<UpcomingItemDto> pendingItems(Student student) {
        LocalDate today = clock.today();
        Long sectionId = student.getSection().getId();
        Long semesterId = currentSemester().getId();
        List<UpcomingItemDto> items = new ArrayList<>();

        for (Assignment a : assignmentContentRepository
                .findBySectionIdAndSemesterIdAndDueDateGreaterThanEqualOrderByDueDateAsc(sectionId, semesterId, today)) {
            items.add(new UpcomingItemDto("assignment", a.getId(), a.getTitle(),
                    a.getSubject().getCode() + " - " + a.getSubject().getName(), a.getDueDate(),
                    a.getEstimatedMinutes(), false));
        }
        for (Task t : taskContentRepository
                .findBySectionIdAndSemesterIdAndDueDateGreaterThanEqualOrderByDueDateAsc(sectionId, semesterId, today)) {
            boolean completed = completionRepository.findByStudentIdAndTaskId(student.getId(), t.getId()).isPresent();
            if (!completed) {
                items.add(new UpcomingItemDto("task", t.getId(), t.getTitle(),
                        t.getSubject().getCode() + " - " + t.getSubject().getName(), t.getDueDate(),
                        t.getEstimatedMinutes(), false));
            }
        }
        items.sort(Comparator.comparing(UpcomingItemDto::due));
        return items.stream().limit(10).collect(Collectors.toList());
    }

    private List<TimetableEntry> weekEntries(Section section) {
        return timetableRepository.findBySectionIdAndSemesterId(section.getId(), currentSemester().getId());
    }

    private Map<Long, AttendanceSession> todaySessions(Section section, LocalDate today) {
        return sessionRepository.findBySectionIdAndSessionDate(section.getId(), today).stream()
                .collect(Collectors.toMap(s -> s.getTimetableEntry().getId(), s -> s, (a, b) -> a));
    }

    private TestDto toDto(Test t) {
        return new TestDto(t.getId(), t.getSubject().getCode() + " - " + t.getSubject().getName(),
                t.getSection().getDisplayName(), t.getName(), t.getUnit(), t.getTestDate(), t.getDurationMinutes());
    }

    private String subjectLabel(TimetableEntry entry) {
        return entry.getSubject().getCode() + " - " + entry.getSubject().getName();
    }

    private String staffLabel(TimetableEntry entry) {
        if (entry.getStaff() != null && entry.getSecondaryStaff() != null) {
            return entry.getStaff().getName() + " + " + entry.getSecondaryStaff().getName();
        }
        return entry.getStaff() == null ? "Unassigned" : entry.getStaff().getName();
    }

    private int periodStart(int period) {
        return clock.periods().stream().filter(p -> p[0] == period).map(p -> p[1]).findFirst().orElse(0);
    }

    private int periodEnd(int period) {
        return clock.periods().stream().filter(p -> p[0] == period).map(p -> p[2]).findFirst().orElse(0);
    }

    private int periodDuration(int period) {
        return periodEnd(period) - periodStart(period);
    }

    private Student currentStudent(String username) {
        Student student = studentRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Student profile not found for " + username));
        if (!student.isActive()) {
            throw new IllegalArgumentException("Your account is inactive");
        }
        return student;
    }

    private String greeting(LocalDate today) {
        int hour = LocalTime.now().getHour();
        if (hour < 12) {
            return "Good morning";
        }
        if (hour < 17) {
            return "Good afternoon";
        }
        return "Good evening";
    }
}
