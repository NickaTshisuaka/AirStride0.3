import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  Product_id: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString(), // auto-generate
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String }, // store path or URL
});

export default mongoose.model("Product", productSchema);
