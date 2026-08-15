package com.smartacademic.config;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.smartacademic.attendance.AttendanceRecord;
import com.smartacademic.attendance.AttendanceRecordRepository;
import com.smartacademic.attendance.AttendanceSession;
import com.smartacademic.attendance.AttendanceSessionRepository;
import com.smartacademic.attendance.AttendanceSessionStatus;
import com.smartacademic.attendance.AttendanceStatus;
import com.smartacademic.attendance.QrTokenService;
import com.smartacademic.common.ClockService;
import com.smartacademic.content.Assignment;
import com.smartacademic.content.AssignmentRepository;
import com.smartacademic.content.Resource;
import com.smartacademic.content.ResourceRepository;
import com.smartacademic.content.StudentTaskCompletion;
import com.smartacademic.content.StudentTaskCompletionRepository;
import com.smartacademic.content.Task;
import com.smartacademic.content.TaskPriority;
import com.smartacademic.content.TaskRepository;
import com.smartacademic.content.Test;
import com.smartacademic.content.TestRepository;
import com.smartacademic.master.Day;
import com.smartacademic.master.Section;
import com.smartacademic.master.Semester;
import com.smartacademic.master.SemesterRepository;
import com.smartacademic.master.Student;
import com.smartacademic.master.StudentRepository;
import com.smartacademic.master.Subject;
import com.smartacademic.master.TimetableEntry;
import com.smartacademic.master.TimetableEntryRepository;

/**
 * Seeds run-time demo data (attendance sessions + records, assignments,
 * tasks, tests, resources) so the student and analytics dashboards have
 * content to show. Runs only once, when no attendance sessions exist yet.
 */
@Component
@Order(2)
public class ContentSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ContentSeeder.class);

    private final SemesterRepository semesterRepository;
    private final TimetableEntryRepository timetableRepository;
    private final StudentRepository studentRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceRecordRepository recordRepository;
    private final AssignmentRepository assignmentRepository;
    private final TaskRepository taskRepository;
    private final TestRepository testRepository;
    private final ResourceRepository resourceRepository;
    private final StudentTaskCompletionRepository completionRepository;
    private final ClockService clock;
    private final QrTokenService qrTokenService;
    private final com.smartacademic.admin.AdminService adminService;

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    public ContentSeeder(SemesterRepository semesterRepository, TimetableEntryRepository timetableRepository,
                         StudentRepository studentRepository, AttendanceSessionRepository sessionRepository,
                         AttendanceRecordRepository recordRepository, AssignmentRepository assignmentRepository,
                         TaskRepository taskRepository, TestRepository testRepository,
                         ResourceRepository resourceRepository, StudentTaskCompletionRepository completionRepository,
                         ClockService clock, QrTokenService qrTokenService,
                         com.smartacademic.admin.AdminService adminService) {
        this.semesterRepository = semesterRepository;
        this.timetableRepository = timetableRepository;
        this.studentRepository = studentRepository;
        this.sessionRepository = sessionRepository;
        this.recordRepository = recordRepository;
        this.assignmentRepository = assignmentRepository;
        this.taskRepository = taskRepository;
        this.testRepository = testRepository;
        this.resourceRepository = resourceRepository;
        this.completionRepository = completionRepository;
        this.clock = clock;
        this.qrTokenService = qrTokenService;
        this.adminService = adminService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        try {
            recordRepository.dropStatusCheckConstraint();
        } catch (Exception e) {
            log.warn("Could not drop status check constraint: {}", e.getMessage());
        }
        recordRepository.resolvePending();
        if (sessionRepository.count() > 0 || assignmentRepository.count() > 0) {
            log.info("Demo content already present, seeding OD records if missing...");
            adminService.seedDemoOdRecords();
            return;
        }
        log.info("Seeding demo attendance and study content...");

        Semester semester = semesterRepository.findFirstByCurrentSemesterTrue().orElseThrow();
        LocalDate today = clock.today();
        Map<Long, List<TimetableEntry>> entriesBySection = timetableRepository.findAllByOrderByIdAsc().stream()
                .collect(Collectors.groupingBy(e -> e.getSection().getId()));

        seedSessions(semester, today, entriesBySection);
        seedContent(semester, today, entriesBySection);
        adminService.seedDemoOdRecords();

        log.info("Demo content complete.");
    }

    // ------------------------------------------------------------------ Sessions

    private void seedSessions(Semester semester, LocalDate today,
                              Map<Long, List<TimetableEntry>> entriesBySection) {
        LocalDate d = today;
        int weekdayCount = 0;
        List<AttendanceRecord> allRecords = new ArrayList<>();
        while (weekdayCount < 8 && d.isAfter(today.minusDays(40))) {
            Day day = Day.valueOf(d.getDayOfWeek().name());
            for (Map.Entry<Long, List<TimetableEntry>> e : entriesBySection.entrySet()) {
                List<TimetableEntry> dayEntries = e.getValue().stream()
                        .filter(te -> te.getDay() == day)
                        .sorted((a, b) -> Integer.compare(a.getPeriod(), b.getPeriod()))
                        .collect(Collectors.toList());
                if (dayEntries.isEmpty()) {
                    continue;
                }
                List<Student> students = studentRepository.findBySectionIdOrderByRegisterNumberAsc(e.getKey());
                boolean isToday = d.equals(today);
                for (TimetableEntry entry : dayEntries) {
                    allRecords.addAll(seedSession(entry, semester, d, isToday, students));
                }
            }
            weekdayCount++;
            d = d.minusDays(1);
        }
        if (!allRecords.isEmpty()) {
            for (int i = 0; i < allRecords.size(); i += 500) {
                int end = Math.min(i + 500, allRecords.size());
                recordRepository.saveAll(allRecords.subList(i, end));
                entityManager.flush();
                entityManager.clear();
            }
        }
    }

    private List<AttendanceRecord> seedSession(TimetableEntry entry, Semester semester, LocalDate date, boolean today,
                                     List<Student> students) {
        AttendanceSession session = new AttendanceSession();
        session.setTimetableEntry(entry);
        session.setStaff(entry.getStaff() != null ? entry.getStaff() : entry.getSecondaryStaff());
        session.setSection(entry.getSection());
        session.setSubject(entry.getSubject());
        session.setSemester(semester);
        session.setSessionDate(date);
        session.setStatus(today ? AttendanceSessionStatus.ACTIVE : AttendanceSessionStatus.CLOSED);
        if (!today) {
            session.setClosedAt(Instant.now().minus(ChronoUnit.DAYS.between(date, clock.today()), ChronoUnit.DAYS)
                    .minus(2, ChronoUnit.HOURS));
        }
        session = sessionRepository.save(session);

        if (today) {
            session.setCurrentToken(qrTokenService.generate(session.getId()));
            session.setTokenExpiresAt(Instant.now().plusSeconds(300));
            sessionRepository.save(session);
            return List.of();
        }

        List<AttendanceRecord> records = new ArrayList<>();
        int roll = 0;
        for (Student student : students) {
            roll++;
            // Roughly one in seven students is absent for a given class.
            if (roll % 7 == 3) {
                continue;
            }
            AttendanceRecord record = new AttendanceRecord();
            record.setSession(session);
            record.setStudent(student);
            record.setStatus(AttendanceStatus.PRESENT);
            record.setMarkedAt(Instant.now().minus(ChronoUnit.DAYS.between(date, clock.today()), ChronoUnit.DAYS)
                    .minus(1, ChronoUnit.HOURS));
            records.add(record);
        }
        return records;
    }

    // ------------------------------------------------------------------ Content

    private void seedContent(Semester semester, LocalDate today,
                             Map<Long, List<TimetableEntry>> entriesBySection) {
        List<TimetableEntry> all = entriesBySection.values().stream().flatMap(List::stream)
                .collect(Collectors.toList());
        Section sectionA = sectionOf(all, "III CSE A");
        Subject dbms = subjectByCode(all, "DBMS");
        Subject os = subjectByCode(all, "OS");
        Subject cn = subjectByCode(all, "CN");
        Subject se = subjectByCode(all, "SE");

        if (dbms != null && sectionA != null) {
            assignment(semester, dbms, sectionA, "ER Diagram for Library System", "Design a complete ER diagram for a"
                    + " library management system with at least six entities and their relationships.", today.minusDays(7),
                    today.plusDays(3), 90);
            task(semester, dbms, sectionA, "Normalize the given schema to 3NF", "Normalize the student-course schema "
                    + "handed out in class to 3NF and note every dependency you remove.", today.plusDays(1), 30,
                    TaskPriority.HIGH);
            resource(semester, dbms, sectionA, "ER Diagram examples", "Worked examples of ER diagrams for practice.",
                    "https://example.com/er-examples");
            test(semester, dbms, sectionA, "Unit Test 3", "DBMS Unit 3", nextWeekday(today, Day.WEDNESDAY), 50);
        }
        if (os != null && sectionA != null) {
            task(semester, os, sectionA, "Draw Gantt charts for scheduling algorithms", "Draw Gantt charts for FCFS, "
                    + "SJF and Round-Robin for the given process set and compare turnaround times.", today.plusDays(2),
                    25, TaskPriority.MEDIUM);
            test(semester, os, sectionA, "Unit Test 2", "OS Unit 2", nextWeekday(today, Day.MONDAY), 50);
            resource(semester, os, sectionA, "OS Unit 2 lecture slides", "Slides for process scheduling.",
                    "https://example.com/os-unit2");
        }
        if (cn != null && sectionA != null) {
            assignment(semester, cn, sectionA, "TCP vs UDP comparison report",
                    "Write a two-page report comparing TCP and UDP across reliability, ordering, and use cases.",
                    today.minusDays(4), today.plusDays(5), 60);
        }
        if (se != null && sectionA != null) {
            task(semester, se, sectionA, "Read Chapter 4 — Requirements Engineering",
                    "Read the chapter and list five requirement categories with one example each.", today.plusDays(4), 20,
                    TaskPriority.LOW);
            test(semester, se, sectionA, "Unit Test 1", "SE Unit 1", nextWeekday(today, Day.FRIDAY), 50);
        }

        // The primary demo student has completed the first task.
        studentRepository.findByUsername("mohan23").ifPresent(mohan -> {
            Task first = taskRepository.findBySectionIdAndSemesterIdOrderByDueDateAsc(sectionA.getId(),
                    semester.getId()).stream().findFirst().orElse(null);
            if (first != null) {
                StudentTaskCompletion completion = new StudentTaskCompletion();
                completion.setTask(first);
                completion.setStudent(mohan);
                completion.setCompletedAt(Instant.now().minus(1, ChronoUnit.DAYS));
                completionRepository.save(completion);
            }
        });
    }

    private Section sectionOf(List<TimetableEntry> entries, String displayName) {
        return entries.stream().map(TimetableEntry::getSection)
                .filter(s -> s.getDisplayName().equals(displayName)).findFirst().orElse(null);
    }

    private Subject subjectByCode(List<TimetableEntry> entries, String code) {
        return entries.stream().map(TimetableEntry::getSubject)
                .filter(s -> s.getCode().equals(code)).findFirst().orElse(null);
    }

    private LocalDate nextWeekday(LocalDate from, Day day) {
        LocalDate d = from;
        for (int i = 0; i < 8; i++) {
            if (Day.valueOf(d.getDayOfWeek().name()) == day && !d.equals(from)) {
                return d;
            }
            d = d.plusDays(1);
        }
        return from.plusDays(7);
    }

    private void assignment(Semester semester, Subject subject, Section section, String title, String description,
                            LocalDate given, LocalDate due, int minutes) {
        Assignment a = new Assignment();
        a.setSubject(subject);
        a.setSection(section);
        a.setSemester(semester);
        a.setTitle(title);
        a.setDescription(description);
        a.setGivenDate(given);
        a.setDueDate(due);
        a.setEstimatedMinutes(minutes);
        assignmentRepository.save(a);
    }

    private void task(Semester semester, Subject subject, Section section, String title, String description,
                      LocalDate due, int minutes, TaskPriority priority) {
        Task t = new Task();
        t.setSubject(subject);
        t.setSection(section);
        t.setSemester(semester);
        t.setTitle(title);
        t.setDescription(description);
        t.setDueDate(due);
        t.setEstimatedMinutes(minutes);
        t.setPriority(priority);
        taskRepository.save(t);
    }

    private void test(Semester semester, Subject subject, Section section, String name, String unit, LocalDate date,
                      int minutes) {
        Test t = new Test();
        t.setSubject(subject);
        t.setSection(section);
        t.setSemester(semester);
        t.setName(name);
        t.setUnit(unit);
        t.setTestDate(date);
        t.setDurationMinutes(minutes);
        testRepository.save(t);
    }

    private void resource(Semester semester, Subject subject, Section section, String title, String description,
                          String link) {
        Resource r = new Resource();
        r.setSubject(subject);
        r.setSection(section);
        r.setSemester(semester);
        r.setTitle(title);
        r.setDescription(description);
        r.setLink(link);
        resourceRepository.save(r);
    }
}
