import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "job_bazaar_default_secret",
    resave: false,
    saveUninitialized: true, // Changed to true to persist session for all visitors
    store: storage.sessionStore,
    cookie: {
      secure: false, // Allow non-HTTPS in development
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("[express] Registration attempt:", req.body.username);
      
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log("[express] Username already exists:", req.body.username);
        return res.status(400).send("Username already exists");
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        isServiceProvider: true, // Set all users to be service providers by default
      });
      
      console.log("[express] User created:", user.id, user.username);

      req.login(user, (err) => {
        if (err) {
          console.log("[express] Login error after registration:", err);
          return next(err);
        }
        
        console.log("[express] User logged in after registration:", user.id);
        return res.status(201).json(user);
      });
    } catch (error) {
      console.error("[express] Registration error:", error);
      return res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  app.post("/api/user/onboarding", async (req, res) => {
    if (!req.isAuthenticated()) {
      console.log("[express] Unauthorized attempt to update onboarding status");
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      console.log("[express] Updating onboarding status for user:", req.user.id);
      
      const { completed } = req.body;
      if (typeof completed !== 'boolean') {
        console.log("[express] Invalid onboarding status:", completed);
        return res.status(400).json({ error: "The 'completed' field must be a boolean" });
      }
      
      const updatedUser = await storage.updateOnboardingStatus(req.user.id, completed);
      console.log("[express] Onboarding status updated:", updatedUser.onboardingCompleted);
      
      // Update the session
      req.login(updatedUser, (err) => {
        if (err) {
          console.log("[express] Error updating session:", err);
          throw err;
        }
        console.log("[express] Session updated successfully");
        
        // Set a secure flag in the response
        res.set('X-Onboarding-Updated', 'true');
        
        // Return the updated user
        res.json(updatedUser);
      });
    } catch (error) {
      console.error("[express] Error updating onboarding status:", error);
      res.status(500).json({ error: "Failed to update onboarding status" });
    }
  });
}
