import UserAvatar from "../ui/UserAvatar";

export default function UserBar() {
    return (
        <div className="bg-background border border-border h-[10%] w-full">
            <div className="flex items-center justify-end gap-2 p-4">
                <UserAvatar />
            </div>
        </div>
    );
}