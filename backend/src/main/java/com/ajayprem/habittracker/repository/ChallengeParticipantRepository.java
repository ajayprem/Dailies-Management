package com.ajayprem.habittracker.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ajayprem.habittracker.model.ChallengeParticipant;

@Repository
public interface ChallengeParticipantRepository extends JpaRepository<ChallengeParticipant, Long> {

}
