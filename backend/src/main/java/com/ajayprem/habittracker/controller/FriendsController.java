package com.ajayprem.habittracker.controller;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ajayprem.habittracker.dto.UserProfileDto;
import com.ajayprem.habittracker.model.FriendRequest;
import com.ajayprem.habittracker.service.FriendService;
import com.ajayprem.habittracker.util.CurrentUser;

// Todo: dont send friend request to exisitng friends or pending requests

@RestController
@RequestMapping("/api/friends")
public class FriendsController {

    private static final Logger log = LoggerFactory.getLogger(FriendsController.class);

    @Autowired
    private FriendService friendService;

    @GetMapping("/search")
    public ResponseEntity<?> search(@RequestParam("search") String search) {
        log.info("FriendsController: search user={}", search);
        List<UserProfileDto> users = friendService.searchByEmail(search);
        return ResponseEntity.ok(Map.of("users", users));
    }

    @PostMapping("/request")
    public ResponseEntity<?> requestFriend(
            @RequestBody Map<String, String> body) {
        Long fromUser = CurrentUser.id();
        Long friendId =  Long.valueOf(body.get("friendId"));
        if (fromUser == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        log.info("FriendsController: requestFriend fromUser={} friendId={}", fromUser, friendId);
        boolean ok = friendService.sendFriendRequest(fromUser, friendId);
        return ResponseEntity.ok(Map.of("success", ok));
    }

    @GetMapping("/requests")
    public ResponseEntity<?> getRequests() {
        Long userId = CurrentUser.id();
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        log.info("FriendsController: getRequests userId={}", userId);
        List<FriendRequest> list = friendService.getFriendRequests(userId);
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
        Long fromUserId = Long.valueOf(body.get("fromUserId"));
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        log.info("FriendsController: accept userId={} fromUserId={}", userId, fromUserId);
        boolean ok = friendService.acceptFriendRequest(userId, fromUserId);
        return ResponseEntity.ok(Map.of("success", ok));
    }

    @PostMapping("/delete")
    public ResponseEntity<?> deleteRequest(
            @RequestBody Map<String, String> body) {
        Long userId = CurrentUser.id();
        Long fromUserId = Long.valueOf(body.get("fromUserId"));
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        log.info("FriendsController: deleteRequest userId={} fromUserId={}", userId, fromUserId);
        boolean ok = friendService.deleteFriendRequest(userId, fromUserId);
        return ResponseEntity.ok(Map.of("success", ok));
    }

    @GetMapping("")
    public ResponseEntity<?> listFriends() {
        Long userId = CurrentUser.id();
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        log.info("FriendsController: listFriends userId={}", userId);
        List<UserProfileDto> list = friendService.listFriends(userId);
        return ResponseEntity.ok(Map.of("friends", list));
    }

    @GetMapping("/sent-requests")
    public ResponseEntity<?> getSentRequests() {
        Long userId = CurrentUser.id();
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        log.info("FriendsController: getSentRequests userId={}", userId);
        List<FriendRequest> list = friendService.getSentFriendRequests(userId);
        List<Map<String, String>> out = list.stream().map(fr -> {
            var to = fr.getToUser();
            return Map.of(
                    "id", String.valueOf(fr.getId()),
                    "name", to.getName(),
                    "email", to.getEmail());
        }).toList();
        return ResponseEntity.ok(Map.of("requests", out));
    }

    @PostMapping("/remove")
    public ResponseEntity<?> removeFriend(
            @RequestBody Map<String, String> body) {
        Long userId = CurrentUser.id();
        Long friendId = Long.valueOf(body.get("friendId"));
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        log.info("FriendsController: delete friend userId={} fromUserId={}", userId, friendId);
        boolean ok = friendService.removeFriend(userId, friendId);
        return ResponseEntity.ok(Map.of("success", ok));
    }
}
