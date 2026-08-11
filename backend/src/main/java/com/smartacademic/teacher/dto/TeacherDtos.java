package com.smartacademic.teacher.dto;

import java.time.LocalDate;
import java.util.List;

import com.smartacademic.attendance.AttendanceSessionStatus;
import com.smartacademic.content.dto.ContentDtos.AssignmentDto;
import com.smartacademic.content.dto.ContentDtos.ResourceDto;
import com.smartacademic.content.dto.ContentDtos.TaskDto;
import com.smartacademic.content.dto.ContentDtos.TestDto;
import com.smartacademic.master.AssignmentDesignation;
import com.smartacademic.master.Day;

public final class TeacherDtos {

    private TeacherDtos() {
    }

    public record TeacherDashboardDto(String name, String employeeId, String greeting, LocalDate today,
                                      int currentPeriod, boolean coordinator, List<TodayClassDto> todayClasses,
                                      long openAssignments, long pendingTests) {
    }

    public record TodayClassDto(Long timetableEntryId, Long assignmentId, Day day, int period, String startTime,
                                String endTime, Long sectionId, String sectionLabel, Long subjectId,
                                String subjectLabel, String subjectCode, boolean isTest, String testTopic,
                                AttendanceSessionStatus status, Long sessionId, long markedCount, long studentCount,
                                boolean isCurrent, boolean isNext) {
    }

    public record TeacherClassDto(Long assignmentId, Long subjectId, String subjectLabel, String subjectCode,
                                  Long sectionId, String sectionLabel, Long semesterId, String semesterLabel,
                                  AssignmentDesignation designation, long assignmentCount, long taskCount,
                                  long testCount, long resourceCount) {
    }

    public record SubjectHubDto(Long assignmentId, Long subjectId, String subjectLabel, String subjectCode,
                                Long sectionId, String sectionLabel, Long semesterId, String semesterLabel,
                                AssignmentDesignation designation, List<AssignmentDto> assignments,
                                List<TaskDto> tasks, List<TestDto> tests, List<ResourceDto> resources) {
    }
}
