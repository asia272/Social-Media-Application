"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getDbUserId } from "./user.action";

export async function createPost(content: string, image: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "User not found" };
    const post = await prisma.post.create({
      data: {
        content,
        image,
        authorId: userId,
      },
    });
    revalidatePath("/");
    return { success: true, post };
  } catch (error) {
    console.log("Faild to create post:", error);
    return { success: false, error: "Failed to create post" };
  }
}
export const getPosts = async () => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });
    return posts;
  } catch (error) {
    console.log("Error in get posts:", error);
    throw new Error("Failed to fetch posts");
       return [];
  }
};

export async function toggleLike(postId: string) {
  try {
    const dbUserId = await getDbUserId();
    if (!dbUserId) return;

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: dbUserId,
          postId,
        },
      },
    });
    if (existingLike) {
      return prisma.like.delete({
        where: {
          userId_postId: {
            userId: dbUserId,
            postId,
          },
        },
      });
    } else {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });
      if (!post) throw new Error("Post not found");
      //like and creat notification(only if liking someone else's post)
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId: dbUserId,
            postId,
          },
        }),
        ...(post.authorId !== dbUserId
          ? [
              prisma.notification.create({
                data: {
                  type: "LIKE",
                  userId: post.authorId, // recipient (post author)
                  creatorId: dbUserId, // person who liked
                  postId,
                },
              }),
            ]
          : []),
      ]);
    }
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.log("Failed to toggle like:", error);
    return { success: false, error: "Failed to toggle like" };
  }
}
export async function deletePost(postId: string) {
  try {
    const dbUserId = await getDbUserId();
    if (!dbUserId) return;
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: { authorId: true },
    });
    if (!post) throw new Error("Post not found");
    await prisma.post.delete({
      where: {
        id: postId,
      },
    });
    revalidatePath("/"); // purge the cache
    return { success: true };
  } catch (error) {
    console.error("Failed to delete post:", error);
    return { success: false, error: "Failed to delete post" };
  }
}
export async function createComment(postId: string, content: string) {
  try {
    const dbUserId = await getDbUserId();
    if (!dbUserId) return;
    if (!content) throw new Error("Content is required");
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("Post not found");

    // Create comment and notification in a transaction
    const [comment] = await prisma.$transaction(async (tx) => {
      // Create comment first
      const newComment = await tx.comment.create({
        data: {
          content,
          authorId: dbUserId,
          postId,
        },
      });

      // Create notification if commenting on someone else's post
      if (post.authorId !== dbUserId) {
        await tx.notification.create({
          data: {
            type: "COMMENT",
            userId: post.authorId, //reveiver,owner of post
            creatorId: dbUserId, //creator
            postId,
            commentId: newComment.id,
          },
        });
      }

      return [newComment];
    });
    revalidatePath(`/`);
    return { success: true, comment };
  } catch (error) {
    console.error("Failed to create comment:", error);
    return { success: false, error: "Failed to create comment" };
  }
}
export async function deleteComment(commentId: string) {
  try {
    const dbUserId = await getDbUserId();
    if (!dbUserId) return { success: false, error: "Unauthorized" };

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });

    if (!comment) throw new Error("Comment not found");

    if (comment.authorId !== dbUserId) {
      return { success: false, error: "Not allowed" };
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return { success: false, error: "Failed to delete comment" };
  }
}
export async function updateComment(commentId: string, content: string) {
  try {
    const dbUserId = await getDbUserId();
    if (!dbUserId) return { success: false, error: "Unauthorized" };

    if (!content.trim()) {
      return { success: false, error: "Content required" };
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });

    if (!comment) {
      return { success: false, error: "Comment not found" };
    }

    if (comment.authorId !== dbUserId) {
      return { success: false, error: "Not allowed" };
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { content },
    });

    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Failed to update comment:", error);
    return { success: false, error: "Failed to update comment" };
  }
}