package com.smartacademic.content.dto;

import java.time.Instant;
import java.time.LocalDate;

import com.smartacademic.content.TaskPriority;

public final class ContentDtos {

    private ContentDtos() {
    }

    public record AssignmentDto(Long id, String subjectLabel, String sectionLabel, String title, String description,
                                LocalDate givenDate, LocalDate dueDate, int estimatedMinutes) {
    }

    public record TaskDto(Long id, String subjectLabel, String sectionLabel, String title, String description,
                          LocalDate dueDate, int estimatedMinutes, TaskPriority priority, boolean completed,
                          Instant completedAt) {
    }

    public record TestDto(Long id, String subjectLabel, String sectionLabel, String name, String unit,
                          LocalDate testDate, int durationMinutes) {
    }

    public record ResourceDto(Long id, String subjectLabel, String sectionLabel, String title, String description,
                              String link) {
    }
}
