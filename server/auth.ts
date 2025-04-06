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
    resave: true, // Needed to ensure sessions are saved for longer sessions
    saveUninitialized: true, // This allows guest sessions
    rolling: true, // Reset expiration with each request
    store: storage.sessionStore,
    name: 'job_bazaar_session', // Custom name to avoid using default connect.sid
    cookie: {
      secure: false, // Set to false to work in development environment without HTTPS
      httpOnly: true, // Prevent client JS from reading
      sameSite: 'lax', // Provides CSRF protection while allowing some cross-site requests
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds for better persistence
      path: '/' // Ensure cookie is available throughout the site
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
    try {
      const user = await storage.getUser(id);
      if (!user) {
        console.log(`[express] User not found during deserialization: ${id}`);
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error(`[express] Error deserializing user ${id}:`, error);
      done(error, null);
    }
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

  app.post("/api/login", passport.authenticate("local"), async (req: any, res) => {
    try {
      // Passport guarantees that req.user exists after successful authentication
      // But we'll double check to be safe
      if (!req.user) {
        console.error("[express] User authenticated but req.user is undefined");
        return res.status(500).json({ error: "Authentication error" });
      }
      
      // Update the user's last seen timestamp
      const userId = req.user.id;
      console.log("[express] Updating last seen for user:", userId);
      const updatedUser = await storage.updateUserLastSeen(userId);
      
      // Update the session with the latest user data
      req.login(updatedUser, (err: any) => {
        if (err) {
          console.error("[express] Error updating session after login:", err);
          return res.status(500).json({ error: "Session update failed" });
        }
        
        console.log("[express] User logged in and session updated:", updatedUser.id);
        return res.status(200).json(updatedUser);
      });
    } catch (error) {
      console.error("[express] Error updating user lastSeen:", error);
      // Still return the user object even if the lastSeen update fails
      if (req.user) {
        return res.status(200).json(req.user);
      } else {
        return res.status(500).json({ error: "Session error" });
      }
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req: any, res) => {
    if (!req.isAuthenticated()) {
      console.log("[express] Unauthenticated attempt to access /api/user");
      return res.sendStatus(401);
    }
    
    if (!req.user) {
      console.error("[express] User authenticated but req.user is undefined");
      return res.status(500).json({ error: "Session error" });
    }
    
    res.json(req.user);
  });

  app.post("/api/user/onboarding", async (req: any, res) => {
    if (!req.isAuthenticated() || !req.user) {
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
      
      // Update the session with the new user data
      req.login(updatedUser, (err: any) => {
        if (err) {
          console.log("[express] Error updating session:", err);
          return res.status(500).json({ error: "Session update failed" });
        }
        
        console.log("[express] Session updated successfully with new onboarding status");
        
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
