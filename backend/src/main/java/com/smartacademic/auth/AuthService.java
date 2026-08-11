package com.smartacademic.auth;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.smartacademic.auth.AuthResponse.UserInfo;
import com.smartacademic.master.Staff;
import com.smartacademic.master.StaffRole;
import com.smartacademic.master.StaffRoleRepository;
import com.smartacademic.master.StaffRoleType;
import com.smartacademic.master.Student;
import com.smartacademic.security.JwtService;
import com.smartacademic.user.Role;
import com.smartacademic.user.User;

@Service
public class AuthService {

    private final com.smartacademic.user.UserService userService;
    private final StaffRoleRepository staffRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(com.smartacademic.user.UserService userService,
                       StaffRoleRepository staffRoleRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userService = userService;
        this.staffRoleRepository = staffRoleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse login(LoginRequest request) {
        User user = userService.findByUsername(request.username().trim());
        if (!user.isActive()) {
            throw new IllegalArgumentException("Account is deactivated");
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid username or password");
        }
        return buildResponse(user, true);
    }

    public AuthResponse me(String username) {
        User user = userService.findByUsername(username);
        return buildResponse(user, false);
    }

    private AuthResponse buildResponse(User user, boolean withToken) {
        String displayName = user.getUsername();
        Long profileId = null;
        boolean coordinator = false;

        if (user.getRole() == Role.STAFF && user.getStaff() != null) {
            Staff staff = user.getStaff();
            displayName = staff.getName();
            profileId = staff.getId();
            List<StaffRole> roles = staffRoleRepository.findByStaffId(staff.getId());
            coordinator = roles.stream().anyMatch(r -> r.getRole() == StaffRoleType.ATTENDANCE_COORDINATOR);
        } else if (user.getRole() == Role.STUDENT && user.getStudent() != null) {
            Student student = user.getStudent();
            displayName = student.getName();
            profileId = student.getId();
        } else if (user.getRole() == Role.ADMIN) {
            displayName = "Administrator";
        }

        UserInfo info = new UserInfo(user.getId(), user.getUsername(), user.getRole(), displayName, profileId,
                coordinator);
        String token = withToken ? jwtService.generateToken(user.getUsername(), user.getRole().name(), profileId) : null;
        return new AuthResponse(token, info);
    }
}
