import PostCard from "@/components/PostCard";
import CreatePost from "@/components/CreatePost";
import WhoToFollow from "@/components/WhoToFollow";
import { currentUser } from "@clerk/nextjs/server";
import { getPosts } from "./actions/post.action";
import { getDbUserId } from "./actions/user.action";

export default async function Home() {
  const user = await currentUser();

  const posts = await getPosts();

  let dbUserId = null;

  if (user?.id) {
    try {
      dbUserId = await getDbUserId();
    } catch (error) {
      console.log("DB user not ready yet");
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      {/* MAIN FEED */}
      <div className="lg:col-span-6">
        {/* ONLY SHOW CREATE POST IF LOGGED IN */}
        {user?.id && <CreatePost />}

        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} dbUserId={dbUserId} />
          ))}
        </div>
      </div>

      {/* SIDEBAR */}
      <div className="hidden lg:block lg:col-span-4 sticky top-20">
        {user?.id && <WhoToFollow />}
      </div>
    </div>
  );
}