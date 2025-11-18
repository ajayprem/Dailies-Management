package com.ajayprem.habittracker.dto;

import lombok.Data;
import java.util.List;

@Data
public class TaskDto {
    private String id;
    private String userId;
    private String title;
    private String description;
    private String period;
    private double penaltyAmount;
    private String penaltyRecipientId;
    private String status;
    private List<String> completedDates;
    private String createdAt;
    private String nextDueDate;
}
