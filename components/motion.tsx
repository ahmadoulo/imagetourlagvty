"use client";

import { motion, HTMLMotionProps } from "framer-motion";

export const FadeIn = ({
  children,
  delay = 0,
  duration = 0.5,
  className,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number; duration?: number }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

export const SlideUp = ({
  children,
  delay = 0,
  duration = 0.5,
  y = 20,
  className,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number; duration?: number; y?: number }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

export const StaggerContainer = ({
  children,
  className,
  delayChildren = 0.1,
  staggerChildren = 0.1,
  ...props
}: HTMLMotionProps<"div"> & { delayChildren?: number; staggerChildren?: number }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: {},
      visible: {
        transition: {
          staggerChildren,
          delayChildren,
        },
      },
    }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({
  children,
  className,
  y = 20,
  ...props
}: HTMLMotionProps<"div"> & { y?: number }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          ease: [0.21, 0.47, 0.32, 0.98],
          duration: 0.5,
        },
      },
    }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);
