package com.ajayprem.habittracker.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ajayprem.habittracker.model.AuthToken;

@Repository
public interface AuthTokenRepository extends JpaRepository<AuthToken, String> {

}
