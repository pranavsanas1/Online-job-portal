package com.nokarisetu.service;

import com.nokarisetu.api.PortalController.JobInput;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class PortalService {
    private final AtomicInteger nextJobId = new AtomicInteger(4);
    private final List<Map<String, Object>> jobs = new ArrayList<>(List.of(
            job(1, "Senior Product Designer", "Kite Labs", "Bengaluru · Hybrid", "Full-time", "₹18–24 LPA", "2 days ago", 42, "active"),
            job(2, "Frontend Engineer", "Orbit Systems", "Remote · India", "Full-time", "₹12–18 LPA", "4 days ago", 68, "active"),
            job(3, "Marketing Intern", "Mango & Co.", "Mumbai · On-site", "Internship", "₹25–35k / month", "1 week ago", 21, "paused")
    ));

    private final List<Map<String, Object>> applications = new ArrayList<>(List.of(
            application(1, "Senior Product Designer", "Kite Labs", "Aarav Mehta", "Today, 10:42 AM", "pending", 96),
            application(2, "Frontend Engineer", "Orbit Systems", "Ishita Nair", "Yesterday, 4:18 PM", "accepted", 91),
            application(3, "Marketing Intern", "Mango & Co.", "Rohan Das", "Sep 21, 2026", "rejected", 68)
    ));

    private final List<Map<String, Object>> users = new ArrayList<>(List.of(
            user(1, "Aarav Mehta", "aarav.mehta@email.com", "seeker", "Sep 24, 2026", "accepted"),
            user(2, "Kite Labs", "people@kitelabs.in", "recruiter", "Sep 23, 2026", "pending"),
            user(3, "Orbit Systems", "hiring@orbitsystems.io", "recruiter", "Sep 20, 2026", "accepted")
    ));

    public synchronized List<Map<String, Object>> jobs(String search, String location, String type) {
        return jobs.stream().filter(job -> {
            String text = (job.get("title") + " " + job.get("company") + " " + job.get("location")).toLowerCase();
            return (search == null || text.contains(search.toLowerCase()))
                    && (location == null || job.get("location").toString().contains(location))
                    && (type == null || job.get("type").equals(type));
        }).toList();
    }

    public synchronized Map<String, Object> createJob(JobInput input) {
        Map<String, Object> created = job(nextJobId.getAndIncrement(), input.title(), input.company(),
                input.location(), input.type(), input.salary(), "Just now", 0, "active");
        jobs.add(0, created);
        return created;
    }

    public Map<String, Object> dashboard(String role) {
        return Map.of("role", role, "headline", "Keep NokariSetu useful, safe, and moving.",
                "metrics", List.of(Map.of("label", "Active listings", "value", "684", "change", "+8.4% this week", "tone", "positive")),
                "activity", List.of(Map.of("id", 1, "title", "Platform activity", "detail", "Your NokariSetu workspace is up to date", "time", "Just now", "tone", "neutral")));
    }

    public synchronized List<Map<String, Object>> applications(String status) {
        return status == null ? List.copyOf(applications) : applications.stream().filter(item -> item.get("status").equals(status)).toList();
    }

    public synchronized Map<String, Object> updateApplicationStatus(int id, String status) {
        return applications.stream().filter(item -> item.get("id").equals(id)).findFirst()
                .map(item -> { item.put("status", status); return item; })
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
    }

    public synchronized List<Map<String, Object>> users(String status) {
        return status == null ? List.copyOf(users) : users.stream().filter(item -> item.get("status").equals(status)).toList();
    }

    public synchronized Map<String, Object> updateUserStatus(int id, String status) {
        return users.stream().filter(item -> item.get("id").equals(id)).findFirst()
                .map(item -> { item.put("status", status); return item; })
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private static Map<String, Object> job(int id, String title, String company, String location,
                                           String type, String salary, String posted, int applicants, String status) {
        return new HashMap<>(Map.of("id", id, "title", title, "company", company, "location", location,
                "type", type, "salary", salary, "posted", posted, "applicants", applicants, "status", status));
    }

    private static Map<String, Object> application(int id, String jobTitle, String company, String candidate,
                                                    String submitted, String status, int match) {
        return new HashMap<>(Map.of("id", id, "jobTitle", jobTitle, "company", company, "candidate", candidate,
                "submitted", submitted, "status", status, "match", match));
    }

    private static Map<String, Object> user(int id, String name, String email, String role, String joined, String status) {
        return new HashMap<>(Map.of("id", id, "name", name, "email", email, "role", role, "joined", joined, "status", status));
    }
}