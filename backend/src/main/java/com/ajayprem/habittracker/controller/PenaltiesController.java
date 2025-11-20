package com.ajayprem.habittracker.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ajayprem.habittracker.dto.PenaltyDto;
import com.ajayprem.habittracker.service.BackendService;

@RestController
@RequestMapping("/api/penalties")
public class PenaltiesController {

    @Autowired
    private BackendService svc;

    @GetMapping("")
    public ResponseEntity<?> getPenalties(@RequestHeader(value = "Authorization", required = false) String authorization) {
        String token = authorization != null && authorization.startsWith("Bearer ") ? authorization.substring(7) : null;
        String userId = svc.getUserIdForToken(token);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        List<PenaltyDto> list = svc.getPenalties(userId);
        return ResponseEntity.ok(Map.of("penalties", list));
    }
}
