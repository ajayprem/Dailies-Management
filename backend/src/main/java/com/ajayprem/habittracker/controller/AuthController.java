package com.ajayprem.habittracker.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.ajayprem.habittracker.dto.AuthResponses;
import com.ajayprem.habittracker.dto.UserProfileDto;
import com.ajayprem.habittracker.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService svc;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String,Object> body) {
        log.info("AuthController: signup request body={}", body);
        String email = (String) body.get("email");
        String password = (String) body.get("password");
        String name = (String) body.get("name");
        AuthResponses r = svc.signup(email, password, name);
        if (r == null) return ResponseEntity.badRequest().body(Map.of("error","user exists"));
        return ResponseEntity.ok(r);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String,Object> body) {
        log.info("AuthController: login request body keys={}", body == null ? null : body.keySet());
        String email = (String) body.get("email");
        String password = (String) body.get("password");
        AuthResponses r = svc.login(email, password);
        if (r == null) return ResponseEntity.status(401).body(Map.of("error","invalid credentials"));
        log.info("AuthController: login succeeded for email={}", email);
        return ResponseEntity.ok(r);
    }

    @GetMapping("/profile")
    public ResponseEntity<?> profile() {
        log.info("AuthController: profile request");
        UserProfileDto p = svc.profile();
        if (p == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        return ResponseEntity.ok(Map.of("user", p));
    }
}
