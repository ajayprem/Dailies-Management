package com.ajayprem.habittracker.controller;

import java.util.List;
import java.util.Map;

import com.ajayprem.habittracker.dto.PenaltySummaryDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.ajayprem.habittracker.service.PenaltyService;
import com.ajayprem.habittracker.util.CurrentUser;

@RestController
@RequestMapping("/api/penalties")
public class PenaltiesController {

    private static final Logger log = LoggerFactory.getLogger(PenaltiesController.class);

    @Autowired
    private PenaltyService svc;

    @GetMapping("")
    public ResponseEntity<?> getPenalties() {
        Long userId = CurrentUser.id();
        log.info("PenaltiesController: getPenalties userId={}", userId);
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        PenaltySummaryDto list = svc.getPenaltySummary(userId);
        return ResponseEntity.ok(Map.of("penaltySummary", list));
    }

    @DeleteMapping("/{friendId}") 
    public ResponseEntity<?> deletePenalties(
            @PathVariable String friendId) {
        Long userId = CurrentUser.id();
        log.info("PenaltiesController: deletePenaltiesForTask userId={} taskId={}", userId, friendId);
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        boolean ok = svc.removePenalties(userId, Long.valueOf(friendId));
        return ResponseEntity.ok(Map.of("success", ok));
    }

}
