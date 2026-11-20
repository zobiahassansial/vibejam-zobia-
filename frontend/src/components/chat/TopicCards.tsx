import React, { useState } from 'react';
import {
  BookOpen,
  Bus,
  FileQuestion,
  FolderKanban,
  GraduationCap,
  Library,
  LifeBuoy,
  Receipt,
  type LucideIcon,
} from 'lucide-react';

const WELCOME_TOPICS_ANIMATED_KEY = 'askse_welcome_topics_animated';

export const TOPICS: readonly {
  title: string;
  subtitle: string;
  question: string;
  icon: LucideIcon;
  color: string;
  soft: string;
}[] = [
  {
    title: 'Labs',
    subtitle: 'Hours & Lab Rules',
    question: 'When is CS-LAB-102A open, and can I eat there?',
    icon: BookOpen,
    color: 'var(--accent)',
    soft: 'var(--primary-soft)',
  },
  {
    title: 'Attendance',
    subtitle: '80% Exam Eligibility',
    question: 'What is the attendance requirement?',
    icon: GraduationCap,
    color: 'var(--violet)',
    soft: 'var(--violet-soft)',
  },
  {
    title: 'Library',
    subtitle: 'Weekdays & Friday Hours',
    question: 'What are the library timings?',
    icon: Library,
    color: 'var(--teal)',
    soft: 'var(--teal-soft)',
  },
  {
    title: 'Exams',
    subtitle: 'Medical Retake Policy',
    question: 'What if I miss a midterm because I was ill?',
    icon: FileQuestion,
    color: 'var(--warning)',
    soft: 'var(--warning-soft)',
  },
  {
    title: 'Fees',
    subtitle: 'Due Date & Challan Info',
    question: 'When is the Spring 2027 fee due?',
    icon: Receipt,
    color: 'var(--pink)',
    soft: 'var(--pink-soft)',
  },
  {
    title: 'FYP',
    subtitle: 'Group Size & Deadline',
    question: 'How do I submit my FYP proposal?',
    icon: FolderKanban,
    color: 'var(--primary)',
    soft: 'var(--primary-soft)',
  },
  {
    title: 'Transport',
    subtitle: 'Departure Times & Cards',
    question: 'When do the university buses leave?',
    icon: Bus,
    color: 'var(--teal)',
    soft: 'var(--teal-soft)',
  },
  {
    title: 'Help',
    subtitle: 'Room 210 & Email',
    question: 'Who do I contact for anything else?',
    icon: LifeBuoy,
    color: 'var(--danger)',
    soft: 'var(--danger-soft)',
  },
];

function useWelcomeTopicEntrance(enabled: boolean) {
  const [shouldAnimate] = useState(() => {
    if (!enabled) return false;
    try {
      if (sessionStorage.getItem(WELCOME_TOPICS_ANIMATED_KEY)) return false;
      sessionStorage.setItem(WELCOME_TOPICS_ANIMATED_KEY, '1');
      return true;
    } catch {
      return false;
    }
  });

  return shouldAnimate;
}

type TopicCardGridProps = {
  onSelect: (question: string) => void;
  layout?: 'welcome' | 'drawer';
};

export function TopicCardGrid({ onSelect, layout = 'welcome' }: TopicCardGridProps) {
  const animateEntrance = useWelcomeTopicEntrance(layout === 'welcome');
  const gridClass =
    layout === 'drawer'
      ? 'grid grid-cols-2 gap-2 w-full'
      : 'grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-2.5 w-full max-w-[900px] mx-auto';

  return (
    <div className={gridClass}>
      {TOPICS.map((topic, index) => {
        const Icon = topic.icon;
        const topicVars = {
          '--topic-color': topic.color,
          '--topic-soft': topic.soft,
        } as React.CSSProperties;

        const entranceStyle: React.CSSProperties = animateEntrance
          ? { ...topicVars, animationDelay: `${index * 40}ms` }
          : topicVars;

        return (
          <button
            key={topic.title}
            type="button"
            onClick={() => onSelect(topic.question)}
            aria-label={`${topic.title}: ${topic.subtitle}`}
            style={entranceStyle}
            className={[
              'group relative flex min-w-0 flex-row items-center gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2.5 sm:p-3 text-left',
              animateEntrance ? 'topic-card-enter' : '',
              'transition-[transform,box-shadow,border-color] duration-200 ease-out',
              'hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--topic-color)_50%,transparent)]',
              'hover:shadow-[0_8px_24px_-8px_color-mix(in_srgb,var(--topic-color)_45%,transparent)]',
              'active:scale-[0.98] motion-reduce:transform-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
            ].join(' ')}
          >
            <span
              className={[
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 ease-out',
                'group-hover:scale-[1.08] motion-reduce:group-hover:scale-100',
              ].join(' ')}
              style={{ backgroundColor: 'var(--topic-soft)', color: 'var(--topic-color)' }}
            >
              <Icon size={16} strokeWidth={2} aria-hidden />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-semibold text-[var(--text)]">{topic.title}</span>
              <span className="block truncate text-xs text-[var(--text-muted)]">{topic.subtitle}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}