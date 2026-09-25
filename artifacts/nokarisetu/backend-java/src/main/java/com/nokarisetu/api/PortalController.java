package com.nokarisetu.api;

import com.nokarisetu.service.PortalService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class PortalController {
    private final PortalService portalService;

    public PortalController(PortalService portalService) {
        this.portalService = portalService;
    }

    @GetMapping("/healthz")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard(@RequestParam String role) {
        return portalService.dashboard(role);
    }

    @GetMapping("/jobs")
    public List<Map<String, Object>> jobs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String type) {
        return portalService.jobs(search, location, type);
    }

    @PostMapping("/jobs")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createJob(@Valid @RequestBody JobInput input) {
        return portalService.createJob(input);
    }

    @GetMapping("/applications")
    public List<Map<String, Object>> applications(
            @RequestParam String role,
            @RequestParam(required = false) String status) {
        return portalService.applications(status);
    }

    @PatchMapping("/applications/{id}/status")
    public Map<String, Object> updateApplicationStatus(
            @PathVariable int id,
            @Valid @RequestBody StatusInput input) {
        return portalService.updateApplicationStatus(id, input.status());
    }

    @GetMapping("/users")
    public List<Map<String, Object>> users(@RequestParam(required = false) String status) {
        return portalService.users(status);
    }

    @PatchMapping("/users/{id}/status")
    public Map<String, Object> updateUserStatus(
            @PathVariable int id,
            @Valid @RequestBody StatusInput input) {
        return portalService.updateUserStatus(id, input.status());
    }

    public record StatusInput(@NotBlank String status) {}

    public record JobInput(
            @NotBlank String title,
            @NotBlank String company,
            @NotBlank String location,
            @NotBlank String type,
            @NotBlank String salary) {}
}