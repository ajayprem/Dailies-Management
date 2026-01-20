package com.ajayprem.habittracker.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.ajayprem.habittracker.model.Task;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUserId(Long userId);
    
    @Query("SELECT DISTINCT t FROM Task t LEFT JOIN FETCH t.completedDates")
    List<Task> findAllWithCompletedDates();
    
    @Query("SELECT DISTINCT t FROM Task t LEFT JOIN FETCH t.penaltyRecipients")
    List<Task> findAllWithPenaltyRecipients();
}
