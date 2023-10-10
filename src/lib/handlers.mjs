import { getTagline } from './tagline.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../../db.mjs';
import credentials from '../../config.mjs';
import emailService from './mailer.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MAIN PAGES ------------------------------------------------------------------------------------
export function home(req, res) {
    res.render('home');
}

export function about(req, res) {
    res.render('about', { tagline: getTagline() });
}

export function colorMode(req, res) {
    res.cookie('color_mode', req.params.mode, {maxAge: 30 * 24 * 60 * 60 * 1000});
    res.redirect(req.get('referer'));
}

export async function masterclass(req, res) {
    db.getProducts()
        .then(products => {
            const context = {
                products: products.map(product => {
                    return {
                        id: product._id,
                        sku: product.sku,
                        name: product.name,
                        description: product.description,
                        featuredImage: product.featuredImage,
                        requiresDeposit: product.requiresDeposit,
                        price: product.getDisplayPrice('€')
                    };
                })
            };
            res.render('masterclass', context);
        })
        .catch(error => console.error(error));
}

export async function cart(req, res) {
    db.getCartById(req.session.cart)
        .then(cart => {
            const context = {
                cartSize: cart.items.length,
                cart: {
                    total: cart.total,
                    items: cart.items.map(item => {
                        return {
                            product: {
                                id: item.product._id,
                                sku: item.product.sku,
                                name: item.product.name,
                                description: item.product.description,
                                featuredImage: item.product.featuredImage,
                                requiresDeposit: item.product.requiresDeposit,
                                price: item.product.price
                            },
                            qty: item.qty,
                            subtotal: item.subtotal
                        };       
                    })
                }
            };
            res.render('cart', context);
        })
        .catch(error => console.error(error));
}
// END MAIN PAGES --------------------------------------------------------------------------------

// SETUP PHOTO CONTEST ---------------------------------------------------------------------------
export function setupPhotoContest(req, res) {
    const now = new Date();
    res.render('contest/setup-photo', { year: now.getFullYear(), month: now.getMonth() });
}
// END SETUP PHOTO CONTEST -----------------------------------------------------------------------

// API -------------------------------------------------------------------------------------------
export const api = {
    newsletterSignup: (req, res) => {
        const VALID_EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        //const csrf = req.body._csrf;
        const name = req.body.name;
        const email = req.body.email;

        if (!VALID_EMAIL_REGEX.test(email)) {
            res.send( { result: 'error', error: 'Email is invalid!' });
            return;
        }

        const mailer = emailService(credentials);
        mailer.send(email, 'NinjaCoders Newsletter Subscription', 
            `Hi ${name}, \nThank you for signing up to the NinjaCoders Newsletter. You'll be hearing from us soon!`)
            .then(() => {
                req.session.flash = {
                    type: 'success',
                    intro: 'Thank you!',
                    message: 'You have now been signed up for the newsletter.'
                };
                res.send({ result: 'success' });
            })
            .catch(err => {
                console.log('Failed to send mail: ', err.message);
                res.send( { result: 'error', error: 'Failed to send email.' });
            });
    },
    setupPhotoContest: (req, res, fields, files) => {
        const uploadedFile = files.photo[0];
        const tmp_path = uploadedFile.path;
        const target_dir = `${__dirname}/../../public/contest-uploads/${req.params.year}/${req.params.month}`;

        if (!fs.existsSync(target_dir)){
            fs.mkdirSync(target_dir, { recursive: true });
        }

        fs.rename(tmp_path, `${target_dir}/${uploadedFile.originalFilename}`, function(err) {
            if (err) {
                res.send( { result: 'error', error: err.message });
                return;
            }
            fs.unlink(tmp_path, function(err) {
                if (err) {
                    res.send( { result: 'error', error: err.message });
                    return;
                }
                res.send( { result: 'success' });
            });
        });
    },
    setupPhotoContestError: (req, res, message) => {
        res.send( { result: 'error', error: message });
    }
};
// END API ---------------------------------------------------------------------------------------

// FETCH NEWSLETTER ------------------------------------------------------------------------------
export function newsletter(req, res) {
    res.render('newsletter', { csrf: 'CSRF token goes here' });
}

export function newsletterArchive(req, res) {
    res.render('newsletter-archive');
}
// END FETCH NEWSLETTER --------------------------------------------------------------------------

// SHOPPING CART ---------------------------------------------------------------------------------
export async function addToCart(req, res) {
    if (!req.session.cart) {
        await db.createCart()
            .then(cartId => req.session.cart = cartId );
    }

    const cartId = req.session.cart;
    const productId = req.body.productId;
    await db.addToCart(cartId, productId);
    res.redirect('/cart');
}

export async function changeCartItemQty(req, res) {
    const cartId = req.session.cart;
    const productId = req.body.productId;
    const qty = req.body.qty;
    
    await db.changeCartItemQty(cartId, productId, qty);  
    res.redirect('/cart');
}

export async function deleteFromCart(req, res) {
    const cartId = req.session.cart;
    const productId = req.body.productId;

    await db.deleteFromCart(cartId, productId);
    res.redirect('/cart');
}

export async function checkout(req, res) {
    const cartId = req.session.cart;
    const email = req.body.email;

    db.checkout(cartId, email)
        .then(cart => {
            const context = {
                total: cart.total,
                items: cart.items.map(item => {
                    return {
                        product: {
                            name: item.product.name,
                            featuredImage: item.product.featuredImage,
                        },
                        qty: item.qty,
                        subtotal: item.subtotal
                    };       
                })
            };
            res.render('email/cart-thank-you', { layout: null, cart: context }, (err,html) => {
                if (err) console.log('Error in email template.');
        
                const mailer = emailService(credentials);
                mailer.send(email, 'NinjaCoders - Thank You For Your Purchase', 
                    html)
                    .then(info => {
                        console.log('Sent: ', info);
                        req.session.cart = { items: [] };
                        res.render('cart-thank-you', { email: email });
                    })
                    .catch(err => {
                        console.error('Unable to send confirmation: ', err.message);
                    });
            });
        });
}
// -----------------------------------------------------------------------------------------------

// ERROR HANDLING --------------------------------------------------------------------------------
export function notFound(req, res) {
    res.render('404');
}

// eslint-disable-next-line no-unused-vars
export function serverError(err, req, res, next) {
    console.error(err);
    res.render('500');
}
// END ERROR HANDLING ----------------------------------------------------------------------------

export default {
    home,
    about,
    notFound,
    serverError,
    newsletter,
    newsletterArchive,
    api,
    setupPhotoContest,
    colorMode,
    cart,
    masterclass,
    addToCart,
    changeCartItemQty,
    deleteFromCart,
    checkout
};
