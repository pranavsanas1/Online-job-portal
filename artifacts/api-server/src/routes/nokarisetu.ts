import { Router, type IRouter } from "express";
import { requireRole, type AuthUser } from "./auth";
import {
  CreateApplicationBody,
  CreateJobBody,
  GetDashboardQueryParams,
  ListApplicationsQueryParams,
  ListJobsQueryParams,
  ListUsersQueryParams,
  UpdateApplicationStatusBody,
  UpdateApplicationStatusParams,
  UpdateUserStatusBody,
  UpdateUserStatusParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const jobs = [
  {
    id: 1,
    title: "Senior Product Designer",
    company: "Kite Labs",
    location: "Bengaluru · Hybrid",
    type: "Full-time",
    salary: "₹18–24 LPA",
    posted: "2 days ago",
    applicants: 42,
    status: "active",
  },
  {
    id: 2,
    title: "Frontend Engineer",
    company: "Orbit Systems",
    location: "Remote · India",
    type: "Full-time",
    salary: "₹12–18 LPA",
    posted: "4 days ago",
    applicants: 68,
    status: "active",
  },
  {
    id: 3,
    title: "Marketing Intern",
    company: "Mango & Co.",
    location: "Mumbai · On-site",
    type: "Internship",
    salary: "₹25–35k / month",
    posted: "1 week ago",
    applicants: 21,
    status: "paused",
  },
];

const applications = [
  {
    id: 1,
    jobTitle: "Senior Product Designer",
    company: "Kite Labs",
    candidate: "Aarav Mehta",
    submitted: "Today, 10:42 AM",
    status: "pending",
    match: 96,
  },
  {
    id: 2,
    jobTitle: "Frontend Engineer",
    company: "Orbit Systems",
    candidate: "Ishita Nair",
    submitted: "Yesterday, 4:18 PM",
    status: "accepted",
    match: 91,
  },
  {
    id: 3,
    jobTitle: "Marketing Intern",
    company: "Mango & Co.",
    candidate: "Rohan Das",
    submitted: "Sep 21, 2026",
    status: "rejected",
    match: 68,
  },
];

const users = [
  {
    id: 1,
    name: "Aarav Mehta",
    email: "aarav.mehta@email.com",
    role: "seeker",
    joined: "Sep 24, 2026",
    status: "accepted",
  },
  {
    id: 2,
    name: "Kite Labs",
    email: "people@kitelabs.in",
    role: "recruiter",
    joined: "Sep 23, 2026",
    status: "pending",
  },
  {
    id: 3,
    name: "Orbit Systems",
    email: "hiring@orbitsystems.io",
    role: "recruiter",
    joined: "Sep 20, 2026",
    status: "accepted",
  },
];

const dashboardByRole = {
  seeker: {
    role: "seeker",
    headline: "Keep moving toward the work you want.",
    metrics: [
      { label: "Applications sent", value: "12", change: "+3 this week", tone: "positive" },
      { label: "Profile views", value: "48", change: "+18% this month", tone: "positive" },
      { label: "Shortlisted", value: "04", change: "2 need your reply", tone: "attention" },
    ],
    activity: [
      { id: 1, title: "Application viewed", detail: "Kite Labs opened your application", time: "18 min ago", tone: "positive" },
      { id: 2, title: "New match for you", detail: "Frontend Engineer at Orbit Systems", time: "2 hrs ago", tone: "neutral" },
      { id: 3, title: "Profile reminder", detail: "Add one more skill to improve your profile", time: "Yesterday", tone: "attention" },
    ],
  },
  recruiter: {
    role: "recruiter",
    headline: "Build the team that moves your company forward.",
    metrics: [
      { label: "Active openings", value: "08", change: "+2 this week", tone: "positive" },
      { label: "New applications", value: "46", change: "12 need review", tone: "attention" },
      { label: "Time to hire", value: "18d", change: "3 days faster", tone: "positive" },
    ],
    activity: [
      { id: 4, title: "New applications", detail: "12 candidates applied to your open roles", time: "32 min ago", tone: "attention" },
      { id: 5, title: "Interview scheduled", detail: "Ishita Nair · Frontend Engineer", time: "3 hrs ago", tone: "positive" },
      { id: 6, title: "Listing performance", detail: "Senior Product Designer is trending", time: "Yesterday", tone: "neutral" },
    ],
  },
  admin: {
    role: "admin",
    headline: "Keep NokariSetu useful, safe, and moving.",
    metrics: [
      { label: "Total users", value: "2,481", change: "+124 this month", tone: "positive" },
      { label: "Pending reviews", value: "17", change: "6 recruiters", tone: "attention" },
      { label: "Active listings", value: "684", change: "+8.4% this week", tone: "positive" },
    ],
    activity: [
      { id: 7, title: "Recruiter approval needed", detail: "Kite Labs is waiting for review", time: "12 min ago", tone: "attention" },
      { id: 8, title: "Listing reported", detail: "A job post was flagged for review", time: "1 hr ago", tone: "attention" },
      { id: 9, title: "Weekly growth", detail: "Seeker sign-ups are up 14%", time: "Yesterday", tone: "positive" },
    ],
  },
} as const;

router.get("/dashboard", (req, res) => {
  const { role } = GetDashboardQueryParams.parse(req.query);
  const user = res.locals.authUser as AuthUser;
  if (role !== user.role && user.role !== "admin") {
    res.status(403).json({ error: "You cannot view another role's dashboard" });
    return;
  }
  res.json(dashboardByRole[role]);
});

router.get("/jobs", (req, res) => {
  const query = ListJobsQueryParams.parse(req.query);
  const search = query.search?.toLowerCase();
  const filtered = jobs.filter((job) => {
    const matchesSearch =
      !search ||
      `${job.title} ${job.company} ${job.location}`.toLowerCase().includes(search);
    const matchesLocation = !query.location || job.location.includes(query.location);
    const matchesType = !query.type || job.type === query.type;
    return matchesSearch && matchesLocation && matchesType;
  });
  res.json(filtered);
});

router.post("/jobs", (req, res) => {
  if (!requireRole(res, "recruiter")) return;
  const body = CreateJobBody.parse(req.body);
  const job = {
    id: jobs.length + 1,
    ...body,
    posted: "Just now",
    applicants: 0,
    status: "active" as const,
  };
  jobs.unshift(job);
  res.status(201).json(job);
});

router.get("/applications", (req, res) => {
  const query = ListApplicationsQueryParams.parse(req.query);
  const user = res.locals.authUser as AuthUser;
  if (query.role !== user.role && user.role !== "admin") {
    res.status(403).json({ error: "You cannot view another role's applications" });
    return;
  }
  const filtered = query.status
    ? applications.filter((application) => application.status === query.status)
    : applications;
  res.json(filtered);
});

router.post("/applications", (req, res) => {
  if (!requireRole(res, "seeker")) return;
  const body = CreateApplicationBody.parse(req.body);
  const job = jobs.find((item) => item.id === body.jobId);
  const application = {
    id: applications.length + 1,
    jobTitle: job?.title ?? "New application",
    company: job?.company ?? "NokariSetu",
    candidate: body.candidate,
    submitted: "Just now",
    status: "pending" as const,
    match: 84,
  };
  applications.unshift(application);
  res.status(201).json(application);
});

router.patch("/applications/:id/status", (req, res) => {
  if (!requireRole(res, "recruiter")) return;
  const { id } = UpdateApplicationStatusParams.parse(req.params);
  const { status } = UpdateApplicationStatusBody.parse(req.body);
  const application = applications.find((item) => item.id === id);
  if (!application) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  application.status = status;
  res.json(application);
});

router.get("/users", (req, res) => {
  if (!requireRole(res, "admin")) return;
  const query = ListUsersQueryParams.parse(req.query);
  const filtered = query.status
    ? users.filter((user) => user.status === query.status)
    : users;
  res.json(filtered);
});

router.patch("/users/:id/status", (req, res) => {
  if (!requireRole(res, "admin")) return;
  const { id } = UpdateUserStatusParams.parse(req.params);
  const { status } = UpdateUserStatusBody.parse(req.body);
  const user = users.find((item) => item.id === id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  user.status = status;
  res.json(user);
});

export default router;