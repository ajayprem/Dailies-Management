package com.ajayprem.habittracker.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.ajayprem.habittracker.dto.AuthResponses;
import com.ajayprem.habittracker.dto.UserProfileDto;
import com.ajayprem.habittracker.model.User;
import com.ajayprem.habittracker.repository.UserRepository;
import com.ajayprem.habittracker.util.CurrentUser;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public AuthResponses signup(String email, String password, String name) {
        log.info("signup: email={} name={}", email, name);
        if (userRepository.findByEmail(email).isPresent()) {
            log.warn("signup: user exists email={}", email);
            return null;
        }

        String encrptedPassword = passwordEncoder.encode(password);

        User user = User.builder()
                .name(name)
                .email(email)
                .password(encrptedPassword)
                .createdAt(String.valueOf(System.currentTimeMillis()))
                .build();

        userRepository.save(user);
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        log.info("signup: created user id={}", user.getId());
        return new AuthResponses(token, String.valueOf(user.getId()));
    }

    public AuthResponses login(String email, String password) {
        log.info("login: email={}", email);
        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isEmpty()) {
            log.warn("login: user not found email={}", email);
            return null;
        }

        User user = optionalUser.get();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            log.warn("login: invalid password for email={}", email);
            return null;
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        log.info("login: success userId={}", user.getId());
        return new AuthResponses(token, String.valueOf(user.getId()));
    }

    public UserProfileDto profile() {
        log.info("profile: request");
        final Long userId = CurrentUser.id();
        if (userId == null) {
            log.warn("profile: unauthorized");
            return null;
        }
        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return null;
        }

        User user = optionalUser.get();
        UserProfileDto dto = new UserProfileDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setName(user.getName());
        List<String> fr = new ArrayList<>();
        for (User f : user.getFriends()) {
            fr.add(String.valueOf(f.getId()));
        }
        dto.setFriends(fr);
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }

}
