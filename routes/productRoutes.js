// actual-back-end/routes/productRoutes.js
import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

// GET all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET single product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// CREATE new product (basic, without image upload)
router.post("/", async (req, res) => {
  try {
    const { name, price, img } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: "Name and price are required" });
    }

    const newProduct = new Product({
      Product_name: name,
      Price: price,
      img: img || "/uploads/default.jpeg", // fallback image
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// UPDATE product by ID
router.put("/:id", async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // return updated doc
    );
    if (!updatedProduct)
      return res.status(404).json({ error: "Product not found" });
    res.json(updatedProduct);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// DELETE product by ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct)
      return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
