import { BeforeInstallPromptEvent } from "@/types/beforeInstallPrompt";
import { MotionProps as OriginalMotionProps } from "framer-motion";

// Use type safe message keys with `next-intl
type EnglishMessages = typeof import("./locales/en.json")

declare interface IntlMessages extends EnglishMessages {}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

// This is a patch of `framer-motion` to allow `className` prop in Next 15 / React 19
declare module "framer-motion" {
  interface MotionProps extends OriginalMotionProps {
    className?: string;
    onClick?: () => void;
    title?: string;
    disabled?: boolean;
  }
}
