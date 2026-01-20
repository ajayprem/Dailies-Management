package com.ajayprem.habittracker.util;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.time.temporal.TemporalAdjusters;

public class DateUtils {
    public static LocalDate parseToLocalDate(String s) {
        if (s == null)
            return null;
        try {
            return LocalDate.parse(s);
        } catch (DateTimeParseException ex) {
            try {
                Instant inst = Instant.parse(s);
                return inst.atZone(ZoneId.systemDefault()).toLocalDate();
            } catch (Exception e) {
                return null;
            }
        }
    }

    public static LocalDate periodKeyFor(LocalDate date, String period) {
        if (date == null)
            return null;
        String p = period == null ? "daily" : period.toLowerCase();
        switch (p) {
            case "weekly" -> {
                LocalDate weekStart = date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                return weekStart;
            }
            case "monthly" -> {
                LocalDate monthStart = date.withDayOfMonth(1);
                return monthStart;
            }
            default -> {
                return date;
            }
        }

    }

}
