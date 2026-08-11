package com.smartacademic.student.dto;

import jakarta.validation.constraints.NotBlank;

public final class StudentRequests {

    private StudentRequests() {
    }

    public record ScanRequest(@NotBlank String qrToken) {
    }
}
