package com.smartacademic.attendance.dto;

import java.time.Instant;
import java.util.List;

import com.smartacademic.attendance.AttendanceSessionStatus;
import com.smartacademic.attendance.AttendanceStatus;
import com.smartacademic.master.Day;

public final class AttendanceDtos {

    private AttendanceDtos() {
    }

    public record AttendanceSessionDto(Long id, Long timetableEntryId, Long assignmentId, String sectionLabel,
                                       String subjectLabel, String subjectCode, Day day, int period,
                                       String startTime, String endTime, AttendanceSessionStatus status,
                                       String qrToken, Instant qrExpiresAt, Instant startedAt, Instant closedAt,
                                       long markedCount, long studentCount, boolean current,
                                       List<AttendanceRecordDto> records) {
    }

    public record AttendanceRecordDto(Long id, Long studentId, String studentName, String registerNumber,
                                      AttendanceStatus status, Instant markedAt) {
    }

    public record ScanResultDto(boolean success, String message, AttendanceRecordDto record) {
    }
}
