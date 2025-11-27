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
import com.ajayprem.habittracker.service.BackendService;
import com.ajayprem.habittracker.util.CurrentUser;

@RestController
@RequestMapping("/api/friends")
public class FriendsController {

    @Autowired
    private BackendService svc;

    @PostMapping("/request")
    public ResponseEntity<?> requestFriend(
            @RequestBody Map<String, String> body) {
        Long fromUser = CurrentUser.id();
        String friendId = body.get("friendId");
        if (fromUser == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        boolean ok = svc.sendFriendRequest(fromUser, Long.valueOf(friendId));
        return ResponseEntity.ok(Map.of("success", ok));
    }

    @GetMapping("/requests")
    public ResponseEntity<?> getRequests() {
        Long userId = CurrentUser.id();
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        List<FriendRequest> list = svc.getFriendRequests(userId);
        List<Map<String, Object>> out = list.stream().map(fr -> {
            var from = fr.getFromUser();
            Map<String, Object> fromUser = Map.of(
                    "id", String.valueOf(from.getId()),
                    "name", from.getName(),
                    "email", from.getEmail());
            return Map.of(
                    "id", String.valueOf(fr.getId()),
                    "fromUserId", String.valueOf(fr.getFromUser().getId()),
                    "toUserId", String.valueOf(fr.getToUser().getId()),
                    "status", fr.getStatus(),
                    "createdAt", fr.getCreatedAt(),
                    "fromUser", fromUser);
        }).toList();
        return ResponseEntity.ok(Map.of("requests", out));
    }

    @PostMapping("/accept")
    public ResponseEntity<?> accept(
            @RequestBody Map<String, String> body) {
        Long userId =  CurrentUser.id();
        Long requestId = Long.valueOf(body.get("requestId"));
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        boolean ok = svc.acceptFriendRequest(userId, requestId);
        return ResponseEntity.ok(Map.of("success", ok));
    }

    @PostMapping("/delete")
    public ResponseEntity<?> deleteRequest(
            @RequestBody Map<String, String> body) {
        Long userId = CurrentUser.id();
        Long requestId = Long.valueOf(body.get("requestId"));
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        boolean ok = svc.deleteFriendRequest(userId, requestId);
        return ResponseEntity.ok(Map.of("success", ok));
    }

    @GetMapping("")
    public ResponseEntity<?> listFriends() {
        Long userId = CurrentUser.id();
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        List<UserProfileDto> list = svc.listFriends(userId);
        return ResponseEntity.ok(Map.of("friends", list));
    }
}
