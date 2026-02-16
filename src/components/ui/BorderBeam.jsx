import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

/**
 * BorderBeam - Un efecto de luz que recorre el borde de un contenedor.
 * Inspirado en Magic UI.
 */
export const BorderBeam = ({
    className,
    size = 200,
    duration = 15,
    anchor = 90,
    borderWidth = 1.5,
    colorFrom = "#3b82f6",
    colorTo = "#8b5cf6",
    delay = 0,
}) => {
    return (
        <div
            style={{
                "--size": `${size}px`,
                "--duration": `${duration}s`,
                "--anchor": `${anchor}`,
                "--border-width": `${borderWidth}px`,
                "--color-from": colorFrom,
                "--color-to": colorTo,
                "--delay": `${delay}s`,
            }}
            className={cn(
                "pointer-events-none absolute inset-0 z-10 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]",
                "![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]",
                className
            )}
        >
            <motion.div
                className="absolute aspect-square w-[var(--size)] [animation-delay:var(--delay)] [background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)] [offset-anchor:calc(var(--anchor)*1%)_50%] [offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]"
                animate={{
                    offsetDistance: ["0%", "100%"],
                }}
                transition={{
                    duration: duration,
                    repeat: Infinity,
                    ease: "linear",
                    delay: delay,
                }}
            />
        </div>
    );
};
