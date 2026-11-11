import {
  Activity,
  BookOpen,
  Brain,
  CalendarHeart,
  Cloud,
  Flame,
  Flower2,
  Gem,
  Heart,
  HeartPulse,
  MessageCircle,
  Moon,
  ScanFace,
  Shield,
  Sparkles,
  Sun,
  Swords,
  Timer,
  Users,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const icons: Record<string, LucideIcon> = {
  activity: Activity,
  'book-open': BookOpen,
  brain: Brain,
  'calendar-heart': CalendarHeart,
  cloud: Cloud,
  flame: Flame,
  flower: Flower2,
  rings: Gem,
  heart: Heart,
  'heart-pulse': HeartPulse,
  'message-circle': MessageCircle,
  mirror: ScanFace,
  moon: Moon,
  shield: Shield,
  sparkles: Sparkles,
  sun: Sun,
  swords: Swords,
  timer: Timer,
  users: Users,
  waves: Waves,
};

export function ServiceIcon({
  name,
  className,
}: {
  name?: string;
  className?: string;
}) {
  const Icon = icons[name || 'sparkles'] || Sparkles;
  return <Icon className={cn('h-5 w-5', className)} aria-hidden />;
}
