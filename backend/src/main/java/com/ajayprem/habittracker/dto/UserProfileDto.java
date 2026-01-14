package com.ajayprem.habittracker.dto;

import java.util.List;

import lombok.Data;

@Data
public class UserProfileDto {
    private Long id;
    private String email;
    private String name;
    private List<String> friends;
    private String createdAt;
}
