package com.smartacademic.admin;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartacademic.admin.dto.AdminDtos.AcademicYearDto;
import com.smartacademic.admin.dto.AdminDtos.AdminOverviewDto;
import com.smartacademic.admin.dto.AdminDtos.DepartmentDto;
import com.smartacademic.admin.dto.AdminDtos.SectionDto;
import com.smartacademic.admin.dto.AdminDtos.SemesterDto;
import com.smartacademic.admin.dto.AdminDtos.StaffDto;
import com.smartacademic.admin.dto.AdminDtos.StaffSubjectAssignmentDto;
import com.smartacademic.admin.dto.AdminDtos.StudentDto;
import com.smartacademic.admin.dto.AdminDtos.SubjectDto;
import com.smartacademic.admin.dto.AdminDtos.TimetableEntryDto;
import com.smartacademic.admin.dto.AdminRequests.AcademicYearRequest;
import com.smartacademic.admin.dto.AdminRequests.DepartmentRequest;
import com.smartacademic.admin.dto.AdminRequests.SectionRequest;
import com.smartacademic.admin.dto.AdminRequests.StaffRequest;
import com.smartacademic.admin.dto.AdminRequests.StaffSubjectAssignmentRequest;
import com.smartacademic.admin.dto.AdminRequests.StudentRequest;
import com.smartacademic.admin.dto.AdminRequests.SubjectRequest;
import com.smartacademic.admin.dto.AdminRequests.TimetableEntryRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/overview")
    public AdminOverviewDto overview() {
        return adminService.overview();
    }

    @GetMapping("/departments")
    public List<DepartmentDto> listDepartments() {
        return adminService.listDepartments();
    }

    @PostMapping("/departments")
    public DepartmentDto createDepartment(@Valid @RequestBody DepartmentRequest request) {
        return adminService.createDepartment(request);
    }

    @PutMapping("/departments/{id}")
    public DepartmentDto updateDepartment(@PathVariable Long id, @Valid @RequestBody DepartmentRequest request) {
        return adminService.updateDepartment(id, request);
    }

    @DeleteMapping("/departments/{id}")
    public void deleteDepartment(@PathVariable Long id) {
        adminService.deleteDepartment(id);
    }

    @GetMapping("/subjects")
    public List<SubjectDto> listSubjects() {
        return adminService.listSubjects();
    }

    @PostMapping("/subjects")
    public SubjectDto createSubject(@Valid @RequestBody SubjectRequest request) {
        return adminService.createSubject(request);
    }

    @PutMapping("/subjects/{id}")
    public SubjectDto updateSubject(@PathVariable Long id, @Valid @RequestBody SubjectRequest request) {
        return adminService.updateSubject(id, request);
    }

    @DeleteMapping("/subjects/{id}")
    public void deleteSubject(@PathVariable Long id) {
        adminService.deleteSubject(id);
    }

    @GetMapping("/sections")
    public List<SectionDto> listSections() {
        return adminService.listSections();
    }

    @PostMapping("/sections")
    public SectionDto createSection(@Valid @RequestBody SectionRequest request) {
        return adminService.createSection(request);
    }

    @PutMapping("/sections/{id}")
    public SectionDto updateSection(@PathVariable Long id, @Valid @RequestBody SectionRequest request) {
        return adminService.updateSection(id, request);
    }

    @DeleteMapping("/sections/{id}")
    public void deleteSection(@PathVariable Long id) {
        adminService.deleteSection(id);
    }

    @GetMapping("/academic-years")
    public List<AcademicYearDto> listAcademicYears() {
        return adminService.listAcademicYears();
    }

    @PostMapping("/academic-years")
    public AcademicYearDto createAcademicYear(@Valid @RequestBody AcademicYearRequest request) {
        return adminService.createAcademicYear(request);
    }

    @GetMapping("/semesters")
    public List<SemesterDto> listSemesters() {
        return adminService.listSemesters();
    }

    @PostMapping("/semesters/{id}/current")
    public SemesterDto setCurrentSemester(@PathVariable Long id) {
        return adminService.setCurrentSemester(id);
    }

    @GetMapping("/staff")
    public List<StaffDto> listStaff() {
        return adminService.listStaff();
    }

    @PostMapping("/staff")
    public StaffDto createStaff(@Valid @RequestBody StaffRequest request) {
        return adminService.createStaff(request);
    }

    @PutMapping("/staff/{id}")
    public StaffDto updateStaff(@PathVariable Long id, @Valid @RequestBody StaffRequest request) {
        return adminService.updateStaff(id, request);
    }

    @DeleteMapping("/staff/{id}")
    public void deleteStaff(@PathVariable Long id) {
        adminService.deleteStaff(id);
    }

    @GetMapping("/staff-subjects")
    public List<StaffSubjectAssignmentDto> listAssignments() {
        return adminService.listAssignments();
    }

    @PostMapping("/staff-subjects")
    public StaffSubjectAssignmentDto createAssignment(@Valid @RequestBody StaffSubjectAssignmentRequest request) {
        return adminService.createAssignment(request);
    }

    @PutMapping("/staff-subjects/{id}")
    public StaffSubjectAssignmentDto updateAssignment(@PathVariable Long id,
                                                      @Valid @RequestBody StaffSubjectAssignmentRequest request) {
        return adminService.updateAssignment(id, request);
    }

    @DeleteMapping("/staff-subjects/{id}")
    public void deleteAssignment(@PathVariable Long id) {
        adminService.deleteAssignment(id);
    }

    @GetMapping("/timetable")
    public List<TimetableEntryDto> listTimetable() {
        return adminService.listTimetable();
    }

    @PostMapping("/timetable")
    public TimetableEntryDto createTimetableEntry(@Valid @RequestBody TimetableEntryRequest request) {
        return adminService.createTimetableEntry(request);
    }

    @PutMapping("/timetable/{id}")
    public TimetableEntryDto updateTimetableEntry(@PathVariable Long id,
                                                  @Valid @RequestBody TimetableEntryRequest request) {
        return adminService.updateTimetableEntry(id, request);
    }

    @DeleteMapping("/timetable/{id}")
    public void deleteTimetableEntry(@PathVariable Long id) {
        adminService.deleteTimetableEntry(id);
    }

    @GetMapping("/students")
    public List<StudentDto> listStudents() {
        return adminService.listStudents();
    }

    @PostMapping("/students")
    public StudentDto createStudent(@Valid @RequestBody StudentRequest request) {
        return adminService.createStudent(request);
    }

    @PutMapping("/students/{id}")
    public StudentDto updateStudent(@PathVariable Long id, @Valid @RequestBody StudentRequest request) {
        return adminService.updateStudent(id, request);
    }

    @DeleteMapping("/students/{id}")
    public void deleteStudent(@PathVariable Long id) {
        adminService.deleteStudent(id);
    }

    // ------------------------------------------------------------------ OD Management

    @GetMapping("/od-records")
    public List<com.smartacademic.admin.dto.AdminDtos.OdRecordDto> listOdRecords() {
        return adminService.listOdRecords();
    }

    @GetMapping("/od-records/{id}")
    public com.smartacademic.admin.dto.AdminDtos.OdRecordDetailDto getOdRecordDetail(@PathVariable Long id) {
        return adminService.getOdRecordDetail(id);
    }

    @GetMapping("/od-records/students")
    public List<com.smartacademic.admin.dto.AdminDtos.StudentSelectDto> getStudentsForOd(
            @org.springframework.web.bind.annotation.RequestParam(required = false) Long departmentId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String yearLabel,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Long sectionId) {
        return adminService.getStudentsForOd(departmentId, yearLabel, sectionId);
    }

    @GetMapping("/od-records/preview-periods")
    public List<com.smartacademic.admin.dto.AdminDtos.OdPeriodInfo> previewOdPeriods(
            @org.springframework.web.bind.annotation.RequestParam Long sectionId,
            @org.springframework.web.bind.annotation.RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate date,
            @org.springframework.web.bind.annotation.RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.TIME) java.time.LocalTime fromTime,
            @org.springframework.web.bind.annotation.RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.TIME) java.time.LocalTime toTime) {
        return adminService.previewOdPeriods(sectionId, date, fromTime, toTime);
    }

    @PostMapping("/od-records")
    public com.smartacademic.admin.dto.AdminDtos.OdRecordDto createOdRecord(
            @Valid @RequestBody com.smartacademic.admin.dto.AdminRequests.CreateOdRequest request) {
        return adminService.createOdRecord(request);
    }

    @PutMapping("/od-records/{id}")
    public com.smartacademic.admin.dto.AdminDtos.OdRecordDto updateOdRecord(
            @PathVariable Long id,
            @Valid @RequestBody com.smartacademic.admin.dto.AdminRequests.UpdateOdRequest request) {
        return adminService.updateOdRecord(id, request);
    }

    @PostMapping("/od-records/{id}/cancel")
    public com.smartacademic.admin.dto.AdminDtos.OdRecordDto cancelOdRecord(@PathVariable Long id) {
        return adminService.cancelOdRecord(id);
    }

    @PostMapping("/od-records/seed-demo")
    public List<com.smartacademic.admin.dto.AdminDtos.OdRecordDto> seedDemoOdRecords() {
        return adminService.seedDemoOdRecords();
    }
}
