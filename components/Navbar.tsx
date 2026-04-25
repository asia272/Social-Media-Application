
import Link from 'next/link'
import DesktopNavbar from './DesktopNavbar'
import MobileNavbar from './MobileNavbar'
import { currentUser } from '@clerk/nextjs/server';
import { getUserByClerkId, syncUser } from '@/app/actions/user.action';



const Navbar = async () => {

  // 1. Get current Clerk user
  const clerkUser = await currentUser();

  let user = null;

  if (clerkUser) {
    // 2. Sync user to DB
    await syncUser();

    // 3. Fetch fresh user from DB
    user = await getUserByClerkId(clerkUser.id);
  }

  return (
    <nav className="sticky top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl font-bold text-primary font-mono tracking-wider"
            >
              Socially
            </Link>
          </div>
          <DesktopNavbar />
          <MobileNavbar user={user} />
        </div>
      </div>
    </nav>
  );
}

export default Navbar
