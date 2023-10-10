import mongoose from 'mongoose';
import credentials from './config.mjs';
import { Product } from './src/models/product.mjs';
import { Cart } from './src/models/cart.mjs';
import ClientOrder from './src/models/clientorder.mjs';

const uri = credentials.mongo.uri;

mongoose.connect(uri, { useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', err => {
    console.error('MongoDB error: ' + err.message);
    process.exit(1);
});
db.once('open', () => console.log('MongoDB Connection Established.'));

// PRODUCT FUNCTIONS ---------------------------------------------------------------------------------------------------------------------------
function seedProducts() {
    new Product({
        sku: 'mc-react',
        name: 'Getting Started with React',
        price: 90,
        featuredImage: 'masterclass_react.png',
        description: 'Get quickly up and running with React and create a profile website in just 3 hours!',
        requiresDeposit: false
    }).save();

    new Product({
        sku: 'mc-ai-python',
        name: 'AI with TensorFlow & Python',
        price: 90,
        featuredImage: 'masterclass_ai.png',
        description: 'Create a machine learning model using Python and TensorFlow, focusing on image recognition and classification.',
        requiresDeposit: false
    }).save();

    new Product({
        sku: 'mc-unity',
        name: 'Game Development with Unity',
        price: 360,
        featuredImage: 'masterclass_game.png',
        description: 'Create a clone of the popular 2D platformer featuring an Italian plumber, starting from scratch and covering all aspects of game development.',
        requiresDeposit: true
    }).save();

    new Product({
        sku: 'mc-flexbox',
        name: 'Introduction to CSS FlexBox',
        price: 90,
        featuredImage: 'masterclass_css.png',
        description: 'FlexBox can revolutionise how you create responsive websites. Learn how in just 3 hours!',
        requiresDeposit: false
    }).save();
}

// Seed product data if necessary
Product.find({})
    .then(products => {
        if (products.length === 0) seedProducts();
    })
    .catch(error => console.err(error));

export async function getProducts() {
    return Product.find();
}

export async function getProductById(product_id) {
    return Product.findById(product_id).exec();
}

// END PRODUCT FUNCTIONS -----------------------------------------------------------------------------------------------------------------------

// CART FUNCTIONS ------------------------------------------------------------------------------------------------------------------------------
export async function createCart() {
    const newCart = await new Cart({
        total: 0,
        items: []
    }).save();
    return newCart._id;
}

export async function getCartById(cart_id) {
    return Cart.findById(cart_id).exec();
}

export async function getCartWarnings(cart_id) {
    const cart = await Cart.findOne({ _id: cart_id });
    const cartWarnings = [];
    if (cart.items && cart.items.some(item => item.product.requiresDeposit)) {
        cartWarnings.push('One or more of your selected products requires a deposit.');
    }
    return cartWarnings;
}

export async function addToCart(cart_id, product_id_str) {
    const productObjectId = new mongoose.Types.ObjectId(product_id_str);
    const product = await Product.findById(product_id_str).exec();

    // If item is not in already in the cart, add it
    if (! await Cart.exists({ _id: cart_id, 'items.product._id': productObjectId })) {
        const newItem = {
            product: product,
            qty: 0,
            subtotal: 0
        };
        await Cart.findOneAndUpdate(
            { _id: cart_id },
            { $push: { items: newItem } }
        );
    }

    // Update item quantity & subtotal, and cart total
    const cart = await Cart.findById(cart_id).exec();
    const idx = cart.items.findIndex(item => productObjectId.equals(item.product._id));
    const cartItem = cart.items[idx];
    cartItem.qty += 1;
    cartItem.subtotal = (Math.round((product.price * cartItem.qty) * 100) / 100).toFixed(2);
    const newCartTotal = (
        Math.round((
            cart.items.reduce((a, b) => a + (parseFloat(b['subtotal']) || 0), 0)
        ) * 100) / 100
    ).toFixed(2);

    await Cart.findOne({ _id: cart_id })
        .then(doc => {
            doc.total = newCartTotal;
            const item = doc.items[idx];
            item.qty = cartItem.qty;
            item.subtotal = cartItem.subtotal;
            doc.save();
        })
        .catch(error => console.log(error));
}

export async function changeCartItemQty(cart_id, product_id_str, qty) {
    const cart = await Cart.findById(cart_id).exec();
    const productObjectId = new mongoose.Types.ObjectId(product_id_str);
    const product = await Product.findById(product_id_str).exec();
    const idx = cart.items.findIndex(item => productObjectId.equals(item.product._id));
    const cartItem = cart.items[idx];

    if (qty > 0) {
        cartItem.qty = qty;
        cartItem.subtotal = (Math.round((product.price * cartItem.qty) * 100) / 100).toFixed(2);
    }
    
    const newCartTotal = (
        Math.round((
            cart.items.reduce((a, b) => a + (parseFloat(b['subtotal']) || 0), 0)
        ) * 100) / 100
    ).toFixed(2);

    await Cart.findOne({ _id: cart_id })
        .then(doc => {
            doc.total = newCartTotal;
            if (qty > 0) {
                const item = doc.items[idx];
                item.qty = cartItem.qty;
                item.subtotal = cartItem.subtotal;
            } else {
                doc.items.splice(idx, 1);
            }
            doc.save();
        })
        .catch(error => console.log(error));
}

export async function deleteFromCart(cart_id, product_id_str) {
    const cart = await Cart.findById(cart_id).exec();
    const productObjectId = new mongoose.Types.ObjectId(product_id_str);   
    const idx = cart.items.findIndex(item => productObjectId.equals(item.product._id));

    await Cart.findOne({ _id: cart_id })
        .then(doc => {
            doc.items.splice(idx, 1);
            doc.total = (
                Math.round((
                    doc.items.reduce((a, b) => a + (parseFloat(b['subtotal']) || 0), 0)
                ) * 100) / 100
            ).toFixed(2);
            doc.save();
        })
        .catch(error => console.log(error));    
}

export async function checkout(cart_id, email) {
    const cart = await Cart.findById(cart_id).exec();

    const newClientOrder = await new ClientOrder({
        email: email,
        cart: cart
    }).save();
    return newClientOrder.cart;
}
// END CART FUNCTIONS --------------------------------------------------------------------------------------------------------------------------

export default {
    getProducts,
    getProductById,
    createCart,
    addToCart,
    getCartById,
    getCartWarnings,
    changeCartItemQty,
    deleteFromCart,
    checkout
};