"use client";

import { useEffect, useState } from "react";
import { getUnreadNotificationsCount } from "@/app/actions/notification.action";
import { Badge } from "@/components/ui/badge";

export default function NotificationBadge() {
    const [count, setCount] = useState<number>(0);

    const fetchCount = async () => {
        const data = await getUnreadNotificationsCount();
        setCount(data ?? 0);
    };

    useEffect(() => {
        fetchCount();

        const interval = setInterval(fetchCount, 10000);
        return () => clearInterval(interval);
    }, []);

    if (count === 0) return null;

    return (
        <Badge
            variant="destructive"
            className="absolute -top-3 -right-2 h-5 min-w-[20px] flex items-center justify-center rounded-full px-1 text-xs"
        >
            {count}
        </Badge>
    );
}