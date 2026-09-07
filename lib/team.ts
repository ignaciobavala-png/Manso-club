import { supabase } from './supabase';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photo_url?: string;
  order_index: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('active', true)
      .order('order_index', { ascending: true });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function getAllTeamMembers(): Promise<TeamMember[]> {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('order_index', { ascending: true });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function upsertTeamMember(member: Partial<TeamMember> & { name: string; role: string; order_index: number }): Promise<TeamMember> {
  const memberData = {
    name: member.name,
    role: member.role,
    photo_url: member.photo_url || null,
    order_index: member.order_index,
    active: member.active !== undefined ? member.active : true,
  };

  if (member.id) {
    // Update existing member
    const { data, error } = await supabase
      .from('team_members')
      .update(memberData)
      .eq('id', member.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Insert new member
    const { data, error } = await supabase
      .from('team_members')
      .insert([memberData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export async function deleteTeamMember(id: string): Promise<void> {
  // Se borra solo la fila. La foto queda en el bucket a propósito: la misma URL
  // puede estar referenciada desde otra tabla y borrarla acá la dejaría rota.
  // Ver components/admin/ImageUploader.tsx.
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function toggleTeamMemberActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .update({ active: !active })
    .eq('id', id);

  if (error) throw error;
}
