export default function Footer() {
    return (
        <footer className="w-full border-t py-4 mt-8">
            <div className="container mx-auto px-4">
                <div className=" text-center text-sm text-muted-foreground flex flex-row gap-4 justify-between">
                    &copy; {new Date().getFullYear()} BuildTheEarth Germany e.V. Alle Rechte vorbehalten.
                    <div className="flex items-center gap-4">
                        <a href="https://bte-germany.de/legal" className="underline hover:text-gray-700 dark:hover:text-gray-200">Impressum</a>
                        <a href="https://bte-germany.de/privacy" className="underline hover:text-gray-700 dark:hover:text-gray-200">Datenschutz</a>
                    </div>
                </div>
            </div>

        </footer>
    );
}