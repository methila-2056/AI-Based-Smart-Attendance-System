package com.smartacademic.admin;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Supplier;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartacademic.admin.dto.AdminDtos.AcademicYearDto;
import com.smartacademic.admin.dto.AdminDtos.AdminOverviewDto;
import com.smartacademic.admin.dto.AdminDtos.DepartmentDto;
import com.smartacademic.admin.dto.AdminDtos.OdPeriodInfo;
import com.smartacademic.admin.dto.AdminDtos.OdRecordDetailDto;
import com.smartacademic.admin.dto.AdminDtos.OdRecordDto;
import com.smartacademic.admin.dto.AdminDtos.SectionDto;
import com.smartacademic.admin.dto.AdminDtos.SemesterDto;
import com.smartacademic.admin.dto.AdminDtos.StaffDto;
import com.smartacademic.admin.dto.AdminDtos.StaffSubjectAssignmentDto;
import com.smartacademic.admin.dto.AdminDtos.StudentDto;
import com.smartacademic.admin.dto.AdminDtos.StudentSelectDto;
import com.smartacademic.admin.dto.AdminDtos.SubjectDto;
import com.smartacademic.admin.dto.AdminDtos.TimetableEntryDto;
import com.smartacademic.admin.dto.AdminRequests.AcademicYearRequest;
import com.smartacademic.admin.dto.AdminRequests.CreateOdRequest;
import com.smartacademic.admin.dto.AdminRequests.DepartmentRequest;
import com.smartacademic.admin.dto.AdminRequests.SectionRequest;
import com.smartacademic.admin.dto.AdminRequests.StaffRequest;
import com.smartacademic.admin.dto.AdminRequests.StaffSubjectAssignmentRequest;
import com.smartacademic.admin.dto.AdminRequests.StudentRequest;
import com.smartacademic.admin.dto.AdminRequests.SubjectRequest;
import com.smartacademic.admin.dto.AdminRequests.TimetableEntryRequest;
import com.smartacademic.admin.dto.AdminRequests.UpdateOdRequest;
import com.smartacademic.attendance.AttendanceRecord;
import com.smartacademic.attendance.AttendanceRecordRepository;
import com.smartacademic.attendance.AttendanceSession;
import com.smartacademic.attendance.AttendanceSessionRepository;
import com.smartacademic.attendance.AttendanceSessionStatus;
import com.smartacademic.attendance.AttendanceStatus;
import com.smartacademic.common.ClockService;
import com.smartacademic.common.NotFoundException;
import com.smartacademic.master.AcademicYear;
import com.smartacademic.master.AcademicYearRepository;
import com.smartacademic.master.AssignmentDesignation;
import com.smartacademic.master.Day;
import com.smartacademic.master.Department;
import com.smartacademic.master.DepartmentRepository;
import com.smartacademic.master.Section;
import com.smartacademic.master.SectionRepository;
import com.smartacademic.master.Semester;
import com.smartacademic.master.SemesterRepository;
import com.smartacademic.master.Staff;
import com.smartacademic.master.StaffRepository;
import com.smartacademic.master.StaffRole;
import com.smartacademic.master.StaffRoleRepository;
import com.smartacademic.master.StaffRoleType;
import com.smartacademic.master.StaffSubjectAssignment;
import com.smartacademic.master.StaffSubjectAssignmentRepository;
import com.smartacademic.master.Student;
import com.smartacademic.master.StudentRepository;
import com.smartacademic.master.Subject;
import com.smartacademic.master.SubjectRepository;
import com.smartacademic.master.TimetableEntry;
import com.smartacademic.master.TimetableEntryRepository;
import com.smartacademic.user.Role;
import com.smartacademic.user.User;
import com.smartacademic.user.UserRepository;
import com.smartacademic.user.UserService;

@Service
public class AdminService {

    private static final String DEFAULT_STAFF_PASSWORD = "Staff@123";
    private static final String DEFAULT_STUDENT_PASSWORD = "Student@123";

    private final DepartmentRepository departmentRepository;
    private final SubjectRepository subjectRepository;
    private final SectionRepository sectionRepository;
    private final AcademicYearRepository academicYearRepository;
    private final SemesterRepository semesterRepository;
    private final StaffRepository staffRepository;
    private final StaffRoleRepository staffRoleRepository;
    private final StaffSubjectAssignmentRepository assignmentRepository;
    private final TimetableEntryRepository timetableRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final OdRecordRepository odRecordRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final ClockService clock;

    public AdminService(DepartmentRepository departmentRepository, SubjectRepository subjectRepository,
                        SectionRepository sectionRepository, AcademicYearRepository academicYearRepository,
                        SemesterRepository semesterRepository, StaffRepository staffRepository,
                        StaffRoleRepository staffRoleRepository, StaffSubjectAssignmentRepository assignmentRepository,
                        TimetableEntryRepository timetableRepository, StudentRepository studentRepository,
                        UserRepository userRepository, UserService userService,
                        OdRecordRepository odRecordRepository, AttendanceSessionRepository sessionRepository,
                        AttendanceRecordRepository attendanceRecordRepository, ClockService clock) {
        this.departmentRepository = departmentRepository;
        this.subjectRepository = subjectRepository;
        this.sectionRepository = sectionRepository;
        this.academicYearRepository = academicYearRepository;
        this.semesterRepository = semesterRepository;
        this.staffRepository = staffRepository;
        this.staffRoleRepository = staffRoleRepository;
        this.assignmentRepository = assignmentRepository;
        this.timetableRepository = timetableRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.odRecordRepository = odRecordRepository;
        this.sessionRepository = sessionRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.clock = clock;
    }

    // ------------------------------------------------------------------ Overview

    @Transactional(readOnly = true)
    public AdminOverviewDto overview() {
        return new AdminOverviewDto(staffRepository.count(), studentRepository.count(), departmentRepository.count(),
                subjectRepository.count(), sectionRepository.count(), timetableRepository.count(),
                timetableRepository.countByStaffIsNull());
    }

    // ------------------------------------------------------------------ Departments

    @Transactional(readOnly = true)
    public List<DepartmentDto> listDepartments() {
        return departmentRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public DepartmentDto createDepartment(DepartmentRequest req) {
        if (departmentRepository.findByCode(req.code().trim().toUpperCase()).isPresent()) {
            throw new IllegalArgumentException("Department code already exists: " + req.code());
        }
        Department dept = new Department();
        dept.setName(req.name().trim());
        dept.setCode(req.code().trim().toUpperCase());
        return toDto(departmentRepository.save(dept));
    }

    @Transactional
    public DepartmentDto updateDepartment(Long id, DepartmentRequest req) {
        Department dept = require(() -> departmentRepository.findById(id), id, "Department");
        dept.setName(req.name().trim());
        dept.setCode(req.code().trim().toUpperCase());
        return toDto(departmentRepository.save(dept));
    }

    @Transactional
    public void deleteDepartment(Long id) {
        Department dept = require(() -> departmentRepository.findById(id), id, "Department");
        boolean referenced = sectionRepository.findAll().stream().anyMatch(s -> s.getDepartment().getId().equals(id))
                || subjectRepository.findAll().stream().anyMatch(s -> s.getDepartment() != null
                        && s.getDepartment().getId().equals(id))
                || staffRepository.findAll().stream().anyMatch(s -> s.getDepartment() != null
                        && s.getDepartment().getId().equals(id));
        if (referenced) {
            throw new IllegalArgumentException("Department is referenced by sections, subjects or staff and cannot be deleted");
        }
        departmentRepository.delete(dept);
    }

    // ------------------------------------------------------------------ Subjects

    @Transactional(readOnly = true)
    public List<SubjectDto> listSubjects() {
        return subjectRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public SubjectDto createSubject(SubjectRequest req) {
        if (subjectRepository.findByCode(req.code().trim().toUpperCase()).isPresent()) {
            throw new IllegalArgumentException("Subject code already exists: " + req.code());
        }
        Subject subject = new Subject();
        applySubject(subject, req);
        return toDto(subjectRepository.save(subject));
    }

    @Transactional
    public SubjectDto updateSubject(Long id, SubjectRequest req) {
        Subject subject = require(() -> subjectRepository.findById(id), id, "Subject");
        applySubject(subject, req);
        return toDto(subjectRepository.save(subject));
    }

    @Transactional
    public void deleteSubject(Long id) {
        Subject subject = require(() -> subjectRepository.findById(id), id, "Subject");
        if (!assignmentRepository.findAll().stream().noneMatch(a -> a.getSubject().getId().equals(id))
                || !timetableRepository.findAll().stream().noneMatch(t -> t.getSubject().getId().equals(id))) {
            throw new IllegalArgumentException("Subject is referenced by timetable or staff assignments and cannot be deleted");
        }
        subjectRepository.delete(subject);
    }

    private void applySubject(Subject subject, SubjectRequest req) {
        subject.setCode(req.code().trim().toUpperCase());
        subject.setName(req.name().trim());
        subject.setType(req.type());
        subject.setDepartment(req.departmentId() == null ? null
                : require(() -> departmentRepository.findById(req.departmentId()), req.departmentId(), "Department"));
    }

    // ------------------------------------------------------------------ Sections

    @Transactional(readOnly = true)
    public List<SectionDto> listSections() {
        return sectionRepository.findAllByOrderByYearLabelAscNameAsc().stream().map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public SectionDto createSection(SectionRequest req) {
        Department dept = require(() -> departmentRepository.findById(req.departmentId()), req.departmentId(),
                "Department");
        boolean exists = sectionRepository.findAll().stream().anyMatch(s ->
                s.getDepartment().getId().equals(dept.getId())
                        && s.getYearLabel().equalsIgnoreCase(req.yearLabel().trim())
                        && s.getName().equalsIgnoreCase(req.name().trim()));
        if (exists) {
            throw new IllegalArgumentException("Section already exists: " + req.yearLabel() + " " + dept.getCode() + " " + req.name());
        }
        Section section = new Section();
        section.setDepartment(dept);
        section.setYearLabel(req.yearLabel().trim());
        section.setName(req.name().trim().toUpperCase());
        return toDto(sectionRepository.save(section));
    }

    @Transactional
    public SectionDto updateSection(Long id, SectionRequest req) {
        Section section = require(() -> sectionRepository.findById(id), id, "Section");
        section.setDepartment(require(() -> departmentRepository.findById(req.departmentId()), req.departmentId(),
                "Department"));
        section.setYearLabel(req.yearLabel().trim());
        section.setName(req.name().trim().toUpperCase());
        return toDto(sectionRepository.save(section));
    }

    @Transactional
    public void deleteSection(Long id) {
        Section section = require(() -> sectionRepository.findById(id), id, "Section");
        if (!studentRepository.findAll().stream().noneMatch(s -> s.getSection().getId().equals(id))
                || !timetableRepository.findAll().stream().noneMatch(t -> t.getSection().getId().equals(id))
                || !assignmentRepository.findAll().stream().noneMatch(a -> a.getSection().getId().equals(id))) {
            throw new IllegalArgumentException("Section is referenced by students, timetable or assignments and cannot be deleted");
        }
        sectionRepository.delete(section);
    }

    // ------------------------------------------------------------------ Academic year / Semester

    @Transactional(readOnly = true)
    public List<AcademicYearDto> listAcademicYears() {
        return academicYearRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SemesterDto> listSemesters() {
        return semesterRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public AcademicYearDto createAcademicYear(AcademicYearRequest req) {
        if (req.currentYear()) {
            clearCurrentAcademicYears();
        }
        AcademicYear year = new AcademicYear();
        year.setName(req.name().trim());
        year.setCurrentYear(req.currentYear());
        return toDto(academicYearRepository.save(year));
    }

    @Transactional
    public SemesterDto setCurrentSemester(Long id) {
        Semester semester = require(() -> semesterRepository.findById(id), id, "Semester");
        semesterRepository.findAll().forEach(s -> s.setCurrentSemester(false));
        semester.setCurrentSemester(true);
        semesterRepository.save(semester);
        return toDto(semester);
    }

    private void clearCurrentAcademicYears() {
        academicYearRepository.findAll().forEach(y -> y.setCurrentYear(false));
    }

    // ------------------------------------------------------------------ Staff

    @Transactional(readOnly = true)
    public List<StaffDto> listStaff() {
        return staffRepository.findAllByOrderByNameAsc().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public StaffDto createStaff(StaffRequest req) {
        if (staffRepository.findByUsername(req.username().trim()).isPresent()) {
            throw new IllegalArgumentException("Username already in use: " + req.username());
        }
        Staff staff = new Staff();
        applyStaff(staff, req);
        staff = staffRepository.save(staff);

        Set<StaffRoleType> roles = req.roles() == null ? Set.of() : Set.copyOf(req.roles());
        saveRoles(staff, roles);

        User user = userService.createUser(staff.getUsername(),
                req.password() == null || req.password().isBlank() ? DEFAULT_STAFF_PASSWORD : req.password(),
                Role.STAFF);
        user.setStaff(staff);
        userService.save(user);
        return toDto(staff);
    }

    @Transactional
    public StaffDto updateStaff(Long id, StaffRequest req) {
        Staff staff = require(() -> staffRepository.findById(id), id, "Staff");
        String oldUsername = staff.getUsername();
        applyStaff(staff, req);
        staffRepository.save(staff);

        Set<StaffRoleType> roles = req.roles() == null ? Set.of() : Set.copyOf(req.roles());
        staffRoleRepository.deleteByStaffId(staff.getId());
        saveRoles(staff, roles);

        User user = userRepository.findByUsername(oldUsername)
                .orElseGet(() -> userService.createUser(staff.getUsername(),
                        req.password() == null || req.password().isBlank() ? DEFAULT_STAFF_PASSWORD : req.password(),
                        Role.STAFF));
        if (!oldUsername.equals(staff.getUsername())) {
            user.setUsername(staff.getUsername());
        }
        user.setStaff(staff);
        userService.save(user);
        return toDto(staff);
    }

    @Transactional
    public void deleteStaff(Long id) {
        Staff staff = require(() -> staffRepository.findById(id), id, "Staff");
        userRepository.findByUsername(staff.getUsername()).ifPresent(u -> {
            u.setStaff(null);
            userRepository.delete(u);
        });
        staffRoleRepository.deleteByStaffId(staff.getId());
        assignmentRepository.findByStaffId(staff.getId()).forEach(assignmentRepository::delete);
        timetableRepository.findAll().forEach(t -> {
            boolean changed = false;
            if (t.getStaff() != null && t.getStaff().getId().equals(id)) {
                t.setStaff(null);
                changed = true;
            }
            if (t.getSecondaryStaff() != null && t.getSecondaryStaff().getId().equals(id)) {
                t.setSecondaryStaff(null);
                changed = true;
            }
            if (changed) {
                timetableRepository.save(t);
            }
        });
        staffRepository.delete(staff);
    }

    private void applyStaff(Staff staff, StaffRequest req) {
        staff.setName(req.name().trim());
        staff.setEmployeeId(req.employeeId().trim());
        staff.setEmail(req.email());
        staff.setPhone(req.phone());
        staff.setDepartment(req.departmentId() == null ? null
                : require(() -> departmentRepository.findById(req.departmentId()), req.departmentId(), "Department"));
        staff.setUsername(req.username().trim());
        staff.setActive(req.active() == null || req.active());
    }

    private void saveRoles(Staff staff, Set<StaffRoleType> roles) {
        for (StaffRoleType role : roles) {
            StaffRole sr = new StaffRole();
            sr.setStaff(staff);
            sr.setRole(role);
            staffRoleRepository.save(sr);
        }
    }

    // ------------------------------------------------------------------ Staff-subject assignments

    @Transactional(readOnly = true)
    public List<StaffSubjectAssignmentDto> listAssignments() {
        return assignmentRepository.findAllByOrderByIdAsc().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public StaffSubjectAssignmentDto createAssignment(StaffSubjectAssignmentRequest req) {
        StaffSubjectAssignment assignment = new StaffSubjectAssignment();
        applyAssignment(assignment, req);
        return toDto(assignmentRepository.save(assignment));
    }

    @Transactional
    public StaffSubjectAssignmentDto updateAssignment(Long id, StaffSubjectAssignmentRequest req) {
        StaffSubjectAssignment assignment = require(() -> assignmentRepository.findById(id), id, "Assignment");
        applyAssignment(assignment, req);
        return toDto(assignmentRepository.save(assignment));
    }

    @Transactional
    public void deleteAssignment(Long id) {
        StaffSubjectAssignment assignment = require(() -> assignmentRepository.findById(id), id, "Assignment");
        assignmentRepository.delete(assignment);
    }

    private void applyAssignment(StaffSubjectAssignment assignment, StaffSubjectAssignmentRequest req) {
        assignment.setStaff(require(() -> staffRepository.findById(req.staffId()), req.staffId(), "Staff"));
        assignment.setSubject(require(() -> subjectRepository.findById(req.subjectId()), req.subjectId(), "Subject"));
        assignment.setSection(require(() -> sectionRepository.findById(req.sectionId()), req.sectionId(), "Section"));
        assignment.setSemester(require(() -> semesterRepository.findById(req.semesterId()), req.semesterId(), "Semester"));
        assignment.setDesignation(req.designation() == null ? AssignmentDesignation.PRIMARY : req.designation());
    }

    // ------------------------------------------------------------------ Timetable

    @Transactional(readOnly = true)
    public List<TimetableEntryDto> listTimetable() {
        return timetableRepository.findAllByOrderByIdAsc().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public TimetableEntryDto createTimetableEntry(TimetableEntryRequest req) {
        ensureSlotFree(req.semesterId(), req.sectionId(), req.day(), req.period());
        TimetableEntry entry = new TimetableEntry();
        applyTimetable(entry, req);
        return toDto(timetableRepository.save(entry));
    }

    @Transactional
    public TimetableEntryDto updateTimetableEntry(Long id, TimetableEntryRequest req) {
        TimetableEntry entry = require(() -> timetableRepository.findById(id), id, "Timetable entry");
        ensureSlotFree(req.semesterId(), req.sectionId(), req.day(), req.period(), id);
        applyTimetable(entry, req);
        return toDto(timetableRepository.save(entry));
    }

    @Transactional
    public void deleteTimetableEntry(Long id) {
        TimetableEntry entry = require(() -> timetableRepository.findById(id), id, "Timetable entry");
        timetableRepository.delete(entry);
    }

    private void applyTimetable(TimetableEntry entry, TimetableEntryRequest req) {
        entry.setSemester(require(() -> semesterRepository.findById(req.semesterId()), req.semesterId(), "Semester"));
        entry.setSection(require(() -> sectionRepository.findById(req.sectionId()), req.sectionId(), "Section"));
        entry.setDay(req.day());
        entry.setPeriod(req.period());
        entry.setSubject(require(() -> subjectRepository.findById(req.subjectId()), req.subjectId(), "Subject"));
        entry.setStaff(req.staffId() == null ? null
                : require(() -> staffRepository.findById(req.staffId()), req.staffId(), "Staff"));
        entry.setSecondaryStaff(req.secondaryStaffId() == null ? null
                : require(() -> staffRepository.findById(req.secondaryStaffId()), req.secondaryStaffId(), "Staff"));
        entry.setTest(Boolean.TRUE.equals(req.isTest()));
        entry.setTestTopic(req.testTopic());
    }

    private void ensureSlotFree(Long semesterId, Long sectionId, com.smartacademic.master.Day day, int period) {
        ensureSlotFree(semesterId, sectionId, day, period, null);
    }

    private void ensureSlotFree(Long semesterId, Long sectionId, com.smartacademic.master.Day day, int period,
                                Long excludeId) {
        boolean occupied = timetableRepository.findBySectionIdAndSemesterId(sectionId, semesterId).stream()
                .anyMatch(t -> t.getDay() == day && t.getPeriod() == period
                        && (excludeId == null || !t.getId().equals(excludeId)));
        if (occupied) {
            throw new IllegalArgumentException("Timetable slot already occupied for " + day + " period " + period);
        }
    }

    // ------------------------------------------------------------------ Students

    @Transactional(readOnly = true)
    public List<StudentDto> listStudents() {
        return studentRepository.findAllByOrderByRegisterNumberAsc().stream().map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public StudentDto createStudent(StudentRequest req) {
        if (studentRepository.findByUsername(req.username().trim()).isPresent()) {
            throw new IllegalArgumentException("Username already in use: " + req.username());
        }
        Student student = new Student();
        applyStudent(student, req);
        student = studentRepository.save(student);
        User user = userService.createUser(student.getUsername(),
                req.password() == null || req.password().isBlank() ? DEFAULT_STUDENT_PASSWORD : req.password(),
                Role.STUDENT);
        user.setStudent(student);
        userService.save(user);
        return toDto(student);
    }

    @Transactional
    public StudentDto updateStudent(Long id, StudentRequest req) {
        Student student = require(() -> studentRepository.findById(id), id, "Student");
        String oldUsername = student.getUsername();
        applyStudent(student, req);
        studentRepository.save(student);
        User user = userRepository.findByUsername(oldUsername)
                .orElseGet(() -> userService.createUser(student.getUsername(),
                        req.password() == null || req.password().isBlank() ? DEFAULT_STUDENT_PASSWORD : req.password(),
                        Role.STUDENT));
        if (!oldUsername.equals(student.getUsername())) {
            user.setUsername(student.getUsername());
        }
        user.setStudent(student);
        userService.save(user);
        return toDto(student);
    }

    @Transactional
    public void deleteStudent(Long id) {
        Student student = require(() -> studentRepository.findById(id), id, "Student");
        userRepository.findByUsername(student.getUsername()).ifPresent(u -> {
            u.setStudent(null);
            userRepository.delete(u);
        });
        studentRepository.delete(student);
    }

    private void applyStudent(Student student, StudentRequest req) {
        student.setName(req.name().trim());
        student.setRegisterNumber(req.registerNumber().trim());
        student.setEmail(req.email());
        student.setPhone(req.phone());
        student.setSection(require(() -> sectionRepository.findById(req.sectionId()), req.sectionId(), "Section"));
        student.setUsername(req.username().trim());
        student.setActive(req.active() == null || req.active());
    }

    // ------------------------------------------------------------------ Mappers

    private DepartmentDto toDto(Department d) {
        return new DepartmentDto(d.getId(), d.getName(), d.getCode());
    }

    private SubjectDto toDto(Subject s) {
        return new SubjectDto(s.getId(), s.getCode(), s.getName(),
                s.getDepartment() == null ? null : s.getDepartment().getId(),
                s.getDepartment() == null ? null : s.getDepartment().getName(), s.getType());
    }

    private SectionDto toDto(Section s) {
        return new SectionDto(s.getId(), s.getDisplayName(), s.getYearLabel(), s.getName(),
                s.getDepartment().getId(), s.getDepartment().getName());
    }

    private AcademicYearDto toDto(AcademicYear y) {
        return new AcademicYearDto(y.getId(), y.getName(), y.isCurrentYear());
    }

    private SemesterDto toDto(Semester s) {
        return new SemesterDto(s.getId(), s.getName(), s.getAcademicYear().getId(), s.getAcademicYear().getName(),
                s.isCurrentSemester());
    }

    private StaffDto toDto(Staff s) {
        List<StaffRoleType> roles = staffRoleRepository.findByStaffId(s.getId()).stream()
                .map(StaffRole::getRole)
                .collect(Collectors.toList());
        return new StaffDto(s.getId(), s.getName(), s.getEmployeeId(), s.getEmail(), s.getPhone(),
                s.getDepartment() == null ? null : s.getDepartment().getId(),
                s.getDepartment() == null ? null : s.getDepartment().getName(),
                s.getUsername(), roles, s.isActive());
    }

    private StaffSubjectAssignmentDto toDto(StaffSubjectAssignment a) {
        return new StaffSubjectAssignmentDto(a.getId(), a.getStaff().getId(), a.getStaff().getName(),
                a.getSubject().getId(), a.getSubject().getCode() + " - " + a.getSubject().getName(),
                a.getSection().getId(), a.getSection().getDisplayName(), a.getSemester().getId(),
                a.getSemester().getName() + " " + a.getSemester().getAcademicYear().getName(), a.getDesignation());
    }

    private TimetableEntryDto toDto(TimetableEntry t) {
        return new TimetableEntryDto(t.getId(), t.getDay(), t.getPeriod(), t.getSubject().getId(),
                t.getSubject().getCode() + " - " + t.getSubject().getName(),
                t.getStaff() == null ? null : t.getStaff().getId(),
                t.getStaff() == null ? null : t.getStaff().getName(),
                t.getSecondaryStaff() == null ? null : t.getSecondaryStaff().getId(),
                t.getSecondaryStaff() == null ? null : t.getSecondaryStaff().getName(),
                t.getSection().getId(), t.getSection().getDisplayName(), t.getSemester().getId(),
                t.getSemester().getName() + " " + t.getSemester().getAcademicYear().getName(),
                t.isTest(), t.getTestTopic());
    }

    private StudentDto toDto(Student s) {
        return new StudentDto(s.getId(), s.getName(), s.getRegisterNumber(), s.getEmail(), s.getPhone(),
                s.getSection().getId(), s.getSection().getDisplayName(), s.getUsername(), s.isActive());
    }

    // ------------------------------------------------------------------ Helper

    private <T> T require(Supplier<java.util.Optional<T>> finder, Long id, String label) {
        return finder.get().orElseThrow(() -> new NotFoundException(label + " not found: " + id));
    }

    // ------------------------------------------------------------------ OD Management

    @Transactional(readOnly = true)
    public List<OdRecordDto> listOdRecords() {
        return odRecordRepository.findAllByOrderByDateDescIdDesc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OdRecordDetailDto getOdRecordDetail(Long id) {
        OdRecord od = require(() -> odRecordRepository.findById(id), id, "OD Record");
        List<StudentDto> studentDtos = od.getStudents().stream()
                .sorted(Comparator.comparing(Student::getRegisterNumber))
                .map(this::toDto)
                .collect(Collectors.toList());
        List<OdPeriodInfo> affectedPeriods = calculateAffectedPeriods(od.getSection().getId(), od.getDate(),
                od.getFromTime(), od.getToTime());
        return new OdRecordDetailDto(od.getId(), od.getEventName(), od.getDate(), od.getFromTime(), od.getToTime(),
                od.getDepartment().getId(), od.getDepartment().getName(), od.getYearLabel(),
                od.getSection().getId(), od.getSection().getDisplayName(), computeOdStatus(od),
                od.getCreatedAt(), studentDtos, affectedPeriods);
    }

    @Transactional(readOnly = true)
    public List<StudentSelectDto> getStudentsForOd(Long departmentId, String yearLabel, Long sectionId) {
        List<Student> students;
        if (sectionId != null) {
            students = studentRepository.findBySectionIdOrderByRegisterNumberAsc(sectionId);
        } else {
            students = studentRepository.findAllByOrderByRegisterNumberAsc().stream()
                    .filter(s -> departmentId == null || (s.getSection().getDepartment() != null && s.getSection().getDepartment().getId().equals(departmentId)))
                    .filter(s -> yearLabel == null || yearLabel.isBlank() || s.getSection().getYearLabel().equalsIgnoreCase(yearLabel.trim()))
                    .collect(Collectors.toList());
        }
        return students.stream()
                .map(s -> new StudentSelectDto(s.getId(), s.getName(), s.getRegisterNumber(),
                        s.getSection().getId(), s.getSection().getDisplayName()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OdPeriodInfo> previewOdPeriods(Long sectionId, LocalDate date, LocalTime fromTime, LocalTime toTime) {
        return calculateAffectedPeriods(sectionId, date, fromTime, toTime);
    }

    @Transactional
    public OdRecordDto createOdRecord(CreateOdRequest req) {
        Department dept = require(() -> departmentRepository.findById(req.departmentId()), req.departmentId(), "Department");
        Section section = require(() -> sectionRepository.findById(req.sectionId()), req.sectionId(), "Section");
        Set<Student> students = new HashSet<>(studentRepository.findAllById(req.studentIds()));
        if (students.isEmpty()) {
            throw new IllegalArgumentException("At least one student must be selected for OD grant");
        }

        OdRecord od = new OdRecord();
        od.setEventName(req.eventName().trim());
        od.setDate(req.date());
        od.setFromTime(req.fromTime());
        od.setToTime(req.toTime());
        od.setDepartment(dept);
        od.setYearLabel(req.yearLabel().trim());
        od.setSection(section);
        od.setStudents(students);
        od.setStatus(computeOdStatus(od));

        OdRecord saved = odRecordRepository.save(od);
        applyOdAttendance(saved);
        return toDto(saved);
    }

    @Transactional
    public OdRecordDto updateOdRecord(Long id, UpdateOdRequest req) {
        OdRecord od = require(() -> odRecordRepository.findById(id), id, "OD Record");
        if (od.getStatus() == OdStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot edit a cancelled OD record");
        }
        revertOdAttendance(od);

        Department dept = require(() -> departmentRepository.findById(req.departmentId()), req.departmentId(), "Department");
        Section section = require(() -> sectionRepository.findById(req.sectionId()), req.sectionId(), "Section");
        Set<Student> students = new HashSet<>(studentRepository.findAllById(req.studentIds()));
        if (students.isEmpty()) {
            throw new IllegalArgumentException("At least one student must be selected for OD grant");
        }

        od.setEventName(req.eventName().trim());
        od.setDate(req.date());
        od.setFromTime(req.fromTime());
        od.setToTime(req.toTime());
        od.setDepartment(dept);
        od.setYearLabel(req.yearLabel().trim());
        od.setSection(section);
        od.setStudents(students);
        od.setStatus(computeOdStatus(od));

        OdRecord saved = odRecordRepository.save(od);
        applyOdAttendance(saved);
        return toDto(saved);
    }

    @Transactional
    public OdRecordDto cancelOdRecord(Long id) {
        OdRecord od = require(() -> odRecordRepository.findById(id), id, "OD Record");
        if (od.getStatus() == OdStatus.CANCELLED) {
            return toDto(od);
        }
        revertOdAttendance(od);
        od.setStatus(OdStatus.CANCELLED);
        return toDto(odRecordRepository.save(od));
    }

    @Transactional
    public List<OdRecordDto> seedDemoOdRecords() {
        if (odRecordRepository.count() > 0) {
            return listOdRecords();
        }
        Section cseA = sectionRepository.findAll().stream()
                .filter(s -> "CSE-A".equalsIgnoreCase(s.getName()))
                .findFirst()
                .orElse(sectionRepository.findAll().isEmpty() ? null : sectionRepository.findAll().get(0));

        if (cseA == null) {
            return List.of();
        }
        Department dept = cseA.getDepartment();
        List<Student> students = studentRepository.findBySectionIdOrderByRegisterNumberAsc(cseA.getId());
        if (students.isEmpty()) {
            return List.of();
        }

        List<Long> allStudentIds = students.stream().map(Student::getId).collect(Collectors.toList());
        List<Long> subset1 = allStudentIds.subList(0, Math.min(3, allStudentIds.size()));
        List<Long> subset2 = allStudentIds.subList(0, Math.min(2, allStudentIds.size()));

        LocalDate today = clock.today();

        // 1. ACTIVE TODAY OD Record
        createOdRecord(new CreateOdRequest(
                "Internal Hackathon 2026",
                today,
                LocalTime.of(9, 15),
                LocalTime.of(16, 15),
                dept.getId(),
                cseA.getYearLabel(),
                cseA.getId(),
                allStudentIds
        ));

        // 2. UPCOMING OD Record
        createOdRecord(new CreateOdRequest(
                "Inter-College Robotics Championship",
                today.plusDays(1),
                LocalTime.of(9, 15),
                LocalTime.of(16, 15),
                dept.getId(),
                cseA.getYearLabel(),
                cseA.getId(),
                subset1
        ));

        // 3. COMPLETED OD Record
        createOdRecord(new CreateOdRequest(
                "State Level Technical Paper Presentation",
                today.minusDays(3),
                LocalTime.of(9, 15),
                LocalTime.of(12, 55),
                dept.getId(),
                cseA.getYearLabel(),
                cseA.getId(),
                subset2
        ));

        // 4. CANCELLED OD Record
        OdRecordDto cancelled = createOdRecord(new CreateOdRequest(
                "Annual Cultural Fest Practice",
                today,
                LocalTime.of(13, 45),
                LocalTime.of(16, 15),
                dept.getId(),
                cseA.getYearLabel(),
                cseA.getId(),
                subset2
        ));
        cancelOdRecord(cancelled.id());

        return listOdRecords();
    }

    private OdStatus computeOdStatus(OdRecord od) {
        if (od.getStatus() == OdStatus.CANCELLED) {
            return OdStatus.CANCELLED;
        }
        LocalDate today = clock.today();
        if (od.getDate().isAfter(today)) {
            return OdStatus.UPCOMING;
        }
        if (od.getDate().isBefore(today)) {
            return OdStatus.COMPLETED;
        }
        LocalTime now = LocalTime.now();
        if (now.isBefore(od.getFromTime())) {
            return OdStatus.UPCOMING;
        }
        if (now.isAfter(od.getToTime())) {
            return OdStatus.COMPLETED;
        }
        return OdStatus.ACTIVE;
    }

    private List<OdPeriodInfo> calculateAffectedPeriods(Long sectionId, LocalDate date, LocalTime fromTime, LocalTime toTime) {
        if (sectionId == null || date == null || fromTime == null || toTime == null) {
            return List.of();
        }
        Day dayOfWeek = Day.valueOf(date.getDayOfWeek().name());
        List<TimetableEntry> entries = timetableRepository.findAll().stream()
                .filter(t -> t.getSection().getId().equals(sectionId) && t.getDay() == dayOfWeek)
                .sorted(Comparator.comparingInt(TimetableEntry::getPeriod))
                .collect(Collectors.toList());

        int fromMins = fromTime.getHour() * 60 + fromTime.getMinute();
        int toMins = toTime.getHour() * 60 + toTime.getMinute();

        List<OdPeriodInfo> result = new ArrayList<>();
        for (int[] p : clock.periods()) {
            int pNum = p[0];
            int pStart = p[1];
            int pEnd = p[2];

            if (Math.max(pStart, fromMins) < Math.min(pEnd, toMins)) {
                TimetableEntry entry = entries.stream().filter(e -> e.getPeriod() == pNum).findFirst().orElse(null);
                String subjectLabel = entry != null ? entry.getSubject().getCode() + " - " + entry.getSubject().getName() : "No Class Scheduled";
                String staffName = entry != null && entry.getStaff() != null ? entry.getStaff().getName() : "N/A";
                result.add(new OdPeriodInfo(pNum, clock.formatTime(pStart), clock.formatTime(pEnd), subjectLabel, staffName));
            }
        }
        return result;
    }

    private void applyOdAttendance(OdRecord od) {
        Day dayOfWeek = Day.valueOf(od.getDate().getDayOfWeek().name());
        List<TimetableEntry> entries = timetableRepository.findAll().stream()
                .filter(t -> t.getSection().getId().equals(od.getSection().getId()) && t.getDay() == dayOfWeek)
                .collect(Collectors.toList());

        int fromMins = od.getFromTime().getHour() * 60 + od.getFromTime().getMinute();
        int toMins = od.getToTime().getHour() * 60 + od.getToTime().getMinute();

        Staff defaultStaff = staffRepository.findAll().stream().findFirst().orElse(null);

        for (int[] p : clock.periods()) {
            int pNum = p[0];
            int pStart = p[1];
            int pEnd = p[2];

            if (Math.max(pStart, fromMins) < Math.min(pEnd, toMins)) {
                TimetableEntry entry = entries.stream().filter(e -> e.getPeriod() == pNum).findFirst().orElse(null);
                if (entry == null) {
                    continue;
                }
                AttendanceSession session = sessionRepository.findByTimetableEntryIdAndSessionDate(entry.getId(), od.getDate())
                        .orElseGet(() -> {
                            AttendanceSession s = new AttendanceSession();
                            s.setTimetableEntry(entry);
                            s.setSessionDate(od.getDate());
                            s.setSection(entry.getSection());
                            s.setSubject(entry.getSubject());
                            s.setStaff(entry.getStaff() != null ? entry.getStaff() : defaultStaff);
                            s.setSemester(entry.getSemester());
                            s.setStatus(AttendanceSessionStatus.ACTIVE);
                            return sessionRepository.save(s);
                        });

                for (Student student : od.getStudents()) {
                    AttendanceRecord record = attendanceRecordRepository.findBySessionIdAndStudentId(session.getId(), student.getId())
                            .orElseGet(() -> {
                                AttendanceRecord r = new AttendanceRecord();
                                r.setSession(session);
                                r.setStudent(student);
                                return r;
                            });
                    record.setStatus(AttendanceStatus.OD_PRESENT);
                    record.setMarkedAt(Instant.now());
                    attendanceRecordRepository.save(record);
                }
            }
        }
    }

    private void revertOdAttendance(OdRecord od) {
        Day dayOfWeek = Day.valueOf(od.getDate().getDayOfWeek().name());
        List<TimetableEntry> entries = timetableRepository.findAll().stream()
                .filter(t -> t.getSection().getId().equals(od.getSection().getId()) && t.getDay() == dayOfWeek)
                .collect(Collectors.toList());

        int fromMins = od.getFromTime().getHour() * 60 + od.getFromTime().getMinute();
        int toMins = od.getToTime().getHour() * 60 + od.getToTime().getMinute();

        for (int[] p : clock.periods()) {
            int pNum = p[0];
            int pStart = p[1];
            int pEnd = p[2];

            if (Math.max(pStart, fromMins) < Math.min(pEnd, toMins)) {
                TimetableEntry entry = entries.stream().filter(e -> e.getPeriod() == pNum).findFirst().orElse(null);
                if (entry == null) continue;

                sessionRepository.findByTimetableEntryIdAndSessionDate(entry.getId(), od.getDate()).ifPresent(session -> {
                    for (Student student : od.getStudents()) {
                        attendanceRecordRepository.findBySessionIdAndStudentId(session.getId(), student.getId()).ifPresent(record -> {
                            if (record.getStatus() == AttendanceStatus.OD_PRESENT) {
                                attendanceRecordRepository.delete(record);
                            }
                        });
                    }
                });
            }
        }
    }

    private OdRecordDto toDto(OdRecord od) {
        return new OdRecordDto(od.getId(), od.getEventName(), od.getDate(), od.getFromTime(), od.getToTime(),
                od.getDepartment().getId(), od.getDepartment().getName(), od.getYearLabel(),
                od.getSection().getId(), od.getSection().getDisplayName(), od.getStudents().size(),
                computeOdStatus(od), od.getCreatedAt());
    }
}
