import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, User, Building, MapPin, Mail, Phone, Calendar, Euro, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IncidentIconProps {
  type: 'status' | 'impact' | 'user' | 'building' | 'location' | 'email' | 'phone' | 'date' | 'amount' | 'tag';
  className?: string;
}

const IncidentIcon: React.FC<IncidentIconProps> = ({ type, className }) => {
  const icons = {
    status: CheckCircle2,
    impact: AlertTriangle,
    user: User,
    building: Building,
    location: MapPin,
    email: Mail,
    phone: Phone,
    date: Calendar,
    amount: Euro,
    tag: Tag
  };

  const Icon = icons[type];

  return <Icon className={cn("h-4 w-4", className)} />;
};

export default IncidentIcon;