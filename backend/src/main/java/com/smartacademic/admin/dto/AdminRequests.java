package com.smartacademic.admin.dto;

import java.util.List;

import com.smartacademic.master.AssignmentDesignation;
import com.smartacademic.master.Day;
import com.smartacademic.master.StaffRoleType;
import com.smartacademic.master.SubjectType;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class AdminRequests {

    private AdminRequests() {
    }

    public record DepartmentRequest(@NotBlank String name, @NotBlank String code) {
    }

    public record SubjectRequest(@NotBlank String code, @NotBlank String name, Long departmentId,
                                 @NotNull SubjectType type) {
    }

    public record SectionRequest(@NotBlank String yearLabel, @NotBlank String name, @NotNull Long departmentId) {
    }

    public record AcademicYearRequest(@NotBlank String name, boolean currentYear) {
    }

    public record StaffRequest(@NotBlank String name, @NotBlank String employeeId, String email, String phone,
                               Long departmentId, @NotBlank String username, List<StaffRoleType> roles,
                               String password, Boolean active) {
    }

    public record StaffSubjectAssignmentRequest(@NotNull Long staffId, @NotNull Long subjectId,
                                                @NotNull Long sectionId, @NotNull Long semesterId,
                                                AssignmentDesignation designation) {
    }

    public record TimetableEntryRequest(@NotNull Long semesterId, @NotNull Long sectionId, @NotNull Day day,
                                        @Min(1) int period, @NotNull Long subjectId, Long staffId,
                                        Long secondaryStaffId, Boolean isTest, String testTopic) {
    }

    public record StudentRequest(@NotBlank String name, @NotBlank String registerNumber, String email, String phone,
                                 @NotNull Long sectionId, @NotBlank String username, String password, Boolean active) {
    }

    public record CreateOdRequest(@NotBlank String eventName, @NotNull java.time.LocalDate date,
                                 @NotNull java.time.LocalTime fromTime, @NotNull java.time.LocalTime toTime,
                                 @NotNull Long departmentId, @NotBlank String yearLabel,
                                 @NotNull Long sectionId, @NotNull List<Long> studentIds) {
    }

    public record UpdateOdRequest(@NotBlank String eventName, @NotNull java.time.LocalDate date,
                                 @NotNull java.time.LocalTime fromTime, @NotNull java.time.LocalTime toTime,
                                 @NotNull Long departmentId, @NotBlank String yearLabel,
                                 @NotNull Long sectionId, @NotNull List<Long> studentIds) {
    }
}
