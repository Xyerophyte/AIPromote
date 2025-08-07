"use client"

import * as React from "react"
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

// Hook for mouse tracking and tilt effect
function useTilt(ref: React.RefObject<HTMLElement>, options = {}) {
  const { tiltMaxX = 15, tiltMaxY = 15, scale = 1.02, glareEnable = true } = options as any;
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [tiltMaxY, -tiltMaxY]), { 
    stiffness: 300, 
    damping: 30 
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-tiltMaxX, tiltMaxX]), { 
    stiffness: 300, 
    damping: 30 
  });

  const handleMouseMove = (event: MouseEvent) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    x.set((event.clientX - centerX) / (rect.width / 2));
    y.set((event.clientY - centerY) / (rect.height / 2));
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref]);

  return { rotateX, rotateY, x, y };
}

// Elevated Card with Shadow Effects
export interface ElevatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  elevation?: 1 | 2 | 3 | 4 | 5;
  hoverElevation?: 1 | 2 | 3 | 4 | 5;
  animateOnHover?: boolean;
  glowEffect?: boolean;
  glowColor?: string;
}

const elevationClasses = {
  1: "shadow-sm",
  2: "shadow-md",
  3: "shadow-lg",
  4: "shadow-xl",
  5: "shadow-2xl"
};

const ElevatedCard = React.forwardRef<HTMLDivElement, ElevatedCardProps>(
  ({ 
    children,
    className,
    elevation = 2,
    hoverElevation = 4,
    animateOnHover = true,
    glowEffect = false,
    glowColor = "rgba(59, 130, 246, 0.15)",
    ...props
  }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative rounded-lg border bg-card text-card-foreground transition-all duration-300",
          elevationClasses[elevation],
          animateOnHover && `hover:${elevationClasses[hoverElevation]}`,
          glowEffect && "hover:shadow-glow",
          className
        )}
        style={{
          ...(glowEffect && {
            "--glow-color": glowColor,
          } as React.CSSProperties),
        }}
        whileHover={animateOnHover ? { 
          y: -4,
          transition: { type: "spring", stiffness: 300, damping: 30 }
        } : {}}
        {...props}
      >
        {glowEffect && (
          <motion.div
            className="absolute inset-0 rounded-inherit opacity-0 transition-opacity duration-300 -z-10"
            style={{
              background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`,
              filter: "blur(12px)",
            }}
            whileHover={{ opacity: 1 }}
          />
        )}
        {children}
      </motion.div>
    );
  }
);
ElevatedCard.displayName = "ElevatedCard";

// Tilt Card with Mouse Tracking
export interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  tiltMaxX?: number;
  tiltMaxY?: number;
  scale?: number;
  glareEnable?: boolean;
  perspective?: number;
}

const TiltCard = React.forwardRef<HTMLDivElement, TiltCardProps>(
  ({ 
    children,
    className,
    tiltMaxX = 15,
    tiltMaxY = 15,
    scale = 1.02,
    glareEnable = true,
    perspective = 1000,
    ...props
  }, forwardedRef) => {
    const ref = React.useRef<HTMLDivElement>(null);
    const { rotateX, rotateY, x, y } = useTilt(ref, { tiltMaxX, tiltMaxY, scale, glareEnable });

    // Combine refs
    React.useImperativeHandle(forwardedRef, () => ref.current!);

    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative rounded-lg border bg-card text-card-foreground shadow-md transition-all duration-300",
          className
        )}
        style={{ 
          perspective: `${perspective}px`,
          transformStyle: "preserve-3d" 
        }}
        animate={{
          rotateX,
          rotateY,
        }}
        whileHover={{
          scale: scale,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        {...props}
      >
        {glareEnable && (
          <motion.div
            className="absolute inset-0 rounded-inherit pointer-events-none"
            style={{
              background: useTransform(
                [x, y],
                ([latestX, latestY]) =>
                  `linear-gradient(${
                    Math.atan2(latestY, latestX) * (180 / Math.PI) + 90
                  }deg, rgba(255,255,255,0.1) 0%, transparent 50%)`
              ),
              opacity: useTransform([x, y], ([latestX, latestY]) => 
                Math.min(Math.sqrt(latestX * latestX + latestY * latestY), 0.3)
              ),
            }}
          />
        )}
        <div style={{ transform: "translateZ(20px)" }}>
          {children}
        </div>
      </motion.div>
    );
  }
);
TiltCard.displayName = "TiltCard";

// Expandable Card with Smooth Height Transitions
export interface ExpandableCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  expandIcon?: React.ReactNode;
  headerContent?: React.ReactNode;
}

const ExpandableCard = React.forwardRef<HTMLDivElement, ExpandableCardProps>(
  ({ 
    title,
    children,
    className,
    defaultExpanded = false,
    expandIcon,
    headerContent,
    ...props
  }, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
    
    const toggleExpanded = () => setIsExpanded(!isExpanded);

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden",
          className
        )}
        {...props}
      >
        <motion.button
          onClick={toggleExpanded}
          className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-accent/50 transition-colors"
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">{title}</h3>
            {headerContent}
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {expandIcon || (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </motion.div>
        </motion.button>
        
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ 
                height: "auto", 
                opacity: 1,
                transition: {
                  height: { duration: 0.3, ease: "easeOut" },
                  opacity: { duration: 0.2, delay: 0.1 }
                }
              }}
              exit={{ 
                height: 0, 
                opacity: 0,
                transition: {
                  height: { duration: 0.3, ease: "easeIn" },
                  opacity: { duration: 0.1 }
                }
              }}
              style={{ overflow: "hidden" }}
            >
              <div className="px-6 pb-4 border-t">
                <div className="pt-4">
                  {children}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
ExpandableCard.displayName = "ExpandableCard";

// Card Skeleton for Loading States
export interface CardSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  showAvatar?: boolean;
  showActions?: boolean;
  lines?: number;
}

const CardSkeleton = React.forwardRef<HTMLDivElement, CardSkeletonProps>(
  ({ 
    className,
    showAvatar = false,
    showActions = false,
    lines = 3,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-card p-6 space-y-4 animate-pulse",
          className
        )}
        {...props}
      >
        <div className="flex items-center space-x-4">
          {showAvatar && (
            <Skeleton className="h-10 w-10 rounded-full" />
          )}
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton 
              key={i} 
              className={cn(
                "h-3",
                i === lines - 1 ? "w-2/3" : "w-full"
              )} 
            />
          ))}
        </div>
        
        {showActions && (
          <div className="flex space-x-2 pt-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        )}
      </div>
    );
  }
);
CardSkeleton.displayName = "CardSkeleton";

// Flip Card with Interactive Animations
export interface FlipCardProps extends React.HTMLAttributes<HTMLDivElement> {
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  triggerMode?: "hover" | "click";
  flipDirection?: "horizontal" | "vertical";
}

const FlipCard = React.forwardRef<HTMLDivElement, FlipCardProps>(
  ({ 
    frontContent,
    backContent,
    className,
    triggerMode = "hover",
    flipDirection = "horizontal",
    ...props
  }, ref) => {
    const [isFlipped, setIsFlipped] = React.useState(false);
    
    const handleFlip = () => {
      if (triggerMode === "click") {
        setIsFlipped(!isFlipped);
      }
    };

    const handleMouseEnter = () => {
      if (triggerMode === "hover") {
        setIsFlipped(true);
      }
    };

    const handleMouseLeave = () => {
      if (triggerMode === "hover") {
        setIsFlipped(false);
      }
    };

    const rotateAxis = flipDirection === "horizontal" ? "rotateY" : "rotateX";

    return (
      <div
        ref={ref}
        className={cn("relative w-full h-64 perspective-1000", className)}
        onClick={handleFlip}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <motion.div
          className="relative w-full h-full preserve-3d cursor-pointer"
          animate={{ 
            [rotateAxis]: isFlipped ? 180 : 0 
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Front Face */}
          <div 
            className="absolute inset-0 w-full h-full backface-hidden rounded-lg border bg-card text-card-foreground shadow-md"
            style={{ backfaceVisibility: "hidden" }}
          >
            {frontContent}
          </div>
          
          {/* Back Face */}
          <div 
            className="absolute inset-0 w-full h-full backface-hidden rounded-lg border bg-card text-card-foreground shadow-md"
            style={{ 
              backfaceVisibility: "hidden",
              transform: flipDirection === "horizontal" ? "rotateY(180deg)" : "rotateX(180deg)"
            }}
          >
            {backContent}
          </div>
        </motion.div>
      </div>
    );
  }
);
FlipCard.displayName = "FlipCard";

// Glassmorphism Card
export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  blurIntensity?: "light" | "medium" | "strong";
  opacity?: "light" | "medium" | "strong";
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ 
    children,
    className,
    blurIntensity = "medium",
    opacity = "medium",
    ...props
  }, ref) => {
    const blurClasses = {
      light: "backdrop-blur-sm",
      medium: "backdrop-blur-md",
      strong: "backdrop-blur-lg"
    };

    const opacityClasses = {
      light: "bg-glass-white-light border-glass-white-light",
      medium: "bg-glass-white-medium border-glass-white-medium",
      strong: "bg-glass-white-strong border-glass-white-strong"
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-lg border shadow-lg",
          blurClasses[blurIntensity],
          opacityClasses[opacity],
          className
        )}
        whileHover={{ 
          scale: 1.02,
          transition: { duration: 0.2 } 
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
GlassCard.displayName = "GlassCard";

export { 
  ElevatedCard, 
  TiltCard, 
  ExpandableCard, 
  CardSkeleton, 
  FlipCard, 
  GlassCard 
};
