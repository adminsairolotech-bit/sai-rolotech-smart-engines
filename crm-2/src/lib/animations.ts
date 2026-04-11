import type { Variants, Transition, TargetAndTransition } from "framer-motion";
import type { DeviceTier } from "@/hooks/use-device-capability";

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export const cardHover = {
  scale: 1.02,
  transition: { type: "spring", stiffness: 400, damping: 25 } as Transition,
};

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const smoothTransition: Transition = {
  duration: 0.2,
  ease: [0.25, 0.46, 0.45, 0.94],
};

export const subtleHover = {
  scale: 1.01,
  transition: { type: "spring", stiffness: 400, damping: 25 } as Transition,
};

export const quickTransition: Transition = {
  duration: 0.3,
};

export const delayedTransition = (delay: number): Transition => ({
  delay,
});

export const iconHover = {
  scale: 1.1,
};

export const slideInRight: Variants = {
  hidden: { x: "100%" },
  visible: { x: 0 },
  exit: { x: "100%" },
};

const noMotionVariants: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
  exit: { opacity: 1 },
};

const noMotionStagger: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
};

const noHover: TargetAndTransition = {};

const instantTransition: Transition = { duration: 0 };

const lowStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0, delayChildren: 0 },
  },
};

const lowFadeInUp: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const lowPageTransition: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const midStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.05 },
  },
};

const midFadeInUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export interface AdaptiveAnimations {
  staggerContainer: Variants;
  staggerItem: Variants;
  fadeInUp: Variants;
  pageTransition: Variants;
  cardHover: TargetAndTransition;
  subtleHover: TargetAndTransition;
  smoothTransition: Transition;
  springTransition: Transition;
}

export function getAdaptiveAnimations(
  tier: DeviceTier,
  prefersReducedMotion: boolean
): AdaptiveAnimations {
  if (prefersReducedMotion) {
    return {
      staggerContainer: noMotionStagger,
      staggerItem: noMotionVariants,
      fadeInUp: noMotionVariants,
      pageTransition: noMotionVariants,
      cardHover: noHover,
      subtleHover: noHover,
      smoothTransition: instantTransition,
      springTransition: instantTransition,
    };
  }

  if (tier === "low") {
    return {
      staggerContainer: lowStagger,
      staggerItem: lowFadeInUp,
      fadeInUp: lowFadeInUp,
      pageTransition: lowPageTransition,
      cardHover: noHover,
      subtleHover: noHover,
      smoothTransition: { duration: 0.1 },
      springTransition: { duration: 0.15 },
    };
  }

  if (tier === "mid") {
    return {
      staggerContainer: midStagger,
      staggerItem: midFadeInUp,
      fadeInUp: midFadeInUp,
      pageTransition: {
        hidden: { opacity: 0, y: 6 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0 },
      },
      cardHover: { scale: 1.01 },
      subtleHover: { scale: 1.005 },
      smoothTransition: { duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] },
      springTransition: { type: "spring", stiffness: 350, damping: 35 },
    };
  }

  return {
    staggerContainer,
    staggerItem,
    fadeInUp,
    pageTransition,
    cardHover,
    subtleHover,
    smoothTransition,
    springTransition,
  };
}
