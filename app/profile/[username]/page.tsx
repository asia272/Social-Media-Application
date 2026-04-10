import { getUserAllPosts, getUserLikedPosts, getProfileByUsername, isFollowing } from "@/app/actions/profile.action";
import ProfilePageClient from "@/components/ProfilePageClient";
import { notFound } from "next/navigation";

const ProfilePage = async ({ params }: { params: { username: string } }) => {
    const param = await params
    const user = await getProfileByUsername(param.username)
    if (!user) notFound();

    const [posts, likedPosts, isCurrentUserFollowing] = await Promise.all([
        getUserAllPosts(user.id),
        getUserLikedPosts(user.id),
        isFollowing(user.id)
    ])

    return (
        <ProfilePageClient
            user={user}
            posts={posts}
            likedPosts={likedPosts}
            isFollowing={isCurrentUserFollowing}
        />
    )
}

export default ProfilePage;
