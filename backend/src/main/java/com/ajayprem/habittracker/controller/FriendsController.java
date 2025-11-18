package com.ajayprem.habittracker.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ajayprem.habittracker.dto.UserProfileDto;
import com.ajayprem.habittracker.model.FriendRequest;
import com.ajayprem.habittracker.service.InMemoryBackendService;

@RestController
@RequestMapping("/api/friends")
public class FriendsController {

    @Autowired
    private InMemoryBackendService svc;

    @PostMapping("/request")
    public ResponseEntity<?> requestFriend(@RequestHeader(value = "Authorization", required = false) String authorization,
                                           @RequestBody Map<String,String> body) {
        String token = authorization != null && authorization.startsWith("Bearer ") ? authorization.substring(7) : null;
        String fromUser = svc.getUserIdForToken(token);
        String friendId = body.get("friendId");
        if (fromUser == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        boolean ok = svc.sendFriendRequest(fromUser, friendId);
        return ResponseEntity.ok(Map.of("success", ok));
    }

    @GetMapping("/requests")
    public ResponseEntity<?> getRequests(@RequestHeader(value = "Authorization", required = false) String authorization) {
        String token = authorization != null && authorization.startsWith("Bearer ") ? authorization.substring(7) : null;
        String userId = svc.getUserIdForToken(token);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        List<FriendRequest> list = svc.getFriendRequests(userId);
        List<Map<String,Object>> out = list.stream().map(fr -> {
            var from = fr.getFromUser();
            Map<String,Object> fromUser = Map.of(
                "id", String.valueOf(from.getId()),
                "name", from.getName(),
                "email", from.getEmail()
            );
            return Map.of(
                "id", String.valueOf(fr.getId()),
                "fromUserId", String.valueOf(fr.getFromUser().getId()),
                "toUserId", String.valueOf(fr.getToUser().getId()),
                "status", fr.getStatus(),
                "createdAt", fr.getCreatedAt(),
                "fromUser", fromUser
            );
        }).toList();
        return ResponseEntity.ok(Map.of("requests", out));
    }

    @PostMapping("/accept")
    public ResponseEntity<?> accept(@RequestHeader(value = "Authorization", required = false) String authorization,
                                    @RequestBody Map<String,String> body) {
        String token = authorization != null && authorization.startsWith("Bearer ") ? authorization.substring(7) : null;
        String userId = svc.getUserIdForToken(token);
        String requestId = body.get("requestId");
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        boolean ok = svc.acceptFriendRequest(userId, requestId);
        return ResponseEntity.ok(Map.of("success", ok));
    }

    @GetMapping("")
    public ResponseEntity<?> listFriends(@RequestHeader(value = "Authorization", required = false) String authorization) {
        String token = authorization != null && authorization.startsWith("Bearer ") ? authorization.substring(7) : null;
        String userId = svc.getUserIdForToken(token);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        List<UserProfileDto> list = svc.listFriends(userId);
        return ResponseEntity.ok(Map.of("friends", list));
    }
}
