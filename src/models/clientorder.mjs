import mongoose from 'mongoose';
import { cartSchema } from './cart.mjs';

const clientOrderSchema = mongoose.Schema({
    email: String,
    cart: cartSchema
});

const ClientOrder = mongoose.model('ClientOrder', clientOrderSchema);

export default ClientOrder;