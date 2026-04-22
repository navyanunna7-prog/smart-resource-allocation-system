import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  doc,
  getDoc
} from "firebase/firestore";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase Config
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "firebase-applet-config.json"), "utf8"));
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- ML Logic (Rule-based) ---
  const predictUrgency = async (problemDescription: string, location: string) => {
    let urgencyScore = 0;

    // 1. Keyword check
    const keywords = ["water", "hospital", "emergency", "accident", "medical", "blood", "fire"];
    const lowercaseDesc = problemDescription.toLowerCase();
    keywords.forEach(word => {
      if (lowercaseDesc.includes(word)) urgencyScore += 2;
    });

    // 2. Location frequency check
    try {
      const needsRef = collection(db, "needs");
      const q = query(needsRef, where("location", "==", location));
      const querySnapshot = await getDocs(q);
      const reportCount = querySnapshot.size;

      if (reportCount >= 5) urgencyScore += 4;
      else if (reportCount >= 3) urgencyScore += 2;
      else if (reportCount >= 1) urgencyScore += 1;
    } catch (e) {
      console.error("Error frequency check:", e);
    }

    if (urgencyScore >= 5) return "HIGH";
    if (urgencyScore >= 3) return "MEDIUM";
    return "LOW";
  };

  // --- Volunteer Matching ---
  const matchVolunteers = async (location: string) => {
    const volunteersRef = collection(db, "volunteers");
    const q = query(
      volunteersRef, 
      where("location", "==", location),
      where("availability", "==", "Available")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.id);
  };

  // --- API Endpoints ---

  // Volunteer Registration
  app.post("/api/volunteer", async (req, res) => {
    try {
      const { name, phone, email, skills, location, availability } = req.body;
      const docRef = await addDoc(collection(db, "volunteers"), {
        name,
        phone,
        email,
        skills: skills || [],
        location,
        availability: availability || "Available"
      });
      res.status(201).json({ id: docRef.id, message: "Volunteer registered successfully!" });
    } catch (error) {
      res.status(500).json({ error: "Failed to register volunteer" });
    }
  });

  // Problem Reporting (with ML Prediction & Matching)
  app.post("/api/needs", async (req, res) => {
    try {
      const { name, phone, location, description, ngoUrgency } = req.body;

      // ML Urgency Prediction
      const predictedUrgency = await predictUrgency(description, location);

      // Match Volunteers
      const assignedVolunteers = await matchVolunteers(location);

      const docRef = await addDoc(collection(db, "needs"), {
        name,
        phone,
        location,
        description,
        ngoUrgency,
        predictedUrgency,
        assignedVolunteers,
        createdAt: Timestamp.now()
      });

      // TODO: Future Step - Send SMS/Email notifications here

      res.status(201).json({ 
        id: docRef.id, 
        predictedUrgency, 
        matchedCount: assignedVolunteers.length,
        message: "Need reported and processed!" 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to report issue" });
    }
  });

  // Get Volunteers
  app.get("/api/volunteers", async (req, res) => {
    const snapshot = await getDocs(collection(db, "volunteers"));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  });

  // Get Needs
  app.get("/api/needs", async (req, res) => {
    const snapshot = await getDocs(collection(db, "needs"));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  });

  // Dashboard Summary
  app.get("/api/dashboard", async (req, res) => {
    const needsSnapshot = await getDocs(collection(db, "needs"));
    const volunteersSnapshot = await getDocs(collection(db, "volunteers"));
    
    res.json({
      totalReports: needsSnapshot.size,
      totalVolunteers: volunteersSnapshot.size,
      recentNeeds: needsSnapshot.docs.map(doc => doc.data()).slice(-10)
    });
  });

  // Simulation NGO API
  app.get("/api/ngo-data", (req, res) => {
    res.json([
      { id: 1, name: "Hands Together NGO", location: "Downtown", urgencyRating: "MEDIUM" },
      { id: 2, name: "Green Earth", location: "Westside", urgencyRating: "LOW" },
      { id: 3, name: "Relief Now", location: "Eastside", urgencyRating: "HIGH" }
    ]);
  });

  // Vite setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
