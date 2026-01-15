package com.ajayprem.habittracker.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ajayprem.habittracker.dto.UserProfileDto;
import com.ajayprem.habittracker.model.FriendRequest;
import com.ajayprem.habittracker.model.FriendRequestKey;
import com.ajayprem.habittracker.model.User;
import com.ajayprem.habittracker.repository.FriendRequestRepository;
import com.ajayprem.habittracker.repository.UserRepository;
import com.ajayprem.habittracker.util.CurrentUser;

@Service
public class FriendService {
    private static final Logger log = LoggerFactory.getLogger(FriendService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FriendRequestRepository friendRequestRepository;

    public List<UserProfileDto> searchByEmail(String query) {
        final Long userId = CurrentUser.id();
        log.info("searchByEmail: query='{}' userId='{}'", query, userId);
        
        List<UserProfileDto> out = new ArrayList<>();
        Set<Long> seen = new HashSet<>();
        if (userId != null) {
            seen.add(userId);
        }

        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return null;
        }

        User user = optionalUser.get();

        for (User friend : user.getFriends()) {
            seen.add(friend.getId());
        }

        List<FriendRequest> sentRequests = getSentFriendRequests(userId);
        for (FriendRequest fr : sentRequests) {
            seen.add(fr.getToUser().getId());
        }

        List<FriendRequest> receivedRequests = getFriendRequests(userId);
        for (FriendRequest fr : receivedRequests) {
            seen.add(fr.getFromUser().getId());
        }

        List<User> users = userRepository.findByEmailContaining(query);
        for (User u : users) {
            if (!seen.contains(u.getId())) {
                UserProfileDto d = new UserProfileDto();
                d.setId(u.getId());
                d.setEmail(u.getEmail());
                d.setName(u.getName());
                out.add(d);
                seen.add(u.getId());
            }
        }

        users = userRepository.findByNameContainingIgnoreCase(query);
        for (User u : users) {
            if (!seen.contains(u.getId())) {
                UserProfileDto d = new UserProfileDto();
                d.setId(u.getId());
                d.setEmail(u.getEmail());
                d.setName(u.getName());
                out.add(d);
            }
        }
        return out;
    }

    public List<FriendRequest> getSentFriendRequests(Long uid) {
        log.info("getSentFriendRequests: uid={}", uid);
        return friendRequestRepository.findByFromUserId(uid);
    }

    public List<FriendRequest> getFriendRequests(Long uid) {
        log.info("getFriendRequests: uid={}", uid);
        return friendRequestRepository.findByToUserId(uid);
    }

     public List<UserProfileDto> listFriends(Long uid) {
        log.info("listFriends: uid={}", uid);
        Optional<User> ou = userRepository.findById(uid);
        if (ou.isEmpty()) {
            log.warn("listFriends: user not found: {}", uid);
            return Collections.emptyList();
        }
        List<UserProfileDto> out = new ArrayList<>();
        for (User f : ou.get().getFriends()) {
            UserProfileDto d = new UserProfileDto();
            d.setId(f.getId());
            d.setName(f.getName());
            d.setEmail(f.getEmail());
            out.add(d);
        }
        return out;
    }

    public boolean sendFriendRequest(Long fromId, Long friendId) {
        log.info("sendFriendRequest: fromId={} friendId={}", fromId, friendId);
        if (fromId.equals(friendId)) {
            log.warn("sendFriendRequest: cannot send request to self: {}", fromId);
            return false;
        }
        Optional<User> of = userRepository.findById(fromId);
        Optional<User> ofr = userRepository.findById(friendId);
        if (of.isEmpty() || ofr.isEmpty()) {
            log.warn("sendFriendRequest: one of users not found (fromId={}, friendId={})", fromId, friendId);
            return false;
        }

        FriendRequestKey key = new FriendRequestKey();
        key.setFromUserId(of.get().getId());
        key.setToUserId(ofr.get().getId());

        FriendRequest fr = new FriendRequest();
        fr.setId(key);
        fr.setFromUser(of.get());
        fr.setToUser(ofr.get());
        fr.setStatus("pending");
        fr.setCreatedAt(Instant.now().toString());
        friendRequestRepository.save(fr);
        log.info("sendFriendRequest: saved friend request id={}", fr.getId());
        return true;
    }

    public boolean acceptFriendRequest(Long uid, Long fromUserId) {
        log.info("acceptFriendRequest: uid={} fromUserId={}", uid, fromUserId);
        FriendRequestKey key = new FriendRequestKey();
        key.setFromUserId(fromUserId);
        key.setToUserId(uid);
        Optional<FriendRequest> ofr = friendRequestRepository.findById(key);
        if (ofr.isEmpty()) {
            log.warn("acceptFriendRequest: request not found for fromUserId={} toUserId={}", fromUserId, uid);
            return false;
        }
        FriendRequest fr = ofr.get();
        if (!Objects.equals(fr.getToUser().getId(), uid)) {
            log.warn("acceptFriendRequest: user {} is not the recipient of request", uid);
            return false;
        }
        User a = fr.getToUser();
        User b = fr.getFromUser();
        a.getFriends().add(b);
        b.getFriends().add(a);
        userRepository.save(a);
        userRepository.save(b);
        friendRequestRepository.delete(fr);
        log.info("acceptFriendRequest: users {} and {} are now friends", a.getId(), b.getId());
        return true;
    }

    public boolean deleteFriendRequest(Long uid, Long fromUserId) {
        log.info("deleteFriendRequest: uid={} fromUserId={}", uid, fromUserId);
        FriendRequestKey key = new FriendRequestKey();
        key.setFromUserId(fromUserId);
        key.setToUserId(uid);
        Optional<FriendRequest> ofr = friendRequestRepository.findById(key);
        if (ofr.isEmpty()) {
            log.warn("deleteFriendRequest: request not found for fromUserId={} toUserId={}", fromUserId, uid);
            return false;
        }
        FriendRequest fr = ofr.get();
        // Only the sender or the recipient may delete the request
        Long fromIdStr = fr.getFromUser().getId();
        Long toIdStr = fr.getToUser().getId();
        if (!Objects.equals(uid, fromIdStr) && !Objects.equals(uid, toIdStr)) {
            log.warn("deleteFriendRequest: uid {} not allowed to delete request", uid);
            return false;
        }
        friendRequestRepository.delete(fr);
        log.info("deleteFriendRequest: deleted request");
        return true;
    }

    @Transactional
    public boolean removeFriend(Long uid, Long friendId) {
        log.info("removeFriend: uid={} friendId={}", uid, friendId);
        Optional<User> ou = userRepository.findById(uid);
        Optional<User> of = userRepository.findById(friendId);
        if (ou.isEmpty() || of.isEmpty()) {
            log.warn("removeFriend: one of users not found (uid={}, friendId={})", uid, friendId);
            return false;
        }
        User u = ou.get();
        User f = of.get();
        if (!u.getFriends().contains(f)) {
            log.warn("removeFriend: users are not friends (uid={}, friendId={})", uid, friendId);
            return false;
        }
        u.getFriends().remove(f);
        f.getFriends().remove(u);
        userRepository.save(u);
        userRepository.save(f);
        log.info("removeFriend: users {} and {} are no longer friends", uid, friendId);
        return true;
    }
}
