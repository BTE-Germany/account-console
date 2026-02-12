"use server";

import { stripe } from "@/lib/stripe";
import { getSession } from "@/lib/auth";
import { headers } from 'next/headers'
import getKcAdminClient from "@/lib/kcAdmin";

export async function createCheckoutSession(interval: "month" | "year") {

    const session = await getSession()
    if (!session) {
        throw new Error("Not authenticated");
    }

    const headersList = await headers()
    const origin = headersList.get('origin')

    const kcAdminClient = await getKcAdminClient()
    const user = await kcAdminClient.users.findOne({ id: session.user.id })
    let customerId: string | undefined = undefined;
    if (user!.attributes && user!.attributes.stripe_customer_id) {
        customerId = user!.attributes.stripe_customer_id[0];
    }

    const checkoutSession = await stripe.checkout.sessions.create({
        line_items: [
            {
                price: interval === "month" ? process.env.PLUS_MONTHLY_PRICE_ID! : process.env.PLUS_YEARLY_PRICE_ID!,
                quantity: 1,
            },
        ],
        subscription_data: {
            metadata: {
                userId: session.user.id
            }
        },
        mode: 'subscription',
        allow_promotion_codes: true,
        payment_method_collection: 'if_required',
        customer_email: customerId ? undefined : session.user.email!,
        customer: customerId,
        success_url: `${origin}/plus/buy/success?session_id={CHECKOUT_SESSION_ID}`,
    });

    return checkoutSession.url;
}