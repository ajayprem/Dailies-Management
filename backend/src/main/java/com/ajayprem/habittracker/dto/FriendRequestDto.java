package com.ajayprem.habittracker.dto;

import lombok.Data;

@Data
public class FriendRequestDto {
    private String id;
    private String fromUserId;
    private String toUserId;
    private String status;
    private String createdAt;
}

@Data
class FriendSearchResult {
    private String id;
    private String email;
    private String name;
}
