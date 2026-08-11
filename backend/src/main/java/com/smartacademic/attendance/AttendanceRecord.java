package com.smartacademic.attendance;

import java.time.Instant;

import com.smartacademic.master.Student;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "attendance_records", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"session_id", "student_id"})
})
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private AttendanceSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttendanceStatus status = AttendanceStatus.PRESENT;

    @Column(nullable = false)
    private Instant markedAt = Instant.now();

    @Column(name = "face_verified", nullable = false)
    private Boolean faceVerified = true;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AttendanceSession getSession() {
        return session;
    }

    public void setSession(AttendanceSession session) {
        this.session = session;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public AttendanceStatus getStatus() {
        return status;
    }

    public void setStatus(AttendanceStatus status) {
        this.status = status;
    }

    public Instant getMarkedAt() {
        return markedAt;
    }

    public void setMarkedAt(Instant markedAt) {
        this.markedAt = markedAt;
    }

    public Boolean getFaceVerified() {
        return faceVerified;
    }

    public void setFaceVerified(Boolean faceVerified) {
        this.faceVerified = faceVerified;
    }
}
