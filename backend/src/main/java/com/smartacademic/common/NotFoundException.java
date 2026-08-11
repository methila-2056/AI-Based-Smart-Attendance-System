package com.smartacademic.common;

import org.springframework.http.HttpStatus;

public class NotFoundException extends RuntimeException {

    private final HttpStatus status;

    public NotFoundException(String message) {
        this(message, HttpStatus.NOT_FOUND);
    }

    public NotFoundException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
