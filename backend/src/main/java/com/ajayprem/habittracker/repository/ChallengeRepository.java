package com.ajayprem.habittracker.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ajayprem.habittracker.model.Challenge;

@Repository
public interface ChallengeRepository extends JpaRepository<Challenge, Long> {

}
