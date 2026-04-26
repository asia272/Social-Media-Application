

import { getUserByClerkId, syncUser } from '@/app/actions/user.action';
import { currentUser } from '@clerk/nextjs/server';
import { LinkIcon, MapPinIcon } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarImage } from './ui/avatar';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import UnAuthenticatedSidebar from './UnauthenticatedSidebar ';

const Sidebar = async () => {
    const authUser = await currentUser();
    if (!authUser) return <UnAuthenticatedSidebar />;
    // 2. Sync with DB
    await syncUser();
    // 3. Fetch the fresh DB user after sync
    const dbUser = await getUserByClerkId(authUser.id);
    if (!dbUser) return null;
    return (
        <div className='sticky top-20'>
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                        <Link
                            href={`/profile/${dbUser.username}`}
                            className="flex flex-col items-center justify-center"
                        >
                            <Avatar className="w-20 h-20 border-2 ">
                                <AvatarImage src={dbUser.image || "/avatar.png"} />
                            </Avatar>

                            <div className="mt-4 space-y-1">
                                <h3 className="font-semibold">{dbUser.name}</h3>
                                <p className="text-sm text-muted-foreground">{dbUser.username}</p>
                            </div>
                        </Link>

                        {dbUser.bio && <p className="mt-3 text-sm text-muted-foreground">{dbUser.bio}</p>}

                        <div className="w-full">
                            <Separator className="my-4" />
                            <div className="flex justify-between">
                                <div>
                                    <p className="font-medium">{dbUser._count.following}</p>
                                    <p className="text-xs text-muted-foreground">Following</p>
                                </div>
                                <Separator orientation="vertical" />
                                <div>
                                    <p className="font-medium">{dbUser._count.followers}</p>
                                    <p className="text-xs text-muted-foreground">Followers</p>
                                </div>
                            </div>
                            <Separator className="my-4" />
                        </div>

                        <div className="w-full space-y-2 text-sm">
                            <div className="flex items-center text-muted-foreground">
                                <MapPinIcon className="w-4 h-4 mr-2" />
                                {dbUser.location || "No location"}
                            </div>
                            <div className="flex items-center text-muted-foreground">
                                <LinkIcon className="w-4 h-4 mr-2 shrink-0" />
                                {dbUser?.website ? (
                                    <a href={`${dbUser.website}`} className="hover:underline truncate" target="_blank">
                                        {dbUser.website}
                                    </a>
                                ) : (
                                    "No website"
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default Sidebar


