package com.smartacademic.auth;

import com.smartacademic.user.Role;

public record AuthResponse(String token, UserInfo user) {

    public record UserInfo(Long id, String username, Role role, String displayName, Long profileId,
                           boolean coordinator) {
    }
}
