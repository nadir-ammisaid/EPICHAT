import LoginForm from "@/components/LoginForm";
import Image from "next/image";

export default function LoginPage() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center justify-center">
            <LoginForm />
      <Image src="/images/blue.jpg" alt="Epichat" width={1920} height={1080} className="object-cover h-screen rounded-lg" />
    </div>
  );
}