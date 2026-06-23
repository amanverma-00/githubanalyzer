import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: false,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  }
);

productSchema.index({ created_at: -1, _id: -1 });

productSchema.index({ category: 1, created_at: -1, _id: -1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
