import { supabase } from '../lib/supabaseClient';

/**
 * Servicio para gestionar solicitudes de acceso en Supabase
 */
export class SupabaseAccessRequestService {
  
  /**
   * Crear una nueva solicitud de acceso
   */
  static async createAccessRequest(email, name, reason) {
    try {
      const { data, error } = await supabase
        .from('access_requests')
        .insert([
          {
            email,
            name,
            reason,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating access request:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception creating access request:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener todas las solicitudes de acceso (solo admins)
   */
  static async getAllAccessRequests() {
    try {
      const { data, error } = await supabase
        .from('access_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Error fetching access requests:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception fetching access requests:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener solicitudes por email
   */
  static async getRequestsByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('access_requests')
        .select('*')
        .eq('email', email)
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests by email:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception fetching requests by email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Aprobar una solicitud de acceso
   */
  static async approveAccessRequest(requestId) {
    try {
      // Usar la función de Supabase para aprobar
      const { error } = await supabase.rpc('approve_access_request', {
        request_id: requestId
      });

      if (error) {
        console.error('Error approving access request:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception approving access request:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Rechazar una solicitud de acceso
   */
  static async rejectAccessRequest(requestId, rejectionReason = null) {
    try {
      // Usar la función de Supabase para rechazar
      const { error } = await supabase.rpc('reject_access_request', {
        request_id: requestId,
        rejection_reason: rejectionReason
      });

      if (error) {
        console.error('Error rejecting access request:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception rejecting access request:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Eliminar una solicitud de acceso
   */
  static async deleteAccessRequest(requestId) {
    try {
      const { error } = await supabase
        .from('access_requests')
        .delete()
        .eq('id', requestId);

      if (error) {
        console.error('Error deleting access request:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception deleting access request:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener estadísticas de solicitudes (solo admins)
   */
  static async getAccessRequestStats() {
    try {
      const { data, error } = await supabase
        .from('access_requests_stats')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching access request stats:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception fetching access request stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verificar si un email ya tiene una solicitud pendiente
   */
  static async hasExistingPendingRequest(email) {
    try {
      const { data, error } = await supabase
        .from('access_requests')
        .select('id')
        .eq('email', email)
        .eq('status', 'pending')
        .limit(1);

      if (error) {
        console.error('Error checking existing request:', error);
        return { success: false, error: error.message };
      }

      return { success: true, hasExisting: data && data.length > 0 };
    } catch (error) {
      console.error('Exception checking existing request:', error);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Servicio para gestionar perfiles de usuario
 */
export class SupabaseProfileService {

  /**
   * Obtener perfil de usuario por ID
   */
  static async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception fetching profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener perfil por email
   */
  static async getProfileByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error fetching profile by email:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception fetching profile by email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualizar perfil de usuario
   */
  static async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception updating profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener todos los perfiles (solo admins)
   */
  static async getAllProfiles() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all profiles:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception fetching all profiles:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Activar/desactivar usuario
   */
  static async toggleUserActive(userId, isActive) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          activo: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error toggling user active status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception toggling user active status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cambiar rol de usuario
   */
  static async changeUserRole(userId, newRole) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          rol: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error changing user role:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception changing user role:', error);
      return { success: false, error: error.message };
    }
  }
}

export default {
  AccessRequests: SupabaseAccessRequestService,
  Profiles: SupabaseProfileService
};