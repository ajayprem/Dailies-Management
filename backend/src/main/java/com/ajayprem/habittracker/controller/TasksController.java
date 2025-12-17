package com.ajayprem.habittracker.controller;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ajayprem.habittracker.dto.TaskDto;
import com.ajayprem.habittracker.service.TaskService;
import com.ajayprem.habittracker.util.CurrentUser;

@RestController
@RequestMapping("/api/tasks")
public class TasksController {

    private static final Logger log = LoggerFactory.getLogger(TasksController.class);

    @Autowired
    private TaskService taskService;

    @PostMapping("/{taskId}/complete-for-date")
    public ResponseEntity<?> completeForDate(
            @PathVariable String taskId,
            @RequestBody Map<String, String> body) {
        Long userId = CurrentUser.id();
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        String date = body.get("date");
        log.info("TasksController: completeForDate userId={} taskId={} date={}", userId, taskId, date);
        boolean ok = taskService.completeTaskForDate(userId, taskId, date);
        return ResponseEntity.ok(Map.of("success", ok));
    }

    @PostMapping("/{taskId}/uncomplete-for-date")
    public ResponseEntity<?> uncompleteForDate(
            @PathVariable String taskId,
            @RequestBody Map<String, String> body) {

        Long userId = CurrentUser.id();
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        String date = body.get("date");
        log.info("TasksController: uncompleteForDate userId={} taskId={} date={}", userId, taskId, date);
        boolean ok = taskService.uncompleteTaskForDate(userId, taskId, date);
        return ResponseEntity.ok(Map.of("success", ok));
    }

    @GetMapping("")
    public ResponseEntity<?> getTasks() {
        Long userId = CurrentUser.id();
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        log.info("TasksController: getTasks userId={}", userId);
        List<TaskDto> list = taskService.getTasks(userId);
        return ResponseEntity.ok(Map.of("tasks", list));
    }

    @PostMapping("")
    public ResponseEntity<?> createTask(
            @RequestBody TaskDto body) {

        Long userId = CurrentUser.id();
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        log.info("TasksController: createTask userId={} title={}", userId, body == null ? null : body.getTitle());
        TaskDto created = taskService.createTask(userId, body);
        if (created == null) {
            log.warn("TasksController: createTask failed for userId={}", userId);
            return ResponseEntity.badRequest().body(Map.of("error", "invalid task data"));
        }
        return ResponseEntity.ok(Map.of("task", created));
    }

    @PostMapping("/{taskId}/complete")
    public ResponseEntity<?> complete(
            @PathVariable String taskId) {

        Long userId = CurrentUser.id();
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        log.info("TasksController: complete userId={} taskId={}", userId, taskId);
        boolean ok = taskService.completeTask(userId, taskId);
        return ResponseEntity.ok(Map.of("success", ok));
    }

    @PostMapping("/{taskId}/penalty")
    public ResponseEntity<?> penalty(
            @PathVariable String taskId) {

        Long userId = CurrentUser.id();
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        log.info("TasksController: penalty userId={} taskId={}", userId, taskId);
        Map<String, Object> resp = taskService.applyTaskPenalty(userId, taskId);
        if (resp == null)
            return ResponseEntity.badRequest().body(Map.of("success", false));
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/{taskId}/uncomplete")
    public ResponseEntity<?> uncomplete(
            @PathVariable String taskId) {

        Long userId = CurrentUser.id();
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        log.info("TasksController: uncomplete userId={} taskId={}", userId, taskId);
        boolean ok = taskService.uncompleteTask(userId, taskId);
        return ResponseEntity.ok(Map.of("success", ok));
    }

    @GetMapping("/{taskId}/stats")
    public ResponseEntity<?> getStats(
            @PathVariable String taskId) {

        Long userId = CurrentUser.id();
        if (userId == null)
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        log.info("TasksController: getStats userId={} taskId={}", userId, taskId);
        Map<String, Object> stats = taskService.getTaskStats(userId, taskId);
        return ResponseEntity.ok(Map.of("stats", stats));
    }
}
