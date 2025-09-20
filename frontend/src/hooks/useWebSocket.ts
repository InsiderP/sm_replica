import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken } from '@/lib/auth';
import { WS_URL } from '@/lib/config';

export interface Notification {
  type: 'hangout_request' | 'hangout_response' | 'location_update';
  requestId?: string;
  fromUser?: {
    id: string;
    userName: string;
    avatarUrl?: string;
    firstName?: string;
    lastName?: string;
  };
  status?: string;
  message: string;
  timestamp: string;
  nearbyUsers?: Array<{
    id: string;
    userName: string;
    avatarUrl?: string;
    distanceKm: number;
    latitude: number;
    longitude: number;
  }>;
}

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // Initialize socket connection
    const newSocket = io(`${WS_URL}/hangouts`, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = newSocket;

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to hangout notifications');
      setIsConnected(true);
      
      // Join user room - get user ID from token
      const token = getToken();
      if (token) {
        try {
          // Decode JWT to get user ID (this is a simple approach)
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userId = payload.sub || payload.user_id;
          if (userId) {
            newSocket.emit('join_user_room', { userId });
          }
        } catch (error) {
          console.error('Error extracting user ID from token:', error);
        }
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from hangout notifications');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    // Notification events
    newSocket.on('hangout_request', (notification: Notification) => {
      console.log('Received hangout request:', notification);
      setNotifications(prev => [notification, ...prev]);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification('Hangout Request', {
          body: notification.message,
          icon: notification.fromUser?.avatarUrl || undefined,
        });
      }
    });

    newSocket.on('hangout_response', (notification: Notification) => {
      console.log('Received hangout response:', notification);
      setNotifications(prev => [notification, ...prev]);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification('Hangout Response', {
          body: notification.message,
          icon: notification.fromUser?.avatarUrl || undefined,
        });
      }
    });

    newSocket.on('location_update', (notification: Notification) => {
      console.log('Received location update:', notification);
      setNotifications(prev => [notification, ...prev]);
    });

    newSocket.on('connected', (data) => {
      console.log('Socket connected:', data);
    });

    setSocket(newSocket);

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup on unmount
    return () => {
      newSocket.close();
      socketRef.current = null;
    };
  }, []);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  return {
    socket,
    isConnected,
    notifications,
    clearNotifications,
    removeNotification,
  };
}
