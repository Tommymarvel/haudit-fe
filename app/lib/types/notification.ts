export interface Notification {
  _id: string;
  type: string;
  title: string;
  description: string;
  is_read: boolean;
  user: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface NotificationsResponse {
  data: Notification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
