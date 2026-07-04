export interface Notification {
    id: string;

    title: string;

    message: string;

    applicationRefNo: string;

    remarks: string;

    senderName: string;

    senderRole: string;

    receiverId: number;

    readAt: string | null;

    createdAt: string;
}