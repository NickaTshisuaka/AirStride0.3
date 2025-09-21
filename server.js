// server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";

import aiRouter from "./routes/ai.js";
import User from "./models/User.js";
import Product from "./models/Product.js";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/auth.js";

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || "superSecretKey";

const app = express();
app.use(express.json());

// ------------------- CORS CONFIG -------------------
const allowedOrigins = [
  "http://localhost:5173", // local Vite dev
  "http://127.0.0.1:5173", // alternative localhost
  "http://www.airstride.co.za", // production domain
  "http://www.airstride.co.za.s3-website-us-east-1.amazonaws.com", // S3 hosted site
  "http://98.89.166.198", // Elastic IP
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow non-browser requests
      if (!allowedOrigins.includes(origin)) {
        const msg = `CORS policy does not allow access from: ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// ------------------- SERVE UPLOADS -------------------
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ------------------- ROUTES -------------------
app.use("/api/ai", aiRouter);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

// ------------------- JWT HELPERS -------------------
const generateToken = (user) =>
  jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: "1h",
  });

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }
  try {
    const token = authHeader.split(" ")[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// ------------------- FILE UPLOAD -------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ------------------- PRODUCT UPLOAD ROUTE -------------------
app.post(
  "/api/products/upload",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, price, description } = req.body;
      if (!req.file)
        return res.status(400).json({ error: "Image is required" });

      const newProduct = new Product({
        name,
        price,
        description,
        image: `/uploads/${req.file.filename}`,
      });

      await newProduct.save();
      res.json(newProduct);
    } catch (err) {
      console.error("Upload Error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

// ------------------- PRODUCTS ROUTES -------------------
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------- AUTH ROUTES -------------------
app.post("/users/signup", async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  try {
    if (!email || !password || !firstName || !lastName)
      return res.status(400).json({ error: "All fields are required" });
    if (password.length < 6)
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
    });

    await user.save();
    res.status(201).json({
      message: "User created successfully",
      token: generateToken(user),
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

app.post("/users/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    res.json({
      message: "Login successful",
      token: generateToken(user),
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// ------------------- MONGO DB CONNECT -------------------
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ------------------- START SERVER -------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
