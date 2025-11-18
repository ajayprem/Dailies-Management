package com.ajayprem.habittracker.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ajayprem.habittracker.dto.AuthResponses;
import com.ajayprem.habittracker.dto.UserProfileDto;
import com.ajayprem.habittracker.service.InMemoryBackendService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private InMemoryBackendService svc;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String,Object> body) {
        String email = (String) body.get("email");
        String password = (String) body.get("password");
        String name = (String) body.get("name");
        AuthResponses r = svc.signup(email, password, name);
        if (r == null) return ResponseEntity.badRequest().body(Map.of("error","user_exists"));
        return ResponseEntity.ok(r);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String,Object> body) {
        String email = (String) body.get("email");
        String password = (String) body.get("password");
        AuthResponses r = svc.login(email, password);
        if (r == null) return ResponseEntity.status(401).body(Map.of("error","invalid_credentials"));
        return ResponseEntity.ok(r);
    }

    @GetMapping("/profile")
    public ResponseEntity<?> profile(@RequestHeader(value = "Authorization", required = false) String authorization) {
        String token = null;
        if (authorization != null && authorization.startsWith("Bearer ")) token = authorization.substring(7);
        UserProfileDto p = svc.profileForToken(token);
        if (p == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        return ResponseEntity.ok(Map.of("user", p));
    }
}
