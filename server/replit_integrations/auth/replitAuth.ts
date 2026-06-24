import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../../email";
import { db } from "../../db";
import { employees } from "../../../shared/schema";
import { eq, sql } from "drizzle-orm";
import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
  skipSuccessfulRequests: true,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many password reset requests. Please try again in an hour." },
});

const isLocalDev = !process.env.REPL_ID && process.env.NODE_ENV !== "production";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  let databaseUrl = process.env.AWS_DATABASE_URL || process.env.DATABASE_URL;
  if (process.env.AWS_DATABASE_URL && !databaseUrl?.includes("sslmode=")) {
    databaseUrl = databaseUrl + (databaseUrl?.includes("?") ? "&" : "?") + "sslmode=no-verify";
  }
  const sessionStore = new pgStore({
    conString: databaseUrl,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: !isLocalDev,
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, cb) => cb(null, user.id));
  passport.deserializeUser(async (id, cb) => {
    try {
      const user = await authStorage.getUserById(id);
      if (user) {
        const { password, ...safeUser } = user;
        cb(null, safeUser);
      } else {
        cb(null, null);
      }
    } catch (err) {
      cb(err);
    }
  });

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          const user = await authStorage.getUserByEmail(email);
          if (!user) return done(null, false, { message: "Invalid email or password" });
          if (!user.password) return done(null, false, { message: "Please set up your password" });
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return done(null, false, { message: "Invalid email or password" });
          try {
            const [emp] = await db.select().from(employees).where(eq(employees.email, (user.email || "").toLowerCase().trim()));
            if (emp) {
              const status = (emp.status || emp.employmentStatus || "").toString().toLowerCase();
              const blockedStatuses = ["inactive", "terminated", "exited", "resigned", "separated"];
              if (blockedStatuses.includes(status)) {
                return done(null, false, { message: "Your account has been deactivated. Please contact HR." });
              }
            }
          } catch (e) {
            console.error("Login status check failed:", e);
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  app.post("/api/login", loginLimiter, (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return res.status(500).json({ message: "Login failed" });
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      req.login(user, (loginErr) => {
        if (loginErr) return res.status(500).json({ message: "Login failed" });
        return res.json({ success: true, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => { if (err) console.error("Logout error:", err); res.json({ success: true }); });
  });

  app.get("/api/logout", (req, res) => {
    req.logout((err) => { if (err) console.error("Logout error:", err); res.redirect("/login"); });
  });

  app.post("/api/forgot-password", forgotPasswordLimiter, async (req, res) => {
    const rawEmail = req.body?.email;
    try {
      if (!rawEmail) return res.status(400).json({ message: "Email is required" });
      const email = String(rawEmail).trim().toLowerCase();
      let user = await authStorage.getUserByEmail(email);
      if (!user) {
        const employeeRows = await db.select().from(employees).where(sql`LOWER(TRIM(${employees.email})) = ${email}`);
        const employee = employeeRows[0];
        if (employee) {
          try {
            user = await authStorage.createUser({ email: employee.email, firstName: employee.firstName ?? null, lastName: employee.lastName ?? null, password: null });
          } catch (createErr) {
            console.error("[ForgotPwd] auto-create failed:", createErr.message);
          }
        }
      }
      if (!user) return res.json({ success: true, message: "If an account with that email exists, a password reset link has been sent." });
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
      await authStorage.setResetToken(user.id, resetToken, resetTokenExpiry);
      const baseUrl = process.env.PRODUCTION_URL || process.env.APP_URL || (process.env.REPLIT_DOMAINS ? "https://" + process.env.REPLIT_DOMAINS.split(",")[0] : null) || "http://localhost:" + (process.env.PORT || 5000);
      const resetUrl = baseUrl + "/reset-password/" + resetToken;
      await sendPasswordResetEmail(email, resetUrl);
      res.json({ success: true, message: "If an account with that email exists, a password reset link has been sent." });
    } catch (error) {
      console.error("[ForgotPwd] error:", error.message);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  app.post("/api/reset-password/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
      if (!password || password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
      const user = await authStorage.getUserByResetToken(token);
      if (!user) return res.status(400).json({ message: "Invalid or expired reset link" });
      if (!user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) return res.status(400).json({ message: "Reset link has expired" });
      const hashedPassword = await bcrypt.hash(password, 10);
      await authStorage.updateUserPassword(user.id, hashedPassword);
      await authStorage.clearResetToken(user.id);
      res.json({ success: true, message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.get("/api/validate-reset-token/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const user = await authStorage.getUserByResetToken(token);
      if (!user || !user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) return res.json({ valid: false });
      res.json({ valid: true });
    } catch (error) {
      res.json({ valid: false });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    if (req.isAuthenticated() && req.user) {
      const user = req.user;
      const sess = req.session;
      try {
        const employee = await db.select().from(employees).where(eq(employees.email, user.email)).limit(1);
        const accessRole = employee.length > 0 ? (employee[0].accessRole || "employee") : "employee";
        return res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, accessRole, isImpersonating: !!sess.originalAdminId, originalAdmin: sess.originalAdminName || null });
      } catch (error) {
        console.error("Error fetching employee role:", error);
        return res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, accessRole: "employee", isImpersonating: !!sess.originalAdminId, originalAdmin: sess.originalAdminName || null });
      }
    }
    return res.status(401).json({ message: "Not authenticated" });
  });

  app.post("/api/admin/impersonate/:employeeId", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) return res.status(401).json({ message: "Unauthorized" });
    const adminUser = req.user;
    const sess = req.session;
    if (sess.originalAdminId) return res.status(400).json({ message: "Already impersonating. Stop current session first." });
    const adminEmployee = await db.select().from(employees).where(eq(employees.email, adminUser.email)).limit(1);
    const adminRole = adminEmployee[0]?.accessRole || "employee";
    const adminRoles = adminRole.split(",").map((r) => r.trim().toLowerCase());
    if (!adminRoles.includes("admin")) return res.status(403).json({ message: "Only admins can impersonate users." });
    const targetEmployeeId = Number(req.params.employeeId);
    const targetEmployee = await db.select().from(employees).where(eq(employees.id, targetEmployeeId)).limit(1);
    if (!targetEmployee[0]) return res.status(404).json({ message: "Employee not found" });
    const targetEmail = targetEmployee[0].email;
    let targetUser = await authStorage.getUserByEmail(targetEmail);
    if (!targetUser) {
      try {
        targetUser = await authStorage.createUser({ email: targetEmployee[0].email, firstName: targetEmployee[0].firstName ?? null, lastName: targetEmployee[0].lastName ?? null, password: null });
      } catch (e) {
        return res.status(400).json({ message: "Could not find or create a user account for this employee." });
      }
    }
    sess.originalAdminId = adminUser.id;
    sess.originalAdminName = ((adminUser.firstName || "") + " " + (adminUser.lastName || "")).trim() || adminUser.email;
    req.login(targetUser, (err) => {
      if (err) return res.status(500).json({ message: "Impersonation failed" });
      return res.json({ success: true, message: "Now viewing as " + (targetEmployee[0].firstName + " " + (targetEmployee[0].lastName || "")).trim(), impersonating: { email: targetUser.email, name: (targetEmployee[0].firstName + " " + (targetEmployee[0].lastName || "")).trim() } });
    });
  });

  app.post("/api/admin/stop-impersonation", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) return res.status(401).json({ message: "Unauthorized" });
    const sess = req.session;
    if (!sess.originalAdminId) return res.status(400).json({ message: "Not currently impersonating anyone." });
    const originalAdmin = await authStorage.getUserById(sess.originalAdminId);
    if (!originalAdmin) return res.status(404).json({ message: "Original admin account not found" });
    delete sess.originalAdminId;
    delete sess.originalAdminName;
    req.login(originalAdmin, (err) => {
      if (err) return res.status(500).json({ message: "Failed to restore admin session" });
      return res.json({ success: true, message: "Returned to admin session" });
    });
  });

  console.log("Custom email/password authentication enabled");
}

export const isAuthenticated = async (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ message: "Unauthorized" });
};

export function registerAuthRoutes(app) {}
