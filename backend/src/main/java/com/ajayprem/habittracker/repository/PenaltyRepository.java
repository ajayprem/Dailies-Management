package com.ajayprem.habittracker.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ajayprem.habittracker.model.Penalty;

@Repository
public interface PenaltyRepository extends JpaRepository<Penalty, Long> {
    List<Penalty> findByFromUserIdOrToUserId(Long fromUserId, Long toUserId);

    boolean existsByTaskIdAndPeriodKey(Long taskId, String periodKey);

    boolean existsByTaskIdAndPeriodKeyAndToUserId(Long taskId, String periodKey, Long toUserId);

    List<Penalty> findByTaskIdAndPeriodKey(Long taskId, String periodKey);

    List<Penalty> findByTaskId(Long taskId);
}
