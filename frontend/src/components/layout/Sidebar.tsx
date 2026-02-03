import Image from "next/image";

export default function Sidebar() {
    return (
        <div className="h-screen max-w-48 bg-border p-4">
            <Image src={"/images/logo.png"} alt="logo" width={300} height={300}/>
        </div>
    );
}