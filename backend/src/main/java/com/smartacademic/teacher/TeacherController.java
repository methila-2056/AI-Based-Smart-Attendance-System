package com.smartacademic.teacher;

import java.security.Principal;
import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartacademic.attendance.dto.AttendanceDtos.AttendanceSessionDto;
import com.smartacademic.content.dto.ContentDtos.AssignmentDto;
import com.smartacademic.content.dto.ContentDtos.ResourceDto;
import com.smartacademic.content.dto.ContentDtos.TaskDto;
import com.smartacademic.content.dto.ContentDtos.TestDto;
import com.smartacademic.teacher.dto.TeacherDtos.SubjectHubDto;
import com.smartacademic.teacher.dto.TeacherDtos.TeacherClassDto;
import com.smartacademic.teacher.dto.TeacherDtos.TeacherDashboardDto;
import com.smartacademic.teacher.dto.TeacherRequests.AssignmentRequest;
import com.smartacademic.teacher.dto.TeacherRequests.MarkAbsentRequest;
import com.smartacademic.teacher.dto.TeacherRequests.ResourceRequest;
import com.smartacademic.teacher.dto.TeacherRequests.StartAttendanceRequest;
import com.smartacademic.teacher.dto.TeacherRequests.TaskRequest;
import com.smartacademic.teacher.dto.TeacherRequests.TestRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/teacher")
public class TeacherController {

    private final TeacherService teacherService;

    public TeacherController(TeacherService teacherService) {
        this.teacherService = teacherService;
    }

    @GetMapping("/dashboard")
    public TeacherDashboardDto dashboard(Principal principal) {
        return teacherService.dashboard(principal.getName());
    }

    @GetMapping("/classes")
    public List<TeacherClassDto> classes(Principal principal) {
        return teacherService.classes(principal.getName());
    }

    @GetMapping("/subject-hub/{assignmentId}")
    public SubjectHubDto subjectHub(Principal principal, @PathVariable Long assignmentId) {
        return teacherService.subjectHub(principal.getName(), assignmentId);
    }

    // ------------------------------------------------------------- Assignments

    @PostMapping("/subject-hub/{assignmentId}/assignments")
    public AssignmentDto createAssignment(Principal principal, @PathVariable Long assignmentId,
                                          @Valid @RequestBody AssignmentRequest request) {
        return teacherService.createAssignment(principal.getName(), assignmentId, request);
    }

    @PutMapping("/assignments/{contentId}")
    public AssignmentDto updateAssignment(Principal principal, @PathVariable Long contentId,
                                          @Valid @RequestBody AssignmentRequest request) {
        return teacherService.updateAssignment(principal.getName(), contentId, request);
    }

    @DeleteMapping("/assignments/{contentId}")
    public void deleteAssignment(Principal principal, @PathVariable Long contentId) {
        teacherService.deleteAssignment(principal.getName(), contentId);
    }

    // ------------------------------------------------------------- Tasks

    @PostMapping("/subject-hub/{assignmentId}/tasks")
    public TaskDto createTask(Principal principal, @PathVariable Long assignmentId,
                              @Valid @RequestBody TaskRequest request) {
        return teacherService.createTask(principal.getName(), assignmentId, request);
    }

    @PutMapping("/tasks/{contentId}")
    public TaskDto updateTask(Principal principal, @PathVariable Long contentId,
                              @Valid @RequestBody TaskRequest request) {
        return teacherService.updateTask(principal.getName(), contentId, request);
    }

    @DeleteMapping("/tasks/{contentId}")
    public void deleteTask(Principal principal, @PathVariable Long contentId) {
        teacherService.deleteTask(principal.getName(), contentId);
    }

    // ------------------------------------------------------------- Tests

    @PostMapping("/subject-hub/{assignmentId}/tests")
    public TestDto createTest(Principal principal, @PathVariable Long assignmentId,
                              @Valid @RequestBody TestRequest request) {
        return teacherService.createTest(principal.getName(), assignmentId, request);
    }

    @PutMapping("/tests/{contentId}")
    public TestDto updateTest(Principal principal, @PathVariable Long contentId,
                              @Valid @RequestBody TestRequest request) {
        return teacherService.updateTest(principal.getName(), contentId, request);
    }

    @DeleteMapping("/tests/{contentId}")
    public void deleteTest(Principal principal, @PathVariable Long contentId) {
        teacherService.deleteTest(principal.getName(), contentId);
    }

    // ------------------------------------------------------------- Resources

    @PostMapping("/subject-hub/{assignmentId}/resources")
    public ResourceDto createResource(Principal principal, @PathVariable Long assignmentId,
                                      @Valid @RequestBody ResourceRequest request) {
        return teacherService.createResource(principal.getName(), assignmentId, request);
    }

    @PutMapping("/resources/{contentId}")
    public ResourceDto updateResource(Principal principal, @PathVariable Long contentId,
                                      @Valid @RequestBody ResourceRequest request) {
        return teacherService.updateResource(principal.getName(), contentId, request);
    }

    @DeleteMapping("/resources/{contentId}")
    public void deleteResource(Principal principal, @PathVariable Long contentId) {
        teacherService.deleteResource(principal.getName(), contentId);
    }

    // ------------------------------------------------------------- Attendance

    @PostMapping("/attendance/start")
    public AttendanceSessionDto startAttendance(Principal principal,
                                                @Valid @RequestBody StartAttendanceRequest request) {
        return teacherService.startAttendance(principal.getName(), request);
    }

    @PostMapping("/attendance/{sessionId}/refresh")
    public AttendanceSessionDto refreshQr(Principal principal, @PathVariable Long sessionId) {
        return teacherService.refreshQr(principal.getName(), sessionId);
    }

    @PostMapping("/attendance/{sessionId}/close")
    public AttendanceSessionDto closeAttendance(Principal principal, @PathVariable Long sessionId) {
        return teacherService.closeAttendance(principal.getName(), sessionId);
    }

    @PostMapping("/attendance/absent")
    public AttendanceSessionDto markAbsent(Principal principal, @Valid @RequestBody MarkAbsentRequest request) {
        return teacherService.markAbsent(principal.getName(), request);
    }

    @GetMapping("/attendance/session/{sessionId}")
    public AttendanceSessionDto session(Principal principal, @PathVariable Long sessionId) {
        return teacherService.session(principal.getName(), sessionId);
    }
}
