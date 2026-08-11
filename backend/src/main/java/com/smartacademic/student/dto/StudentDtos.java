package com.smartacademic.student.dto;

import java.time.LocalDate;
import java.util.List;

import com.smartacademic.attendance.AttendanceSessionStatus;
import com.smartacademic.attendance.AttendanceStatus;
import com.smartacademic.content.dto.ContentDtos.TestDto;
import com.smartacademic.master.Day;

public final class StudentDtos {

    private StudentDtos() {
    }

    public record StudentDashboardDto(String name, String registerNumber, Long sectionId, String sectionLabel,
                                      LocalDate today, String greeting, int currentPeriod,
                                      AttendanceSummaryDto summary, PeriodInfoDto current, PeriodInfoDto next,
                                      List<TodayPeriodDto> todayPeriods, List<TestDto> upcomingTests,
                                      List<UpcomingItemDto> pendingItems, boolean freePeriod,
                                      Integer freePeriodMinutes) {
    }

    public record AttendanceSummaryDto(long totalPeriods, long presentPeriods, long odPeriods, long absentPeriods, double percentage) {
    }

    public record TodayPeriodDto(Long timetableEntryId, int period, String startTime, String endTime,
                                 String subjectLabel, String staffName, AttendanceSessionStatus status,
                                 boolean isCurrent, boolean isNext, boolean test, String testTopic,
                                 boolean freePeriod, Integer freeMinutes) {
    }

    public record PeriodInfoDto(Long timetableEntryId, int period, String startTime, String endTime,
                                String subjectLabel, String staffName, AttendanceSessionStatus status,
                                boolean test, String testTopic, boolean freePeriod, Integer freeMinutes) {
    }

    public record DayTimetableDto(Day day, List<PeriodInfoDto> periods) {
    }

    public record StudentTimetableDto(List<DayTimetableDto> days, List<String> periodMeta) {
    }

    public record AttendanceRecordViewDto(Long id, LocalDate date, String dayLabel, int period, String subjectLabel,
                                          String sectionLabel, AttendanceStatus status) {
    }

    public record StudentSubjectDto(Long subjectId, String subjectLabel, String subjectCode, long attendancePresent,
                                    long attendanceOd, long attendanceAbsent, long attendanceTotal,
                                    double attendancePercent, long assignmentCount, long taskCount, long testCount,
                                    long resourceCount, long pendingTaskCount) {
    }

    public record StudentSubjectDetailsDto(Long subjectId, String subjectLabel, String subjectCode, long attendancePresent,
                                           long attendanceOd, long attendanceAbsent, long attendanceTotal,
                                           double attendancePercent,
                                           List<com.smartacademic.content.dto.ContentDtos.AssignmentDto> assignments,
                                           List<com.smartacademic.content.dto.ContentDtos.TaskDto> tasks,
                                           List<com.smartacademic.content.dto.ContentDtos.TestDto> tests,
                                           List<com.smartacademic.content.dto.ContentDtos.ResourceDto> resources) {
    }

    public record PlannerDto(boolean freePeriod, Integer freeMinutes, String statusLabel,
                             List<RecommendationDto> recommendations, List<TestDto> upcomingTests,
                             List<UpcomingItemDto> pendingItems) {
    }

    public record RecommendationDto(String kind, Long id, String title, String subjectLabel, LocalDate due,
                                    Integer estimatedMinutes, String explanation) {
    }

    public record UpcomingItemDto(String kind, Long id, String title, String subjectLabel, LocalDate due,
                                  Integer estimatedMinutes, boolean completed) {
    }
}
