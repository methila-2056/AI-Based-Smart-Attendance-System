package com.smartacademic.common;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Provides the "college clock": today's academic date and the current
 * period. Supports demo overrides so the hackathon demo can run at any
 * real-world time.
 */
@Service
public class ClockService {

    public static final List<int[]> PERIODS = List.of(
            new int[] {1, 9 * 60 + 15, 10 * 60 + 10},
            new int[] {2, 10 * 60 + 10, 11 * 60 + 5},
            new int[] {3, 11 * 60 + 20, 12 * 60 + 10},
            new int[] {4, 12 * 60 + 10, 13 * 60},
            new int[] {5, 13 * 60 + 45, 14 * 60 + 35},
            new int[] {6, 14 * 60 + 35, 15 * 60 + 25},
            new int[] {7, 15 * 60 + 25, 16 * 60 + 15});

    private final String simulatedDate;
    private final int simulatedPeriod;

    public ClockService(@Value("${app.demo.simulated-date:}") String simulatedDate,
                        @Value("${app.demo.simulated-period:-1}") int simulatedPeriod) {
        this.simulatedDate = simulatedDate;
        this.simulatedPeriod = simulatedPeriod;
    }

    public LocalDate today() {
        if (simulatedDate != null && !simulatedDate.isBlank()) {
            return LocalDate.parse(simulatedDate);
        }
        return LocalDate.now();
    }

    public int currentPeriod() {
        if (simulatedPeriod >= 1 && simulatedPeriod <= 7) {
            return simulatedPeriod;
        }
        int minutes = LocalTime.now().getHour() * 60 + LocalTime.now().getMinute();
        for (int[] p : PERIODS) {
            if (minutes >= p[1] && minutes < p[2]) {
                return p[0];
            }
        }
        return -1;
    }

    public boolean isWithinPeriod(int period, LocalTime time) {
        int minutes = time.getHour() * 60 + time.getMinute();
        for (int[] p : PERIODS) {
            if (p[0] == period) {
                return minutes >= p[1] && minutes < p[2];
            }
        }
        return false;
    }

    public String formatTime(int minutes) {
        return String.format("%02d:%02d", minutes / 60, minutes % 60);
    }

    public List<int[]> periods() {
        return PERIODS;
    }
}
