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
        const currentDay = today.getDate();

        // Generate notifications for the current month
        const active: NotificationItem[] = [];

        cards.forEach(card => {
            const dueDay = card.due_day;

            // Calculate how many days until/since the due date this month
            const daysUntilDue = dueDay - currentDay;

            // Only show notifications for due dates that:
            // 1. Are within 2 days in the future (daysUntilDue <= 2 and daysUntilDue >= 0)
            // 2. OR have already passed this month (daysUntilDue < 0) and haven't been marked as read

            // Construct notification ID for this month's occurrence
            const notifId = `${card.id}-${currentYear}-${currentMonth}`;
            const isRead = readIds.has(notifId);

            // Show if: (upcoming within 2 days) OR (already passed this month AND not marked as read)
            if ((daysUntilDue >= 0 && daysUntilDue <= 2) || (daysUntilDue < 0 && !isRead)) {
                const dueDate = new Date(currentYear, currentMonth, dueDay);

                active.push({
                    id: notifId,
                    type: 'due_date',
                    title: daysUntilDue < 0 ? 'Fatura Vencida' : 'Fatura Vencendo',
                    message: daysUntilDue < 0
                        ? `A fatura do cartão ${card.name} venceu há ${Math.abs(daysUntilDue)} dia(s).`
                        : daysUntilDue === 0
                            ? `A fatura do cartão ${card.name} vence hoje.`
                            : `A fatura do cartão ${card.name} vence em ${daysUntilDue} dia(s).`,
                    date: `Dia ${dueDay}`,
                    cardId: card.id,
                    isRead: isRead,
                    timestamp: dueDate.getTime()
                });
            }
        });

        // Sort by timestamp (oldest first)
        return active.sort((a, b) => a.timestamp - b.timestamp);
    }, [cards, readIds]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const markAsRead = (id: string) => {
        const newSet = new Set<string>(readIds);
        newSet.add(id);
        saveReadIds(newSet);
    };

    const markAllAsRead = () => {
        const newSet = new Set<string>(readIds);
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
