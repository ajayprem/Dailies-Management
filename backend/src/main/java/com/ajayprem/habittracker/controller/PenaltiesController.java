package com.ajayprem.habittracker.controller;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ajayprem.habittracker.dto.PenaltyDto;
import com.ajayprem.habittracker.service.BackendService;
import com.ajayprem.habittracker.util.CurrentUser;

@RestController
@RequestMapping("/api/penalties")
public class PenaltiesController {

    private static final Logger log = LoggerFactory.getLogger(PenaltiesController.class);

    @Autowired
    private BackendService svc;

    @GetMapping("")
    public ResponseEntity<?> getPenalties(@RequestHeader(value = "Authorization", required = false) String authorization) {
        Long userId = CurrentUser.id();
        log.info("PenaltiesController: getPenalties userId={}", userId);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        List<PenaltyDto> list = svc.getPenalties(userId);
        return ResponseEntity.ok(Map.of("penalties", list));
    }
}
