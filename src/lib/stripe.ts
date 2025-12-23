import Stripe from "stripe";

const globalForStripe = globalThis as unknown as {
    stripe?: Stripe;
};

export const stripe = globalForStripe.stripe ?? (process.env.STRIPE_SECRET
    ? new Stripe(process.env.STRIPE_SECRET)
    : new Stripe("sk_test_" + "0".repeat(32))
);
