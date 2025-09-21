// routes/productRoutes.js
import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

// GET all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST upload product
router.post("/upload", async (req, res) => {
  try {
    const { name, price, image } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: "Name and price are required" });
    }

    const newProduct = new Product({
      name,
      price,
      image,
    });

    await newProduct.save();
    res.json({ success: true, product: newProduct });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
