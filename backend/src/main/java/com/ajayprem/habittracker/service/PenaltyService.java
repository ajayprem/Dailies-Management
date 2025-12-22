package com.ajayprem.habittracker.service;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.ajayprem.habittracker.dto.PenaltyDto;
import com.ajayprem.habittracker.model.Penalty;
import com.ajayprem.habittracker.model.Task;
import com.ajayprem.habittracker.model.User;
import com.ajayprem.habittracker.repository.PenaltyRepository;
import com.ajayprem.habittracker.repository.TaskRepository;

@Service
public class PenaltyService {

    private static final Logger log = LoggerFactory.getLogger(PenaltyService.class);

    @Autowired
    private PenaltyRepository penaltyRepository;

    @Autowired
    private TaskRepository taskRepository;

    public List<Penalty> getPenaltiesEntities(Long userId) {
        log.info("getPenaltiesEntities: userId={}", userId);
        return penaltyRepository.findByFromUserIdOrToUserId(userId, userId);
    }

    public List<PenaltyDto> getPenalties(Long uid) {
        log.info("getPenalties: uid={}", uid);
        List<Penalty> list = getPenaltiesEntities(uid);
        List<PenaltyDto> out = new ArrayList<>();
        for (Penalty p : list) {
            PenaltyDto dto = new PenaltyDto();
            dto.setId(String.valueOf(p.getId()));
            dto.setType(p.getType());
            dto.setTaskId(p.getTask() != null ? String.valueOf(p.getTask().getId()) : null);
            dto.setFromUserId(p.getFromUser() != null ? String.valueOf(p.getFromUser().getId()) : null);
            dto.setToUserId(p.getToUser() != null ? String.valueOf(p.getToUser().getId()) : null);
            dto.setAmount(p.getAmount());
            dto.setReason(p.getReason());
            dto.setCreatedAt(p.getCreatedAt());
            out.add(dto);
        }
        return out;
    }

    /**
     * Scheduled job that applies penalties for missed task periods.
     * - daily: apply for yesterday
     * - weekly: apply when yesterday was Sunday (so previous week just finished)
     * - monthly: apply when today is 1st of month (so previous month just finished)
     */
    @Scheduled(cron = "0 5 0 * * *") // run daily at 00:05
    public void applyMissedTaskPenalties() {
        log.info("applyMissedTaskPenalties: start");
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        List<Task> all = taskRepository.findAll();
        for (Task t : all) {
            try {
                if (t.getPenaltyAmount() <= 0 || "inactive".equalsIgnoreCase(t.getStatus()))
                    continue;

                String period = t.getPeriod() == null ? "daily" : t.getPeriod().toLowerCase();

                if ("daily".equals(period)) {
                    LocalDate periodDate = yesterday; // check yesterday
                    String key = periodDate.toString();
                    if (t.getCompletedDates().contains(key))
                        continue;
                    applyPenaltiesForTaskPeriod(t, key);
                } else if ("weekly".equals(period)) {
                    // run only when yesterday was Sunday (week ended)
                    if (yesterday.getDayOfWeek() != DayOfWeek.SUNDAY)
                        continue;
                    LocalDate weekStart = yesterday.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                    String key = weekStart.toString();
                    if (t.getCompletedDates().contains(key))
                        continue;
                    applyPenaltiesForTaskPeriod(t, key);
                } else if ("monthly".equals(period)) {
                    // run only when today is 1st of month
                    if (today.getDayOfMonth() != 1)
                        continue;
                    LocalDate monthStart = today.minusMonths(1).withDayOfMonth(1);
                    String key = monthStart.toString();
                    if (t.getCompletedDates().contains(key))
                        continue;
                    applyPenaltiesForTaskPeriod(t, key);
                }
            } catch (Exception e) {
                log.warn("applyMissedTaskPenalties: failed for task id={} reason={}", t.getId(), e.getMessage());
            }
        }

        log.info("applyMissedTaskPenalties: end");
    }

    private void applyPenaltiesForTaskPeriod(Task t, String periodKey) {
        if (t.getPenaltyRecipients() == null || t.getPenaltyRecipients().isEmpty())
            return;
        int numRecipients = t.getPenaltyRecipients().size();
        double splitAmount = t.getPenaltyAmount() / (double) numRecipients;
        for (User recipient : t.getPenaltyRecipients()) {
            try {
                // avoid duplicates per recipient
                if (penaltyRepository.existsByTaskIdAndPeriodKeyAndToUserId(t.getId(), periodKey,
                        recipient.getId())) {
                    continue;
                }
                Penalty p = new Penalty();
                p.setType("task");
                p.setTask(t);
                p.setFromUser(t.getUser());
                p.setToUser(recipient);
                p.setAmount(splitAmount);
                p.setReason("Missed task: " + t.getTitle());
                p.setCreatedAt(Instant.now().toString());
                p.setPeriodKey(periodKey);
                penaltyRepository.save(p);
                log.info("applyMissedTaskPenalties: created penalty id={} taskId={} toUser={} amount={} periodKey={}",
                        p.getId(), t.getId(), recipient.getId(), p.getAmount(), periodKey);
            } catch (Exception e) {
                log.warn("applyMissedTaskPenalties: failed to create penalty for task {} recipient {}: {}",
                        t.getId(), recipient == null ? null : recipient.getId(), e.getMessage());
            }
        }
    }
}