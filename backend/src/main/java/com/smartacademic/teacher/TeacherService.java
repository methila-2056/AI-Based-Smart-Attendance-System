package com.smartacademic.teacher;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Supplier;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartacademic.attendance.AttendanceSession;
import com.smartacademic.attendance.AttendanceSessionRepository;
import com.smartacademic.attendance.AttendanceSessionStatus;
import com.smartacademic.attendance.AttendanceRecord;
import com.smartacademic.attendance.AttendanceRecordRepository;
import com.smartacademic.attendance.QrTokenService;
import com.smartacademic.attendance.dto.AttendanceDtos.AttendanceRecordDto;
import com.smartacademic.attendance.dto.AttendanceDtos.AttendanceSessionDto;
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
import com.smartacademic.content.dto.ContentDtos.AssignmentDto;
import com.smartacademic.content.dto.ContentDtos.ResourceDto;
import com.smartacademic.content.dto.ContentDtos.TaskDto;
import com.smartacademic.content.dto.ContentDtos.TestDto;
import com.smartacademic.master.Day;
import com.smartacademic.master.Section;
import com.smartacademic.master.Semester;
import com.smartacademic.master.SemesterRepository;
import com.smartacademic.master.Staff;
import com.smartacademic.master.StaffRepository;
import com.smartacademic.master.StaffRole;
import com.smartacademic.master.StaffRoleRepository;
import com.smartacademic.master.StaffRoleType;
import com.smartacademic.master.StaffSubjectAssignment;
import com.smartacademic.master.StaffSubjectAssignmentRepository;
import com.smartacademic.master.StudentRepository;
import com.smartacademic.master.Subject;
import com.smartacademic.master.TimetableEntry;
import com.smartacademic.master.TimetableEntryRepository;
import com.smartacademic.teacher.dto.TeacherDtos.SubjectHubDto;
import com.smartacademic.teacher.dto.TeacherDtos.TeacherClassDto;
import com.smartacademic.teacher.dto.TeacherDtos.TeacherDashboardDto;
import com.smartacademic.teacher.dto.TeacherDtos.TodayClassDto;
import com.smartacademic.teacher.dto.TeacherRequests.AssignmentRequest;
import com.smartacademic.teacher.dto.TeacherRequests.MarkAbsentRequest;
import com.smartacademic.teacher.dto.TeacherRequests.ResourceRequest;
import com.smartacademic.teacher.dto.TeacherRequests.StartAttendanceRequest;
import com.smartacademic.teacher.dto.TeacherRequests.TaskRequest;
import com.smartacademic.teacher.dto.TeacherRequests.TestRequest;
import com.smartacademic.user.UserService;

@Service
public class TeacherService {

    private final StaffRepository staffRepository;
    private final StaffRoleRepository staffRoleRepository;
    private final TimetableEntryRepository timetableRepository;
    private final StaffSubjectAssignmentRepository assignmentRepository;
    private final SemesterRepository semesterRepository;
    private final StudentRepository studentRepository;
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

    public TeacherService(StaffRepository staffRepository, StaffRoleRepository staffRoleRepository,
                          TimetableEntryRepository timetableRepository,
                          StaffSubjectAssignmentRepository assignmentRepository,
                          SemesterRepository semesterRepository, StudentRepository studentRepository,
                          AttendanceSessionRepository sessionRepository, AttendanceRecordRepository recordRepository,
                          AssignmentRepository assignmentContentRepository, TaskRepository taskContentRepository,
                          TestRepository testContentRepository, ResourceRepository resourceContentRepository,
                          StudentTaskCompletionRepository completionRepository, ClockService clock,
                          QrTokenService qrTokenService, UserService userService) {
        this.staffRepository = staffRepository;
        this.staffRoleRepository = staffRoleRepository;
        this.timetableRepository = timetableRepository;
        this.assignmentRepository = assignmentRepository;
        this.semesterRepository = semesterRepository;
        this.studentRepository = studentRepository;
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
    public TeacherDashboardDto dashboard(String username) {
        Staff staff = currentStaff(username);
        LocalDate today = clock.today();
        Day day = Day.valueOf(today.getDayOfWeek().name());
        int currentPeriod = clock.currentPeriod();

        List<TodayClassDto> todayClasses = todayClasses(staff, today, day, currentPeriod);

        List<StaffSubjectAssignment> hubs = assignmentRepository.findByStaffId(staff.getId());
        long openAssignments = 0;
        long pendingTests = 0;
        for (StaffSubjectAssignment hub : hubs) {
            openAssignments += assignmentContentRepository
                    .findBySectionIdAndSemesterIdAndDueDateGreaterThanEqualOrderByDueDateAsc(
                            hub.getSection().getId(), hub.getSemester().getId(), today).size();
            openAssignments += taskContentRepository
                    .findBySectionIdAndSemesterIdAndDueDateGreaterThanEqualOrderByDueDateAsc(
                            hub.getSection().getId(), hub.getSemester().getId(), today).size();
            pendingTests += testContentRepository
                    .findBySectionIdAndSemesterIdAndTestDateGreaterThanEqualOrderByTestDateAsc(
                            hub.getSection().getId(), hub.getSemester().getId(), today).size();
        }

        return new TeacherDashboardDto(staff.getName(), staff.getEmployeeId(), greeting(today), today, currentPeriod,
                isCoordinator(staff), todayClasses, openAssignments, pendingTests);
    }

    private List<TodayClassDto> todayClasses(Staff staff, LocalDate today, Day day, int currentPeriod) {
        Set<Long> entryIds = new java.util.LinkedHashSet<>();
        entryIds.addAll(timetableRepository.findByStaffIdAndDayOrderByPeriodAsc(staff.getId(), day).stream()
                .map(TimetableEntry::getId).collect(Collectors.toList()));
        entryIds.addAll(timetableRepository.findBySecondaryStaffIdAndDayOrderByPeriodAsc(staff.getId(), day).stream()
                .map(TimetableEntry::getId).collect(Collectors.toList()));

        Map<Long, AttendanceSession> sessions = sessionRepository
                .findByTimetableEntryIdInAndSessionDate(new ArrayList<>(entryIds), today).stream()
                .collect(Collectors.toMap(s -> s.getTimetableEntry().getId(), s -> s, (a, b) -> a));

        List<TodayClassDto> result = new ArrayList<>();
        for (Long entryId : entryIds) {
            TimetableEntry entry = timetableRepository.findById(entryId).orElse(null);
            if (entry == null) {
                continue;
            }
            AttendanceSession session = sessions.get(entryId);
            AttendanceSessionStatus status = session == null ? null : session.getStatus();
            long marked = session == null ? 0 : recordRepository.findBySessionId(session.getId()).size();
            long total = studentRepository.findBySectionIdOrderByRegisterNumberAsc(entry.getSection().getId()).size();
            result.add(new TodayClassDto(entry.getId(), findAssignmentId(staff, entry), entry.getDay(), entry.getPeriod(),
                    clock.formatTime(periodStart(entry.getPeriod())), clock.formatTime(periodEnd(entry.getPeriod())),
                    entry.getSection().getId(), entry.getSection().getDisplayName(), entry.getSubject().getId(),
                    entry.getSubject().getCode() + " - " + entry.getSubject().getName(), entry.getSubject().getCode(),
                    entry.isTest(), entry.getTestTopic(), status, session == null ? null : session.getId(), marked, total,
                    entry.getPeriod() == currentPeriod, entry.getPeriod() == currentPeriod + 1));
        }
        result.sort(Comparator.comparingInt(TodayClassDto::period));
        return result;
    }

    private Long findAssignmentId(Staff staff, TimetableEntry entry) {
        return assignmentRepository
                .findFirstByStaffIdAndSubjectIdAndSectionIdAndSemesterId(staff.getId(), entry.getSubject().getId(),
                        entry.getSection().getId(), entry.getSemester().getId())
                .map(StaffSubjectAssignment::getId).orElse(null);
    }

    // ------------------------------------------------------------------ Classes / Subject hub

    @Transactional(readOnly = true)
    public List<TeacherClassDto> classes(String username) {
        Staff staff = currentStaff(username);
        List<TeacherClassDto> result = new ArrayList<>();
        for (StaffSubjectAssignment hub : assignmentRepository.findByStaffId(staff.getId())) {
            Long sectionId = hub.getSection().getId();
            Long semesterId = hub.getSemester().getId();
            result.add(new TeacherClassDto(hub.getId(), hub.getSubject().getId(),
                    hub.getSubject().getCode() + " - " + hub.getSubject().getName(), hub.getSubject().getCode(),
                    hub.getSection().getId(), hub.getSection().getDisplayName(), hub.getSemester().getId(),
                    hub.getSemester().getName() + " " + hub.getSemester().getAcademicYear().getName(),
                    hub.getDesignation(), assignmentContentRepository.findBySectionIdAndSemesterIdOrderByDueDateAsc(
                            sectionId, semesterId).size(),
                    taskContentRepository.findBySectionIdAndSemesterIdOrderByDueDateAsc(sectionId, semesterId).size(),
                    testContentRepository.findBySectionIdAndSemesterIdOrderByTestDateAsc(sectionId, semesterId).size(),
                    resourceContentRepository.findBySectionIdAndSemesterIdOrderByCreatedAtDesc(sectionId, semesterId)
                            .size()));
        }
        result.sort(Comparator.comparing(TeacherClassDto::sectionLabel).thenComparing(TeacherClassDto::subjectLabel));
        return result;
    }

    @Transactional(readOnly = true)
    public SubjectHubDto subjectHub(String username, Long assignmentId) {
        Staff staff = currentStaff(username);
        StaffSubjectAssignment hub = requireAssignment(assignmentId);
        if (!hub.getStaff().getId().equals(staff.getId())) {
            throw new IllegalArgumentException("This subject hub belongs to another teacher");
        }
        Long sectionId = hub.getSection().getId();
        Long semesterId = hub.getSemester().getId();
        List<AssignmentDto> assignments = assignmentContentRepository
                .findBySectionIdAndSemesterIdOrderByDueDateAsc(sectionId, semesterId).stream()
                .map(a -> toDto(a)).collect(Collectors.toList());
        List<TaskDto> tasks = taskContentRepository.findBySectionIdAndSemesterIdOrderByDueDateAsc(sectionId, semesterId)
                .stream().map(t -> new TaskDto(t.getId(), hub.getSubject().getCode() + " - " + hub.getSubject().getName(),
                        hub.getSection().getDisplayName(), t.getTitle(), t.getDescription(), t.getDueDate(),
                        t.getEstimatedMinutes(), t.getPriority(), false, null))
                .collect(Collectors.toList());
        List<TestDto> tests = testContentRepository.findBySectionIdAndSemesterIdOrderByTestDateAsc(sectionId, semesterId)
                .stream().map(this::toDto).collect(Collectors.toList());
        List<ResourceDto> resources = resourceContentRepository
                .findBySectionIdAndSemesterIdOrderByCreatedAtDesc(sectionId, semesterId).stream()
                .map(r -> new ResourceDto(r.getId(), hub.getSubject().getCode() + " - " + hub.getSubject().getName(),
                        hub.getSection().getDisplayName(), r.getTitle(), r.getDescription(), r.getLink()))
                .collect(Collectors.toList());

        return new SubjectHubDto(hub.getId(), hub.getSubject().getId(),
                hub.getSubject().getCode() + " - " + hub.getSubject().getName(), hub.getSubject().getCode(),
                hub.getSection().getId(), hub.getSection().getDisplayName(), hub.getSemester().getId(),
                hub.getSemester().getName() + " " + hub.getSemester().getAcademicYear().getName(), hub.getDesignation(),
                assignments, tasks, tests, resources);
    }

    // ------------------------------------------------------------------ Content CRUD

    @Transactional
    public AssignmentDto createAssignment(String username, Long assignmentId, AssignmentRequest req) {
        HubContext ctx = ownedHub(username, assignmentId);
        Assignment a = new Assignment();
        apply(a, ctx, req);
        return toDto(assignmentContentRepository.save(a));
    }

    @Transactional
    public AssignmentDto updateAssignment(String username, Long contentId, AssignmentRequest req) {
        Staff staff = currentStaff(username);
        Assignment a = requireAssignmentContent(contentId);
        ensureContentOwned(staff, a.getSubject().getId(), a.getSection().getId(), a.getSemester().getId());
        apply(a, a.getSubject(), a.getSection(), a.getSemester(), req);
        return toDto(assignmentContentRepository.save(a));
    }

    @Transactional
    public void deleteAssignment(String username, Long contentId) {
        Staff staff = currentStaff(username);
        Assignment a = requireAssignmentContent(contentId);
        ensureContentOwned(staff, a.getSubject().getId(), a.getSection().getId(), a.getSemester().getId());
        assignmentContentRepository.delete(a);
    }

    @Transactional
    public TaskDto createTask(String username, Long assignmentId, TaskRequest req) {
        HubContext ctx = ownedHub(username, assignmentId);
        Task t = new Task();
        apply(t, ctx, req);
        taskContentRepository.save(t);
        return new TaskDto(t.getId(), ctx.subject.getCode() + " - " + ctx.subject.getName(), ctx.section.getDisplayName(),
                t.getTitle(), t.getDescription(), t.getDueDate(), t.getEstimatedMinutes(), t.getPriority(), false, null);
    }

    @Transactional
    public TaskDto updateTask(String username, Long contentId, TaskRequest req) {
        Staff staff = currentStaff(username);
        Task t = requireTaskContent(contentId);
        ensureContentOwned(staff, t.getSubject().getId(), t.getSection().getId(), t.getSemester().getId());
        apply(t, req);
        Task saved = taskContentRepository.save(t);
        return new TaskDto(saved.getId(), saved.getSubject().getCode() + " - " + saved.getSubject().getName(),
                saved.getSection().getDisplayName(), saved.getTitle(), saved.getDescription(), saved.getDueDate(),
                saved.getEstimatedMinutes(), saved.getPriority(), false, null);
    }

    @Transactional
    public void deleteTask(String username, Long contentId) {
        Staff staff = currentStaff(username);
        Task t = requireTaskContent(contentId);
        ensureContentOwned(staff, t.getSubject().getId(), t.getSection().getId(), t.getSemester().getId());
        completionRepository.deleteByTaskId(t.getId());
        taskContentRepository.delete(t);
    }

    @Transactional
    public TestDto createTest(String username, Long assignmentId, TestRequest req) {
        HubContext ctx = ownedHub(username, assignmentId);
        Test t = new Test();
        apply(t, ctx, req);
        return toDto(testContentRepository.save(t));
    }

    @Transactional
    public TestDto updateTest(String username, Long contentId, TestRequest req) {
        Staff staff = currentStaff(username);
        Test t = requireTestContent(contentId);
        ensureContentOwned(staff, t.getSubject().getId(), t.getSection().getId(), t.getSemester().getId());
        apply(t, req);
        return toDto(testContentRepository.save(t));
    }

    @Transactional
    public void deleteTest(String username, Long contentId) {
        Staff staff = currentStaff(username);
        Test t = requireTestContent(contentId);
        ensureContentOwned(staff, t.getSubject().getId(), t.getSection().getId(), t.getSemester().getId());
        testContentRepository.delete(t);
    }

    @Transactional
    public ResourceDto createResource(String username, Long assignmentId, ResourceRequest req) {
        HubContext ctx = ownedHub(username, assignmentId);
        Resource r = new Resource();
        apply(r, ctx, req);
        return toDto(r, ctx);
    }

    @Transactional
    public ResourceDto updateResource(String username, Long contentId, ResourceRequest req) {
        Staff staff = currentStaff(username);
        Resource r = requireResourceContent(contentId);
        ensureContentOwned(staff, r.getSubject().getId(), r.getSection().getId(), r.getSemester().getId());
        apply(r, req);
        return toDto(r, ctxOf(r.getSubject(), r.getSection(), r.getSemester()));
    }

    @Transactional
    public void deleteResource(String username, Long contentId) {
        Staff staff = currentStaff(username);
        Resource r = requireResourceContent(contentId);
        ensureContentOwned(staff, r.getSubject().getId(), r.getSection().getId(), r.getSemester().getId());
        resourceContentRepository.delete(r);
    }

    // ------------------------------------------------------------------ Attendance

    @Transactional
    public AttendanceSessionDto startAttendance(String username, StartAttendanceRequest req) {
        Staff staff = currentStaff(username);
        TimetableEntry entry = requireTimetableEntry(req.timetableEntryId());
        ensureOwnedEntry(staff, entry);
        ensureToday(entry);

        LocalDate today = clock.today();
        AttendanceSession session = sessionRepository.findByTimetableEntryIdAndSessionDate(entry.getId(), today)
                .orElse(null);
        if (session == null) {
            session = new AttendanceSession();
            session.setTimetableEntry(entry);
            session.setStaff(staff);
            session.setSection(entry.getSection());
            session.setSubject(entry.getSubject());
            session.setSemester(entry.getSemester());
            session.setSessionDate(today);
            session.setStatus(AttendanceSessionStatus.ACTIVE);
            session.setStartedAt(Instant.now());
            session = sessionRepository.save(session);
        } else if (session.getStatus() == AttendanceSessionStatus.ABSENT) {
            session.setStatus(AttendanceSessionStatus.ACTIVE);
            session.setStartedAt(Instant.now());
            session = sessionRepository.save(session);
        } else if (session.getStatus() == AttendanceSessionStatus.CLOSED) {
            throw new IllegalArgumentException("Attendance for this period is already closed");
        }
        rotateToken(session);
        return toDto(session, staff);
    }

    @Transactional
    public AttendanceSessionDto refreshQr(String username, Long sessionId) {
        Staff staff = currentStaff(username);
        AttendanceSession session = requireSession(sessionId, staff);
        if (session.getStatus() != AttendanceSessionStatus.ACTIVE) {
            throw new IllegalArgumentException("Only an active attendance session can issue a fresh QR");
        }
        rotateToken(session);
        return toDto(session, staff);
    }

    @Transactional
    public AttendanceSessionDto closeAttendance(String username, Long sessionId) {
        Staff staff = currentStaff(username);
        AttendanceSession session = requireSession(sessionId, staff);
        if (session.getStatus() != AttendanceSessionStatus.ACTIVE) {
            throw new IllegalArgumentException("Session is not active");
        }
        session.setStatus(AttendanceSessionStatus.CLOSED);
        session.setClosedAt(Instant.now());
        session.setCurrentToken(null);
        session.setTokenExpiresAt(null);
        session = sessionRepository.save(session);
        return toDto(session, staff);
    }

    @Transactional
    public AttendanceSessionDto markAbsent(String username, MarkAbsentRequest req) {
        Staff staff = currentStaff(username);
        TimetableEntry entry = requireTimetableEntry(req.timetableEntryId());
        ensureOwnedEntry(staff, entry);
        ensureToday(entry);

        LocalDate today = clock.today();
        AttendanceSession session = sessionRepository.findByTimetableEntryIdAndSessionDate(entry.getId(), today)
                .orElse(null);
        if (session != null && session.getStatus() == AttendanceSessionStatus.ACTIVE) {
            throw new IllegalArgumentException("Class has already started; close attendance first");
        }
        if (session == null) {
            session = new AttendanceSession();
            session.setTimetableEntry(entry);
            session.setStaff(staff);
            session.setSection(entry.getSection());
            session.setSubject(entry.getSubject());
            session.setSemester(entry.getSemester());
            session.setSessionDate(today);
            session.setStatus(AttendanceSessionStatus.ABSENT);
            session.setClosedAt(Instant.now());
        } else {
            session.setStatus(AttendanceSessionStatus.ABSENT);
            session.setClosedAt(Instant.now());
            session.setCurrentToken(null);
            session.setTokenExpiresAt(null);
        }
        session = sessionRepository.save(session);
        return toDto(session, staff);
    }

    @Transactional(readOnly = true)
    public AttendanceSessionDto session(String username, Long sessionId) {
        Staff staff = currentStaff(username);
        return toDto(requireSession(sessionId, staff), staff);
    }

    private void rotateToken(AttendanceSession session) {
        String token = qrTokenService.generate(session.getId());
        session.setCurrentToken(token);
        session.setTokenExpiresAt(Instant.now().plusSeconds(180));
        sessionRepository.save(session);
    }

    // ------------------------------------------------------------------ Mappers & helpers

    private AttendanceSessionDto toDto(AttendanceSession session, Staff staff) {
        TimetableEntry entry = session.getTimetableEntry();
        List<AttendanceRecordDto> records = recordRepository.findBySessionId(session.getId()).stream()
                .map(r -> new AttendanceRecordDto(r.getId(), r.getStudent().getId(), r.getStudent().getName(),
                        r.getStudent().getRegisterNumber(), r.getStatus(), r.getMarkedAt()))
                .collect(Collectors.toList());
        long studentCount = studentRepository.findBySectionIdOrderByRegisterNumberAsc(entry.getSection().getId()).size();
        return new AttendanceSessionDto(session.getId(), entry.getId(),
                findAssignmentId(session.getStaff(), entry), entry.getSection().getDisplayName(),
                entry.getSubject().getCode() + " - " + entry.getSubject().getName(), entry.getSubject().getCode(),
                entry.getDay(), entry.getPeriod(), clock.formatTime(periodStart(entry.getPeriod())),
                clock.formatTime(periodEnd(entry.getPeriod())), session.getStatus(),
                session.getStatus() == AttendanceSessionStatus.ACTIVE ? session.getCurrentToken() : null,
                session.getTokenExpiresAt(), session.getStartedAt(), session.getClosedAt(), records.size(),
                studentCount, entry.getPeriod() == clock.currentPeriod(), records);
    }

    private AssignmentDto toDto(Assignment a) {
        return new AssignmentDto(a.getId(), a.getSubject().getCode() + " - " + a.getSubject().getName(),
                a.getSection().getDisplayName(), a.getTitle(), a.getDescription(), a.getGivenDate(), a.getDueDate(),
                a.getEstimatedMinutes());
    }

    private TestDto toDto(Test t) {
        return new TestDto(t.getId(), t.getSubject().getCode() + " - " + t.getSubject().getName(),
                t.getSection().getDisplayName(), t.getName(), t.getUnit(), t.getTestDate(), t.getDurationMinutes());
    }

    private ResourceDto toDto(Resource r, HubContext ctx) {
        return new ResourceDto(r.getId(), ctx.subject.getCode() + " - " + ctx.subject.getName(),
                ctx.section.getDisplayName(), r.getTitle(), r.getDescription(), r.getLink());
    }

    private void apply(Assignment a, HubContext ctx, AssignmentRequest req) {
        a.setSubject(ctx.subject);
        a.setSection(ctx.section);
        a.setSemester(ctx.semester);
        a.setCreatedBy(ctx.staff);
        a.setTitle(req.title().trim());
        a.setDescription(req.description());
        a.setGivenDate(req.givenDate());
        a.setDueDate(req.dueDate());
        a.setEstimatedMinutes(req.estimatedMinutes());
    }

    private void apply(Assignment a, Subject subject, Section section, Semester semester, AssignmentRequest req) {
        a.setSubject(subject);
        a.setSection(section);
        a.setSemester(semester);
        a.setTitle(req.title().trim());
        a.setDescription(req.description());
        a.setGivenDate(req.givenDate());
        a.setDueDate(req.dueDate());
        a.setEstimatedMinutes(req.estimatedMinutes());
    }

    private void apply(Task t, HubContext ctx, TaskRequest req) {
        t.setSubject(ctx.subject);
        t.setSection(ctx.section);
        t.setSemester(ctx.semester);
        t.setCreatedBy(ctx.staff);
        t.setTitle(req.title().trim());
        t.setDescription(req.description());
        t.setDueDate(req.dueDate());
        t.setEstimatedMinutes(req.estimatedMinutes());
        t.setPriority(req.priority() == null ? com.smartacademic.content.TaskPriority.MEDIUM : req.priority());
    }

    private void apply(Task t, TaskRequest req) {
        t.setTitle(req.title().trim());
        t.setDescription(req.description());
        t.setDueDate(req.dueDate());
        t.setEstimatedMinutes(req.estimatedMinutes());
        t.setPriority(req.priority() == null ? com.smartacademic.content.TaskPriority.MEDIUM : req.priority());
    }

    private void apply(Test t, HubContext ctx, TestRequest req) {
        t.setSubject(ctx.subject);
        t.setSection(ctx.section);
        t.setSemester(ctx.semester);
        t.setCreatedBy(ctx.staff);
        t.setName(req.name().trim());
        t.setUnit(req.unit());
        t.setTestDate(req.testDate());
        t.setDurationMinutes(req.durationMinutes());
    }

    private void apply(Test t, TestRequest req) {
        t.setName(req.name().trim());
        t.setUnit(req.unit());
        t.setTestDate(req.testDate());
        t.setDurationMinutes(req.durationMinutes());
    }

    private void apply(Resource r, HubContext ctx, ResourceRequest req) {
        r.setSubject(ctx.subject);
        r.setSection(ctx.section);
        r.setSemester(ctx.semester);
        r.setCreatedBy(ctx.staff);
        r.setTitle(req.title().trim());
        r.setDescription(req.description());
        r.setLink(req.link());
    }

    private void apply(Resource r, ResourceRequest req) {
        r.setTitle(req.title().trim());
        r.setDescription(req.description());
        r.setLink(req.link());
    }

    private HubContext ctxOf(Subject subject, Section section, Semester semester) {
        return new HubContext(null, subject, section, semester);
    }

    private record HubContext(Staff staff, Subject subject, Section section, Semester semester) {
    }

    private HubContext ownedHub(String username, Long assignmentId) {
        Staff staff = currentStaff(username);
        StaffSubjectAssignment hub = requireAssignment(assignmentId);
        if (!hub.getStaff().getId().equals(staff.getId())) {
            throw new IllegalArgumentException("This subject hub belongs to another teacher");
        }
        return new HubContext(staff, hub.getSubject(), hub.getSection(), hub.getSemester());
    }

    private void ensureContentOwned(Staff staff, Long subjectId, Long sectionId, Long semesterId) {
        boolean owned = assignmentRepository
                .findFirstByStaffIdAndSubjectIdAndSectionIdAndSemesterId(staff.getId(), subjectId, sectionId, semesterId)
                .isPresent();
        if (!owned) {
            throw new IllegalArgumentException("You do not have access to this academic content");
        }
    }

    private Staff currentStaff(String username) {
        Staff staff = staffRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Staff profile not found for " + username));
        if (!staff.isActive()) {
            throw new IllegalArgumentException("Your account is inactive");
        }
        return staff;
    }

    private boolean isCoordinator(Staff staff) {
        return staffRoleRepository.findByStaffId(staff.getId()).stream()
                .map(StaffRole::getRole).anyMatch(r -> r == StaffRoleType.ATTENDANCE_COORDINATOR);
    }

    private String greeting(LocalDate today) {
        int hour = java.time.LocalTime.now().getHour();
        if (hour < 12) {
            return "Good morning";
        }
        if (hour < 17) {
            return "Good afternoon";
        }
        return "Good evening";
    }

    private void ensureToday(TimetableEntry entry) {
        Day today = Day.valueOf(clock.today().getDayOfWeek().name());
        if (entry.getDay() != today) {
            throw new IllegalArgumentException("This class is scheduled for " + entry.getDay() + ", not today");
        }
    }

    private void ensureOwnedEntry(Staff staff, TimetableEntry entry) {
        boolean owned = (entry.getStaff() != null && entry.getStaff().getId().equals(staff.getId()))
                || (entry.getSecondaryStaff() != null && entry.getSecondaryStaff().getId().equals(staff.getId()));
        if (!owned) {
            throw new IllegalArgumentException("This period is not assigned to you");
        }
    }

    private int periodStart(int period) {
        return clock.periods().stream().filter(p -> p[0] == period).map(p -> p[1]).findFirst().orElse(0);
    }

    private int periodEnd(int period) {
        return clock.periods().stream().filter(p -> p[0] == period).map(p -> p[2]).findFirst().orElse(0);
    }

    private StaffSubjectAssignment requireAssignment(Long id) {
        return assignmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Subject assignment not found: " + id));
    }

    private TimetableEntry requireTimetableEntry(Long id) {
        return timetableRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Timetable entry not found: " + id));
    }

    private AttendanceSession requireSession(Long id, Staff staff) {
        AttendanceSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Attendance session not found: " + id));
        if (!session.getStaff().getId().equals(staff.getId())) {
            throw new IllegalArgumentException("This attendance session belongs to another teacher");
        }
        return session;
    }

    private Assignment requireAssignmentContent(Long id) {
        return assignmentContentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Assignment not found: " + id));
    }

    private Task requireTaskContent(Long id) {
        return taskContentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Task not found: " + id));
    }

    private Test requireTestContent(Long id) {
        return testContentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Test not found: " + id));
    }

    private Resource requireResourceContent(Long id) {
        return resourceContentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Resource not found: " + id));
    }
}
