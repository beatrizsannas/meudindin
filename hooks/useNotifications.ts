import { useState, useEffect, useMemo } from 'react';
import { useCreditCards } from './useCreditCards';

export interface NotificationItem {
    id: string;
    type: 'due_date';
    title: string;
    message: string;
    date: string; // The due date string
    cardId: string;
    isRead: boolean;
    timestamp: number; // For sorting
}

export const useNotifications = (userId: string | undefined) => {
    const { cards } = useCreditCards(userId);
    const [readIds, setReadIds] = useState<Set<string>>(new Set());

    // Load read receipts from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(`notifications_read_${userId}`);
            if (stored) {
                setReadIds(new Set(JSON.parse(stored) as string[]));
            }
        } catch (e) {
            console.error("Failed to load notification state", e);
        }
    }, [userId]);

    // Save read receipts when they change
    const saveReadIds = (newSet: Set<string>) => {
        setReadIds(newSet);
        if (userId) {
            localStorage.setItem(`notifications_read_${userId}`, JSON.stringify(Array.from(newSet)));
        }
    };

    const notifications = useMemo(() => {
        if (!cards || cards.length === 0) return [];

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // 0-indexed

        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + 2); // Check 2 days ahead
        const targetDay = targetDate.getDate();

        // Generate notifications
        const active: NotificationItem[] = [];

        cards.forEach(card => {
            if (card.due_day === targetDay) {
                // Construct a unique ID for this specific monthly occurrence
                // Format: cardId-year-month
                // Example: 123-2024-1 (February 2024)
                // Note: using targetDate's year/month to be precise about WHICH bill works best
                const notifId = `${card.id}-${targetDate.getFullYear()}-${targetDate.getMonth()}`;

                active.push({
                    id: notifId,
                    type: 'due_date',
                    title: 'Fatura Vencendo',
                    message: `A fatura do cartão ${card.name} vence em 2 dias.`,
                    date: `Dia ${card.due_day}`,
                    cardId: card.id,
                    isRead: readIds.has(notifId),
                    timestamp: targetDate.getTime()
                });
            }
        });

        return active;
    }, [cards, readIds]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const markAsRead = (id: string) => {
        const newSet = new Set(readIds);
        newSet.add(id);
        saveReadIds(newSet);
    };

    const markAllAsRead = () => {
        const newSet = new Set(readIds);
        notifications.forEach(n => newSet.add(n.id));
        saveReadIds(newSet);
    };

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead
    };
};
