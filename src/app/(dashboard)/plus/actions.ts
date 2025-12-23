"use server"

import getKcAdminClient from "@/lib/kcAdmin";
import {getSession} from "@/lib/auth";
import {stripe} from "@/lib/stripe";
import Stripe from "stripe";

export async function getProductsBoughtViaCheckout(customerId: string) {
    const sessions = await stripe.checkout.sessions.list({ customer: customerId, limit: 100 });
    const productIds = new Set<string>();

    for (const s of sessions.data) {
        const lineItems = await stripe.checkout.sessions.listLineItems(s.id, { limit: 100 });
        for (const li of lineItems.data) {
            const price = li.price as Stripe.Price | null;
            const prodId = price?.product as string | undefined;
            if (prodId) productIds.add(prodId);
        }
    }

    const products = await Promise.all([...productIds].map(id => stripe.products.retrieve(id)));
    return products;
}

export const getHasActivePlusSubscription = async () => {
    const kcAdminClient = await getKcAdminClient()
    const session = await getSession()
    if (!kcAdminClient || !session) return null;

    const user = await kcAdminClient.users.findOne({id: session.user.id})
    if (!user) return false;

    const roles = await kcAdminClient.users.listRealmRoleMappings({id: session.user.id})

    if (roles.some((r) => r.name === "plus")) return true;
    return false;
}

export const getPlusType = async (): Promise<"subcription"|"onetime"|null> => {
    const kcAdminClient = await getKcAdminClient()
    const session = await getSession()
    if (!kcAdminClient || !session) return null;

    const user = await kcAdminClient.users.findOne({id: session.user.id})
    if (!user) return null;

    const roles = await kcAdminClient.users.listRealmRoleMappings({id: session.user.id})

    if (!roles.some((r) => r.name === "plus")) return null;
    if (!user.attributes) return "onetime";
    if (!user.attributes.stripe_customer_id) return "onetime";

    const subscriptions = await stripe.subscriptions.list({
        customer: user.attributes.stripe_customer_id[0]
    });

    if (subscriptions.data.filter((s) => (s.status !== "canceled" && s.cancel_at! < Date.now())).length > 0) return "subcription"

    return "onetime"
}

export const getSubscriptionInfo = async () => {
    const kcAdminClient = await getKcAdminClient()
    const session = await getSession()
    if (!kcAdminClient || !session) return null;

    const user = await kcAdminClient.users.findOne({id: session.user.id})
    if (!user) return null;
    if (!user.attributes) return null;
    if (!user.attributes.stripe_customer_id) return null;

    const stripe_customer_id: string = user.attributes.stripe_customer_id[0];


    const customer = await stripe.customers.retrieve(stripe_customer_id)

    if (!customer) return null;


    const subscriptions = await stripe.subscriptions.list({
        customer: stripe_customer_id,
        expand: ['data.default_payment_method'],
    });

    const filtered = subscriptions.data.filter(sub =>
        sub.items.data.some(item =>
            [process.env.PLUS_MONTHLY_PRICE_ID, process.env.PLUS_YEARLY_PRICE_ID].includes(item.price.id)
        )
    );

    const subscription = filtered[0]

    console.log(subscription)

    return {
        status: subscription?.status,
        cancel_at: subscription?.cancel_at,
        default_payment_method: subscription?.default_payment_method,
    }
}

export const getStripeManageUrl = async () => {
    const kcAdminClient = await getKcAdminClient()
    const session = await getSession()
    if (!kcAdminClient || !session) return null;

    const user = await kcAdminClient.users.findOne({id: session.user.id})
    if (!user) return null;
    if (!user.attributes) return null;
    if (!user.attributes.stripe_customer_id) return null;

    const stripe_customer_id: string = user.attributes.stripe_customer_id[0];

    const billingPortalSession = await stripe.billingPortal.sessions.create({
        customer: stripe_customer_id,
        return_url: `${process.env.NEXTAUTH_URL}/plus`,
        locale: "de"
    })

    return billingPortalSession.url
}