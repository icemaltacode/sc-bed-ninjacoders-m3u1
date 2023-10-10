import mongoose from 'mongoose';

export const productSchema = mongoose.Schema({
    sku: String,
    name: String,
    price: Number,
    featuredImage: String,
    description: String,
    requiresDeposit: Boolean
});

productSchema.methods.getDisplayPrice = function(symbol) {
    return symbol + this.price.toFixed(2);
};

export const Product = mongoose.model('Product', productSchema);

export default {
    productSchema, 
    Product
};