package com.ajayprem.habittracker.dto;

import java.util.List;

import lombok.Data;

@Data
public class ChallengeDto {
    private String id;
    private String creatorId;
    private String title;
    private String description;
    private String period;
    private double penaltyAmount;
    private List<Participant> participants;
    private List<String> invitedUsers;
    private String status;
    private String createdAt;
    private String nextDueDate;
    private String startDate;
    private String endDate;

    @Data
    public static class Participant {
        private String userId;
        private String status;
        private List<String> completedDates;
    }
}
