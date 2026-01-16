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
    private List<Long> invitedUserIds;
    private String status;
    private String createdAt;
    private String nextDueDate;
    private String startDate;
    private String endDate;

    @Data
    public static class Participant {
        private Long userId;
        private String name;
        private String status;
        private List<String> completedDates;
        private String lastUncompletedDate;
    }
}
