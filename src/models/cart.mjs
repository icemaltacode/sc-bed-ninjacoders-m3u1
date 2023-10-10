import mongoose from 'mongoose';
import { productSchema } from './product.mjs';

const itemSchema = mongoose.Schema({
    product: productSchema,
    qty: Number,
    subtotal: Number
});

export const cartSchema = mongoose.Schema({
    total: Number,
    items: [itemSchema]
});

export const Cart = mongoose.model('Cart', cartSchema);

export default {
    cartSchema,
    Cart
};