package com.ajayprem.habittracker.dto;

import lombok.Data;

@Data
public class PenaltyDto {
    private String id;
    private String type;
    private String taskId;
    private String fromUserId;
    private String toUserId;
    private String fromUser;
    private String toUser;
    private double amount;
    private String reason;
    private String createdAt;
}
