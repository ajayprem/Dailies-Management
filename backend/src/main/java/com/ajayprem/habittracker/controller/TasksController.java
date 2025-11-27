package com.ajayprem.habittracker.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ajayprem.habittracker.dto.TaskDto;
import com.ajayprem.habittracker.util.CurrentUser;
import com.ajayprem.habittracker.service.BackendService;

@RestController
@RequestMapping("/api/tasks")
public class TasksController {
    // --- New Feature: Retroactive Completion ---
    @PostMapping("/{taskId}/complete-for-date")
    public ResponseEntity<?> completeForDate(
                                             @PathVariable String taskId,
                                             @RequestBody Map<String, String> body) {
       Long userId = CurrentUser.id();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        String date = body.get("date");
        Map<String, Object> resp = svc.completeTaskForDate(userId, taskId, date);
        if (resp == null) return ResponseEntity.badRequest().body(Map.of("success", false));
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/{taskId}/uncomplete-for-date")
    public ResponseEntity<?> uncompleteForDate(
                                               @PathVariable String taskId,
                                               @RequestBody Map<String, String> body) {
        
       Long userId = CurrentUser.id();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        String date = body.get("date");
        boolean ok = svc.uncompleteTaskForDate(userId, taskId, date);
        return ResponseEntity.ok(Map.of("success", ok));
    }

    @Autowired
    private BackendService svc;

    @GetMapping("")
    public ResponseEntity<?> getTasks() {
        
       Long userId = CurrentUser.id();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        List<TaskDto> list = svc.getTasks(userId);
        return ResponseEntity.ok(Map.of("tasks", list));
    }

    @PostMapping("")
    public ResponseEntity<?> createTask(
                                        @RequestBody TaskDto body) {
        
       Long userId = CurrentUser.id();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        TaskDto created = svc.createTask(userId, body);
        return ResponseEntity.ok(Map.of("task", created));
    }

    @PostMapping("/{taskId}/complete")
    public ResponseEntity<?> complete(
                                      @PathVariable String taskId) {
        
       Long userId = CurrentUser.id();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        boolean ok = svc.completeTask(userId, taskId);
        return ResponseEntity.ok(Map.of("success", ok));
    }

    @PostMapping("/{taskId}/penalty")
    public ResponseEntity<?> penalty(
                                     @PathVariable String taskId) {
        
       Long userId = CurrentUser.id();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        Map<String,Object> resp = svc.applyTaskPenalty(userId, taskId);
        if (resp == null) return ResponseEntity.badRequest().body(Map.of("success", false));
        return ResponseEntity.ok(resp);
    }

    // --- New Feature: Task Reset (Uncomplete) ---
    @PostMapping("/{taskId}/uncomplete")
    public ResponseEntity<?> uncomplete(
                                        @PathVariable String taskId) {
        
       Long userId = CurrentUser.id();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        boolean ok = svc.uncompleteTask(userId, taskId);
        return ResponseEntity.ok(Map.of("success", ok));
    }

    // --- New Feature: Task Stats ---
    @GetMapping("/{taskId}/stats")
    public ResponseEntity<?> getStats(
                                      @PathVariable String taskId) {
        
       Long userId = CurrentUser.id();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        Map<String, Object> stats = svc.getTaskStats(userId, taskId);
        return ResponseEntity.ok(Map.of("stats", stats));
    }
}
