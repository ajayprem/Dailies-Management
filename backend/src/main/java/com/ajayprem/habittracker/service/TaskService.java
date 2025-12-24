package com.ajayprem.habittracker.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.time.DayOfWeek;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.HashSet;
import java.util.Set;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ajayprem.habittracker.dto.TaskDto;
import com.ajayprem.habittracker.dto.UserDto;
import com.ajayprem.habittracker.model.Penalty;
import com.ajayprem.habittracker.model.Task;
import com.ajayprem.habittracker.model.User;
import com.ajayprem.habittracker.repository.PenaltyRepository;
import com.ajayprem.habittracker.repository.TaskRepository;
import com.ajayprem.habittracker.repository.UserRepository;

@Service
public class TaskService {

    private static final Logger log = LoggerFactory.getLogger(TaskService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private PenaltyRepository penaltyRepository;

    public boolean completeTaskForDate(Long uid, String taskIdStr, String dateStr) {
        log.info("completeTaskForDate: uid={} taskId={} date={}", uid, taskIdStr, dateStr);
        Long tid = Long.valueOf(taskIdStr);
        Optional<Task> ot = taskRepository.findById(tid);
        if (ot.isEmpty()) {
            log.warn("completeTaskForDate: task not found {}", tid);
            return false;
        }
        Task t = ot.get();
        if (!Objects.equals(t.getUser().getId(), uid)) {
            return false;
        }

        // Validate date format
        LocalDate date;
        try {
            date = LocalDate.parse(dateStr);
        } catch (Exception e) {
            log.warn("completeTaskForDate: invalid date {}", dateStr);
            return false;
        }
        LocalDate today = LocalDate.now();
        if (date.isAfter(today)) {
            log.warn("completeTaskForDate: date {} is after today {}", date, today);
            return false;
        }

        // Validate start/end date
        if (t.getStartDate() != null && !t.getStartDate().isEmpty()) {
            LocalDate start = LocalDate.parse(t.getStartDate());
            if (date.isBefore(start)) {
                return false;
            }
        }
        if (t.getEndDate() != null && !t.getEndDate().isEmpty()) {
            LocalDate end = LocalDate.parse(t.getEndDate());
            if (date.isAfter(end)) {
                return false;
            }
        }

        // compute canonical key for the task's period (daily/weekly/monthly)
        String key = periodKeyFor(date, t.getPeriod());
        // Add canonical key if not present
        if (!t.getCompletedDates().contains(key)) {
            t.getCompletedDates().add(key);
            taskRepository.save(t);
            log.info("completeTaskForDate: added completion key {} for task {} (period={})", key, tid,
                    t.getPeriod());
            // remove any penalties for this task+period (if scheduled job created them)
            try {
                List<Penalty> existing = penaltyRepository.findByTaskIdAndPeriodKey(t.getId(), key);
                for (Penalty p : existing) {
                    penaltyRepository.delete(p);
                    log.info("completeTaskForDate: removed penalty id={} for task {} periodKey={}", p.getId(), tid,
                            key);
                }
            } catch (Exception e) {
                log.warn("completeTaskForDate: failed to remove penalties for task {} period {}: {}", tid, key,
                        e.getMessage());
            }
        }
        return true;
    }

    public boolean uncompleteTaskForDate(Long uid, String taskIdStr, String dateStr) {
        log.info("uncompleteTaskForDate: uid={} taskId={} date={}", uid, taskIdStr, dateStr);
        Long tid = Long.parseLong(taskIdStr);
        Optional<Task> ot = taskRepository.findById(tid);
        if (ot.isEmpty()) {
            log.warn("uncompleteTaskForDate: task not found {}", tid);
            return false;
        }
        Task t = ot.get();
        if (!Objects.equals(t.getUser().getId(), uid)) {
            return false;
        }
        // remove canonical key depending on period
        String key = null;
        try {
            LocalDate date = LocalDate.parse(dateStr);
            key = periodKeyFor(date, t.getPeriod());
        } catch (Exception e) {
            // parsing failed - nothing to remove
        }

        if (key != null && t.getCompletedDates().contains(key)) {
            t.getCompletedDates().remove(key);
            taskRepository.save(t);
            log.info("uncompleteTaskForDate: removed key {} for task {} (period={})", key, tid, t.getPeriod());
            return true;
        }

        return false;
    }

    private String periodKeyFor(LocalDate date, String period) {
        if (date == null)
            return null;
        String p = period == null ? "daily" : period.toLowerCase();
        switch (p) {
            case "weekly": {
                LocalDate weekStart = date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                return weekStart.toString();
            }
            case "monthly": {
                LocalDate monthStart = date.withDayOfMonth(1);
                return monthStart.toString();
            }
            default:
                return date.toString();
        }

    }

    public Map<String, Object> getTaskStats(Long uid, String taskIdStr) {
        log.info("getTaskStats: uid={} taskId={}", uid, taskIdStr);
        Long tid = Long.parseLong(taskIdStr);
        Optional<Task> ot = taskRepository.findById(tid);
        if (ot.isEmpty()) {
            log.warn("getTaskStats: task not found {}", tid);
            return Map.of();
        }
        Task t = ot.get();
        if (!Objects.equals(t.getUser().getId(), uid)) {
            log.warn("getTaskStats: user {} not owner of task {}", uid, tid);
            return Map.of();
        }
        List<String> completedDates = t.getCompletedDates();

        int totalCompletions = completedDates.size();

        int currentStreak = calcCurrentStreak(completedDates, t.getPeriod());

        int longestStreak = calcLongestStreak(completedDates, t.getPeriod());

        double completionRate = calcCompletionRate(t, completedDates);

        int totalPenalties = 0; // Optional: implement penalty count if needed
        double penaltyAmount = t.getPenaltyAmount();
        return Map.of(
                "totalCompletions", totalCompletions,
                "currentStreak", currentStreak,
                "longestStreak", longestStreak,
                "completionRate", completionRate,
                "totalPenalties", totalPenalties,
                "penaltyAmount", penaltyAmount);
    }

    private LocalDate parseToLocalDate(String s) {
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

    private int calcCurrentStreak(List<String> completedDates, String period) {
        if (completedDates == null || completedDates.isEmpty()) {
            return 0;
        }

        String p = period == null ? "daily" : period.toLowerCase();

        switch (p) {
            case "weekly" -> {
                // convert to week-start (Monday) set
                Set<LocalDate> weeks = new HashSet<>();
                for (String s : completedDates) {
                    LocalDate d = parseToLocalDate(s);
                    if (d == null)
                        continue;
                    LocalDate weekStart = d
                            .with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                    weeks.add(weekStart);
                }
                if (weeks.isEmpty())
                    return 0;
                List<LocalDate> sorted = weeks.stream().sorted(Collections.reverseOrder()).collect(Collectors.toList());
                int streak = 0;
                LocalDate todayWeekStart = LocalDate.now()
                        .with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                for (LocalDate wk : sorted) {
                    if (wk.equals(todayWeekStart.minusWeeks(streak))) {
                        streak++;
                    } else {
                        break;
                    }
                }
                return streak;
            }
            case "monthly" -> {
                // convert to month-start set
                Set<LocalDate> months = new HashSet<>();
                for (String s : completedDates) {
                    LocalDate d = parseToLocalDate(s);
                    if (d == null)
                        continue;
                    LocalDate monthStart = d.withDayOfMonth(1);
                    months.add(monthStart);
                }
                if (months.isEmpty())
                    return 0;
                List<LocalDate> sorted = months.stream().sorted(Collections.reverseOrder())
                        .collect(Collectors.toList());
                int streak = 0;
                LocalDate todayMonthStart = LocalDate.now().withDayOfMonth(1);
                for (LocalDate m : sorted) {
                    if (m.equals(todayMonthStart.minusMonths(streak))) {
                        streak++;
                    } else {
                        break;
                    }
                }
                return streak;
            }
            default -> {
                // default: daily
                List<LocalDate> dates = completedDates.stream().map(this::parseToLocalDate).filter(Objects::nonNull)
                        .sorted(Collections.reverseOrder()).collect(Collectors.toList());
                int streak = 0;
                LocalDate today = LocalDate.now();
                for (LocalDate d : dates) {
                    if (d.equals(today.minusDays(streak))) {
                        streak++;
                    } else {
                        break;
                    }
                }
                return streak;
            }
        }
    }

    private int calcLongestStreak(List<String> completedDates, String period) {
        if (completedDates == null || completedDates.isEmpty()) {
            return 0;
        }

        String p = period == null ? "daily" : period.toLowerCase();

        switch (p) {
            case "weekly" -> {
                // map to unique week-starts
                Set<LocalDate> weeks = new HashSet<>();
                for (String s : completedDates) {
                    LocalDate d = parseToLocalDate(s);
                    if (d == null)
                        continue;
                    LocalDate weekStart = d
                            .with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                    weeks.add(weekStart);
                }
                if (weeks.isEmpty())
                    return 0;
                List<LocalDate> sorted = weeks.stream().sorted().collect(Collectors.toList());
                int longest = 0, current = 1;
                for (int i = 1; i < sorted.size(); i++) {
                    if (sorted.get(i).equals(sorted.get(i - 1).plusWeeks(1))) {
                        current++;
                    } else {
                        longest = Math.max(longest, current);
                        current = 1;
                    }
                }
                longest = Math.max(longest, current);
                return longest;
            }
            case "monthly" -> {
                // map to unique month-starts
                Set<LocalDate> months = new HashSet<>();
                for (String s : completedDates) {
                    LocalDate d = parseToLocalDate(s);
                    if (d == null)
                        continue;
                    LocalDate monthStart = d.withDayOfMonth(1);
                    months.add(monthStart);
                }
                if (months.isEmpty())
                    return 0;
                List<LocalDate> sorted = months.stream().sorted().collect(Collectors.toList());
                int longest = 0, current = 1;
                for (int i = 1; i < sorted.size(); i++) {
                    if (sorted.get(i).equals(sorted.get(i - 1).plusMonths(1))) {
                        current++;
                    } else {
                        longest = Math.max(longest, current);
                        current = 1;
                    }
                }
                longest = Math.max(longest, current);
                return longest;
            }
            default -> {
                // daily
                List<LocalDate> dates = completedDates.stream().map(this::parseToLocalDate).filter(Objects::nonNull)
                        .sorted().collect(Collectors.toList());
                if (dates.isEmpty())
                    return 0;
                int longest = 0, current = 1;
                for (int i = 1; i < dates.size(); i++) {
                    if (dates.get(i).equals(dates.get(i - 1).plusDays(1))) {
                        current++;
                    } else {
                        longest = Math.max(longest, current);
                        current = 1;
                    }
                }
                longest = Math.max(longest, current);
                return longest;
            }
        }
    }

    private double calcCompletionRate(Task t, List<String> completedDates) {
        if (completedDates == null || completedDates.isEmpty()) {
            return 0.0;
        }
        LocalDate created;
        String createdAt = t.getCreatedAt();
        try {
            created = LocalDate.parse(createdAt);
        } catch (DateTimeParseException ex) {
            try {
                Instant inst = Instant.parse(createdAt);
                created = inst.atZone(ZoneId.systemDefault()).toLocalDate();
            } catch (Exception e) {
                created = LocalDate.now();
            }
        }
        LocalDate today = LocalDate.now();
        long days = java.time.temporal.ChronoUnit.DAYS.between(created, today) + 1;
        int expectedCompletions = 1;
        if ("daily".equalsIgnoreCase(t.getPeriod())) {
            expectedCompletions = (int) days;
        } else if ("weekly".equalsIgnoreCase(t.getPeriod())) {
            expectedCompletions = (int) Math.ceil(days / 7.0);
        } else if ("monthly".equalsIgnoreCase(t.getPeriod())) {
            expectedCompletions = (int) Math.ceil(days / 30.0);
        }
        return expectedCompletions > 0 ? (completedDates.size() * 100.0 / expectedCompletions) : 0.0;
    }

    public TaskDto createTask(Long uid, TaskDto input) {
        log.info("createTask: uid={} title={}", uid, input == null ? null : input.getTitle());
        Optional<User> ou = userRepository.findById(uid);
        if (ou.isEmpty()) {
            log.warn("createTask: user not found {}", uid);
            return null;
        }
        Task t = new Task();
        t.setUser(ou.get());
        t.setTitle(input.getTitle());
        t.setDescription(input.getDescription());
        t.setPeriod(input.getPeriod());
        // Penalty fields are optional (personal tasks). Validate pair-wise presence.
        double penaltyAmount = input.getPenaltyAmount();
        List<String> recipients = input.getPenaltyRecipientIds();
        if (recipients != null && !recipients.isEmpty() && penaltyAmount <= 0) {
            log.warn("createTask: penaltyRecipientIds provided but penaltyAmount is missing/zero");
            return null;
        }
        if (penaltyAmount > 0) {
            t.setPenaltyAmount(penaltyAmount);
        } else {
            t.setPenaltyAmount(0.0);
        }
        if (recipients != null && !recipients.isEmpty()) {
            for (String recipientId : recipients) {
                Long pid = Long.parseLong(recipientId);
                userRepository.findById(pid).ifPresent(recipient -> t.getPenaltyRecipients().add(recipient));
            }
        }
        t.setStatus(input.getStatus() == null ? "active" : input.getStatus());
        t.setCreatedAt(input.getCreatedAt() == null ? Instant.now().toString() : input.getCreatedAt());
        if (input.getCompletedDates() != null) {
            t.setCompletedDates(input.getCompletedDates());
        }
        t.setStartDate(input.getStartDate());
        t.setEndDate(input.getEndDate());
        taskRepository.save(t);
        log.info("createTask: created task id={} for user {}", t.getId(), uid);
        input.setId(String.valueOf(t.getId()));
        input.setUserId(String.valueOf(uid));
        return input;
    }

    public Map<String, Object> applyTaskPenalty(Long uid, String taskIdStr) {
        log.info("applyTaskPenalty: uid={} taskId={}", uid, taskIdStr);
        Long tid = Long.parseLong(taskIdStr);
        Optional<Task> ot = taskRepository.findById(tid);
        if (ot.isEmpty()) {
            log.warn("applyTaskPenalty: task not found {}", tid);
            return null;
        }
        Task t = ot.get();
        List<Long> penaltyIds = new ArrayList<>();
        // No penalty configured (personal task)
        if (t.getPenaltyRecipients() == null || t.getPenaltyRecipients().isEmpty() || t.getPenaltyAmount() <= 0) {
            log.info("applyTaskPenalty: no penalty recipients or amount for task {}", tid);
            return Map.of("success", false, "reason", "no_penalty_configured");
        }

        // Split penalty amount among recipients
        int numRecipients = t.getPenaltyRecipients().size();
        double splitAmount = t.getPenaltyAmount() / (double) numRecipients;

        for (User recipient : t.getPenaltyRecipients()) {
            Penalty p = new Penalty();
            p.setType("task");
            p.setTask(t);
            userRepository.findById(uid).ifPresent(p::setFromUser);
            p.setToUser(recipient);
            p.setAmount(splitAmount);
            p.setReason("Incomplete task: " + t.getTitle());
            p.setCreatedAt(Instant.now().toString());
            penaltyRepository.save(p);
            penaltyIds.add(p.getId());
            log.info("applyTaskPenalty: created penalty id={} toUser={} amount={}", p.getId(), p.getToUser().getId(),
                    p.getAmount());
        }

        return Map.of("success", !penaltyIds.isEmpty(), "penaltyIds", penaltyIds);
    }

    // --- Tasks ---
    public List<TaskDto> getTasks(Long uid) {
        List<Task> list = taskRepository.findByUserId(uid);
        List<TaskDto> out = new ArrayList<>();
        for (Task t : list) {
            TaskDto dto = new TaskDto();
            dto.setId(String.valueOf(t.getId()));
            dto.setUserId(String.valueOf(t.getUser().getId()));
            dto.setTitle(t.getTitle());
            dto.setDescription(t.getDescription());
            dto.setPeriod(t.getPeriod());
            dto.setPenaltyAmount(t.getPenaltyAmount());

            // Convert penaltyRecipients list to IDs and DTOs
            List<String> recipientIds = new ArrayList<>();
            List<UserDto> recipientDtos = new ArrayList<>();
            for (User recipient : t.getPenaltyRecipients()) {
                recipientIds.add(String.valueOf(recipient.getId()));
                UserDto userDto = new UserDto();
                userDto.setId(String.valueOf(recipient.getId()));
                userDto.setName(recipient.getName());
                recipientDtos.add(userDto);
            }
            dto.setPenaltyRecipientIds(recipientIds);
            dto.setRecipientFriends(recipientDtos);

            dto.setStatus(t.getStatus());
            dto.setCompletedDates(t.getCompletedDates());
            dto.setCreatedAt(t.getCreatedAt());
            dto.setStartDate(t.getStartDate());
            dto.setEndDate(t.getEndDate());
            out.add(dto);
        }
        return out;
    }

    // public Map<String, Object> applyTaskPenalty(Long uid, String challengeIdStr,
    // String failedUserIdStr) {
    // log.info("applyChallengePenalty: uid={} challengeId={} failedUserId={}", uid,
    // challengeIdStr, failedUserIdStr);
    // Long cid = Long.parseLong(challengeIdStr);
    // Optional<Challenge> oc = challengeRepository.findById(cid);
    // if (oc.isEmpty()) {
    // log.warn("applyChallengePenalty: challenge not found: {}", cid);
    // return null;
    // }
    // Challenge c = oc.get();
    // Penalty p = new Penalty();
    // p.setType("challenge");
    // userRepository.findById(Long.parseLong(failedUserIdStr)).ifPresent(p::setFromUser);
    // p.setToUser(c.getCreator());
    // p.setAmount(c.getPenaltyAmount());
    // p.setReason("Failed challenge: " + c.getTitle());
    // p.setCreatedAt(Instant.now().toString());
    // penaltyRepository.save(p);
    // log.info("applyChallengePenalty: penalty created id={} amount={}", p.getId(),
    // p.getAmount());
    // return Map.of("success", true, "penaltyId", String.valueOf(p.getId()));
    // }

}
