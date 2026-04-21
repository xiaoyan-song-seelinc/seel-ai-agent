/* Sales Agent UI primitives — Seel design-system aligned.
 * Primary #2121C4, card border #E0E0E0 @ 10px radius,
 * button/input 6px radius + 32px height, Inter typography at
 * 12 / 14 / 16 / 18 / 24 / 30 scale. Hex values are used inline
 * so the rest of the app can keep its own primary token.
 */

import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  forwardRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { HelpCircle, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ── Surface ───────────────────────────────────────────────
   White panel, 1px #E0E0E0 border, 10px radius, no shadow. */
export const Panel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Panel({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white border border-[#E0E0E0] rounded-[10px]",
          className,
        )}
        {...props}
      />
    );
  },
);

/* ── Button ───────────────────────────────────────────────
   Primary = Seel indigo #2121C4. Radius 6px, height 32px. */
interface SABtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}

export const SAButton = forwardRef<HTMLButtonElement, SABtnProps>(
  function SAButton(
    { className, variant = "secondary", size = "md", ...props },
    ref,
  ) {
    const base =
      "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(33,33,196,0.2)] disabled:pointer-events-none disabled:opacity-40 tabular-nums";
    const sizes = {
      sm: "h-7 px-3 text-[12px]",
      md: "h-8 px-4 text-[14px]",
    };
    const variants = {
      primary:
        "bg-[#2121C4] text-white hover:bg-[#3730A3] active:bg-[#1B1AA0] shadow-[rgba(92,106,196,0.12)_0px_2px_0px_0px] border border-transparent",
      secondary:
        "bg-white text-[#202223] border border-[#D9D9D9] hover:bg-[#F2F6FE] hover:border-[#2121C4] hover:text-[#2121C4] active:bg-[#ECE9FF]",
      ghost:
        "bg-transparent text-[#5C5F62] hover:bg-[#F7F7FC] hover:text-[#202223] active:bg-[#EEF0F3]",
      danger:
        "bg-white text-[#FF4D4F] border border-[#F4DDDC] hover:bg-[#FDEEED] active:bg-[#FBDADA]",
    };
    return (
      <button
        ref={ref}
        className={cn(base, sizes[size], variants[variant], className)}
        {...props}
      />
    );
  },
);

/* ── Input ──────────────────────────────────────────────── */
export const SAInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function SAInput({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-8 w-full rounded-md border border-[#D9D9D9] bg-white px-3 text-[14px] text-[#202223] placeholder:text-[#8C8C8C] outline-none focus:border-[#2121C4] focus:ring-2 focus:ring-[rgba(33,33,196,0.1)] disabled:bg-[#F9FAFB] disabled:text-[#8C8C8C]",
          className,
        )}
        {...props}
      />
    );
  },
);

/* ── Select (native) ─────────────────────────────────────── */
export const SASelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function SASelect({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "h-8 rounded-md border border-[#D9D9D9] bg-white pl-3 pr-8 text-[14px] text-[#202223] outline-none focus:border-[#2121C4] focus:ring-2 focus:ring-[rgba(33,33,196,0.1)] disabled:bg-[#F9FAFB] disabled:text-[#8C8C8C] appearance-none",
          "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22rgba(0,0,0,0.45)%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-no-repeat",
          "bg-[position:right_0.625rem_center]",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);

/* ── Toggle (switch) ─────────────────────────────────────── */
interface SAToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}
export function SAToggle({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: SAToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[22px] w-[40px] shrink-0 items-center rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(33,33,196,0.2)]",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        checked ? "bg-[#2121C4]" : "bg-[rgba(0,0,0,0.25)]",
      )}
    >
      <span
        className={cn(
          "inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[20px]" : "translate-x-[2px]",
        )}
      />
    </button>
  );
}

/* ── Chip ───────────────────────────────────────────────── */
interface ChipProps {
  children: ReactNode;
  onRemove?: () => void;
  className?: string;
}
export function Chip({ children, onRemove, className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 h-6 pl-2 pr-1 rounded border border-[#DADEE9] bg-[#E7EBF5] text-[#5C5F62] text-[12px]",
        !onRemove && "pr-2",
        className,
      )}
    >
      <span className="truncate max-w-[220px]">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-0.5 rounded hover:bg-[#DADEE9] text-[#5C5F62] hover:text-[#202223]"
          aria-label="Remove"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

/* ── Status dot ─────────────────────────────────────────── */
export function StatusDot({ kind }: { kind: "on" | "off" | "warn" }) {
  const map: Record<string, string> = {
    on: "bg-[#52C41A]",
    off: "bg-[#D9D9D9]",
    warn: "bg-[#FBBF24]",
  };
  return <span className={cn("inline-block w-2 h-2 rounded-full", map[kind])} />;
}

/* ── Callout (info / warn / danger) ─────────────────────── */
interface CalloutProps {
  tone: "info" | "warn" | "danger";
  title?: string;
  children?: ReactNode;
  className?: string;
}
export function Callout({ tone, title, children, className }: CalloutProps) {
  const styles: Record<string, string> = {
    info: "bg-[#F2F6FE] border-[#D6E7FF] text-[#202223]",
    warn: "bg-[#FFFBEB] border-[#F5E6C8] border-l-[3px] border-l-[#FBBF24] text-[#202223]",
    danger: "bg-[#FDEEED] border-[#F4DDDC] text-[#FF0000]",
  };
  const titleStyles: Record<string, string> = {
    info: "text-[#2121C4]",
    warn: "text-[#D97706] uppercase tracking-[0.08em] text-[12px]",
    danger: "text-[#FF0000]",
  };
  return (
    <div
      className={cn(
        "text-[14px] leading-relaxed px-3 py-2.5 rounded-lg border",
        styles[tone],
        className,
      )}
    >
      {title && (
        <p className={cn("font-semibold mb-0.5 text-[14px]", titleStyles[tone])}>
          {title}
        </p>
      )}
      {children && <div className="text-[14px]">{children}</div>}
    </div>
  );
}

/* ── InfoTip (hover ? icon → tooltip) ──────────────────── */
interface InfoTipProps {
  children: ReactNode;
  size?: number;
  className?: string;
}
export function InfoTip({ children, size = 14, className }: InfoTipProps) {
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center text-[#8C8C8C] hover:text-[#202223] transition-colors align-middle",
            className,
          )}
          aria-label="More info"
        >
          <HelpCircle style={{ width: size, height: size }} />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        className="max-w-[260px] bg-[#202223] text-white text-[12px] leading-snug px-2.5 py-1.5 rounded-md"
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

/* ── Modal ──────────────────────────────────────────────── */
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = "max-w-[560px]",
}: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative w-[calc(100%-32px)] bg-white rounded-[10px] shadow-[0_10px_32px_-12px_rgba(0,0,0,0.25)] border border-[#E0E0E0] flex flex-col max-h-[calc(100vh-64px)]",
          width,
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAEAEA]">
          <h2 className="text-[18px] font-semibold text-[#202223]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-[#F7F7FC] text-[#8C8C8C] hover:text-[#202223]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#EAEAEA] bg-[#F9FAFB] rounded-b-[10px]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Drawer (right-side) ────────────────────────────────── */
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  width = "w-[480px]",
}: DrawerProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 bg-white border-l border-[#E0E0E0] shadow-[0_0_32px_-8px_rgba(0,0,0,0.18)] flex flex-col",
          width,
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#EAEAEA]">
          <div className="min-w-0 flex-1">
            {typeof title === "string" ? (
              <h2 className="text-[18px] font-semibold text-[#202223] truncate">
                {title}
              </h2>
            ) : (
              title
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-[#F7F7FC] text-[#8C8C8C] hover:text-[#202223] shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#EAEAEA] bg-[#F9FAFB]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Field wrapper ──────────────────────────────────────── */
interface FieldProps {
  label: string;
  htmlFor?: string;
  help?: string;
  children: ReactNode;
  className?: string;
}
export function Field({ label, htmlFor, help, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-[14px] font-medium text-[#202223]"
      >
        {label}
      </label>
      {children}
      {help && <p className="text-[12px] text-[#6B7280] leading-snug">{help}</p>}
    </div>
  );
}

/* ── Segmented control ──────────────────────────────────── */
interface SegmentProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  size?: "sm" | "md";
  disabled?: boolean;
}
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
  disabled = false,
}: SegmentProps<T>) {
  const h = size === "sm" ? "h-7" : "h-8";
  const text = size === "sm" ? "text-[12px]" : "text-[14px]";
  return (
    <div
      className={cn(
        "inline-flex rounded-md bg-[#F7F7FC] p-0.5 border border-[#EAEAEA]",
        h,
        disabled && "opacity-60",
      )}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(opt.value)}
            className={cn(
              "px-3 rounded-[4px] font-medium transition-colors",
              text,
              active
                ? "bg-white text-[#2121C4] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                : "text-[#5C5F62] hover:text-[#202223]",
              disabled && "cursor-not-allowed hover:text-[#5C5F62]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Accordion ─────────────────────────────────────────── */
interface AccordionProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}
export function Accordion({
  title,
  subtitle,
  right,
  defaultOpen = true,
  children,
  className,
}: AccordionProps) {
  return (
    <Panel className={cn("overflow-hidden", className)}>
      <AccordionInner
        title={title}
        subtitle={subtitle}
        right={right}
        defaultOpen={defaultOpen}
      >
        {children}
      </AccordionInner>
    </Panel>
  );
}

function AccordionInner({
  title,
  subtitle,
  right,
  defaultOpen,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v: boolean) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="min-w-0">
          <p className="text-[16px] font-semibold text-[#202223]">{title}</p>
          {subtitle && (
            <p className="text-[12px] text-[#6B7280] mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {right}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cn(
              "text-[#8C8C8C] transition-transform",
              open ? "rotate-180" : "",
            )}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </button>
      {open && <div className="border-t border-[#F0F0F0]">{children}</div>}
    </>
  );
}
