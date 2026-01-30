import React from "react";
import {
    Package, Wifi, Zap, Smartphone, PhoneCall, Shield, Lightbulb, Flame
} from "lucide-react";
import { getFamiliaConfig } from "../utils/gestionUtils";

const FamiliaBadge = ({ familia }) => {
    const config = getFamiliaConfig(familia);
    const Icon = {
        Wifi, Zap, Smartphone, PhoneCall, Shield, Lightbulb, Flame, Package
    }[config.icon] || Package;

    const colorClasses = {
        blue: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
        purple: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
        green: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
        indigo: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
        red: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
        yellow: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
        orange: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
        slate: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses[config.color]}`}>
            <Icon className="w-3 h-3" />
            {familia || "Sin clasificar"}
        </span>
    );
};

export default FamiliaBadge;
