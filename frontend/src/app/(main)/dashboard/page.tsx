import ServerBar from "@/components/layout/ServerBar";
import ChannelBar from "@/components/layout/ChannelBar";
import ChatSection from "@/components/layout/ChatSection";
import MemberSection from "@/components/layout/MemberSection";
import UserBar from "@/components/layout/UserBar";

export default function DashboardPage() {
    return (
        <div className="flex h-screen overflow-hidden">
            <ServerBar />
            <ChannelBar />
            <div className="flex flex-1 flex-col min-w-0">
                <UserBar />
                <div className="flex min-h-0 flex-1">
                    <ChatSection />
                    <MemberSection />
                </div>
            </div>
        </div>
    );
}