package com.smartacademic.config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

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
import com.smartacademic.master.SubjectType;
import com.smartacademic.master.TimetableEntry;
import com.smartacademic.master.TimetableEntryRepository;
import com.smartacademic.user.Role;
import com.smartacademic.user.UserService;

import org.springframework.core.annotation.Order;

@Component
@Order(1)
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final DepartmentRepository departmentRepository;
    private final SectionRepository sectionRepository;
    private final SubjectRepository subjectRepository;
    private final StaffRepository staffRepository;
    private final StaffRoleRepository staffRoleRepository;
    private final StaffSubjectAssignmentRepository assignmentRepository;
    private final StudentRepository studentRepository;
    private final AcademicYearRepository academicYearRepository;
    private final SemesterRepository semesterRepository;
    private final TimetableEntryRepository timetableRepository;
    private final UserService userService;

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    public DataSeeder(DepartmentRepository departmentRepository, SectionRepository sectionRepository,
                      SubjectRepository subjectRepository, StaffRepository staffRepository,
                      StaffRoleRepository staffRoleRepository, StaffSubjectAssignmentRepository assignmentRepository,
                      StudentRepository studentRepository, AcademicYearRepository academicYearRepository,
                      SemesterRepository semesterRepository, TimetableEntryRepository timetableRepository,
                      UserService userService) {
        this.departmentRepository = departmentRepository;
        this.sectionRepository = sectionRepository;
        this.subjectRepository = subjectRepository;
        this.staffRepository = staffRepository;
        this.staffRoleRepository = staffRoleRepository;
        this.assignmentRepository = assignmentRepository;
        this.studentRepository = studentRepository;
        this.academicYearRepository = academicYearRepository;
        this.semesterRepository = semesterRepository;
        this.timetableRepository = timetableRepository;
        this.userService = userService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (studentRepository.count() >= 200) {
            log.info("Seed data with 100+ students already present, skipping.");
            return;
        }
        log.info("Truncating tables to perform fresh seed with 100+ students per class...");
        entityManager.createNativeQuery("TRUNCATE TABLE attendance_records, attendance_sessions, student_task_completions, assignments, tasks, tests, resources, timetable_entries, staff_subject_assignments, students, staff, sections, subjects, semesters, academic_years, departments, users CASCADE").executeUpdate();

        log.info("Seeding demo data...");

        userService.createUser("admin", "Admin@123", Role.ADMIN);

        AcademicYear year = new AcademicYear();
        year.setName("2026-2027");
        year.setCurrentYear(true);
        academicYearRepository.save(year);

        Semester semester = new Semester();
        semester.setName("Odd");
        semester.setAcademicYear(year);
        semester.setCurrentSemester(true);
        semesterRepository.save(semester);

        Department cse = new Department();
        cse.setName("Computer Science and Engineering");
        cse.setCode("CSE");
        departmentRepository.save(cse);

        Section sectionA = createSection(cse, "III", "A");
        Section sectionB = createSection(cse, "III", "B");

        Subject dbms = createSubject("DBMS", "Database Management Systems", cse, SubjectType.THEORY);
        Subject os = createSubject("OS", "Operating Systems", cse, SubjectType.THEORY);
        Subject cn = createSubject("CN", "Computer Networks", cse, SubjectType.THEORY);
        Subject se = createSubject("SE", "Software Engineering", cse, SubjectType.THEORY);
        Subject flat = createSubject("FLAT", "Formal Languages and Automata Theory", cse, SubjectType.THEORY);
        Subject dbmsLab = createSubject("DBMS-LAB", "DBMS Laboratory", cse, SubjectType.LAB);
        Subject osLab = createSubject("OS-LAB", "OS Laboratory", cse, SubjectType.LAB);
        Subject cnLab = createSubject("CN-LAB", "CN Laboratory", cse, SubjectType.LAB);

        Staff pavithra = createStaff("Pavithra", "CSE001", "Pav@123", StaffRoleType.SUBJECT_STAFF);
        Staff arun = createStaff("Arun Kumar", "CSE002", "Arun@123", StaffRoleType.SUBJECT_STAFF);
        Staff keerthana = createStaff("Keerthana", "CSE003", "Kee@123", StaffRoleType.SUBJECT_STAFF);
        Staff rajasekar = createStaff("Rajasekar", "CSE004", "Raj@123",
                StaffRoleType.SUBJECT_STAFF, StaffRoleType.ATTENDANCE_COORDINATOR);

        assign(pavithra, dbms, sectionA, AssignmentDesignation.PRIMARY);
        assign(pavithra, dbms, sectionB, AssignmentDesignation.PRIMARY);
        assign(arun, os, sectionA, AssignmentDesignation.PRIMARY);
        assign(arun, os, sectionB, AssignmentDesignation.PRIMARY);
        assign(keerthana, cn, sectionA, AssignmentDesignation.PRIMARY);
        assign(keerthana, cn, sectionB, AssignmentDesignation.PRIMARY);
        assign(rajasekar, se, sectionA, AssignmentDesignation.PRIMARY);
        assign(rajasekar, se, sectionB, AssignmentDesignation.PRIMARY);
        assign(rajasekar, flat, sectionA, AssignmentDesignation.PRIMARY);
        assign(rajasekar, flat, sectionB, AssignmentDesignation.PRIMARY);
        assign(arun, dbmsLab, sectionA, AssignmentDesignation.SECONDARY);
        assign(arun, dbmsLab, sectionB, AssignmentDesignation.SECONDARY);
        assign(pavithra, dbmsLab, sectionA, AssignmentDesignation.PRIMARY);
        assign(pavithra, dbmsLab, sectionB, AssignmentDesignation.PRIMARY);
        assign(keerthana, osLab, sectionA, AssignmentDesignation.SECONDARY);
        assign(keerthana, osLab, sectionB, AssignmentDesignation.SECONDARY);
        assign(arun, osLab, sectionA, AssignmentDesignation.PRIMARY);
        assign(arun, osLab, sectionB, AssignmentDesignation.PRIMARY);
        assign(arun, cnLab, sectionA, AssignmentDesignation.SECONDARY);
        assign(arun, cnLab, sectionB, AssignmentDesignation.SECONDARY);
        assign(keerthana, cnLab, sectionA, AssignmentDesignation.PRIMARY);
        assign(keerthana, cnLab, sectionB, AssignmentDesignation.PRIMARY);

        // Section A: 100 students
        createStudent("Mohan Kumar", "711522CSE001", sectionA, "mohan23");
        createStudent("Priya S", "711522CSE002", sectionA, "priya23");
        createStudent("Karthik R", "711522CSE003", sectionA, "karthik23");
        createStudent("Divya N", "711522CSE004", sectionA, "divya23");
        for (int i = 5; i <= 100; i++) {
            String suffix = String.format("%03d", i);
            createStudent("Student A " + i, "711522CSE" + suffix, sectionA, "studenta" + i);
        }

        // Section B: 100 students
        createStudent("Sneha V", "711522CSE101", sectionB, "sneha23");
        createStudent("Vignesh T", "711522CSE102", sectionB, "vignesh23");
        for (int i = 3; i <= 100; i++) {
            String suffix = String.format("%03d", i + 100);
            createStudent("Student B " + i, "711522CSE" + suffix, sectionB, "studentb" + i);
        }

        seedTimetable(sectionA, semester, dbms, os, cn, se, flat, dbmsLab, osLab, cnLab, pavithra, arun, keerthana,
                rajasekar);
        seedTimetable(sectionB, semester, os, cn, dbms, flat, se, osLab, cnLab, dbmsLab, arun, keerthana, pavithra,
                rajasekar);

        log.info("Seed data complete.");
    }

    private Section createSection(Department dept, String yearLabel, String name) {
        Section s = new Section();
        s.setDepartment(dept);
        s.setYearLabel(yearLabel);
        s.setName(name);
        return sectionRepository.save(s);
    }

    private Subject createSubject(String code, String name, Department dept, SubjectType type) {
        Subject s = new Subject();
        s.setCode(code);
        s.setName(name);
        s.setDepartment(dept);
        s.setType(type);
        return subjectRepository.save(s);
    }

    private Staff createStaff(String name, String employeeId, String password, StaffRoleType... roles) {
        String username = name.toLowerCase().replace(" ", "");
        Staff s = new Staff();
        s.setName(name);
        s.setEmployeeId(employeeId);
        s.setUsername(username);
        s.setActive(true);
        s = staffRepository.save(s);
        for (StaffRoleType role : roles) {
            StaffRole sr = new StaffRole();
            sr.setStaff(s);
            sr.setRole(role);
            staffRoleRepository.save(sr);
        }
        com.smartacademic.user.User user = userService.createUser(username, password, Role.STAFF);
        user.setStaff(s);
        userService.save(user);
        return s;
    }

    private void assign(Staff staff, Subject subject, Section section, AssignmentDesignation designation) {
        StaffSubjectAssignment a = new StaffSubjectAssignment();
        a.setStaff(staff);
        a.setSubject(subject);
        a.setSection(section);
        a.setSemester(currentSemester());
        a.setDesignation(designation);
        assignmentRepository.save(a);
    }

    private void createStudent(String name, String registerNumber, Section section, String username) {
        Student s = new Student();
        s.setName(name);
        s.setRegisterNumber(registerNumber);
        s.setSection(section);
        s.setUsername(username);
        s.setActive(true);
        s = studentRepository.save(s);
        com.smartacademic.user.User user = userService.createUser(username, "Student@123", Role.STUDENT);
        user.setStudent(s);
        userService.save(user);
    }

    private Semester currentSemester() {
        return semesterRepository.findFirstByCurrentSemesterTrue().orElseThrow();
    }

    private void seedTimetable(Section section, Semester semester, Subject s1, Subject s2, Subject s3, Subject s4,
                               Subject s5, Subject lab1, Subject lab2, Subject lab3, Staff t1, Staff t2, Staff t3,
                               Staff t4) {
        TimetableEntry e;

        e = entry(section, semester, Day.MONDAY, 1, s1, t1, null, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.MONDAY, 2, s2, t2, null, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.MONDAY, 3, s2, t2, null, true, "OS Unit 2");
        timetableRepository.save(e);
        e = entry(section, semester, Day.MONDAY, 4, s3, t3, null, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.MONDAY, 5, lab1, t1, t2, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.MONDAY, 6, lab1, t1, t2, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.MONDAY, 7, lab1, t1, t2, false, null);
        timetableRepository.save(e);

        e = entry(section, semester, Day.TUESDAY, 1, s2, t2, null, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.TUESDAY, 2, s3, t3, null, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.TUESDAY, 3, s1, t1, null, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.TUESDAY, 4, s4, t4, null, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.TUESDAY, 5, lab2, t2, t3, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.TUESDAY, 6, lab2, t2, t3, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.TUESDAY, 7, lab2, t2, t3, false, null);
        timetableRepository.save(e);

        e = entry(section, semester, Day.WEDNESDAY, 1, s3, t3, null, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.WEDNESDAY, 2, s1, t1, null, true, "DBMS Unit 3");
        timetableRepository.save(e);
        e = entry(section, semester, Day.WEDNESDAY, 3, s2, t2, null, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.WEDNESDAY, 4, s1, t1, null, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.WEDNESDAY, 5, s5, t4, null, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.WEDNESDAY, 6, lab3, t3, t2, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.WEDNESDAY, 7, lab3, t3, t2, false, null);
        timetableRepository.save(e);

        e = entry(section, semester, Day.THURSDAY, 1, s1, t1, null, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.THURSDAY, 2, s4, t4, null, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.THURSDAY, 3, s3, t3, null, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.THURSDAY, 4, s2, t2, null, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.THURSDAY, 5, s5, t4, null, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.THURSDAY, 6, lab1, t1, t2, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.THURSDAY, 7, lab1, t1, t2, false, null);
        timetableRepository.save(e);

        e = entry(section, semester, Day.FRIDAY, 1, s5, t4, null, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.FRIDAY, 2, s1, t1, null, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.FRIDAY, 3, s4, t4, null, true, "SE Unit 1");
        timetableRepository.save(e);
        e = entry(section, semester, Day.FRIDAY, 4, s2, t2, null, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.FRIDAY, 5, s3, t3, null, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.FRIDAY, 6, lab3, t3, t2, false, null);
        timetableRepository.save(e);
        e = entry(section, semester, Day.FRIDAY, 7, lab3, t3, t2, false, null);
        timetableRepository.save(e);
    }

    private TimetableEntry entry(Section section, Semester semester, Day day, int period, Subject subject, Staff staff,
                                 Staff secondary, boolean isTest, String testTopic) {
        TimetableEntry e = new TimetableEntry();
        e.setSection(section);
        e.setSemester(semester);
        e.setDay(day);
        e.setPeriod(period);
        e.setSubject(subject);
        e.setStaff(staff);
        e.setSecondaryStaff(secondary);
        e.setTest(isTest);
        e.setTestTopic(testTopic);
        return e;
    }
}
