# Kalima — Design Brief & Screen Prompts

> **للاستخدام:** كل قسم «Prompt» تحت مكتوب بالإنجليزي وجاهز للنسخ كما هو —
> ابعت القسم اللي عايزه لمصمم أو لأداة توليد صور. القسم الأول (Design System)
> ابعته مرة واحدة في البداية عشان يثبّت الهوية، وبعدين ابعت أي شاشة لوحدها.

---

## 0. Design System — send this first

```
PRODUCT
Kalima — a mobile vocabulary app for Arabic speakers learning English.
You save words you keep forgetting; AI writes the translation, examples and
pronunciation; spaced repetition brings each word back right before you'd
forget it.

PLATFORM
iOS and Android phone screens, 1080 × 2340 px (portrait, 9:19.5).
Show a realistic status bar and a home indicator.

VISUAL LANGUAGE
Modern 2026 mobile UI. Near-monochrome canvas with a single confident accent.
Translucent frosted-glass cards floating over a soft coloured wash.
Generous corner radii, layered soft shadows, tight letter-spacing on large
type. Calm, premium, uncluttered — closer to Linear or Arc than to a
gamified language app. No skeuomorphism, no drop-shadow bevels, no clip-art
mascots, no gradients on text.

LIGHT THEME PALETTE
  Page background        #F6F7FB
  Ambient gradient       #FFFFFF → #F6F7FB, top 520px, fading into the page
  Accent glow            radial #5B5BF5 at 10% opacity, top-left corner
  Card fill              #FFFFFF (opaque). On iOS only, cards may use a
                         frosted blur at 72% white; never on Android.
  Solid card             #FFFFFF
  Sunken / track         #ECEEF5
  Hairline border        rgba(11,13,20,0.06) — LIGHT MODE USES NO CARD BORDER,
                         separation comes from the shadow alone
  Strong border          rgba(11,13,20,0.14)
  Primary text           #0B0D14
  Secondary text         #5C6373
  Faint text             #98A0B2
  Brand (primary)        #5B5BF5
  Brand gradient end     #8B5CF6
  Brand tint fill        #5B5BF5 at 10%
  Brand tint border      #5B5BF5 at 22%
  Text on brand          #FFFFFF
  Accent / streak        #FF8A3D
  Success                #10B981
  Danger                 #F43F5E
  Warning                #E08600

DARK THEME PALETTE
  Page background        #08090E
  Ambient gradient       #12141C (top) → #08090E (bottom)
  Glass card fill        white at 5.5% opacity + background blur
  Solid card             #12141C
  Elevated card          #171A24
  Sunken / track         #0D0F16
  Hairline border        rgba(255,255,255,0.09)
  Primary text           #F2F4FA
  Secondary text         #9BA3B6
  Faint text             #666E80
  Brand                  #8080FF
  Brand gradient end     #A78BFA
  Text on brand          #0A0B12
  Accent / streak        #FF9F5A
  Success                #34D399
  Danger                 #FB7185

TYPOGRAPHY
Inter (or SF Pro / Geist). English is the default UI language.
  Display     36px / 700 / letter-spacing −1
  Word        34px / 700 / −0.8   (the English vocabulary word itself)
  Title       26px / 700 / −0.5
  Heading     19px / 600 / −0.2
  Body        16px / 400 / line-height 25
  Body strong 16px / 600
  Label       14px / 600
  Caption     13px / 400
  Micro       11px / 600 / letter-spacing +0.6 / UPPERCASE  (section labels)

GEOMETRY
  Corner radii: 10 / 14 / 20 / 28 / 36 px, plus fully-rounded pills
  Cards use 20–36px. Buttons 14px. Chips and avatars fully rounded.
  Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48
  Screen side padding: 16px
  Minimum tap target: 48 × 48px

SHADOWS
  Card:   0 6px 18px rgba(11,13,20,0.07)
  Raised: 0 14px 32px rgba(11,13,20,0.11)
  Brand glow (primary buttons only): 0 10px 22px rgba(91,91,245,0.28)

CORE COMPONENTS
  Primary button — 56px tall, radius 14, linear gradient #5B5BF5 → #8B5CF6
                   (135°), white 16px/600 label, coloured glow beneath.
  Secondary button — same size, white-glass fill, hairline border, dark label.
  Card — radius 20–36, opaque white fill, NO border in light mode, soft shadow.
         In dark mode: no shadow, a single hairline border instead.
  Badge / chip — pill, tinted fill at ~10%, matching text colour, 13px/600,
                 optional 13px outline icon on the leading side.
  Bottom sheet — radius 36 top corners, 40×4px grey drag handle, dark
                 backdrop at 50%. Used for every dialog; never a centred modal.
  Icons — Ionicons outline style, 19–24px. Filled variant only when active.
  Progress bar — 10px tall, fully rounded, #ECEEF5 track, brand-coloured fill.

RULES
  • Arabic text renders right-to-left; English words always left-to-right.
  • State is never conveyed by colour alone — always icon + text as well.
  • Never nest a bordered box inside a bordered card.
  • No emoji in the UI.
```

---

## 1. Welcome / Landing

```
Kalima welcome screen, light theme, 1080×2340.

Top-right: a small pill toggle with two segments "EN" and "ع"; EN is active
(filled #5B5BF5, white text), ع inactive (transparent, #98A0B2 text).

Centred hero: a 96×96 rounded-square app icon, radius 28, filled with a 135°
gradient #5B5BF5 → #8B5CF6, glowing softly; inside it a white bookmark
symbol. Below it "Kalima" at 36px/700 in #0B0D14, then the subtitle
"Learn a word once. Keep it for good." at 16px in #5C6373.

Below, three stacked glass feature cards (radius 20, white 66% + blur,
hairline border, 16px padding, 12px gap). Each has a 46×46 rounded square
tinted #5B5BF5 at 10% containing a #5B5BF5 outline icon, then two lines:
  1. sparkles icon — "Just type the word" / "Translation, examples and
     pronunciation arrive on their own"
  2. clock icon — "Reviews timed right" / "We resurface each word just
     before you'd forget it"
  3. flame icon — "Five minutes a day" / "A daily streak that keeps you
     going without effort"
Titles 16px/600 #0B0D14, bodies 13px #5C6373.

Bottom: a full-width 56px gradient primary button "Get started" with a
trailing arrow and a violet glow; under it a white-glass secondary button
"I have an account". Finally one line of 13px #98A0B2 centred legal text
with "Terms of Use" and "Privacy Policy" in #5B5BF5.

Soft #5B5BF5 radial glow at 10% bleeding from the top-left corner.
```

---

## 2. Sign in

```
Kalima sign-in screen, light theme, 1080×2340.

Header row: a 40×40 circular white-glass back button with a hairline border
and a dark chevron; title "Sign in" 26px/700 #0B0D14; on the right the
EN/ع pill toggle. Beneath the title, "Welcome back" 16px #5C6373.

One large glass card (radius 28, white 66% + blur, 16px padding, soft
shadow) containing:
  • Label "Email" 14px/600 #5C6373, then a 48px input field, radius 14,
    white-glass fill, hairline border, placeholder "you@example.com" in
    #98A0B2.
  • Label "Password" and a masked input; the focused field has a 2px
    #5B5BF5 border instead of the hairline.
  • A row under it: "Show" on the left and "Forgot your password?" on the
    right, both 13px #5B5BF5.
  • A full-width 56px gradient primary button "Sign in".

Under the card, centred: "No account yet?" 16px #5C6373 followed by
"Create one" 16px/600 #5B5BF5.

Show an inline error banner variant too: a soft #F43F5E-at-10% rounded
rectangle with a red alert-circle icon and the text "Wrong email or
password" in #F43F5E.
```

---

## 3. Onboarding — level picker

```
Kalima onboarding step, light theme, 1080×2340.

At the top, three progress dots centred: the first is a 24×8 rounded bar in
#5B5BF5, the other two are 8×8 dots in a pale border grey.

Heading "What's your English level?" 26px/700 #0B0D14, then the subtitle
"We use it to tune how explanations and examples are written. You can change
it anytime." 16px #5C6373.

A vertical list of six selectable option rows, 8px apart, each radius 14,
white-glass fill, hairline border, 16px padding, minimum 60px tall. Each row
shows a bold title and a smaller grey description, with a circular radio
indicator on the trailing edge.
  Complete beginner / I know basic words like numbers and colours
  Beginner / I understand short sentences and can introduce myself
  Intermediate / I hold everyday conversations and follow most speech
  Upper intermediate / I read articles and watch films without subtitles
  Advanced / I handle academic and professional material
  Near native / I understand practically everything

The third row is selected: fill #5B5BF5 at 10%, 2px #5B5BF5 border, title in
#5B5BF5, and a filled #5B5BF5 check-circle on the trailing edge.

At the bottom, a full-width gradient primary button "Next" with a trailing
arrow.
```

---

## 4. Home

```
Kalima home screen, light theme, 1080×2340.

Header row: on the left "Hi" 13px #5C6373 above "Ahmed" 26px/700 #0B0D14; on
the right the EN/ع pill toggle, then a small pill in #FF8A3D-at-12% holding
a filled #FF8A3D flame icon and the number "7" in #E08600.

HERO CARD — the largest element. Glass card, radius 36, white 66% + blur,
24px padding, prominent soft shadow. Inside, a row: a 62×62 rounded square
(radius 20) filled with the #5B5BF5 → #8B5CF6 gradient and glowing, holding
a white layers icon; beside it "12 words are waiting" 19px/600 #0B0D14 and
"Five minutes and you're done" 13px #5C6373. Below the row, a full-width
56px gradient primary button "Start review" with a play icon.

GOAL CARD — glass card radius 28. Top row: "Today's goal" 14px/600 #5C6373
on the left, "8 / 10" 16px/600 #0B0D14 on the right. Below it a 10px
fully-rounded progress bar, track #ECEEF5, fill #5B5BF5 at 80% width.

STATS ROW — three equal glass cards, radius 20, 12px gap. Each is centred:
a 19px #98A0B2 outline icon, a large 19px/600 number, and an uppercase
11px #98A0B2 label with wide letter-spacing.
  library icon · 84 · WORDS
  ribbon icon · 21 · MASTERED
  trending icon · 4 · LEVEL

RECENTLY ADDED — a "Recently added" uppercase micro label on the left with
"See all" 14px/600 #5B5BF5 on the right, then three word rows. Each row is
a white-glass card, radius 20, 16px padding, containing: the English word
"resilient" 19px/600 left-to-right, its Arabic translation "مرن · صامد"
16px #5C6373 beneath, then a small pill badge ("Learning", brand tint, with
a school icon) and "in 4 days" 13px #98A0B2. On the trailing edge a 44px
circular #5B5BF5-at-10% button with a #5B5BF5 speaker icon, then a faint
chevron.

Bottom: a dashed-border rounded rectangle, radius 20, 58px tall, containing
a #5B5BF5 plus-circle icon and "Add a word" 16px/600 #5B5BF5.

TAB BAR — 78px tall, frosted translucent white with a hairline top border,
five items: Home (active, filled icon and label in #5B5BF5), Words, Review,
Discover, Profile (inactive icons outline, #98A0B2). Labels are 11px/600.

Soft #5B5BF5 radial glow at 10% from the top-left.
```

---

## 5. My Words

```
Kalima word list screen, light theme, 1080×2340.

Sticky header over the page background: "My words" 26px/700 #0B0D14 on the
left, "84 words" 13px #98A0B2 on the right. Below, a search field (48px,
radius 14, white-glass, hairline border, placeholder "Search your words")
taking most of the width, and beside it a 48×48 square filter button,
radius 14, tinted #5B5BF5 at 10% with a #5B5BF5 sliders icon and a tiny
#5B5BF5 dot in its top-trailing corner indicating an active filter.

Below, a scrolling list of word cards, 8px apart. Each card: white-glass,
radius 20, 16px padding, showing the English word 19px/600 (left-to-right),
Arabic translation 16px #5C6373 under it, then a status pill and a due-time
caption, a circular brand-tinted speaker button, and a faint chevron.
Vary the states across the visible cards:
  resilient · مرن · "Learning" brand-tint pill · in 4 days
  fragile · هش · "Mastered" green pill with a check icon · in 3 months
  accomplish · يُنجز · "Tricky" red pill with an alert icon · Due now
  vivid · حيّ · "In review" grey pill · tomorrow · plus a small amber star
A floating 62×62 circular action button sits above the tab bar on the
trailing side, filled with the #5B5BF5 → #8B5CF6 gradient, glowing, with a
white plus icon.
```

---

## 6. Add a word — result state

```
Kalima "add word" result screen, light theme, 1080×2340.

Top: a circular white-glass back button. Under it a green success pill
badge reading "From dictionary · instant" with a lightning icon, in
#10B981-at-12% fill and #10B981 text.

A brand-tinted card (radius 28, fill #5B5BF5 at 10%, 1px #5B5BF5-at-22%
border) titled "Which meaning did you come across?" with a #5B5BF5
help-circle icon, containing two radio rows — the first selected with a 2px
#5B5BF5 border, the second plain. Each row shows an Arabic translation in
bold, a short grey clarifier, and a tiny uppercase part-of-speech label.

MAIN WORD CARD — glass, radius 36, 24px padding. The word "resilient"
34px/700 left-to-right, its IPA "/rɪˈzɪliənt/" 13px #98A0B2 beneath, and on
the trailing side a 50px circular gradient speaker button with a violet glow
plus a smaller white-glass "slow playback" button. A grey "B2" pill sits
underneath. Then a highlighted translation block: fill #5B5BF5 at 10%,
1px #5B5BF5-at-22% border, radius 20, 16px padding, containing
"مرن · صامد · سريع التعافي" 19px/600 in #5B5BF5 and a grey Arabic
definition line under it.

MEMORY HOOK CARD — brand-tinted card with an #FF8A3D filled bulb icon, an
uppercase 11px "MEMORY HOOK" micro label, and one line of Arabic text.

EXAMPLES CARD — glass card with an uppercase "EXAMPLES" micro label, then
two examples. Each is indented with a 3px vertical rule on the leading edge:
an English sentence 16px left-to-right with a small grey speaker icon on the
trailing side, and its Arabic translation 13px #5C6373 beneath.

RELATED WORDS CARD — uppercase "RELATED WORDS" label, then three groups of
tappable chips. Each chip is a pill showing the word plus a small
plus-circle icon: synonyms in #10B981-at-12% with green text, opposites in
#F43F5E-at-10% with red text, and "often confused with" in #FF8A3D-at-12%
with amber text.

A note input card, then a full-width 56px gradient primary button
"Save word" with a bookmark icon.
```

---

## 7. Review — flashcard

```
Kalima review flashcard screen, light theme, 1080×2340. No ambient glow —
this screen is deliberately calm.

Top row: a 40×40 circular white-glass close button, a 10px rounded progress
bar filling about a third in #5B5BF5, and "4 of 12" 14px/600 #5C6373.

Centre: one very large glass card, radius 36, white 66% + blur, prominent
layered shadow, filling most of the screen. Its contents are vertically
centred: a small grey "B2" pill, then the word "resilient" at 34px/700
left-to-right, its IPA in 13px #98A0B2, and a row with a 58px circular
gradient speaker button (violet glow) beside a smaller white-glass slow
button. At the bottom of the card, faint 13px #98A0B2 text with a small
hand icon: "Tap to reveal".

Bottom: four equal rating buttons in a row, 8px apart, each 68px tall,
radius 14, with a tinted fill, a matching 1px border, a 14px/600 coloured
label and an 11px grey caption underneath showing when the word returns:
  "Forgot" #F43F5E on #F43F5E-at-10% — caption "in 10 min"
  "Hard"   #F59E0B on #F59E0B-at-12% — caption "in 6 days"
  "Good"   #10B981 on #10B981-at-12% — caption "in 12 days"
  "Easy"   #5B5BF5 on #5B5BF5-at-10% — caption "in 16 days"
```

---

## 8. Review — multiple choice, answered

```
Kalima quiz question screen, light theme, 1080×2340.

Top row identical to the flashcard screen: circular close button, progress
bar, "7 of 12".

QUESTION CARD — glass, radius 36, 24px padding, at least 200px tall. Top
row: a grey pill "Choose the right translation" with a help-circle icon,
and beside it three tiny difficulty dots with two filled. Centred inside:
the word "resilient" at 34px/700 left-to-right, IPA underneath in #98A0B2.

Below, four full-width answer options in Arabic, 8px apart, each 58px tall,
radius 14. Show the answered state:
  • The correct option has fill #10B981 at 12%, a 1.5px #10B981 border,
    #10B981 text, and a filled green check-circle icon on the trailing edge.
  • The option the user chose is wrong: fill #F43F5E at 10%, 1.5px #F43F5E
    border, red text, and a filled red close-circle icon.
  • The two remaining options are transparent with only a hairline border
    and muted text.

Under the options, a feedback banner: rounded rectangle, radius 20, fill
#F43F5E at 10%, containing a red info icon, the line "Close — the answer is
مرن" in 16px/600 #F43F5E, and a 13px #5C6373 one-line Arabic explanation
beneath it.

At the very bottom, a small centred "Next →" in 14px/600 #5B5BF5.
```

---

## 9. Review — fill in the blank

```
Kalima fill-in-the-blank quiz screen, light theme, 1080×2340.

Same top row: close button, progress bar, "9 of 12".

QUESTION CARD — glass, radius 36, 24px padding. A grey pill labelled
"Complete the sentence" with a help-circle icon and three difficulty dots
(all three filled). Inside, an English sentence at 19px with generous
34px line-height, left-to-right:
"She stayed  ____  through the whole crisis."
The blank is rendered as a #5B5BF5-at-10% highlighted span with wide letter
spacing and #5B5BF5 underscores. Under the sentence, the Arabic translation
hint in 13px #5C6373.

Four answer options in English below, unanswered state: white-glass fill,
hairline border, 16px/600 dark text, 58px tall, radius 14.
```

---

## 10. Session complete

```
Kalima session result screen, light theme, 1080×2340.

Centred at the top: a 104×104 circle filled with the #5B5BF5 → #8B5CF6
gradient with a strong violet glow, containing a large white checkmark.
Below it "Session complete" 26px/700 #0B0D14 and "Nice work — see you
tomorrow" 16px #5C6373. Then, very large, "+185 XP" at 36px/700 in #5B5BF5.

A glass metrics card, radius 28, split into three equal columns separated by
hairline vertical dividers. Each column is centred with a 20px outline icon,
a 19px/600 value and an 11px uppercase grey label:
  albums icon · 12 · CARDS
  check-circle icon · 83% · REMEMBERED
  flame icon in #FF8A3D · 8 · STREAK

Beneath, two highlight rows stacked 8px apart, each a rounded rectangle
radius 20 with a tinted fill, a filled icon and 16px/600 coloured text:
  #10B981-at-12% fill, trophy icon, "Daily goal reached"
  #5B5BF5-at-10% fill, ribbon icon, "Mastered · 2"

Bottom: a full-width gradient primary button "Keep going" with a play icon,
and a white-glass secondary button "Back home".
```

---

## 11. Achievements

```
Kalima achievements screen, light theme, 1080×2340.

Header: circular back button, title "Achievements" 26px/700, EN/ع toggle.

A glass summary card, radius 28: "UNLOCKED" uppercase micro label on the
left, "5 / 13" 16px/600 on the right, and a 10px rounded progress bar
underneath filled to about 38% in #5B5BF5.

Then a vertical list of badge rows, 8px apart. Each row is a glass card,
radius 20, 16px padding, with a 52×52 rounded square (radius 14) on the
leading edge, a bold title, and a 13px grey description.

Unlocked rows: the square carries the #5B5BF5 → #8B5CF6 gradient with a
violet glow and a white filled icon; a small green check-circle sits on the
trailing edge; the card is at full opacity.

Locked rows: the square is flat #ECEEF5 with a grey outline icon; the whole
card sits at about 72% opacity; the XP reward ("+100") appears in 11px grey
on the trailing edge; and a thin 4px progress bar runs under the description
showing how close the user is.

Example rows, in order:
  First Step (unlocked) · Added your first word
  Getting Started (unlocked) · Reached 10 words
  Collector (locked, bar at 60%) · Reached 50 words
  Week Warrior (unlocked, flame icon) · 7-day streak
  Monthly Master (locked, bar at 25%) · 30-day streak
  Mastery (locked, bar at 40%) · Mastered 10 words
```

---

## 12. Profile

```
Kalima profile screen, light theme, 1080×2340.

Header: "Profile" 26px/700 with the EN/ع toggle on the trailing side.

IDENTITY CARD — glass, radius 36, 24px padding, centred content. A 92px
circular avatar wrapped in a 3px gradient ring (#5B5BF5 → #8B5CF6); the
avatar shows two large initials in #5B5BF5 on a #5B5BF5-at-10% fill. Below:
the name "Ahmed Alaa" 26px/700, the email in 13px #98A0B2 (left-to-right).
Then a full-width row: "Level 4" 14px/600 in #5B5BF5 on the left and
"1,240 XP" 13px #5C6373 on the right, with an 8px rounded progress bar
beneath at about 65%.

STATS ROW — three glass cards, radius 20: 84 / WORDS · 21 / MASTERED ·
14 / BEST STREAK. Numbers 19px/600, labels 11px uppercase grey.

Then grouped list sections. Each group is a single white-glass rounded
container (radius 20) with hairline dividers between rows; above each group
sits a 14px/600 grey label. Every row is 54px tall with a leading 22px
outline icon, a 16px title, an optional 13px grey subtitle, and a trailing
chevron.
  ACCOUNT — Edit profile (Name and photo) · Achievements · Settings
  ABOUT — Privacy policy · Terms of use
  A final standalone group with one row: "Sign out" with a log-out icon,
  both the icon and label in #F43F5E.

Footer: "Kalima · version 0.1.0" 13px #98A0B2, centred.
```

---

## 13. Settings

```
Kalima settings screen, light theme, 1080×2340.

Header: circular back button, "Settings" 26px/700, EN/ع toggle.

Four grouped white-glass list containers (radius 20, hairline dividers),
each under a 14px/600 grey section label. Rows are 54px with a leading 22px
outline icon.

  APPEARANCE
    Theme — trailing value "System", chevron
    Text size — trailing value "Default", chevron
    Simple mode — subtitle "Bigger text, fewer options", trailing iOS-style
      switch turned ON in #5B5BF5

  LEARNING
    Daily goal — trailing "10"
    My English level — trailing "Intermediate"
    Autoplay pronunciation — switch ON

  NOTIFICATIONS
    Daily reminder — switch ON
    Reminder time — trailing "7:00 PM"

  ACCOUNT
    Edit profile
    Download my data — subtitle "Everything in one file"
    Delete account — icon and label in #F43F5E

Footer: "Kalima · version 0.1.0" centred in 13px #98A0B2.
```

---

## 14. Bottom sheet — word options

```
Kalima bottom sheet over a dimmed word-detail screen, light theme,
1080×2340.

The background screen is visible but covered by a black scrim at 50%.

The sheet rises from the bottom, occupying roughly the lower third. Its top
corners are rounded 36px, the fill is #FFFFFF, and a 40×4px rounded grey
drag handle is centred just below the top edge. A strong upward shadow
separates it from the scrim.

Inside, 16px padding: the title "Word options" 19px/600 #0B0D14, then three
action rows stacked 12px apart. Each row is 54px tall, radius 14, with a
white-glass fill and a hairline border, holding a leading 20px outline icon
and a 16px/600 label:
  star-outline icon · "Add to favorites"
  flag-outline icon · "What's wrong?" with the grey subtitle "We'll review
    it and fix it for everyone"
  trash-outline icon · "Delete" — this row uses a #F43F5E-at-10% fill with
    the icon and label in #F43F5E
```

---

## 15. Dark mode — home

```
Kalima home screen, DARK theme, 1080×2340.

Identical layout to the light home screen, re-coloured:
  Page background #08090E with a #12141C → #08090E vertical gradient in the
  top 420px, and a #8080FF radial glow at about 14% from the top-left.
  Glass cards are white at 5.5% opacity over the dark background with real
  background blur and an rgba(255,255,255,0.09) hairline border.
  Primary text #F2F4FA, secondary #9BA3B6, faint #666E80.
  The primary button keeps a gradient but shifts lighter: #8080FF → #A78BFA
  with near-black #0A0B12 label text and a violet glow.
  Streak pill: #FF9F5A-at-16% fill with an #FF9F5A flame.
  Progress track #0D0F16, fill #8080FF.
  Tab bar is a dark frosted translucent bar; the active item is #8080FF.

The overall feel is deep near-black rather than grey — high contrast, calm,
with the violet accent as the only saturated colour on screen.
```

---

## 16. Empty state

```
Kalima empty word list, light theme, 1080×2340.

Sticky header with "My words" and a search field, as usual.

The body is empty and vertically centred: an 84×84 rounded square (radius
28) in flat #ECEEF5 holding a 38px #98A0B2 outline library icon; below it
"No words yet" 19px/600 #0B0D14, then "The first word you add shows up
here" 16px #5C6373, both centred. Under that, a text button "Add your first
word" in 16px/600 #5B5BF5.

The floating gradient plus button still sits above the tab bar on the
trailing side.
```

---

## Suggested order to hand over

1. Design System (section 0) — always first
2. Home (4) · Review flashcard (7) · Add word result (6) — these three carry
   the product's identity
3. Welcome (1) · Sign in (2) · Onboarding (3)
4. My Words (5) · Word quiz (8, 9) · Result (10)
5. Achievements (11) · Profile (12) · Settings (13)
6. Bottom sheet (14) · Dark mode (15) · Empty state (16)
