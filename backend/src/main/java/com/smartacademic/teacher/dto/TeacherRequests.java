package com.smartacademic.teacher.dto;

import java.time.LocalDate;

import com.smartacademic.content.TaskPriority;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class TeacherRequests {

    private TeacherRequests() {
    }

    public record StartAttendanceRequest(@NotNull Long timetableEntryId) {
    }

    public record MarkAbsentRequest(@NotNull Long timetableEntryId) {
    }

    public record AssignmentRequest(@NotBlank String title, String description, @NotNull LocalDate givenDate,
                                    @NotNull LocalDate dueDate, @Min(1) int estimatedMinutes) {
    }

    public record TaskRequest(@NotBlank String title, String description, @NotNull LocalDate dueDate,
                              @Min(1) int estimatedMinutes, TaskPriority priority) {
    }

    public record TestRequest(@NotBlank String name, String unit, @NotNull LocalDate testDate,
                              @Min(1) int durationMinutes) {
    }

    public record ResourceRequest(@NotBlank String title, String description, String link) {
    }
}
