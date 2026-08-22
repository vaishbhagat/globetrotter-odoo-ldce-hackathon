import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { User, Camera, Globe2, DollarSign, Trash2, Loader2, Save, CheckCircle2 } from 'lucide-react';
import { getInitials, cn } from '../lib/utils';

const LANGUAGES = ['en', 'hi', 'fr', 'de', 'ja', 'es', 'pt'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'AED'];

const LANG_LABELS: Record<string, string> = {
  en: 'English', hi: 'Hindi', fr: 'French', de: 'German',
  ja: 'Japanese', es: 'Spanish', pt: 'Portuguese',
};

export function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [language, setLanguage] = useState(profile?.preferences?.language ?? 'en');
  const [currency, setCurrency] = useState(profile?.preferences?.currency ?? 'INR');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    let avatar_url = profile?.avatar_url ?? null;

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
      if (!uploadErr) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        avatar_url = data.publicUrl;
      }
    }

    await supabase.from('profiles').update({
      full_name: fullName,
      avatar_url,
      preferences: { language, currency },
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE' || !user) return;
    setDeleting(true);
    // Delete profile (cascades to trips, etc.)
    await supabase.from('profiles').delete().eq('id', user.id);
    await supabase.auth.admin?.deleteUser(user.id).catch(() => {});
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="flex-1 overflow-auto bg-linen-100">
      <div className="max-w-2xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="section-label mb-2">Account Settings</p>
          <h1 className="font-serif text-3xl font-bold text-ink-200">Your Profile</h1>
        </div>

        {/* Avatar Section */}
        <div className="card mb-6">
          <h2 className="font-serif text-lg font-semibold text-ink-200 mb-5">Avatar</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-terracotta-50 border-2 border-sand-300 flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-2xl text-terracotta-500">
                    {getInitials(fullName || profile?.full_name)}
                  </span>
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                id="profile-avatar-upload-btn"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-terracotta-500 flex items-center justify-center cursor-pointer hover:bg-terracotta-600 transition-colors"
              >
                <Camera size={13} className="text-white" />
                <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-200">{profile?.full_name ?? 'Trotter Guest'}</p>
              <p className="text-xs text-sand-500 mt-0.5">{user?.email}</p>
              <p className="text-xs text-sand-400 mt-2">Click the camera icon to update your photo</p>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="card mb-6">
          <h2 className="font-serif text-lg font-semibold text-ink-200 mb-5">Personal Information</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="profile-name" className="label">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sand-400" />
                <input
                  id="profile-name"
                  type="text"
                  className="input pl-10"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="label">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  className="input opacity-60 cursor-not-allowed"
                  value={user?.email ?? ''}
                  readOnly
                />
              </div>
              <p className="text-xs text-sand-400">Email cannot be changed here.</p>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="card mb-6">
          <h2 className="font-serif text-lg font-semibold text-ink-200 mb-5">Preferences</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="profile-language" className="label">
                <Globe2 size={12} className="inline mr-1" />Language
              </label>
              <select id="profile-language" className="input" value={language} onChange={e => setLanguage(e.target.value)}>
                {LANGUAGES.map(l => (
                  <option key={l} value={l}>{LANG_LABELS[l]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="profile-currency" className="label">
                <DollarSign size={12} className="inline mr-1" />Currency
              </label>
              <select id="profile-currency" className="input" value={currency} onChange={e => setCurrency(e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={handleSave}
            disabled={saving}
            id="profile-save-btn"
            className="btn-primary"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
          {saved && <p className="text-sage-600 text-sm font-medium flex items-center gap-1.5"><CheckCircle2 size={14} /> Profile updated successfully</p>}
        </div>

        {/* Danger Zone */}
        <div className="border border-dusty-100 rounded-xl overflow-hidden">
          <div className="bg-dusty-50 px-6 py-4 border-b border-dusty-100">
            <h3 className="font-semibold text-dusty-700 flex items-center gap-2">
              <Trash2 size={15} /> Danger Zone
            </h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-ink-50 mb-4">
              Permanently delete your account and all associated data, including trips, stops, and itineraries.
              <strong className="text-dusty-600"> This action cannot be undone.</strong>
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                id="profile-delete-account-btn"
                className="btn-danger text-sm"
              >
                <Trash2 size={14} /> Delete My Account
              </button>
            ) : (
              <div className="space-y-4 animate-slide-up">
                <div className="p-4 bg-dusty-50 border border-dusty-200 rounded-lg">
                  <p className="text-sm text-dusty-700 mb-3">
                    Type <strong>DELETE</strong> in the field below to confirm account deletion:
                  </p>
                  <input
                    type="text"
                    id="profile-delete-confirm-input"
                    className="input border-dusty-200 focus:border-dusty-400 focus:ring-dusty-100 mb-3"
                    placeholder="Type DELETE to confirm"
                    value={deleteInput}
                    onChange={e => setDeleteInput(e.target.value)}
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteInput !== 'DELETE' || deleting}
                      id="profile-delete-confirm-btn"
                      className="btn-danger text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      {deleting ? 'Deleting...' : 'Permanently Delete'}
                    </button>
                    <button
                      onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                      className="btn-secondary text-sm"
                      id="profile-delete-cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
