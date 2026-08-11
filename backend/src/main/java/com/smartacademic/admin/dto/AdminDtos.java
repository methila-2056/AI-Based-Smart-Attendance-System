package com.smartacademic.admin.dto;

import java.util.List;

import com.smartacademic.master.AssignmentDesignation;
import com.smartacademic.master.Day;
import com.smartacademic.master.StaffRoleType;
import com.smartacademic.master.SubjectType;

public final class AdminDtos {

    private AdminDtos() {
    }

    public record DepartmentDto(Long id, String name, String code) {
    }

    public record SubjectDto(Long id, String code, String name, Long departmentId, String departmentName,
                             SubjectType type) {
    }

    public record SectionDto(Long id, String displayName, String yearLabel, String name, Long departmentId,
                             String departmentName) {
    }

    public record AcademicYearDto(Long id, String name, boolean currentYear) {
    }

    public record SemesterDto(Long id, String name, Long academicYearId, String academicYearName,
                              boolean currentSemester) {
    }

    public record StaffDto(Long id, String name, String employeeId, String email, String phone, Long departmentId,
                           String departmentName, String username, List<StaffRoleType> roles, boolean active) {
    }

    public record StaffSubjectAssignmentDto(Long id, Long staffId, String staffName, Long subjectId,
                                            String subjectLabel, Long sectionId, String sectionLabel,
                                            Long semesterId, String semesterLabel, AssignmentDesignation designation) {
    }

    public record TimetableEntryDto(Long id, Day day, int period, Long subjectId, String subjectLabel, Long staffId,
                                    String staffName, Long secondaryStaffId, String secondaryStaffName,
                                    Long sectionId, String sectionLabel, Long semesterId, String semesterLabel,
                                    boolean isTest, String testTopic) {
    }

    public record StudentDto(Long id, String name, String registerNumber, String email, String phone, Long sectionId,
                             String sectionLabel, String username, boolean active) {
    }

    public record AdminOverviewDto(long staffCount, long studentCount, long departmentCount, long subjectCount,
                                   long sectionCount, long timetableEntryCount, long unassignedTimetableCount) {
    }

    public record OdPeriodInfo(int period, String startTime, String endTime, String subjectLabel, String staffName) {
    }

    public record OdRecordDto(Long id, String eventName, java.time.LocalDate date, java.time.LocalTime fromTime,
                              java.time.LocalTime toTime, Long departmentId, String departmentName, String yearLabel,
                              Long sectionId, String sectionLabel, int studentCount, com.smartacademic.admin.OdStatus status,
                              java.time.Instant createdAt) {
    }

    public record OdRecordDetailDto(Long id, String eventName, java.time.LocalDate date, java.time.LocalTime fromTime,
                                    java.time.LocalTime toTime, Long departmentId, String departmentName, String yearLabel,
                                    Long sectionId, String sectionLabel, com.smartacademic.admin.OdStatus status,
                                    java.time.Instant createdAt, List<StudentDto> students, List<OdPeriodInfo> affectedPeriods) {
    }

    public record StudentSelectDto(Long id, String name, String registerNumber, Long sectionId, String sectionLabel) {
    }
}
