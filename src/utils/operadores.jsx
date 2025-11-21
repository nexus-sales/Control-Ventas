// src/utils/operadores.jsx
import React from "react";
import { Phone, Zap, Shield, Briefcase, Home, Building } from "lucide-react";

export const getSectorIcon = (sector) => {
  switch(sector?.toLowerCase()) {
    case 'telefonia': return <Phone className="w-4 h-4 text-blue-600" />;
    case 'energia': return <Zap className="w-4 h-4 text-yellow-600" />;
    case 'seguridad': return <Shield className="w-4 h-4 text-red-600" />;
    case 'alarmas': return <Shield className="w-4 h-4 text-red-600" />;
    case 'internet': return <Briefcase className="w-4 h-4 text-purple-600" />;
    case 'seguros': return <Home className="w-4 h-4 text-green-600" />;
    default: return <Building className="w-4 h-4 text-gray-600" />;
  }
};

export const getSectorColor = (sector) => {
  switch(sector?.toLowerCase()) {
    case 'telefonia': return 'bg-blue-100 text-blue-700';
    case 'energia': return 'bg-yellow-100 text-yellow-700';
    case 'seguridad': return 'bg-red-100 text-red-700';
    case 'alarmas': return 'bg-red-100 text-red-700';
    case 'internet': return 'bg-purple-100 text-purple-700';
    case 'seguros': return 'bg-green-100 text-green-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};
