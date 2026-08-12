-- ═══════════════════════════════════════════════════════════
-- Kalima — 0004_seed_achievements.sql
-- كتالوج الإنجازات (أيقونات Ionicons)
-- ═══════════════════════════════════════════════════════════

insert into public.achievements
  (code, title_ar, title_en, desc_ar, desc_en, icon, xp_reward, sort_order)
values
  ('first_word',  'البداية',        'First Step',
   'أضفت أول كلمة',                   'Added your first word',
   'sparkles-outline',  20,  10),

  ('words_10',    'مجموعة صغيرة',   'Getting Started',
   'وصلت لـ 10 كلمات',                'Reached 10 words',
   'library-outline',   30,  20),

  ('words_50',    'مكتبة',          'Collector',
   'وصلت لـ 50 كلمة',                 'Reached 50 words',
   'library-outline',   75,  30),

  ('words_100',   'مئة كلمة',       'Century',
   'وصلت لـ 100 كلمة',                'Reached 100 words',
   'trophy-outline',   150,  40),

  ('words_500',   'قاموس متنقّل',   'Walking Dictionary',
   'وصلت لـ 500 كلمة',                'Reached 500 words',
   'trophy-outline',   500,  50),

  ('mastered_10', 'إتقان',          'Mastery',
   'أتقنت 10 كلمات',                  'Mastered 10 words',
   'ribbon-outline',   100,  60),

  ('mastered_50', 'إتقان متقدّم',   'Advanced Mastery',
   'أتقنت 50 كلمة',                   'Mastered 50 words',
   'ribbon-outline',   300,  70),

  ('streak_3',    'ثلاثة أيام',     'Three in a Row',
   'حققت هدفك 3 أيام متتالية',        '3-day streak',
   'flame-outline',     30,  80),

  ('streak_7',    'أسبوع كامل',     'Week Warrior',
   'حققت هدفك 7 أيام متتالية',        '7-day streak',
   'flame-outline',    100,  90),

  ('streak_30',   'شهر كامل',       'Monthly Master',
   'حققت هدفك 30 يوم متتالي',         '30-day streak',
   'flame-outline',    400, 100),

  ('streak_100',  'مئة يوم',        'Unstoppable',
   'حققت هدفك 100 يوم متتالي',        '100-day streak',
   'flame-outline',   1500, 110),

  ('level_5',     'المستوى الخامس', 'Level 5',
   'وصلت للمستوى 5',                  'Reached level 5',
   'star-outline',      50, 120),

  ('level_10',    'المستوى العاشر', 'Level 10',
   'وصلت للمستوى 10',                 'Reached level 10',
   'star-outline',     200, 130)

on conflict (code) do update set
  title_ar   = excluded.title_ar,
  title_en   = excluded.title_en,
  desc_ar    = excluded.desc_ar,
  desc_en    = excluded.desc_en,
  icon       = excluded.icon,
  xp_reward  = excluded.xp_reward,
  sort_order = excluded.sort_order;
