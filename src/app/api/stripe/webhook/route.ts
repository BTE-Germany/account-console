import { stripe } from "@/lib/stripe"
import { Stripe } from "stripe";
import getKcAdminClient from "@/lib/kcAdmin";
import { syncUserSubscription } from "@/lib/rankSync";

export async function POST(request: Request) {
    return handleStripeWebhook(request)
}

export async function handleStripeWebhook(request: Request) {

    const payload = await request.text();

    const verified = stripe.webhooks.signature.verifyHeader(
        payload,
        request.headers.get("stripe-signature")!,
        process.env.STRIPE_WEBHOOK_SECRET!
    )

    if (!verified) {
        console.error("Invalid Stripe webhook signature");
        return new Response("Invalid signature", { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(
        payload,
        request.headers.get("stripe-signature")!,
        process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted" || event.type === "customer.subscription.resumed" || event.type === "customer.subscription.paused") {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId as string;
        const customerId = subscription.customer as string;

        const kcAdmin = await getKcAdminClient()

        const user = await kcAdmin.users.findOne({ id: userId })


        if (customerId) {
            try {
                await kcAdmin.users.update({
                    id: userId
                }, {
                    username: user?.username,
                    email: user?.email,
                    attributes: {
                        ...user?.attributes,
                        stripe_customer_id: customerId
                    }
                })
            } catch (error) {
                console.error("Error updating user in Keycloak:", error);
            }

            try {
                if (subscription.status === "active") {
                    await kcAdmin.users.addRealmRoleMappings({
                        id: userId,
                        roles: [{
                            name: "plus",
                            id: process.env.KEYCLOAK_PLUS_ROLE_ID!
                        }]
                    })
                } else {
                    await kcAdmin.users.delRealmRoleMappings({
                        id: userId,
                        roles: [{
                            name: "plus",
                            id: process.env.KEYCLOAK_PLUS_ROLE_ID!
                        }]
                    })
                }
            } catch (error) {
                console.error("Error updating user group in Keycloak:", error);
            }

        }

        await syncUserSubscription(userId)

    }
    return new Response("Webhook handled", { status: 200 });
}