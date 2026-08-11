package com.smartacademic.common;

public record ApiError(int status, String error, String message) {

    public static ApiError of(int status, String error, String message) {
        return new ApiError(status, error, message);
    }
}
