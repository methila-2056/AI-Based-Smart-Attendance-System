package com.smartacademic.student;

import java.security.Principal;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartacademic.attendance.dto.AttendanceDtos.ScanResultDto;
import com.smartacademic.content.dto.ContentDtos.TaskDto;
import com.smartacademic.student.dto.StudentDtos.AttendanceRecordViewDto;
import com.smartacademic.student.dto.StudentDtos.PlannerDto;
import com.smartacademic.student.dto.StudentDtos.StudentDashboardDto;
import com.smartacademic.student.dto.StudentDtos.StudentSubjectDto;
import com.smartacademic.student.dto.StudentDtos.StudentTimetableDto;
import com.smartacademic.student.dto.StudentRequests.ScanRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/student")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping("/dashboard")
    public StudentDashboardDto dashboard(Principal principal) {
        return studentService.dashboard(principal.getName());
    }

    @GetMapping("/timetable")
    public StudentTimetableDto timetable(Principal principal) {
        return studentService.timetable(principal.getName());
    }

    @GetMapping("/attendance")
    public List<AttendanceRecordViewDto> attendance(Principal principal) {
        return studentService.attendance(principal.getName());
    }

    @GetMapping("/subjects")
    public List<StudentSubjectDto> subjects(Principal principal) {
        return studentService.subjects(principal.getName());
    }

    @GetMapping("/subjects/{subjectId}/details")
    public com.smartacademic.student.dto.StudentDtos.StudentSubjectDetailsDto subjectDetails(Principal principal, @PathVariable Long subjectId) {
        return studentService.subjectDetails(principal.getName(), subjectId);
    }

    @GetMapping("/planner")
    public PlannerDto planner(Principal principal) {
        return studentService.planner(principal.getName());
    }

    @GetMapping("/planner/dummy")
    public PlannerDto dummyPlanner() {
        return studentService.dummyPlanner();
    }

    @PostMapping("/attendance/scan")
    public ScanResultDto scan(Principal principal, @Valid @RequestBody ScanRequest request) {
        return studentService.scan(principal.getName(), request);
    }

    @PostMapping("/tasks/{taskId}/complete")
    public TaskDto completeTask(Principal principal, @PathVariable Long taskId) {
        return studentService.completeTask(principal.getName(), taskId);
    }
}
