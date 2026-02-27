'use client';

import { useState, useEffect } from 'react';
import { getAllTeamMembers, toggleTeamMemberActive, deleteTeamMember, TeamMember } from '@/lib/team';
import { Edit2, Trash2, Eye, EyeOff, Users, Briefcase } from 'lucide-react';

export function TeamList() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const data = await getAllTeamMembers();
      setTeamMembers(data);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
    setLoading(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await toggleTeamMemberActive(id, active);
      setTeamMembers(prev =>
        prev.map(member => member.id === id ? { ...member, active: !active } : member)
      );
    } catch (error: any) {
      alert('Error al actualizar estado: ' + error.message);
    }
  };

  const handleEdit = (member: TeamMember) => {
    window.dispatchEvent(new CustomEvent('editTeamMember', { detail: member }));
  };

  const handleDelete = async (member: TeamMember) => {
    if (!confirm(`¿Eliminar a ${member.name}? Esta acción no se puede deshacer.`)) return;

    try {
      await deleteTeamMember(member.id);
      setTeamMembers(prev => prev.filter(m => m.id !== member.id));
    } catch (error: any) {
      alert('Error al eliminar: ' + error.message);
    }
  };

  if (loading) {
    return <div className="text-manso-cream/60 text-center py-8">Cargando miembros del team...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream mb-6 flex items-center gap-2">
        <Users size={20} />
        Team Members ({teamMembers.length})
      </h3>

      {teamMembers.length === 0 ? (
        <div className="text-center text-manso-cream/40 py-8">
          No hay miembros del team registrados
        </div>
      ) : (
        teamMembers.map((member) => (
          <div
            key={member.id}
            className={`p-4 rounded-2xl border transition-all ${
              member.active
                ? 'bg-manso-cream/10 border-manso-cream/20'
                : 'bg-manso-black/20 border-manso-cream/10 opacity-60'
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Foto circular */}
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-manso-cream/5">
                {member.photo_url ? (
                  <img
                    src={member.photo_url}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users size={24} className="text-manso-cream/30" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className={`text-lg font-bold uppercase tracking-tighter text-manso-cream ${
                  !member.active ? 'line-through decoration-1 decoration-manso-cream/50' : ''
                }`}>
                  {member.name}
                </h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="text-[9px] uppercase tracking-widest text-manso-cream/60 px-2 py-0.5 border border-manso-cream/20 rounded flex items-center gap-1">
                    <Briefcase size={10} />
                    {member.role}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-manso-terra px-2 py-0.5 border border-manso-terra/30 rounded">
                    Orden: {member.order_index}
                  </span>
                  {!member.active && (
                    <span className="text-[9px] uppercase font-bold text-red-400 px-2 py-0.5 border border-red-400/30 rounded">
                      Inactivo
                    </span>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleEdit(member)}
                  className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 ring-2 ring-blue-500/30 transition-all"
                  title="Editar miembro"
                >
                  <Edit2 size={14} className="text-blue-400" />
                </button>

                <button
                  onClick={() => toggleActive(member.id, member.active)}
                  className={`p-2 rounded-lg transition-all ${
                    member.active
                      ? 'bg-green-500/20 hover:bg-green-500/30 ring-2 ring-green-500/30'
                      : 'bg-red-500/20 hover:bg-red-500/30 ring-2 ring-red-500/30'
                  }`}
                  title={member.active ? 'Desactivar miembro' : 'Activar miembro'}
                >
                  {member.active ? (
                    <Eye size={14} className="text-green-400" />
                  ) : (
                    <EyeOff size={14} className="text-red-400" />
                  )}
                </button>

                <button
                  onClick={() => handleDelete(member)}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 ring-2 ring-red-500/30 transition-all"
                  title="Eliminar miembro"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
