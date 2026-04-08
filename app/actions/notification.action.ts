"use server";

import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.action";


//get notitification of current user
export async function getUserNotifications() {
    try {
        const dbUserId = await getDbUserId();
        if (!dbUserId) return null

        const notifications = await prisma.notification.findMany({
            where: {
                userId: dbUserId
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true
                    }
                },
                post: {
                    select: {
                        id: true,
                        content: true,
                        image: true
                    }
                },
                comment: {
                    select: {
                        id: true,
                        content: true,
                        createdAt: true,
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        })
        return notifications;
    } catch (error) {
        console.error("Error fetching notifications:", error);
        throw new Error("Failed to fetch notifications");
    }
}
// Mark as read notification
export async function markAsReadNotifications(notificationIds: string[]) {
    try {
        await prisma.notification.updateMany({
            where: {
                id: {
                    in: notificationIds,
                },
            },
            data: {
                read: true,
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        return { success: false };
    }
}
export async function getUnreadNotificationsCount() {
    try {
        const dbUserId = await getDbUserId();
        if (!dbUserId) return null

        return await prisma.notification.count({
            where: {
                userId: dbUserId,
                read: false,
            },
        });
    } catch (error) {
        throw new Error("Faild to get count")
    }

}