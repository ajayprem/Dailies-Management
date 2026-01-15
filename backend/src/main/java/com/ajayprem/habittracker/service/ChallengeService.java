package com.ajayprem.habittracker.service;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ajayprem.habittracker.dto.ChallengeDto;
import com.ajayprem.habittracker.model.Challenge;
import com.ajayprem.habittracker.model.ChallengeParticipant;
import com.ajayprem.habittracker.model.Penalty;
import com.ajayprem.habittracker.model.User;
import com.ajayprem.habittracker.repository.ChallengeParticipantRepository;
import com.ajayprem.habittracker.repository.ChallengeRepository;
import com.ajayprem.habittracker.repository.PenaltyRepository;
import com.ajayprem.habittracker.repository.UserRepository;

@Service
public class ChallengeService {

    private static final Logger log = LoggerFactory.getLogger(ChallengeService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PenaltyRepository penaltyRepository;

    @Autowired
    private ChallengeRepository challengeRepository;

    @Autowired
    private ChallengeParticipantRepository challengeParticipantRepository;

    public List<Challenge> getChallengesEntities(Long userId) {
        // helper: return challenges where creator or invited
        log.info("getChallengesEntities: userId={}", userId);
        List<Challenge> all = challengeRepository.findAll();
        List<Challenge> out = new ArrayList<>();
        for (Challenge c : all) {
            if (Objects.equals(c.getCreator().getId(), userId) || c.getInvitedUsers().contains(userId)) {
                out.add(c);
            }
        }
        return out;
    }

    public List<ChallengeDto> getChallenges(Long uid) {
        log.info("getChallenges: uid={}", uid);
        List<Challenge> list = getChallengesEntities(uid);
        List<ChallengeDto> out = new ArrayList<>();
        for (Challenge c : list) {
            ChallengeDto dto = new ChallengeDto();
            dto.setId(String.valueOf(c.getId()));
            dto.setCreatorId(String.valueOf(c.getCreator().getId()));
            dto.setTitle(c.getTitle());
            dto.setDescription(c.getDescription());
            dto.setPeriod(c.getPeriod());
            dto.setPenaltyAmount(c.getPenaltyAmount());
            List<ChallengeDto.Participant> parts = new ArrayList<>();
            for (ChallengeParticipant cp : c.getParticipants()) {
                ChallengeDto.Participant pd = new ChallengeDto.Participant();
                pd.setName(cp.getUser().getName());
                pd.setUserId(cp.getUser().getId());
                pd.setStatus(cp.getStatus());
                pd.setCompletedDates(cp.getCompletedDates());
                parts.add(pd);
            }
            dto.setParticipants(parts);
            dto.setInvitedUserIds(c.getInvitedUsers());
            dto.setStatus(c.getStatus());
            dto.setCreatedAt(c.getCreatedAt());
            dto.setNextDueDate(c.getNextDueDate());
            out.add(dto);
        }
        return out;
    }

    public ChallengeDto createChallenge(Long uid, ChallengeDto input) {
        log.info("createChallenge: uid={} title={}", uid, input == null ? null : input.getTitle());
        Optional<User> ou = userRepository.findById(uid);
        if (ou.isEmpty()) {
            log.warn("createChallenge: user not found: {}", uid);
            return null;
        }
        Challenge c = new Challenge();
        c.setCreator(ou.get());
        c.setTitle(input.getTitle());
        c.setDescription(input.getDescription());
        c.setPeriod(input.getPeriod());
        c.setPenaltyAmount(input.getPenaltyAmount());
        if (input.getInvitedUserIds() != null) {
            c.setInvitedUsers(input.getInvitedUserIds());
        }
        c.setStatus("pending");
        c.setCreatedAt(input.getCreatedAt() == null ? Instant.now().toString() : input.getCreatedAt());
        c.setNextDueDate(
                input.getNextDueDate() == null ? LocalDate.now().plusDays(1).toString() : input.getNextDueDate());
        c.setStartDate(input.getStartDate());
        c.setEndDate(input.getEndDate());
        // add creator as participant
        ChallengeParticipant cp = new ChallengeParticipant();
        cp.setChallenge(c);
        cp.setUser(ou.get());
        cp.setStatus("accepted");
        c.getParticipants().add(cp);
        challengeRepository.save(c);
        log.info("createChallenge: created challenge id={} by user={}", c.getId(), uid);
        ChallengeDto out = new ChallengeDto();
        out.setId(String.valueOf(c.getId()));
        out.setCreatorId(String.valueOf(c.getCreator().getId()));
        return out;
    }

    public boolean acceptChallenge(Long uid, String challengeIdStr) {
        log.info("acceptChallenge: uid={} challengeId={}", uid, challengeIdStr);
        Long cid = Long.valueOf(challengeIdStr);
        Optional<Challenge> oc = challengeRepository.findById(cid);
        if (oc.isEmpty()) {
            log.warn("acceptChallenge: challenge not found: {}", cid);
            return false;
        }
        Challenge c = oc.get();
        // check if participant exists
        for (ChallengeParticipant p : c.getParticipants()) {
            if (Objects.equals(p.getUser().getId(), uid)) {
                p.setStatus("accepted");
                challengeParticipantRepository.save(p);
                return true;
            }
        }
        ChallengeParticipant np = new ChallengeParticipant();
        np.setChallenge(c);
        userRepository.findById(uid).ifPresent(np::setUser);
        np.setStatus("accepted");
        c.getParticipants().add(np);
        if (c.getInvitedUsers().size() + 1 == c.getParticipants().size()) {
            c.setStatus("active");
        }
        challengeRepository.save(c);
        log.info("acceptChallenge: user {} accepted challenge {}", uid, cid);
        return true;
    }

    public boolean rejectChallenge(Long uid, String challengeIdStr) {
        log.info("rejectChallenge: uid={} challengeId={}", uid, challengeIdStr);
        Long cid = Long.valueOf(challengeIdStr);
        Optional<Challenge> oc = challengeRepository.findById(cid);
        if (oc.isEmpty()) {
            log.warn("rejectChallenge: challenge not found: {}", cid);
            return false;
        }
        Challenge c = oc.get();
        // check if participant exists
        for (ChallengeParticipant p : c.getParticipants()) {
            if (Objects.equals(p.getUser().getId(), uid)) {
                p.setStatus("rejected");
                challengeParticipantRepository.save(p);
                return true;
            }
        }
        ChallengeParticipant np = new ChallengeParticipant();
        np.setChallenge(c);
        userRepository.findById(uid).ifPresent(np::setUser);
        np.setStatus("rejected");
        c.getParticipants().add(np);
        c.setStatus("rejected");
        challengeRepository.save(c);
        log.info("rejectChallenge: user {} rejected challenge {}", uid, cid);
        return true;
    }

    public boolean completeChallenge(Long uid, String challengeIdStr, String dateStr) {
        log.info("completeChallenge: uid={} challengeId={}", uid, challengeIdStr);
        Long cid = Long.valueOf(challengeIdStr);
        Optional<Challenge> oc = challengeRepository.findById(cid);
        if (oc.isEmpty()) {
            log.warn("completeChallenge: challenge not found: {}", cid);
            return false;
        }
        Challenge c = oc.get();
        
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
        if (c.getStartDate() != null && !c.getStartDate().isEmpty()) {
            LocalDate start = LocalDate.parse(c.getStartDate());
            if (date.isBefore(start)) {
                return false;
            }
        }
        if (c.getEndDate() != null && !c.getEndDate().isEmpty()) {
            LocalDate end = LocalDate.parse(c.getEndDate());
            if (date.isAfter(end)) {
                return false;
            }
        }

        String key = periodKeyFor(date, c.getPeriod());
        
        for (ChallengeParticipant p : c.getParticipants()) {
            if (Objects.equals(p.getUser().getId(), uid)) {
                if (!p.getCompletedDates().contains(key)) {
                    p.getCompletedDates().add(key);
                    challengeParticipantRepository.save(p);
                    log.info("completeChallenge: user {} completed challenge {} with key {} (period={})", uid, cid, key, c.getPeriod());
                }
                return true;
            }
        }
        log.info("here"); 
        return false;
    }

    public boolean uncompleteChallenge(Long uid, String challengeIdStr, String dateStr) {
        log.info("uncompleteChallenge: uid={} challengeId={}", uid, challengeIdStr);
        Long cid = Long.valueOf(challengeIdStr);
        Optional<Challenge> oc = challengeRepository.findById(cid);
        if (oc.isEmpty()) {
            log.warn("uncompleteChallenge: challenge not found: {}", cid);
            return false;
        }
        Challenge c = oc.get();
        String key = null;
        try {
            LocalDate date = LocalDate.parse(dateStr);
            key = periodKeyFor(date, c.getPeriod());
        } catch (Exception e) {
            // parsing failed - nothing to remove
            return false;
        }
        
        for (ChallengeParticipant p : c.getParticipants()) {
            if (Objects.equals(p.getUser().getId(), uid)) {
                if (p.getCompletedDates().contains(key)) {
                    p.getCompletedDates().remove(key);
                    challengeParticipantRepository.save(p);
                    log.info("uncompleteChallenge: removed key {} for user {} challenge {} (period={})", key, uid, cid, c.getPeriod());
                    return true;
                }
                return false;
            }
        }
        return false;
    }

    public Map<String, Object> applyChallengePenalty(Long uid, String challengeIdStr, String failedUserIdStr) {
        log.info("applyChallengePenalty: uid={} challengeId={} failedUserId={}", uid, challengeIdStr, failedUserIdStr);
        Long cid = Long.valueOf(challengeIdStr);
        Optional<Challenge> oc = challengeRepository.findById(cid);
        if (oc.isEmpty()) {
            log.warn("applyChallengePenalty: challenge not found: {}", cid);
            return null;
        }
        Challenge c = oc.get();
        Penalty p = new Penalty();
        p.setType("challenge");
        userRepository.findById(Long.valueOf(failedUserIdStr)).ifPresent(p::setFromUser);
        p.setToUser(c.getCreator());
        p.setAmount(c.getPenaltyAmount());
        p.setReason("Failed challenge: " + c.getTitle());
        p.setCreatedAt(Instant.now().toString());
        penaltyRepository.save(p);
        log.info("applyChallengePenalty: penalty created id={} amount={}", p.getId(), p.getAmount());
        return Map.of("success", true, "penaltyId", String.valueOf(p.getId()));
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
                Set<LocalDate> weeks = new HashSet<>();
                for (String s : completedDates) {
                    LocalDate d = parseToLocalDate(s);
                    if (d == null)
                        continue;
                    LocalDate weekStart = d.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                    weeks.add(weekStart);
                }
                if (weeks.isEmpty())
                    return 0;
                List<LocalDate> sorted = weeks.stream().sorted(Collections.reverseOrder()).collect(Collectors.toList());
                int streak = 0;
                LocalDate todayWeekStart = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
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
                Set<LocalDate> weeks = new HashSet<>();
                for (String s : completedDates) {
                    LocalDate d = parseToLocalDate(s);
                    if (d == null)
                        continue;
                    LocalDate weekStart = d.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
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

    public Map<String, Object> getChallengeStats(Long uid, String challengeIdStr) {
        log.info("getChallengeStats: uid={} challengeId={}", uid, challengeIdStr);
        Long cid = Long.valueOf(challengeIdStr);
        Optional<Challenge> oc = challengeRepository.findById(cid);
        if (oc.isEmpty()) {
            log.warn("getChallengeStats: challenge not found {}", cid);
            return Map.of();
        }
        Challenge c = oc.get();
        
        // Find participant for this user
        ChallengeParticipant userParticipant = null;
        for (ChallengeParticipant p : c.getParticipants()) {
            if (Objects.equals(p.getUser().getId(), uid)) {
                userParticipant = p;
                break;
            }
        }
        
        if (userParticipant == null) {
            log.warn("getChallengeStats: user {} not participant of challenge {}", uid, cid);
            return Map.of();
        }
        
        List<String> completedDates = userParticipant.getCompletedDates();
        int totalCompletions = completedDates.size();
        int currentStreak = calcCurrentStreak(completedDates, c.getPeriod());
        int longestStreak = calcLongestStreak(completedDates, c.getPeriod());
        
        return Map.of(
                "totalCompletions", totalCompletions,
                "currentStreak", currentStreak,
                "longestStreak", longestStreak,
                "penaltyAmount", c.getPenaltyAmount());
    }
}
