package com.smartacademic.analytics.dto;

import java.time.LocalDate;
import java.util.List;

public final class AnalyticsDtos {

    private AnalyticsDtos() {
    }

    public record AnalyticsOverviewDto(long totalStudents, long totalPeriods, long presentPeriods, long odPeriods,
                                       long absentPeriods, double totalHours, double presentHours, double odHours,
                                       double absentHours, double overallPercent, List<SubjectStatDto> subjectStats,
                                       List<SectionStatDto> sectionStats) {
    }

    public record StudentStatDto(Long studentId, String name, String registerNumber, String sectionLabel, long total,
                                 long present, long od, long absent, double percent) {
    }

    public record SubjectStatDto(String subjectLabel, long total, long present, long od, long absent, double percent) {
    }

    public record SectionStatDto(String sectionLabel, long total, long present, long od, long absent, double percent) {
    }

    public record MonthlyPointDto(LocalDate date, String label, long total, long present, long od, long absent,
                                  double percent) {
    }
}
