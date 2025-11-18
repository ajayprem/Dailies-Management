package com.ajayprem.habittracker.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ajayprem.habittracker.dto.AuthResponses;
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
public class InMemoryBackendService {

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

    // --- Auth & User ---
    public AuthResponses signup(String email, String password, String name) {
        if (userRepository.findByEmail(email).isPresent()) return null;
        User u = new User();
        u.setEmail(email);
        u.setName(name);
        u.setPassword(password);
        u.setCreatedAt(Instant.now().toString());
        userRepository.save(u);
        String token = "token-" + UUID.randomUUID();
        AuthToken t = new AuthToken();
        t.setToken(token);
        t.setUser(u);
        authTokenRepository.save(t);
        return new AuthResponses(token, String.valueOf(u.getId()));
    }

    public AuthResponses login(String email, String password) {
        Optional<User> ou = userRepository.findByEmail(email);
        if (ou.isEmpty()) return null;
        User u = ou.get();
        if (!Objects.equals(u.getPassword(), password)) return null;
        String token = "token-" + UUID.randomUUID();
        AuthToken t = new AuthToken();
        t.setToken(token);
        t.setUser(u);
        authTokenRepository.save(t);
        return new AuthResponses(token, String.valueOf(u.getId()));
    }

    public UserProfileDto profileForToken(String token) {
        if (token == null) return null;
        AuthToken t = authTokenRepository.findById(token).orElse(null);
        if (t == null) return null;
        User u = t.getUser();
        UserProfileDto dto = new UserProfileDto();
        dto.setId(String.valueOf(u.getId()));
        dto.setEmail(u.getEmail());
        dto.setName(u.getName());
        List<String> fr = new ArrayList<>();
        for (User f : u.getFriends()) fr.add(String.valueOf(f.getId()));
        dto.setFriends(fr);
        dto.setCreatedAt(u.getCreatedAt());
        return dto;
    }

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
    public boolean sendFriendRequest(String fromUserIdStr, String friendIdStr) {
        Long fromId = Long.parseLong(fromUserIdStr);
        Long friendId = Long.parseLong(friendIdStr);
        Optional<User> of = userRepository.findById(fromId);
        Optional<User> ofr = userRepository.findById(friendId);
        if (of.isEmpty() || ofr.isEmpty()) return false;
        FriendRequest fr = new FriendRequest();
        fr.setFromUser(of.get());
        fr.setToUser(ofr.get());
        fr.setStatus("pending");
        fr.setCreatedAt(Instant.now().toString());
        friendRequestRepository.save(fr);
        return true;
    }

    public List<FriendRequest> getFriendRequests(String userIdStr) {
        Long uid = Long.parseLong(userIdStr);
        return friendRequestRepository.findByToUserId(uid);
    }

    public boolean acceptFriendRequest(String userIdStr, String requestIdStr) {
        Long requestId = Long.parseLong(requestIdStr);
        Optional<FriendRequest> ofr = friendRequestRepository.findById(requestId);
        if (ofr.isEmpty()) return false;
        FriendRequest fr = ofr.get();
        if (!Objects.equals(String.valueOf(fr.getToUser().getId()), userIdStr)) return false;
        fr.setStatus("accepted");
        friendRequestRepository.save(fr);
        User a = fr.getToUser();
        User b = fr.getFromUser();
        a.getFriends().add(b);
        b.getFriends().add(a);
        userRepository.save(a);
        userRepository.save(b);
        return true;
    }

    public List<UserProfileDto> listFriends(String userIdStr) {
        Long uid = Long.parseLong(userIdStr);
        Optional<User> ou = userRepository.findById(uid);
        if (ou.isEmpty()) return Collections.emptyList();
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
    public List<TaskDto> getTasks(String userIdStr) {
        Long uid = Long.parseLong(userIdStr);
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
            dto.setPenaltyRecipientId(t.getPenaltyRecipient() != null ? String.valueOf(t.getPenaltyRecipient().getId()) : null);
            dto.setStatus(t.getStatus());
            dto.setCompletedDates(t.getCompletedDates());
            dto.setCreatedAt(t.getCreatedAt());
            dto.setNextDueDate(t.getNextDueDate());
            out.add(dto);
        }
        return out;
    }

    public TaskDto createTask(String userIdStr, TaskDto input) {
        Long uid = Long.parseLong(userIdStr);
        Optional<User> ou = userRepository.findById(uid);
        if (ou.isEmpty()) return null;
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
        t.setNextDueDate(input.getNextDueDate() == null ? LocalDate.now().plusDays(1).toString() : input.getNextDueDate());
        if (input.getCompletedDates() != null) t.setCompletedDates(input.getCompletedDates());
        taskRepository.save(t);
        input.setId(String.valueOf(t.getId()));
        input.setUserId(String.valueOf(uid));
        return input;
    }

    public boolean completeTask(String userIdStr, String taskIdStr) {
        Long tid = Long.parseLong(taskIdStr);
        Optional<Task> ot = taskRepository.findById(tid);
        if (ot.isEmpty()) return false;
        Task t = ot.get();
        if (!Objects.equals(String.valueOf(t.getUser().getId()), userIdStr)) return false;
        String today = LocalDate.now().toString();
        if (!t.getCompletedDates().contains(today)) t.getCompletedDates().add(today);
        t.setNextDueDate(LocalDate.now().plusDays(1).toString());
        taskRepository.save(t);
        return true;
    }

    public Map<String, Object> applyTaskPenalty(String userIdStr, String taskIdStr) {
        Long tid = Long.parseLong(taskIdStr);
        Optional<Task> ot = taskRepository.findById(tid);
        if (ot.isEmpty()) return null;
        Task t = ot.get();
        Penalty p = new Penalty();
        p.setType("task");
        p.setTask(t);
        userRepository.findById(Long.parseLong(userIdStr)).ifPresent(p::setFromUser);
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
            if (Objects.equals(c.getCreator().getId(), userId) || c.getInvitedUsers().contains(userId)) out.add(c);
        }
        return out;
    }

    public List<ChallengeDto> getChallenges(String userIdStr) {
        Long uid = Long.parseLong(userIdStr);
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
            for (Long id : c.getInvitedUsers()) invited.add(String.valueOf(id));
            dto.setInvitedUsers(invited);
            dto.setStatus(c.getStatus());
            dto.setCreatedAt(c.getCreatedAt());
            dto.setNextDueDate(c.getNextDueDate());
            out.add(dto);
        }
        return out;
    }

    public ChallengeDto createChallenge(String userIdStr, ChallengeDto input) {
        Long uid = Long.parseLong(userIdStr);
        Optional<User> ou = userRepository.findById(uid);
        if (ou.isEmpty()) return null;
        Challenge c = new Challenge();
        c.setCreator(ou.get());
        c.setTitle(input.getTitle());
        c.setDescription(input.getDescription());
        c.setPeriod(input.getPeriod());
        c.setPenaltyAmount(input.getPenaltyAmount());
        if (input.getInvitedUsers() != null) {
            List<Long> invited = new ArrayList<>();
            for (String s : input.getInvitedUsers()) invited.add(Long.parseLong(s));
            c.setInvitedUsers(invited);
        }
        c.setStatus(input.getStatus() == null ? "active" : input.getStatus());
        c.setCreatedAt(input.getCreatedAt() == null ? Instant.now().toString() : input.getCreatedAt());
        c.setNextDueDate(input.getNextDueDate() == null ? LocalDate.now().plusDays(1).toString() : input.getNextDueDate());
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

    public boolean acceptChallenge(String userIdStr, String challengeIdStr) {
        Long uid = Long.parseLong(userIdStr);
        Long cid = Long.parseLong(challengeIdStr);
        Optional<Challenge> oc = challengeRepository.findById(cid);
        if (oc.isEmpty()) return false;
        Challenge c = oc.get();
        // check if participant exists
        for (ChallengeParticipant p : c.getParticipants()) {
            if (Objects.equals(p.getUser().getId(), uid)) { p.setStatus("accepted"); challengeParticipantRepository.save(p); return true; }
        }
        ChallengeParticipant np = new ChallengeParticipant();
        np.setChallenge(c);
        userRepository.findById(uid).ifPresent(np::setUser);
        np.setStatus("accepted");
        c.getParticipants().add(np);
        challengeRepository.save(c);
        return true;
    }

    public boolean completeChallenge(String userIdStr, String challengeIdStr) {
        Long uid = Long.parseLong(userIdStr);
        Long cid = Long.parseLong(challengeIdStr);
        Optional<Challenge> oc = challengeRepository.findById(cid);
        if (oc.isEmpty()) return false;
        Challenge c = oc.get();
        String today = LocalDate.now().toString();
        for (ChallengeParticipant p : c.getParticipants()) {
            if (Objects.equals(p.getUser().getId(), uid)) {
                if (!p.getCompletedDates().contains(today)) p.getCompletedDates().add(today);
                challengeParticipantRepository.save(p);
                return true;
            }
        }
        return false;
    }

    public Map<String,Object> applyChallengePenalty(String userIdStr, String challengeIdStr, String failedUserIdStr) {
        Long cid = Long.parseLong(challengeIdStr);
        Optional<Challenge> oc = challengeRepository.findById(cid);
        if (oc.isEmpty()) return null;
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

    public List<PenaltyDto> getPenalties(String userIdStr) {
        Long uid = Long.parseLong(userIdStr);
        List<Penalty> list = getPenaltiesEntities(uid);
        List<PenaltyDto> out = new ArrayList<>();
        for (Penalty p : list) {
            PenaltyDto dto = new PenaltyDto();
            dto.setId(String.valueOf(p.getId()));
            dto.setType(p.getType());
            dto.setTaskId(p.getTask()!=null?String.valueOf(p.getTask().getId()):null);
            dto.setFromUserId(p.getFromUser()!=null?String.valueOf(p.getFromUser().getId()):null);
            dto.setToUserId(p.getToUser()!=null?String.valueOf(p.getToUser().getId()):null);
            dto.setAmount(p.getAmount());
            dto.setReason(p.getReason());
            dto.setCreatedAt(p.getCreatedAt());
            out.add(dto);
        }
        return out;
    }

    // helper to resolve token->id
    public String getUserIdForToken(String token) {
        if (token == null) return null;
        if (token.startsWith("Bearer ")) token = token.substring(7);
        AuthToken t = authTokenRepository.findById(token).orElse(null);
        if (t == null) return null;
        return String.valueOf(t.getUser().getId());
    }
}
