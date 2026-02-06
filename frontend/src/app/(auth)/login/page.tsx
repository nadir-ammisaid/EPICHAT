import LoginForm from "@/components/LoginForm";
import Image from "next/image";
import RedirectIfAuthed from "@/components/dashboard/RedirectIfAuthed";


export default function LoginPage() {
    return (
        <>
        <RedirectIfAuthed />
        <div className="relative w-full h-screen md:grid md:grid-cols-2">
            <div className="absolute inset-0 flex items-center justify-center md:relative md:flex md:items-center md:justify-center md:order-1">
                <div className="w-full max-w-[95%] px-4 md:px-0 bg-background py-14 rounded-lg">
                    <LoginForm />
                </div>
            </div>
            <Image 
                src="/login.png" 
                alt="Illustration de connexion" 
                width={1920} 
                height={1080} 
                className="object-cover w-full h-full md:order-2" 
                priority={true}
            />
        </div>
        </>
    );
}