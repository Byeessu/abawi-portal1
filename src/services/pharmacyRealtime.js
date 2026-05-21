import { supabase } from '../lib/supabase';

const EDGE_BASE = '';

export async function fetchGooglePlacesPharmacies(lat, lng, radius = 5000) {
  try {
    const res = await fetch(`${EDGE_BASE}/.netlify/edge-functions/pharmacies-open-now?lat=${lat}&lng=${lng}&radius=${radius}`);
    if (!res.ok) throw new Error('Google Places fetch failed');
    return await res.json();
  } catch (e) {
    console.error(e);
    return { results: [], error: e.message };
  }
}

export async function fetchSupabaseGuardShifts(city = null) {
  const today = new Date().toISOString().split('T')[0];
  let q = supabase
    .from('pharmacy_guard_shifts')
    .select('*')
    .eq('status', 'active')
    .gte('guard_date', today)
    .order('verification_count', { ascending: false })
    .limit(50);
  if (city) q = q.eq('city', city);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function reportGuardShift(shift) {
  const { data, error } = await supabase.from('pharmacy_guard_shifts').insert({
    pharmacy_name: shift.name,
    address: shift.address,
    phone: shift.phone,
    city: shift.city,
    zone: shift.zone,
    lat: shift.lat,
    lng: shift.lng,
    guard_date: shift.guardDate,
    starts_at: shift.startsAt,
    ends_at: shift.endsAt,
    notes: shift.notes,
    photo_url: shift.photoUrl,
    reported_by: shift.reportedBy,
    reported_name: shift.reportedName
  }).select().single();
  if (error) throw error;
  return data;
}

export async function verifyGuardShift(id) {
  const { data, error } = await supabase.rpc('increment_guard_verification', { shift_id: id });
  if (error) throw error;
  return data;
}
