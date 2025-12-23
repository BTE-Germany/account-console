import {getSession} from "@/lib/auth";
import {Button} from "@/components/ui/button";
import {Form} from "react-hook-form";
import EditProfileForm from "@/components/dashboard/profile/EditProfileForm";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {AlertCircleIcon} from "lucide-react";

export default async function Home() {

    const session = await getSession()

  return (
    <div className={""}>
        <h2 className={"text-xl font-bold mb-8"}>
            Deine Profildaten
        </h2>

        {
            !session?.user.email_verified && <Alert variant="destructive" className={"mb-8"}>
                <AlertCircleIcon />
                <AlertTitle>E-Mail Adresse verifizieren</AlertTitle>
                <AlertDescription>
                    Bitte verifiziere deine E-Mail Adresse, indem du auf den Link in der Bestätigungs-E-Mail klickst, die wir dir gesendet haben. Wenn du die E-Mail nicht erhalten hast, überprüfe bitte auch deinen Spam-Ordner.
                </AlertDescription>
            </Alert>
        }

        <EditProfileForm currentProfile={{username: session?.user.username || "", email: session?.user.email || ""}} />
    </div>
  );
}
