package com.smartacademic.analytics;

import java.security.Principal;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartacademic.analytics.dto.AnalyticsDtos.AnalyticsOverviewDto;
import com.smartacademic.analytics.dto.AnalyticsDtos.MonthlyPointDto;
import com.smartacademic.analytics.dto.AnalyticsDtos.StudentStatDto;
import com.smartacademic.analytics.dto.AnalyticsDtos.SubjectStatDto;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/overview")
    public AnalyticsOverviewDto overview(Principal principal) {
        return analyticsService.overview(principal.getName());
    }

    @GetMapping("/students")
    public List<StudentStatDto> students(Principal principal) {
        return analyticsService.students(principal.getName());
    }

    @GetMapping("/subjects")
    public List<SubjectStatDto> subjects(Principal principal) {
        return analyticsService.subjects(principal.getName());
    }

    @GetMapping("/monthly")
    public List<MonthlyPointDto> monthly(Principal principal) {
        return analyticsService.monthly(principal.getName());
    }
}
