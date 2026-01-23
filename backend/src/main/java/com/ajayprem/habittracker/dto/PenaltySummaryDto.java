package com.ajayprem.habittracker.dto;

import java.util.List;
import lombok.Data;

@Data
public class PenaltySummaryDto {
    private List<PenaltyDto> penalties;
    private double totalOwed;
    private double totalReceived;
    private List<UserOwedDto> owedList;
}
