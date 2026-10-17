// Available social-icon platforms for the footer. Icons are from lucide-react.
import {
  Facebook, Instagram, Twitter, Youtube, Linkedin, Github,
  Send, MessageCircle, Mail, Globe, Music2, type LucideIcon,
} from 'lucide-react';

export const SOCIAL_ICONS: Record<string, LucideIcon> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
  github: Github,
  telegram: Send,
  whatsapp: MessageCircle,
  tiktok: Music2,
  email: Mail,
  website: Globe,
};

export const SOCIAL_OPTIONS: { key: string; label: string }[] = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'twitter', label: 'Twitter / X' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'github', label: 'GitHub' },
  { key: 'email', label: 'Email' },
  { key: 'website', label: 'Website' },
];
