
import LoginPage from "./(auth)/login/page";
import Image from "next/image";

  export default function Home() {
  return (
    <div className="flex justify-center items-center h-screen">
      <main className="w-full p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-background rounded-lg">
        <LoginPage />
      </main>
    </div>
  );
}
