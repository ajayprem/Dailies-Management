package com.ajayprem.habittracker.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public AuthResponses signup(String email, String password, String name) {
        if (userRepository.findByEmail(email).isPresent()) {
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

        return new AuthResponses(token, String.valueOf(user.getId()));
    }

    public AuthResponses login(String email, String password) {
        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isEmpty()) {
            return null;
        }

        User user = optionalUser.get();
        if (passwordEncoder.matches(password, user.getPassword())) {
            return null;
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        
        return new AuthResponses(token, String.valueOf(user.getId()));
    }

    public UserProfileDto profile() {
        final Long userId = CurrentUser.id();
        if (userId == null) {
            return null;
        }
        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return null;
        }

        User user = optionalUser.get();
        UserProfileDto dto = new UserProfileDto();
        dto.setId(String.valueOf(user.getId()));
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
