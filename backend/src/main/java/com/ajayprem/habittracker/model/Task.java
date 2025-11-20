package com.ajayprem.habittracker.model;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "task")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String title;
    private String description;
    private String period;
    private double penaltyAmount;

    @ManyToOne
    @JoinColumn(name = "penalty_recipient_id")
    private User penaltyRecipient;

    private String status;

    @ElementCollection
    @CollectionTable(name = "task_completed_dates", joinColumns = @JoinColumn(name = "task_id"))
    @Column(name = "completed_date")
    private List<String> completedDates = new ArrayList<>();

    private String createdAt;
    private String nextDueDate;

    private String startDate;
    private String endDate;
}
