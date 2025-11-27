package com.ajayprem.habittracker.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.Data;

@Data
@Entity
@Builder
@Table(name = "auth_token")
public class AuthToken {
    @Id
    private String token;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
