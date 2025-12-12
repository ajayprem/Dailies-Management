package com.ajayprem.habittracker.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ajayprem.habittracker.dto.ChallengeDto;
import com.ajayprem.habittracker.dto.PenaltyDto;
import com.ajayprem.habittracker.dto.UserProfileDto;
import com.ajayprem.habittracker.model.AuthToken;
import com.ajayprem.habittracker.model.Challenge;
import com.ajayprem.habittracker.model.ChallengeParticipant;
import com.ajayprem.habittracker.model.FriendRequest;
import com.ajayprem.habittracker.model.FriendRequestKey;
import com.ajayprem.habittracker.model.Penalty;
import com.ajayprem.habittracker.model.User;
import com.ajayprem.habittracker.repository.AuthTokenRepository;
import com.ajayprem.habittracker.repository.ChallengeParticipantRepository;
import com.ajayprem.habittracker.repository.ChallengeRepository;
import com.ajayprem.habittracker.repository.FriendRequestRepository;
import com.ajayprem.habittracker.repository.PenaltyRepository;
import com.ajayprem.habittracker.repository.UserRepository;
import com.ajayprem.habittracker.util.CurrentUser;

@Service
@Transactional
public class BackendService {

    private static final Logger log = LoggerFactory.getLogger(BackendService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthTokenRepository authTokenRepository;

    @Autowired
    private ChallengeRepository challengeRepository;

    @Autowired
    private ChallengeParticipantRepository challengeParticipantRepository;

    @Autowired
    private PenaltyRepository penaltyRepository;


    // --- Challenges ---
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
        log.info("createChallenge: created challenge id={} by user={}", c.getId(), uid);
        ChallengeDto out = new ChallengeDto();
        out.setId(String.valueOf(c.getId()));
        out.setCreatorId(String.valueOf(c.getCreator().getId()));
        return out;
    }

    public boolean acceptChallenge(Long uid, String challengeIdStr) {
        log.info("acceptChallenge: uid={} challengeId={}", uid, challengeIdStr);
        Long cid = Long.parseLong(challengeIdStr);
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
        challengeRepository.save(c);
        log.info("acceptChallenge: user {} accepted challenge {}", uid, cid);
        return true;
    }

    public boolean completeChallenge(Long uid, String challengeIdStr) {
        log.info("completeChallenge: uid={} challengeId={}", uid, challengeIdStr);
        Long cid = Long.parseLong(challengeIdStr);
        Optional<Challenge> oc = challengeRepository.findById(cid);
        if (oc.isEmpty()) {
            log.warn("completeChallenge: challenge not found: {}", cid);
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
                log.info("completeChallenge: user {} completed challenge {} for date {}", uid, cid, today);
                return true;
            }
        }
        return false;
    }

    public Map<String, Object> applyChallengePenalty(Long uid, String challengeIdStr, String failedUserIdStr) {
        log.info("applyChallengePenalty: uid={} challengeId={} failedUserId={}", uid, challengeIdStr, failedUserIdStr);
        Long cid = Long.parseLong(challengeIdStr);
        Optional<Challenge> oc = challengeRepository.findById(cid);
        if (oc.isEmpty()) {
            log.warn("applyChallengePenalty: challenge not found: {}", cid);
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
        log.info("applyChallengePenalty: penalty created id={} amount={}", p.getId(), p.getAmount());
        return Map.of("success", true, "penaltyId", String.valueOf(p.getId()));
    }

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

    // helper to resolve token->id
    public String getUserIdForToken(String token) {
        log.debug("getUserIdForToken: tokenPresent={}", token != null);
        if (token == null) {
            return null;
        }
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        AuthToken t = authTokenRepository.findById(token).orElse(null);
        if (t == null) {
            log.warn("getUserIdForToken: token not found");
            return null;
        }
        return String.valueOf(t.getUser().getId());
    }
}
