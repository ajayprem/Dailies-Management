package com.ajayprem.habittracker.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ajayprem.habittracker.dto.ChallengeDto;
import com.ajayprem.habittracker.service.BackendService;

@RestController
@RequestMapping("/api/challenges")
public class ChallengesController {

    @Autowired
    private BackendService svc;

    @GetMapping("")
    public ResponseEntity<?> getChallenges(@RequestHeader(value = "Authorization", required = false) String authorization) {
        String token = authorization != null && authorization.startsWith("Bearer ") ? authorization.substring(7) : null;
        String userId = svc.getUserIdForToken(token);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        List<ChallengeDto> list = svc.getChallenges(userId);
        return ResponseEntity.ok(Map.of("challenges", list));
    }

    @PostMapping("")
    public ResponseEntity<?> create(@RequestHeader(value = "Authorization", required = false) String authorization,
                                    @RequestBody ChallengeDto body) {
        String token = authorization != null && authorization.startsWith("Bearer ") ? authorization.substring(7) : null;
        String userId = svc.getUserIdForToken(token);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        ChallengeDto created = svc.createChallenge(userId, body);
        return ResponseEntity.ok(Map.of("challenge", created));
    }

    @PostMapping("/{challengeId}/accept")
    public ResponseEntity<?> accept(@RequestHeader(value = "Authorization", required = false) String authorization,
                                    @PathVariable String challengeId) {
        String token = authorization != null && authorization.startsWith("Bearer ") ? authorization.substring(7) : null;
        String userId = svc.getUserIdForToken(token);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        boolean ok = svc.acceptChallenge(userId, challengeId);
        return ResponseEntity.ok(Map.of("success", ok));
    }

    @PostMapping("/{challengeId}/complete")
    public ResponseEntity<?> complete(@RequestHeader(value = "Authorization", required = false) String authorization,
                                      @PathVariable String challengeId) {
        String token = authorization != null && authorization.startsWith("Bearer ") ? authorization.substring(7) : null;
        String userId = svc.getUserIdForToken(token);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        boolean ok = svc.completeChallenge(userId, challengeId);
        return ResponseEntity.ok(Map.of("success", ok));
    }

    @PostMapping("/{challengeId}/penalty")
    public ResponseEntity<?> penalty(@RequestHeader(value = "Authorization", required = false) String authorization,
                                     @PathVariable String challengeId,
                                     @RequestBody Map<String,String> body) {
        String token = authorization != null && authorization.startsWith("Bearer ") ? authorization.substring(7) : null;
        String userId = svc.getUserIdForToken(token);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        String failedUserId = body.get("failedUserId");
        Map<String,Object> resp = svc.applyChallengePenalty(userId, challengeId, failedUserId);
        if (resp == null) return ResponseEntity.badRequest().body(Map.of("success", false));
        return ResponseEntity.ok(resp);
    }
}
