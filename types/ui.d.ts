/**
 * Pulse UI — Component library types
 * @invisibleloop/pulse/ui
 *
 * All components are pure functions: (props?) => HTML string.
 * Import only what you need — no side effects on import.
 */

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size          = 'sm' | 'md' | 'lg'
type AlertVariant  = 'info' | 'success' | 'warning' | 'error'
type BadgeVariant  = 'default' | 'success' | 'warning' | 'error' | 'info'
type ChartColor    = 'accent' | 'success' | 'warning' | 'error' | 'blue' | 'muted'

// ---------------------------------------------------------------------------
// Form controls
// ---------------------------------------------------------------------------

export interface ButtonProps {
  label?:     string
  variant?:   ButtonVariant
  size?:      Size
  /** Renders as <a> when set */
  href?:      string
  disabled?:  boolean
  type?:      'button' | 'submit' | 'reset'
  /** SVG HTML prepended inside the element */
  icon?:      string
  /** SVG HTML appended inside the element */
  iconAfter?: string
  fullWidth?: boolean
  class?:     string
  /** Extra HTML attributes added to <button> (not <a>) */
  attrs?:     Record<string, string | number | boolean>
}
export function button(props?: ButtonProps): string

export interface InputProps {
  name?:        string
  label?:       string
  type?:        string
  placeholder?: string
  value?:       string
  error?:       string
  hint?:        string
  required?:    boolean
  disabled?:    boolean
  id?:          string
  class?:       string
  attrs?:       Record<string, string | number | boolean>
}
export function input(props?: InputProps): string

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  name?:     string
  label?:    string
  options?:  Array<string | SelectOption>
  value?:    string
  error?:    string
  hint?:     string
  required?: boolean
  disabled?: boolean
  id?:       string
  /** data-event value for mutation binding, e.g. 'change:setLang' */
  event?:    string
  class?:    string
}
export function select(props?: SelectProps): string

export interface TextareaProps {
  name?:        string
  label?:       string
  placeholder?: string
  value?:       string
  rows?:        number
  error?:       string
  hint?:        string
  required?:    boolean
  disabled?:    boolean
  id?:          string
  class?:       string
  attrs?:       Record<string, string | number | boolean>
}
export function textarea(props?: TextareaProps): string

export interface ToggleProps {
  name?:     string
  label?:    string
  checked?:  boolean
  disabled?: boolean
  hint?:     string
  id?:       string
  /** data-event value for mutation binding */
  event?:    string
  class?:    string
}
export function toggle(props?: ToggleProps): string

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export interface AlertProps {
  variant?: AlertVariant
  title?:   string
  content?: string
  class?:   string
}
export function alert(props?: AlertProps): string

export interface BadgeProps {
  label?:   string
  variant?: BadgeVariant
  class?:   string
}
export function badge(props?: BadgeProps): string

export interface SpinnerProps {
  size?:  Size
  color?: 'accent' | 'muted' | 'white'
  label?: string
  class?: string
}
export function spinner(props?: SpinnerProps): string

export interface ProgressProps {
  /** Omit for indeterminate progress */
  value?:     number
  max?:       number
  label?:     string
  showLabel?: boolean
  showValue?: boolean
  variant?:   AlertVariant
  size?:      Size
  class?:     string
}
export function progress(props?: ProgressProps): string

// ---------------------------------------------------------------------------
// Layout & content
// ---------------------------------------------------------------------------

export interface CardProps {
  title?:   string
  content?: string
  footer?:  string
  /** Remove inner padding */
  flush?:   boolean
  class?:   string
}
export function card(props?: CardProps): string

export interface ContainerProps {
  content?: string
  class?:   string
}
export function container(props?: ContainerProps): string

export interface SectionProps {
  content?: string
  class?:   string
}
export function section(props?: SectionProps): string

export interface GridProps {
  items?:  string[]
  cols?:   number
  gap?:    string
  class?:  string
}
export function grid(props?: GridProps): string

export interface StackProps {
  items?:  string[]
  gap?:    string
  class?:  string
}
export function stack(props?: StackProps): string

export interface ClusterProps {
  items?:  string[]
  gap?:    string
  class?:  string
}
export function cluster(props?: ClusterProps): string

export interface DividerProps {
  label?: string
  class?: string
}
export function divider(props?: DividerProps): string

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export interface HeadingProps {
  level?:   1 | 2 | 3 | 4 | 5 | 6
  text?:    string
  class?:   string
}
export function heading(props?: HeadingProps): string

export interface ProseProps {
  content?: string
  class?:   string
}
export function prose(props?: ProseProps): string

export interface PullquoteProps {
  quote?:    string
  cite?:     string
  class?:    string
}
export function pullquote(props?: PullquoteProps): string

export interface ListItem {
  text:   string
  href?:  string
}
export interface ListProps {
  items?:    Array<string | ListItem>
  ordered?:  boolean
  class?:    string
}
export function list(props?: ListProps): string

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export interface NavLink {
  label: string
  href:  string
  active?: boolean
}

export interface NavProps {
  logo?:        string
  logoHref?:    string
  links?:       NavLink[]
  action?:      string
  sticky?:      boolean
  burgerAlign?: 'right' | 'left'
  class?:       string
}
export function nav(props?: NavProps): string

export interface BreadcrumbItem {
  label: string
  href?: string
}
export interface BreadcrumbsProps {
  items?:     BreadcrumbItem[]
  separator?: string
  class?:     string
}
export function breadcrumbs(props?: BreadcrumbsProps): string

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

export interface ModalProps {
  id?:      string
  title?:   string
  content?: string
  footer?:  string
  size?:    'sm' | Size | 'xl'
  class?:   string
}
export function modal(props?: ModalProps): string

export interface ModalTriggerProps {
  target?:  string
  label?:   string
  variant?: ButtonVariant
  size?:    Size
  class?:   string
}
export function modalTrigger(props?: ModalTriggerProps): string

export interface TooltipProps {
  content?: string
  trigger?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  class?:   string
}
export function tooltip(props?: TooltipProps): string

// ---------------------------------------------------------------------------
// Data display
// ---------------------------------------------------------------------------

export interface TableProps {
  headers?: string[]
  rows?:    Array<Array<string | number>>
  caption?: string
  class?:   string
}
export function table(props?: TableProps): string

export interface StatProps {
  label?:   string
  value?:   string | number
  delta?:   string
  trend?:   'up' | 'down' | 'flat'
  class?:   string
}
export function stat(props?: StatProps): string

export interface AvatarProps {
  src?:     string
  alt?:     string
  initials?: string
  size?:    Size
  class?:   string
}
export function avatar(props?: AvatarProps): string

export interface EmptyProps {
  title?:   string
  content?: string
  action?:  string
  class?:   string
}
export function empty(props?: EmptyProps): string

// ---------------------------------------------------------------------------
// Marketing / landing page
// ---------------------------------------------------------------------------

export interface HeroProps {
  heading?:    string
  subheading?: string
  actions?:    string
  media?:      string
  class?:      string
}
export function hero(props?: HeroProps): string

export interface FeatureItem {
  icon?:    string
  title?:   string
  content?: string
}
export interface FeatureProps {
  items?:  FeatureItem[]
  cols?:   number
  class?:  string
}
export function feature(props?: FeatureProps): string

export interface TestimonialProps {
  quote?:    string
  name?:     string
  role?:     string
  avatar?:   string
  class?:    string
}
export function testimonial(props?: TestimonialProps): string

export interface PricingTier {
  name?:     string
  price?:    string
  period?:   string
  features?: string[]
  action?:   string
  featured?: boolean
}
export interface PricingProps {
  tiers?: PricingTier[]
  class?: string
}
export function pricing(props?: PricingProps): string

export interface CtaProps {
  heading?: string
  content?: string
  actions?: string
  class?:   string
}
export function cta(props?: CtaProps): string

export interface BannerProps {
  content?: string
  variant?: AlertVariant
  class?:   string
}
export function banner(props?: BannerProps): string

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export interface MediaProps {
  src?:      string
  alt?:      string
  width?:    number
  height?:   number
  class?:    string
}
export function media(props?: MediaProps): string

export interface UiImageProps {
  src?:      string
  alt?:      string
  width?:    number
  height?:   number
  priority?: boolean
  class?:    string
}
export function uiImage(props?: UiImageProps): string

export interface CarouselProps {
  items?:  string[]
  class?:  string
}
export function carousel(props?: CarouselProps): string

// ---------------------------------------------------------------------------
// Interactive UI
// ---------------------------------------------------------------------------

export interface AccordionItem {
  title:    string
  content:  string
  open?:    boolean
}
export interface AccordionProps {
  items?:   AccordionItem[]
  class?:   string
}
export function accordion(props?: AccordionProps): string

export interface SliderProps {
  name?:      string
  label?:     string
  min?:       number
  max?:       number
  step?:      number
  value?:     number
  disabled?:  boolean
  event?:     string
  class?:     string
}
export function slider(props?: SliderProps): string

export interface SegmentedOption {
  label: string
  value: string
}
export interface SegmentedProps {
  name?:    string
  options?: Array<string | SegmentedOption>
  value?:   string
  event?:   string
  class?:   string
}
export function segmented(props?: SegmentedProps): string

export interface RadioOption {
  label: string
  value: string
  hint?: string
}
export interface RadioProps {
  name?:      string
  options?:   Array<string | RadioOption>
  value?:     string
  disabled?:  boolean
  event?:     string
  class?:     string
}
export function radio(props?: RadioProps): string

export interface RadioGroupProps {
  name?:    string
  label?:   string
  options?: Array<string | RadioOption>
  value?:   string
  event?:   string
  class?:   string
}
export function radioGroup(props?: RadioGroupProps): string

export interface RatingProps {
  value?:    number
  max?:      number
  readonly?: boolean
  name?:     string
  event?:    string
  class?:    string
}
export function rating(props?: RatingProps): string

export interface FileUploadProps {
  name?:     string
  label?:    string
  accept?:   string
  multiple?: boolean
  hint?:     string
  class?:    string
}
export function fileUpload(props?: FileUploadProps): string

// ---------------------------------------------------------------------------
// Timeline & stepper
// ---------------------------------------------------------------------------

export interface TimelineItemProps {
  title?:   string
  content?: string
  date?:    string
  icon?:    string
  active?:  boolean
  class?:   string
}
export function timelineItem(props?: TimelineItemProps): string

export interface TimelineProps {
  items?: string[]
  class?: string
}
export function timeline(props?: TimelineProps): string

export interface StepperStep {
  label:    string
  complete?: boolean
  active?:  boolean
}
export interface StepperProps {
  steps?:   StepperStep[]
  current?: number
  class?:   string
}
export function stepper(props?: StepperProps): string

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export interface AppBadgeProps {
  store?:   'apple' | 'google'
  href?:    string
  class?:   string
}
export function appBadge(props?: AppBadgeProps): string

export interface FooterProps {
  content?: string
  class?:   string
}
export function footer(props?: FooterProps): string

export interface CodeWindowProps {
  code?:     string
  language?: string
  filename?: string
  class?:    string
}
export function codeWindow(props?: CodeWindowProps): string

// ---------------------------------------------------------------------------
// Charts
// ---------------------------------------------------------------------------

export interface ChartDataPoint {
  label: string
  value: number
}
export interface DonutDataPoint {
  label:  string
  value:  number
  color?: string
}

export interface BarChartProps {
  data?:       ChartDataPoint[]
  height?:     number
  color?:      ChartColor
  showValues?: boolean
  showGrid?:   boolean
  gap?:        number
  class?:      string
}
export function barChart(props?: BarChartProps): string

export interface LineChartProps {
  data?:      ChartDataPoint[]
  height?:    number
  color?:     ChartColor
  area?:      boolean
  showDots?:  boolean
  showGrid?:  boolean
  class?:     string
}
export function lineChart(props?: LineChartProps): string

export interface DonutChartProps {
  data?:      DonutDataPoint[]
  size?:      number
  thickness?: number
  label?:     string
  sublabel?:  string
  class?:     string
}
export function donutChart(props?: DonutChartProps): string

export interface SparklineProps {
  data?:   number[]
  width?:  number
  height?: number
  color?:  ChartColor
  area?:   boolean
  class?:  string
}
export function sparkline(props?: SparklineProps): string

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

/** Render an SVG icon as an HTML string. Accepts optional className. */
type IconFn = (className?: string) => string

export const iconArrowLeft:       IconFn
export const iconArrowRight:      IconFn
export const iconArrowUp:         IconFn
export const iconArrowDown:       IconFn
export const iconChevronLeft:     IconFn
export const iconChevronRight:    IconFn
export const iconChevronUp:       IconFn
export const iconChevronDown:     IconFn
export const iconExternalLink:    IconFn
export const iconMenu:            IconFn
export const iconX:               IconFn
export const iconMoreHorizontal:  IconFn
export const iconMoreVertical:    IconFn
export const iconCheck:           IconFn
export const iconCheckCircle:     IconFn
export const iconXCircle:         IconFn
export const iconAlertCircle:     IconFn
export const iconAlertTriangle:   IconFn
export const iconInfo:            IconFn
export const iconPlus:            IconFn
export const iconMinus:           IconFn
export const iconEdit:            IconFn
export const iconTrash:           IconFn
export const iconCopy:            IconFn
export const iconSearch:          IconFn
export const iconFilter:          IconFn
export const iconDownload:        IconFn
export const iconUpload:          IconFn
export const iconRefresh:         IconFn
export const iconSend:            IconFn
export const iconEye:             IconFn
export const iconEyeOff:          IconFn
export const iconLock:            IconFn
export const iconUnlock:          IconFn
export const iconSettings:        IconFn
export const iconBell:            IconFn
export const iconUser:            IconFn
export const iconUsers:           IconFn
export const iconMail:            IconFn
export const iconMessageSquare:   IconFn
export const iconHome:            IconFn
export const iconLogOut:          IconFn
export const iconLogIn:           IconFn
export const iconFile:            IconFn
export const iconImage:           IconFn
export const iconLink:            IconFn
export const iconCode:            IconFn
export const iconCalendar:        IconFn
export const iconClock:           IconFn
export const iconBookmark:        IconFn
export const iconTag:             IconFn
export const iconPlay:            IconFn
export const iconPause:           IconFn
export const iconVolume:          IconFn
export const iconStar:            IconFn
export const iconHeart:           IconFn
export const iconPhone:           IconFn
export const iconGamepad:         IconFn
export const iconHandPointUp:     IconFn
export const iconHandPointDown:   IconFn
export const iconHandPointLeft:   IconFn
export const iconHandPointRight:  IconFn
export const iconGlobe:           IconFn
export const iconShield:          IconFn
export const iconZap:             IconFn
export const iconTrendingUp:      IconFn
export const iconTrendingDown:    IconFn
export const iconLoader:          IconFn
export const iconGrid:            IconFn
