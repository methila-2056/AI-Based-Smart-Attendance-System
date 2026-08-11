package com.smartacademic.master;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StaffRoleRepository extends JpaRepository<StaffRole, Long> {
    List<StaffRole> findByStaffId(Long staffId);

    void deleteByStaffId(Long staffId);
}
