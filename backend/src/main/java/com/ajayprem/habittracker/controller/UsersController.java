package com.ajayprem.habittracker.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ajayprem.habittracker.dto.UserProfileDto;
import com.ajayprem.habittracker.service.InMemoryBackendService;

@RestController
@RequestMapping("/api/users")
public class UsersController {

    @Autowired
    private InMemoryBackendService svc;

    @GetMapping("/search")
    public ResponseEntity<?> search(@RequestParam("email") String email) {
        List<UserProfileDto> users = svc.searchByEmail(email);
        return ResponseEntity.ok(Map.of("users", users));
    }
}
