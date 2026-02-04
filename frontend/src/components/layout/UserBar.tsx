import { BellIcon, SettingsIcon } from "lucide-react";
import UserAvatar from "../ui/UserAvatar";

export default function UserBar() {
    return (
        <div className="bg-background border border-border h-[10%] w-full">
            <div className="flex items-center justify-end gap-2 p-4">
                <span className="hover:cursor-pointer bg-brand-muted/80 text-foreground rounded-full p-2">
                    <SettingsIcon className="h-4 w-4" />
                </span>
                <span className="hover:cursor-pointer bg-brand-muted/80 text-foreground rounded-full p-2">
                    <BellIcon className="h-4 w-4" />
                </span>
                <UserAvatar />

            </div>
        
        </div>
    );
}