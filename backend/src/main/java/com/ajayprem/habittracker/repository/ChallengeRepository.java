package com.ajayprem.habittracker.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.ajayprem.habittracker.model.Challenge;

@Repository
public interface ChallengeRepository extends JpaRepository<Challenge, Long> {

    // @Query("SELECT DISTINCT t FROM Task t LEFT JOIN FETCH t.completedDates")
    // List<Challenge> findAllWithCompletedDates();

}
