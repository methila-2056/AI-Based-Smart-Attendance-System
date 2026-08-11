package com.smartacademic.attendance;

import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.stereotype.Service;

/**
 * Issues short-lived numeric 8-digit QR/attendance tokens and validates them by looking up
 * active sessions in the database.
 */
@Service
public class QrTokenService {

    private final AttendanceSessionRepository sessionRepository;

    public QrTokenService(AttendanceSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    public String generate(Long sessionId) {
        // Generate a random 8-digit number
        int number = ThreadLocalRandom.current().nextInt(10000000, 100000000);
        return String.valueOf(number);
    }

    /**
     * Validates the token and returns the attendance session id.
     *
     * @throws IllegalArgumentException if the token is invalid or expired.
     */
    public Long validate(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Attendance token is missing. Ask the teacher to start the class.");
        }
        String trimmedToken = token.trim();
        if (!trimmedToken.matches("\\d{8}")) {
            throw new IllegalArgumentException("Invalid attendance token format. It must be exactly 8 digits.");
        }
        Optional<AttendanceSession> sessionOpt = sessionRepository.findByCurrentToken(trimmedToken);
        if (sessionOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid attendance token. Ask the teacher to show a fresh QR.");
        }
        AttendanceSession session = sessionOpt.get();
        if (session.getStatus() != AttendanceSessionStatus.ACTIVE) {
            throw new IllegalArgumentException("Attendance session is no longer active. Ask the teacher to refresh the QR.");
        }
        return session.getId();
    }
}
