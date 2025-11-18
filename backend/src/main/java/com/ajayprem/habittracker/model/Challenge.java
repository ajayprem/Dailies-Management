package com.ajayprem.habittracker.model;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "challenge")
public class Challenge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "creator_id")
    private User creator;

    private String title;
    private String description;
    private String period;
    private double penaltyAmount;

    @OneToMany(mappedBy = "challenge", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChallengeParticipant> participants = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "challenge_invited_users", joinColumns = @JoinColumn(name = "challenge_id"))
    @Column(name = "invited_user_id")
    private List<Long> invitedUsers = new ArrayList<>();

    private String status;
    private String createdAt;
    private String nextDueDate;
}
