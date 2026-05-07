// Mock data for Violence Detection System

export interface Alert {
  id: string;
  timestamp: string;
  camera: string;
  location: string;
  confidence: number;
  type: 'violence' | 'suspicious' | 'weapon';
  thumbnail: string;
  status: 'new' | 'reviewed' | 'resolved';
}

export interface SystemHealth {
  gpu: number;
  ram: number;
  cpu: number;
  uptime: string;
  status: 'online' | 'offline' | 'warning';
}

export const systemHealth: SystemHealth = {
  gpu: 90,
  ram: 75,
  cpu: 45,
  uptime: '72h 15m',
  status: 'online',
};

export const recentAlerts: Alert[] = [
  {
    id: 'ALT-001',
    timestamp: '2024-12-06T14:32:00',
    camera: 'CAM-04',
    location: 'Main Entrance',
    confidence: 94,
    type: 'violence',
    thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&h=60&fit=crop',
    status: 'new',
  },
  {
    id: 'ALT-002',
    timestamp: '2024-12-06T14:28:00',
    camera: 'CAM-02',
    location: 'Parking Lot B',
    confidence: 87,
    type: 'suspicious',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=60&fit=crop',
    status: 'new',
  },
  {
    id: 'ALT-003',
    timestamp: '2024-12-06T14:15:00',
    camera: 'CAM-07',
    location: 'Loading Dock',
    confidence: 92,
    type: 'violence',
    thumbnail: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=100&h=60&fit=crop',
    status: 'reviewed',
  },
  {
    id: 'ALT-004',
    timestamp: '2024-12-06T13:58:00',
    camera: 'CAM-01',
    location: 'Lobby',
    confidence: 78,
    type: 'suspicious',
    thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=100&h=60&fit=crop',
    status: 'resolved',
  },
  {
    id: 'ALT-005',
    timestamp: '2024-12-06T13:45:00',
    camera: 'CAM-05',
    location: 'Stairwell C',
    confidence: 96,
    type: 'weapon',
    thumbnail: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=100&h=60&fit=crop',
    status: 'new',
  },
  {
    id: 'ALT-006',
    timestamp: '2024-12-06T13:30:00',
    camera: 'CAM-03',
    location: 'East Wing',
    confidence: 85,
    type: 'violence',
    thumbnail: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=100&h=60&fit=crop',
    status: 'reviewed',
  },
];

export const mockAlerts = recentAlerts;

export const quickActions = [
  {
    id: 'upload',
    title: 'Upload Video',
    description: 'Analyze recorded footage',
    icon: 'Upload',
    color: 'primary',
    route: '/upload',
  },
  {
    id: 'camera',
    title: 'Connect IP Camera',
    description: 'Add RTSP stream',
    icon: 'Video',
    color: 'accent',
    route: '/live',
  },
  {
    id: 'webcam',
    title: 'Webcam Mode',
    description: 'Live detection',
    icon: 'Camera',
    color: 'success',
    route: '/webcam',
  },
];
