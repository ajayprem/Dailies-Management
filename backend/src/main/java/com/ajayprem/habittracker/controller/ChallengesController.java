package com.ajayprem.habittracker.controller;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ajayprem.habittracker.dto.ChallengeDto;
import com.ajayprem.habittracker.service.BackendService;
import com.ajayprem.habittracker.util.CurrentUser;

@RestController
@RequestMapping("/api/challenges")
public class ChallengesController {

    private static final Logger log = LoggerFactory.getLogger(ChallengesController.class);

    @Autowired
    private BackendService svc;

    @GetMapping("")
    public ResponseEntity<?> getChallenges() {
        final Long userId = CurrentUser.id();
        log.info("ChallengesController: getChallenges userId={}", userId);
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        List<ChallengeDto> list = svc.getChallenges(userId);
        return ResponseEntity.ok(Map.of("challenges", list));
    }

    @PostMapping("")
    public ResponseEntity<?> create(
            @RequestBody ChallengeDto body) {
        final Long userId = CurrentUser.id();
        log.info("ChallengesController: create userId={} title={}", userId, body == null ? null : body.getTitle());
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        ChallengeDto created = svc.createChallenge(userId, body);
        return ResponseEntity.ok(Map.of("challenge", created));
    }

    @PostMapping("/{challengeId}/accept")
    public ResponseEntity<?> accept(
            @PathVariable String challengeId) {
        final Long userId = CurrentUser.id();
        log.info("ChallengesController: accept userId={} challengeId={}", userId, challengeId);
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        boolean ok = svc.acceptChallenge(userId, challengeId);
        return ResponseEntity.ok(Map.of("success", ok));
    }

    @PostMapping("/{challengeId}/complete")
    public ResponseEntity<?> complete(
            @PathVariable String challengeId) {
        final Long userId = CurrentUser.id();
        log.info("ChallengesController: complete userId={} challengeId={}", userId, challengeId);
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        boolean ok = svc.completeChallenge(userId, challengeId);
        return ResponseEntity.ok(Map.of("success", ok));
    }

    @PostMapping("/{challengeId}/penalty")
    public ResponseEntity<?> penalty(
            @PathVariable String challengeId,
            @RequestBody Map<String, String> body) {
        final Long userId = CurrentUser.id();
        String failedUserId = body.get("failedUserId");
        log.info("ChallengesController: penalty userId={} challengeId={} failedUserId={}", userId, challengeId, failedUserId);
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        Map<String, Object> resp = svc.applyChallengePenalty(userId, challengeId, failedUserId);
        if (resp == null)
            return ResponseEntity.badRequest().body(Map.of("success", false));
        return ResponseEntity.ok(resp);
    }
}
