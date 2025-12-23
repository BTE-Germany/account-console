"use client"
import {Button} from "@/components/ui/button";
import { useForm } from "react-hook-form"
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {saveProfile} from "@/app/(dashboard)/actions";
import {useState} from "react";
import {toast} from "sonner";
import {signIn} from "next-auth/react";

export default function EditProfileForm({currentProfile}: { currentProfile: { username: string, email: string } }) {

    const formSchema = z.object({
        username: z.string().lowercase("Der Benutzername muss in Kleinbuchstaben sein.").min(3, "Der Benutzername muss mindestens 3 Zeichen lang sein.").max(20, "Der Benutzername darf maximal 20 Zeichen lang sein.").regex(/^[a-z0-9_.]+$/, "Der Benutzername darf nur Kleinbuchstaben, Zahlen, Punkte und Unterstriche enthalten."),
        email: z.email("Bitte gebe eine gültige E-Mail-Adresse ein.")
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: currentProfile.username,
            email: currentProfile.email
        },
    })

    const [loading, setLoading] = useState(false)

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(async (values) => {
                setLoading(true)
                const result = await saveProfile(values.username, values.email)

                if (result?.status === "success") {
                    toast.success(result.message || "Deine Profildaten wurden erfolgreich gespeichert.")
                    signIn("keycloak")
                } else {
                    if (result?.field && result?.message) {
                        if (result.field === "global") {
                            toast.error(result.message)
                            return
                        }
                        form.setError(result.field as "username" | "email", {
                            type: "manual",
                            message: result.message
                        })
                    }
                }
                setLoading(false)

            })} className="space-y-8">
                <FormField
                    control={form.control}
                    name="username"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Benutzername</FormLabel>
                            <FormControl>
                                <Input placeholder="Maxi.Mustermensch" {...field} />
                            </FormControl>
                            <FormDescription>
                                Dein öffentlicher Benutzername.
                            </FormDescription>
                            <FormMessage/>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>E-Mail Adresse</FormLabel>
                            <FormControl>
                                <Input placeholder="dein@email.de" type={"email"} {...field} />
                            </FormControl>
                            <FormDescription>
                                Nachdem du deine E-Mail Adresse geändert hast, musst du sie erneut verifizieren.
                            </FormDescription>
                            <FormMessage/>
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={loading}>Speichern</Button>
            </form>
        </Form>
    )
}