package com.ajayprem.habittracker.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ajayprem.habittracker.dto.ChallengeDto;
import com.ajayprem.habittracker.dto.PenaltyDto;
import com.ajayprem.habittracker.dto.TaskDto;
import com.ajayprem.habittracker.dto.UserProfileDto;
import com.ajayprem.habittracker.model.AuthToken;
import com.ajayprem.habittracker.model.Challenge;
import com.ajayprem.habittracker.model.ChallengeParticipant;
import com.ajayprem.habittracker.model.FriendRequest;
import com.ajayprem.habittracker.model.Penalty;
import com.ajayprem.habittracker.model.Task;
import com.ajayprem.habittracker.model.User;
import com.ajayprem.habittracker.repository.AuthTokenRepository;
import com.ajayprem.habittracker.repository.ChallengeParticipantRepository;
import com.ajayprem.habittracker.repository.ChallengeRepository;
import com.ajayprem.habittracker.repository.FriendRequestRepository;
import com.ajayprem.habittracker.repository.PenaltyRepository;
import com.ajayprem.habittracker.repository.TaskRepository;
import com.ajayprem.habittracker.repository.UserRepository;

@Service
@Transactional
public class BackendService {
    @Autowired
    private JwtService jwtService;

    // --- New Feature: Retroactive Completion ---
    public Map<String, Object> completeTaskForDate(Long uid, String taskIdStr, String dateStr) {
        Long tid = Long.parseLong(taskIdStr);
        Optional<Task> ot = taskRepository.findById(tid);
        if (ot.isEmpty()) {
            return null;
        }
        Task t = ot.get();
        if (!Objects.equals(t.getUser().getId(), uid)) {
            return null;
        }
        // Validate date format
        LocalDate date;
        try {
            date = LocalDate.parse(dateStr);
        } catch (Exception e) {
            return null;
        }
        LocalDate today = LocalDate.now();
        if (date.isAfter(today)) {
            return null;
        }
        // Validate start/end date
        if (t.getStartDate() != null && !t.getStartDate().isEmpty()) {
            LocalDate start = LocalDate.parse(t.getStartDate());
            if (date.isBefore(start)) {
                return null;
            }
        }
        if (t.getEndDate() != null && !t.getEndDate().isEmpty()) {
            LocalDate end = LocalDate.parse(t.getEndDate());
            if (date.isAfter(end)) {
                return null;
            }
        }
        // Validate period
        boolean valid = false;
        if ("daily".equalsIgnoreCase(t.getPeriod())) {
            valid = true;
        } else if ("weekly".equalsIgnoreCase(t.getPeriod())) {
            LocalDate created = t.getCreatedAt() != null ? LocalDate.parse(t.getCreatedAt().substring(0, 10)) : date;
            valid = date.getDayOfWeek() == created.getDayOfWeek();
        } else if ("monthly".equalsIgnoreCase(t.getPeriod())) {
            LocalDate created = t.getCreatedAt() != null ? LocalDate.parse(t.getCreatedAt().substring(0, 10)) : date;
            valid = date.getDayOfMonth() == created.getDayOfMonth();
        }
        if (!valid) {
            return null;
        }
        // Add date if not present
        if (!t.getCompletedDates().contains(dateStr)) {
            t.getCompletedDates().add(dateStr);
            taskRepository.save(t);
        }
        TaskDto dto = new TaskDto();
        dto.setId(String.valueOf(t.getId()));
        dto.setUserId(String.valueOf(t.getUser().getId()));
        dto.setTitle(t.getTitle());
        dto.setDescription(t.getDescription());
        dto.setPeriod(t.getPeriod());
        dto.setPenaltyAmount(t.getPenaltyAmount());
        dto.setPenaltyRecipientId(
                t.getPenaltyRecipient() != null ? String.valueOf(t.getPenaltyRecipient().getId()) : null);
        dto.setStatus(t.getStatus());
        dto.setCompletedDates(t.getCompletedDates());
        dto.setCreatedAt(t.getCreatedAt());
        dto.setNextDueDate(t.getNextDueDate());
        dto.setStartDate(t.getStartDate());
        dto.setEndDate(t.getEndDate());
        return Map.of("success", true, "task", dto);
    }

    public boolean uncompleteTaskForDate(Long uid, String taskIdStr, String dateStr) {
        Long tid = Long.parseLong(taskIdStr);
        Optional<Task> ot = taskRepository.findById(tid);
        if (ot.isEmpty()) {
            return false;
        }
        Task t = ot.get();
        if (!Objects.equals(t.getUser().getId(), uid)) {
            return false;
        }
        if (t.getCompletedDates().contains(dateStr)) {
            t.getCompletedDates().remove(dateStr);
            taskRepository.save(t);
            return true;
        }
        return false;
    }

    // --- New Feature: Task Reset (Uncomplete) ---
    public boolean uncompleteTask(Long uid, String taskIdStr) {
        Long tid = Long.parseLong(taskIdStr);
        Optional<Task> ot = taskRepository.findById(tid);
        if (ot.isEmpty()) {
            return false;
        }
        Task t = ot.get();
        if (!Objects.equals(t.getUser().getId(), uid)) {
            return false;
        }
        String today = LocalDate.now().toString();
        if (t.getCompletedDates().contains(today)) {
            t.getCompletedDates().remove(today);
            taskRepository.save(t);
            return true;
        }
        return false;
    }

    // --- New Feature: Task Stats ---
    public Map<String, Object> getTaskStats(Long uid, String taskIdStr) {
        Long tid = Long.parseLong(taskIdStr);
        Optional<Task> ot = taskRepository.findById(tid);
        if (ot.isEmpty()) {
            return Map.of();
        }
        Task t = ot.get();
        if (!Objects.equals(t.getUser().getId(), uid)) {
            return Map.of();
        }
        List<String> completedDates = t.getCompletedDates();
        int totalCompletions = completedDates.size();
        int currentStreak = calcCurrentStreak(completedDates);
        int longestStreak = calcLongestStreak(completedDates);
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

    // --- Helper Methods for Stats ---
    private int calcCurrentStreak(List<String> completedDates) {
        if (completedDates == null || completedDates.isEmpty()) {
            return 0;
        }
        List<LocalDate> dates = completedDates.stream().map(LocalDate::parse).sorted(Collections.reverseOrder())
                .toList();
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

    private int calcLongestStreak(List<String> completedDates) {
        if (completedDates == null || completedDates.isEmpty()) {
            return 0;
        }
        List<LocalDate> dates = completedDates.stream().map(LocalDate::parse).sorted().toList();
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

    private double calcCompletionRate(Task t, List<String> completedDates) {
        if (completedDates == null || completedDates.isEmpty()) {
            return 0.0;
        }
        LocalDate created = LocalDate.parse(t.getCreatedAt());
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

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthTokenRepository authTokenRepository;

    @Autowired
    private FriendRequestRepository friendRequestRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private ChallengeRepository challengeRepository;

    @Autowired
    private ChallengeParticipantRepository challengeParticipantRepository;

    @Autowired
    private PenaltyRepository penaltyRepository;

    public List<UserProfileDto> searchByEmail(String queryEmail) {
        List<UserProfileDto> out = new ArrayList<>();
        List<User> users = userRepository.findByEmailContaining(queryEmail);
        for (User u : users) {
            UserProfileDto d = new UserProfileDto();
            d.setId(String.valueOf(u.getId()));
            d.setEmail(u.getEmail());
            d.setName(u.getName());
            out.add(d);
        }
        return out;
    }

    // --- Friends ---
    public boolean sendFriendRequest(Long fromId, Long friendId) {
        if (fromId.equals(friendId)) {
            return false;
        }
        Optional<User> of = userRepository.findById(fromId);
        Optional<User> ofr = userRepository.findById(friendId);
        if (of.isEmpty() || ofr.isEmpty()) {
            return false;
        }
        FriendRequest fr = new FriendRequest();
        fr.setFromUser(of.get());
        fr.setToUser(ofr.get());
        fr.setStatus("pending");
        fr.setCreatedAt(Instant.now().toString());
        friendRequestRepository.save(fr);
        return true;
    }

    public List<FriendRequest> getFriendRequests(Long uid) {
        return friendRequestRepository.findByToUserId(uid);
    }

    public boolean acceptFriendRequest(Long uid, Long requestId) {
        Optional<FriendRequest> ofr = friendRequestRepository.findById(requestId);
        if (ofr.isEmpty()) {
            return false;
        }
        FriendRequest fr = ofr.get();
        if (!Objects.equals(fr.getToUser().getId(), uid)) {
            return false;
        }
        User a = fr.getToUser();
        User b = fr.getFromUser();
        a.getFriends().add(b);
        b.getFriends().add(a);
        userRepository.save(a);
        userRepository.save(b);
        friendRequestRepository.delete(fr);
        return true;
    }

    public boolean deleteFriendRequest(Long uid, Long requestId) {
        Optional<FriendRequest> ofr = friendRequestRepository.findById(requestId);
        if (ofr.isEmpty()) {
            return false;
        }
        FriendRequest fr = ofr.get();
        // Only the sender or the recipient may delete the request
        Long fromIdStr = fr.getFromUser().getId();
        Long toIdStr = fr.getToUser().getId();
        if (!Objects.equals(uid, fromIdStr) && !Objects.equals(uid, toIdStr)) {
            return false;
        }
        friendRequestRepository.delete(fr);
        return true;
    }

    public List<UserProfileDto> listFriends(Long uid) {
        Optional<User> ou = userRepository.findById(uid);
        if (ou.isEmpty()) {
            return Collections.emptyList();
        }
        List<UserProfileDto> out = new ArrayList<>();
        for (User f : ou.get().getFriends()) {
            UserProfileDto d = new UserProfileDto();
            d.setId(String.valueOf(f.getId()));
            d.setName(f.getName());
            d.setEmail(f.getEmail());
            out.add(d);
        }
        return out;
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
            dto.setPenaltyRecipientId(
                    t.getPenaltyRecipient() != null ? String.valueOf(t.getPenaltyRecipient().getId()) : null);
            dto.setStatus(t.getStatus());
            dto.setCompletedDates(t.getCompletedDates());
            dto.setCreatedAt(t.getCreatedAt());
            dto.setNextDueDate(t.getNextDueDate());
            dto.setStartDate(t.getStartDate());
            dto.setEndDate(t.getEndDate());
            out.add(dto);
        }
        return out;
    }

    public TaskDto createTask(Long uid, TaskDto input) {
        Optional<User> ou = userRepository.findById(uid);
        if (ou.isEmpty()) {
            return null;
        }
        Task t = new Task();
        t.setUser(ou.get());
        t.setTitle(input.getTitle());
        t.setDescription(input.getDescription());
        t.setPeriod(input.getPeriod());
        t.setPenaltyAmount(input.getPenaltyAmount());
        if (input.getPenaltyRecipientId() != null) {
            Long pid = Long.parseLong(input.getPenaltyRecipientId());
            userRepository.findById(pid).ifPresent(t::setPenaltyRecipient);
        }
        t.setStatus(input.getStatus() == null ? "active" : input.getStatus());
        t.setCreatedAt(input.getCreatedAt() == null ? Instant.now().toString() : input.getCreatedAt());
        t.setNextDueDate(
                input.getNextDueDate() == null ? LocalDate.now().plusDays(1).toString() : input.getNextDueDate());
        if (input.getCompletedDates() != null) {
            t.setCompletedDates(input.getCompletedDates());
        }
        t.setStartDate(input.getStartDate());
        t.setEndDate(input.getEndDate());
        taskRepository.save(t);
        input.setId(String.valueOf(t.getId()));
        input.setUserId(String.valueOf(uid));
        return input;
    }

    public boolean completeTask(Long uid, String taskIdStr) {
        Long tid = Long.parseLong(taskIdStr);
        Optional<Task> ot = taskRepository.findById(tid);
        if (ot.isEmpty()) {
            return false;
        }
        Task t = ot.get();
        if (!Objects.equals(t.getUser().getId(), uid)) {
            return false;
        }
        String today = LocalDate.now().toString();
        if (!t.getCompletedDates().contains(today)) {
            t.getCompletedDates().add(today);
        }
        t.setNextDueDate(LocalDate.now().plusDays(1).toString());
        taskRepository.save(t);
        return true;
    }

    public Map<String, Object> applyTaskPenalty(Long uid, String taskIdStr) {
        Long tid = Long.parseLong(taskIdStr);
        Optional<Task> ot = taskRepository.findById(tid);
        if (ot.isEmpty()) {
            return null;
        }
        Task t = ot.get();
        Penalty p = new Penalty();
        p.setType("task");
        p.setTask(t);
        userRepository.findById(uid).ifPresent(p::setFromUser);
        p.setToUser(t.getPenaltyRecipient());
        p.setAmount(t.getPenaltyAmount());
        p.setReason("Incomplete task: " + t.getTitle());
        p.setCreatedAt(Instant.now().toString());
        penaltyRepository.save(p);
        return Map.of("success", true, "penaltyId", String.valueOf(p.getId()));
    }

    // --- Challenges ---
    public List<Challenge> getChallengesEntities(Long userId) {
        // helper: return challenges where creator or invited
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
                pd.setUserId(String.valueOf(cp.getUser().getId()));
                pd.setStatus(cp.getStatus());
                pd.setCompletedDates(cp.getCompletedDates());
                parts.add(pd);
            }
            dto.setParticipants(parts);
            List<String> invited = new ArrayList<>();
            for (Long id : c.getInvitedUsers()) {
                invited.add(String.valueOf(id));
            }
            dto.setInvitedUsers(invited);
            dto.setStatus(c.getStatus());
            dto.setCreatedAt(c.getCreatedAt());
            dto.setNextDueDate(c.getNextDueDate());
            out.add(dto);
        }
        return out;
    }

    public ChallengeDto createChallenge(Long uid, ChallengeDto input) {
        Optional<User> ou = userRepository.findById(uid);
        if (ou.isEmpty()) {
            return null;
        }
        Challenge c = new Challenge();
        c.setCreator(ou.get());
        c.setTitle(input.getTitle());
        c.setDescription(input.getDescription());
        c.setPeriod(input.getPeriod());
        c.setPenaltyAmount(input.getPenaltyAmount());
        if (input.getInvitedUsers() != null) {
            List<Long> invited = new ArrayList<>();
            for (String s : input.getInvitedUsers()) {
                invited.add(Long.parseLong(s));
            }
            c.setInvitedUsers(invited);
        }
        c.setStatus(input.getStatus() == null ? "active" : input.getStatus());
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
        ChallengeDto out = new ChallengeDto();
        out.setId(String.valueOf(c.getId()));
        out.setCreatorId(String.valueOf(c.getCreator().getId()));
        return out;
    }

    public boolean acceptChallenge(Long uid, String challengeIdStr) {
        Long cid = Long.parseLong(challengeIdStr);
        Optional<Challenge> oc = challengeRepository.findById(cid);
        if (oc.isEmpty()) {
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
        challengeRepository.save(c);
        return true;
    }

    public boolean completeChallenge(Long uid, String challengeIdStr) {
        Long cid = Long.parseLong(challengeIdStr);
        Optional<Challenge> oc = challengeRepository.findById(cid);
        if (oc.isEmpty()) {
            return false;
        }
        Challenge c = oc.get();
        String today = LocalDate.now().toString();
        for (ChallengeParticipant p : c.getParticipants()) {
            if (Objects.equals(p.getUser().getId(), uid)) {
                if (!p.getCompletedDates().contains(today)) {
                    p.getCompletedDates().add(today);
                }
                challengeParticipantRepository.save(p);
                return true;
            }
        }
        return false;
    }

    public Map<String, Object> applyChallengePenalty(Long uid, String challengeIdStr, String failedUserIdStr) {
        Long cid = Long.parseLong(challengeIdStr);
        Optional<Challenge> oc = challengeRepository.findById(cid);
        if (oc.isEmpty()) {
            return null;
        }
        Challenge c = oc.get();
        Penalty p = new Penalty();
        p.setType("challenge");
        userRepository.findById(Long.parseLong(failedUserIdStr)).ifPresent(p::setFromUser);
        p.setToUser(c.getCreator());
        p.setAmount(c.getPenaltyAmount());
        p.setReason("Failed challenge: " + c.getTitle());
        p.setCreatedAt(Instant.now().toString());
        penaltyRepository.save(p);
        return Map.of("success", true, "penaltyId", String.valueOf(p.getId()));
    }

    public List<Penalty> getPenaltiesEntities(Long userId) {
        return penaltyRepository.findByFromUserIdOrToUserId(userId, userId);
    }

    public List<PenaltyDto> getPenalties(Long uid) {
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

    // helper to resolve token->id
    public String getUserIdForToken(String token) {
        if (token == null) {
            return null;
        }
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        AuthToken t = authTokenRepository.findById(token).orElse(null);
        if (t == null) {
            return null;
        }
        return String.valueOf(t.getUser().getId());
    }
}
