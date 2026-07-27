import useSWR, { mutate } from 'swr';
import axiosInstance from '@/lib/axiosinstance';
import { AxiosError } from 'axios';
import { NotificationsResponse } from '@/lib/types/notification';
import { toast } from 'react-toastify';

const fetcher = (url: string) =>
  axiosInstance.get<NotificationsResponse>(url).then((res) => res.data);

export function useNotifications(
  page: number = 1,
  limit: number = 10,
  startDate?: string,
  endDate?: string,
  search?: string
) {
  const buildUrl = () => {
    let url = `/notifications?page=${page}&limit=${limit}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    if (search?.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
    return url;
  };
  const url = buildUrl();

  const { data, error, isLoading } = useSWR<NotificationsResponse>(url, fetcher);

  const markAsRead = async (notificationId: string) => {
    try {
      await axiosInstance.patch(`/notifications/${notificationId}/read`);
      mutate(url);
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      toast.error(err.response?.data?.message || 'Failed to mark notification as read');
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosInstance.patch('/notifications/read-all');
      mutate(url);
      toast.success('All notifications marked as read');
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      toast.error(err.response?.data?.message || 'Failed to mark all as read');
      throw error;
    }
  };

  const unreadCount = data?.data?.filter(n => !n.is_read).length || 0;

  return {
    notifications: data?.data || [],
    meta: data?.meta,
    unreadCount,
    isLoading,
    isError: error,
    markAsRead,
    markAllAsRead,
  };
}
