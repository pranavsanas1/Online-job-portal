import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export type DemoRole = "seeker" | "recruiter" | "admin";

export type AuthUser = {
  email: string;
  name: string;
  role: DemoRole;
};

type DemoAccount = AuthUser & {
  salt: string;
  passwordHash: string;
};

const SESSION_COOKIE = "nokarisetu_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function createAccount(email: string, name: string, role: DemoRole, defaultSalt: string, defaultHash: string, environmentPassword?: string): DemoAccount {
  const salt = environmentPassword ? randomBytes(16).toString("hex") : defaultSalt;
  return {
    email,
    name,
    role,
    salt,
    passwordHash: environmentPassword ? scryptSync(environmentPassword, salt, 64).toString("hex") : defaultHash,
  };
}

const accounts: DemoAccount[] = [
  createAccount(
    "seeker@nokarisetu.in",
    "Maya Shah",
    "seeker",
    "nokarisetu-seeker-v1",
    "ef86791a3633249dd0223d2efd9e3fcfaee67f9800c1f0299fc2aaa0fdc7c4a6ee3a21c3cb5f51c29cbc3f23043b021e500d265bcacb73a78eb137f18119046c",
    process.env.NOKARISETU_SEEKER_PASSWORD,
  ),
  createAccount(
    "recruiter@nokarisetu.in",
    "Aarav Mehta",
    "recruiter",
    "nokarisetu-recruiter-v1",
    "12ae8b0fc5447157273f6e2a44ae0128f2c486fe3ee6ae5250a3ec43ef29aaa7688f4ddce976cc31aa8bcf9f4623d11e6e072a90c240a6ea47935bfa78d9f55e",
    process.env.NOKARISETU_RECRUITER_PASSWORD,
  ),
  createAccount(
    "admin@nokarisetu.in",
    "Nokari team",
    "admin",
    "nokarisetu-admin-v1",
    "b65801f436a855844e0f4e525b70a98bc05d5b958057a52ac6cc495b206f6972851ef75ad5ee5b23a3436c73a06ef2b5ee7b004d4f7d94273444a3ac76a4e842",
    process.env.NOKARISETU_ADMIN_PASSWORD,
  ),
];

const sessions = new Map<string, { user: AuthUser; expiresAt: number }>();
const router: IRouter = Router();

function publicUser(account: DemoAccount): AuthUser {
  return { email: account.email, name: account.name, role: account.role };
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
  };
}

export function getAuthenticatedUser(req: Request): AuthUser | undefined {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return undefined;
  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    if (session) sessions.delete(token);
    return undefined;
  }
  return session.user;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  res.locals.authUser = user;
  next();
}

export function requireRole(res: Response, role: DemoRole): AuthUser | undefined {
  const user = res.locals.authUser as AuthUser | undefined;
  if (!user || (user.role !== role && user.role !== "admin")) {
    res.status(403).json({ error: "You do not have permission for this action" });
    return undefined;
  }
  return user;
}

router.get("/auth/me", (req, res) => {
  res.set("Cache-Control", "no-store");
  const user = getAuthenticatedUser(req);
  res.json({ authenticated: Boolean(user), user: user ?? null });
});

router.post("/auth/login", (req, res) => {
  res.set("Cache-Control", "no-store");
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const account = accounts.find((candidate) => candidate.email === email);

  if (!account) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const submittedHash = scryptSync(password, account.salt, 64);
  const storedHash = Buffer.from(account.passwordHash, "hex");
  if (submittedHash.length !== storedHash.length || !timingSafeEqual(submittedHash, storedHash)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = randomBytes(32).toString("hex");
  sessions.set(token, { user: publicUser(account), expiresAt: Date.now() + SESSION_TTL_MS });
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
  res.json({ user: publicUser(account) });
});

router.post("/auth/logout", (req, res) => {
  res.set("Cache-Control", "no-store");
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) sessions.delete(token);
  res.clearCookie(SESSION_COOKIE, sessionCookieOptions());
  res.json({ success: true });
});

export default router;