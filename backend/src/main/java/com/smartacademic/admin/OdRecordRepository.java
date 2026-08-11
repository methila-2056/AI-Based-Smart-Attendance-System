package com.smartacademic.admin;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OdRecordRepository extends JpaRepository<OdRecord, Long> {

    List<OdRecord> findAllByOrderByDateDescIdDesc();

    List<OdRecord> findBySectionIdAndDate(Long sectionId, LocalDate date);

    List<OdRecord> findByStatusNotOrderByDateDescIdDesc(OdStatus status);
}
