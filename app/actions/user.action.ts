"use server"
import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";




export async function syncUser() {
    try {
        const clerkUser = await currentUser();
        const userId = await auth();
        // 1 Check is user authunticated  
        if (!clerkUser || !userId) {
            return null
        }
        //2    Check if User exist is DB

        const existingUser = await prisma.user.findUnique({
            where: {
                clerkId: clerkUser.id
            }
        })
        if (existingUser) {
            return await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    clerkId: clerkUser.id,
                    name: `${clerkUser.firstName || ""}  ${clerkUser?.lastName || ""}`,
                    username: clerkUser.username ?? clerkUser?.emailAddresses[0].emailAddress.split("@")[0],
                    email: clerkUser.emailAddresses[0].emailAddress,
                    image: clerkUser.imageUrl
                }
            })

        }
        // 3 If not exist then create
        const dbUser = await prisma.user.create({
            data: {
                clerkId: clerkUser.id,
                name: `${clerkUser.firstName || ""}  ${clerkUser?.lastName || ""}`,
                username: clerkUser.username ?? clerkUser?.emailAddresses[0].emailAddress.split("@")[0],
                email: clerkUser.emailAddresses[0].emailAddress,
                image: clerkUser.imageUrl
            }
        }
        )
        return dbUser;
    } catch (error) {
        console.log("Error in syncUser", error)
    }


}
export async function getUserByClerkId(clerkId: string) {

    return await prisma.user.findUnique({
        where: {
            clerkId,
        }, include: {
            _count: {
                select:
                {
                    followers: true,
                    following: true,
                    posts: true,
                }
            }
        }
    })
}
export async function getDbUserId() {
    const { userId: clerkId } = await auth();

    if (!clerkId) throw new Error("Unauthorized");

    const user = await getUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");
    return user.id
}
export async function getRandomUsers() {
    try {
        const userId = await getDbUserId();
        if (!userId) return null;

        //get random  users exclude ourselves & users that we already follow
        const randomUsers = await prisma.user.findMany({
            where: {
                AND: [
                    { NOT: { id: userId } },//exclue ourseleves
                    {
                        NOT: {//User that we already follow
                            followers: {
                                some: {
                                    followerId: userId
                                }
                            }
                        }
                    }
                ]
            },
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                _count: {
                    select: {
                        followers: true,
                    }
                }
            },
            take: 3,
        })
        return randomUsers;
    } catch (error) {
        console.log("Error fetching random users", error);
        return [];
    }
}
export async function toggleFollow(targetUserId: string) {
    try {
        const activeUserId = await getDbUserId();

        if (!activeUserId) return;

        if (activeUserId === targetUserId) throw new Error("You cannot follow yourself")

        //check is already follow
        const existingFollow = await prisma.follows.findUnique({
            where: {
                followerId_followingId: {
                    followerId: activeUserId,
                    followingId: targetUserId,
                }
            }
        })

        if (existingFollow) {
            // unfollow
            await prisma.follows.delete({
                where: {
                    followerId_followingId: {
                        followerId: activeUserId,
                        followingId: targetUserId,
                    }
                }
            })
        } else {
            // follow
            await prisma.$transaction([
                prisma.follows.create({
                    data: {
                        followerId: activeUserId,
                        followingId: targetUserId
                    }
                }),
                prisma.notification.create({
                    data: {
                        type: "FOLLOW",
                        userId: targetUserId,
                        creatorId: activeUserId
                    }
                })
            ])
        }
        revalidatePath("/")
        return { success: true }
    } catch (error) {

        console.log("error in toggleFollow", error)
        return { success: false, error: "Error toggling follow" }
    }
}