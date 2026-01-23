package com.ajayprem.habittracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserOwedDto {
    private Long id;
    private String name;
    private String email;
    private Double amount;

    public void addAmount(double amount) {
        this.amount += amount;
    }
}
