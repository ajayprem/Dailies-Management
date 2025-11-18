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
import com.ajayprem.habittracker.service.InMemoryBackendService;

@RestController
@RequestMapping("/api/tasks")
public class TasksController {

    @Autowired
    private InMemoryBackendService svc;

    @GetMapping("")
    public ResponseEntity<?> getTasks(@RequestHeader(value = "Authorization", required = false) String authorization) {
        String token = authorization != null && authorization.startsWith("Bearer ") ? authorization.substring(7) : null;
        String userId = svc.getUserIdForToken(token);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        List<TaskDto> list = svc.getTasks(userId);
        return ResponseEntity.ok(Map.of("tasks", list));
    }

    @PostMapping("")
    public ResponseEntity<?> createTask(@RequestHeader(value = "Authorization", required = false) String authorization,
                                        @RequestBody TaskDto body) {
        String token = authorization != null && authorization.startsWith("Bearer ") ? authorization.substring(7) : null;
        String userId = svc.getUserIdForToken(token);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        TaskDto created = svc.createTask(userId, body);
        return ResponseEntity.ok(Map.of("task", created));
    }

    @PostMapping("/{taskId}/complete")
    public ResponseEntity<?> complete(@RequestHeader(value = "Authorization", required = false) String authorization,
                                      @PathVariable String taskId) {
        String token = authorization != null && authorization.startsWith("Bearer ") ? authorization.substring(7) : null;
        String userId = svc.getUserIdForToken(token);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        boolean ok = svc.completeTask(userId, taskId);
        return ResponseEntity.ok(Map.of("success", ok));
    }

    @PostMapping("/{taskId}/penalty")
    public ResponseEntity<?> penalty(@RequestHeader(value = "Authorization", required = false) String authorization,
                                     @PathVariable String taskId) {
        String token = authorization != null && authorization.startsWith("Bearer ") ? authorization.substring(7) : null;
        String userId = svc.getUserIdForToken(token);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        Map<String,Object> resp = svc.applyTaskPenalty(userId, taskId);
        if (resp == null) return ResponseEntity.badRequest().body(Map.of("success", false));
        return ResponseEntity.ok(resp);
    }
}
