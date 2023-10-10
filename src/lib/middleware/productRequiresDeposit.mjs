import db from '../../../db.mjs';

export default async (req, res, next) => {
    const { cart } = req.session;
    if (!cart) return next();
    res.locals.cartWarnings = await db.getCartWarnings(cart);
    next();
};