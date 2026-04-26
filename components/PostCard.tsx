"use client"
import { createComment, deleteComment, deletePost, getPosts, toggleLike, updateComment } from '@/app/actions/post.action';
import { SignInButton, useUser } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { Check, HeartIcon, Loader2, LogInIcon, MessageCircleIcon, MoreVertical, Pencil, SendIcon, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect,useRef } from 'react';
import toast from 'react-hot-toast';
import { DeleteAlertDialog } from './DeleteAlertDialog';
import { Avatar, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Textarea } from './ui/textarea';

type Posts = Awaited<ReturnType<typeof getPosts>>
type Post = Posts[0]

function PostCard({ post, dbUserId }: { post: Post; dbUserId: string | null }) {
    const { user } = useUser()

    const [newComment, setNewComment] = useState("")
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCommenting, setIsCommenting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasLiked, setHasLiked] = useState(post.likes.some((like) => like.userId === dbUserId))
    const [optimisticLikes, setOptimisticLikes] = useState(post._count.likes);
    const [showComments, setShowComments] = useState(false);
const [expanded, setExpanded] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
const menuRef = useRef<HTMLDivElement | null>(null);

    const handleLike = async (postId: string) => {
        if (isLiking) return
        try {
            setIsLiking(true)
            setHasLiked((prev) => !prev)
            setOptimisticLikes((prev) => hasLiked ? prev - 1 : prev + 1)
            await toggleLike(postId)

        } catch (error) {
            setOptimisticLikes(post._count.likes)
            setHasLiked(post.likes.some((like) => like.userId === dbUserId))
        } finally {
            setIsLiking(false)
        }
    }
    const handleDeletePost = async (postId: string) => {
        if (isDeleting) return;
        try {
            setIsDeleting(true);
            const result = await deletePost(postId);
            if (result?.success) toast.success("Post deleted successfully");
            else throw new Error(result?.error);
        } catch (error) {
            toast.error("Failed to delete post");
        } finally {
            setIsDeleting(false);
        }
    }
    const handleAddComment = async (postId: string) => {
        if (!newComment.trim() || isCommenting) return;
        try {
            setIsCommenting(true);
            const result = await createComment(postId, newComment);
            if (result?.success) {
                toast.success("Comment posted successfully");
                setNewComment("");
            }
        } catch (error) {
            toast.error("Failed to add comment");
        } finally {
            setIsCommenting(false);
        }
    }
  const handleDeleteComment = async (commentId: string) => {
    try {
      const result = await deleteComment(commentId);

      if (result?.success) {
        toast.success("Comment deleted");
      } else {
        toast.error(result?.error || "Failed to delete");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };
const handleUpdateComment = async (commentId: string) => {
  if (!editText.trim() || isUpdating) return;

  try {
    setIsUpdating(true);

    const result = await updateComment(commentId, editText);

    if (result?.success) {
      toast.success("Comment updated");
      setEditingCommentId(null);
      setEditText("");
    } else {
      toast.error(result?.error || "Failed to update");
    }
  } catch {
    toast.error("Something went wrong");
  } finally {
    setIsUpdating(false);
  }
};
  // For outside click of comment menu
useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setOpenMenuId(null);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            <div className="flex space-x-3 sm:space-x-4">
              <Link href={`/profile/${post.author.username}`}>
                <Avatar className="size-8 sm:w-10 sm:h-10">
                  <AvatarImage src={post.author.image ?? "/avatar.png"} />
                </Avatar>
              </Link>

              {/* POST HEADER & TEXT CONTENT */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 truncate">
                    <Link
                      href={`/profile/${post.author.username}`}
                      className="font-semibold truncate"
                    >
                      {post.author.name}
                    </Link>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Link href={`/profile/${post.author.username}`}>
                        @{post.author.username}
                      </Link>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(post.createdAt))} ago
                      </span>
                    </div>
                  </div>
                  {/* Check if current user is the post author */}
                  {dbUserId === post.author.id && (
                    <DeleteAlertDialog
                      isDeleting={isDeleting}
                      onDelete={() => handleDeletePost(post.id)}
                    />
                  )}
                </div>
                <p
                  className={`mt-2 text-sm text-foreground break-words ${
                    expanded ? "" : "line-clamp-3"
                  }`}
                >
                  {post.content}
                </p>

                {post.content && post.content.length > 120 && (
                  <button
                    onClick={() => setExpanded((prev) => !prev)}
                    className="text-sm text-muted-foreground hover:text-primary mt-1"
                  >
                    {expanded ? "Show less" : "...see more"}
                  </button>
                )}
              </div>
            </div>

            {/* POST IMAGE */}
            {post.image && (
              <div className="rounded-xl overflow-hidden border">
                <img
                  src={post.image}
                  alt="Post content"
                  className="w-full max-h-[500px] object-cover cursor-pointer hover:scale-[1.01] transition-transform"
                />
              </div>
            )}

            {/* LIKE & COMMENT BUTTONS */}
            <div className="flex items-center pt-2 space-x-4">
              {user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-muted-foreground gap-2 ${
                    hasLiked
                      ? "text-red-500 hover:text-red-600"
                      : "hover:text-red-500"
                  }`}
                  onClick={() => handleLike(post.id)}
                >
                  {hasLiked ? (
                    <HeartIcon className="size-5 fill-current" />
                  ) : (
                    <HeartIcon className="size-5" />
                  )}
                  <span>{optimisticLikes}</span>
                </Button>
              ) : (
                <SignInButton mode="modal">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground gap-2"
                  >
                    <HeartIcon className="size-5" />
                    <span>{optimisticLikes}</span>
                  </Button>
                </SignInButton>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground gap-2 hover:text-blue-500"
                onClick={() => setShowComments((prev) => !prev)}
              >
                <MessageCircleIcon
                  className={`size-5 ${showComments ? "fill-blue-500 text-blue-500" : ""}`}
                />
                <span>{post.comments.length}</span>
              </Button>
            </div>

            {/* COMMENTS SECTION */}
            {showComments && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-4">
                  {/* DISPLAY COMMENTS */}
                  {post.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex items-start justify-between gap-2"
                    >
                      {/* LEFT SIDE */}
                      <div className="flex space-x-3 flex-1">
                        <Link
                          href={`/profile/${comment.author.username}`}
                          className="font-semibold truncate"
                        >
                          <Avatar className="size-8">
                            <AvatarImage
                              src={comment.author.image ?? "/avatar.png"}
                            />
                          </Avatar>
                        </Link>

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <Link
                              href={`/profile/${comment.author.username}`}
                              className="font-medium"
                            >
                              {comment.author.name}
                            </Link>

                            <Link
                              href={`/profile/${comment.author.username}`}
                              className="text-muted-foreground "
                            >
                              @{comment.author.username}
                            </Link>

                            <span className="text-muted-foreground">·</span>

                            <span className="text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.createdAt))}{" "}
                              ago
                            </span>
                          </div>

                          {/* EDIT MODE */}
                          {editingCommentId === comment.id ? (
                            <>
                              <Textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="mt-1 resize-none"
                              />
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateComment(comment.id)
                                  }
                                  disabled={isUpdating || !editText.trim()}
                                  className="flex items-center gap-2 h-9 px-4"
                                >
                                  {isUpdating ? (
                                    <>
                                      <Loader2 className="size-4 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    "Save"
                                  )}
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingCommentId(null)}
                                  className="flex items-center gap-2 h-9 px-3 border-muted text-muted-foreground hover:bg-muted hover:text-foreground transition"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </>
                          ) : (
                            <p className="text-sm break-words">
                              {comment.content}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* RIGHT SIDE*/}
                      {dbUserId === comment.author.id && (
                        <div
                          ref={openMenuId === comment.id ? menuRef : null}
                          className="relative"
                        >
                          <button
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === comment.id ? null : comment.id,
                              )
                            }
                            className="p-1 rounded-full hover:bg-muted transition"
                          >
                            <MoreVertical className="size-5" />
                          </button>

                          {openMenuId === comment.id && (
                            <div className="absolute right-0 mt-2 w-36 rounded-md border bg-popover text-popover-foreground shadow-md z-50">
                              <button
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditText(comment.content);
                                  setOpenMenuId(null);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted"
                              >
                                <Pencil className="size-4" />
                                Edit
                              </button>

                              <button
                                onClick={() => {
                                  handleDeleteComment(comment.id);
                                  setOpenMenuId(null);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-muted"
                              >
                                <Trash2 className="size-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {user ? (
                  <div className="flex space-x-3">
                    <Avatar className="size-8 flex-shrink-0">
                      <AvatarImage src={user?.imageUrl || "/avatar.png"} />
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px] resize-none"
                      />
                      <div className="flex justify-end mt-2">
                        <Button
                          size="sm"
                          onClick={() => handleAddComment(post.id)}
                          className="flex items-center gap-2"
                          disabled={!newComment.trim() || isCommenting}
                        >
                          {isCommenting ? (
                            "Posting..."
                          ) : (
                            <>
                              <SendIcon className="size-4" />
                              Comment
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center p-4 border rounded-lg bg-muted/50">
                    <SignInButton mode="modal">
                      <Button variant="outline" className="gap-2">
                        <LogInIcon className="size-4" />
                        Sign in to comment
                      </Button>
                    </SignInButton>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
}

export default PostCard 
