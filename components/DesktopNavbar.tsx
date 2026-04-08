import { BellIcon, HomeIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SignInButton, UserButton } from "@clerk/nextjs";
import ThemeToggle from "./ThemeToggle";
import { currentUser } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/app/actions/user.action";
import NotificationBadge from "./NotificationBadge";

async function DesktopNavbar() {
    const autheUser = await currentUser();

    let user = null; //  define outside

    if (autheUser) {
        user = await getUserByClerkId(autheUser.id);
    }

    return (
        <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />

            <Button variant="ghost" className="flex items-center gap-2" asChild>
                <Link href="/">
                    <HomeIcon className="w-4 h-4" />
                    <span className="hidden lg:inline">Home</span>
                </Link>
            </Button>

            {user ? (
                <>
                    <Button variant="ghost" className="flex items-center gap-2" asChild>
                        <Link href="/notifications">
                            <div className="relative">
                                <BellIcon className="w-4 h-4" />
                                <NotificationBadge />
                            </div>
                            <span className="hidden lg:inline">Notifications</span>
                        </Link>
                    </Button>

                    <Button variant="ghost" className="flex items-center gap-2" asChild>
                        <Link
                            href={`/profile/${user.username ?? user.email.split("@")[0]}`}
                        >
                            <UserIcon className="w-4 h-4" />
                            <span className="hidden lg:inline">Profile</span>
                        </Link>
                    </Button>

                    <UserButton />
                </>
            ) : (
                <SignInButton mode="modal">
                    <Button variant="default">Sign In</Button>
                </SignInButton>
            )}
        </div>
    );
}
export default DesktopNavbar;