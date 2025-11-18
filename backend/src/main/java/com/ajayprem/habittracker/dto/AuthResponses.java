package com.ajayprem.habittracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponses {
    private String token;
    private String userId;
}
