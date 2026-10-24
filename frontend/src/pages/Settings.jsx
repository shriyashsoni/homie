import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../api';
import { User, Lock, Shield, Bell, Trash2, LogOut, ChevronRight, Eye, EyeOff } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card p-6">
      <h2 className="text-sm font-bold text-charcoal mb-4 flex items-center gap-2">
        <Icon size={16} className="text-brand-500" />
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '' });
  const [language, setLanguage] = useState(user?.preferredLanguage || 'en');

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await userApi.update({ firstName: name.firstName, lastName: name.lastName, preferredLanguage: language });
      await refreshUser();
      alert('Saved!');
    } catch {}
    setSaving(false);
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE') return;
    try {
      await userApi.delete();
      await logout();
      navigate('/');
    } catch {
      alert('Could not delete account. Contact support.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="page-title">Settings</h1>

      {/* Account */}
      <Section icon={User} title="Account details">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              value={name.firstName}
              onChange={(e) => setName((n) => ({ ...n, firstName: e.target.value }))}
            />
            <Input
              label="Last name"
              value={name.lastName}
              onChange={(e) => setName((n) => ({ ...n, lastName: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Email address</label>
            <div className="flex items-center gap-2">
              <input value={user?.email || ''} disabled className="input-field flex-1 bg-sand/50 text-clay cursor-not-allowed" />
              {user?.emailVerified
                ? <span className="text-xs text-green-600 font-medium flex-shrink-0">✓ Verified</span>
                : <span className="text-xs text-orange-600 font-medium flex-shrink-0">Unverified</span>
              }
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Preferred language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input-field">
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="kn">Kannada</option>
            </select>
          </div>
          <Button loading={saving} onClick={handleSaveProfile} size="sm">Save changes</Button>
        </div>
      </Section>

      {/* Privacy */}
      <Section icon={Eye} title="Privacy & visibility">
        <div className="space-y-3">
          {[
            { label: 'Profile discoverable in search', hint: 'Others can find you when browsing.', checked: true },
            { label: 'Show dietary preference', hint: 'Visible on your Homie Card.', checked: true },
            { label: 'Show religious / cultural practices', hint: 'Only if you chose to share these.', checked: false },
            { label: 'Share profile with parents/supporters', hint: 'Requires their explicit invite.', checked: false },
          ].map(({ label, hint, checked: defaultVal }) => {
            const [val, setVal] = useState(defaultVal);
            return (
              <div key={label} className="flex items-center justify-between py-2 border-b border-charcoal/[0.05] last:border-0">
                <div>
                  <p className="text-sm font-medium text-charcoal">{label}</p>
                  <p className="text-xs text-clay">{hint}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={val} onChange={(e) => setVal(e.target.checked)} className="sr-only peer" />
                  <div className="w-10 h-5 bg-sand peer-checked:bg-brand-500 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5" />
                </label>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Verification */}
      <Section icon={Shield} title="Verification">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal">Email</p>
              <p className="text-xs text-clay">{user?.email}</p>
            </div>
            {user?.emailVerified
              ? <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Verified</span>
              : <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Not verified</span>
            }
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal">Phone</p>
              <p className="text-xs text-clay">{user?.phone || 'Not added'}</p>
            </div>
            {user?.phoneVerified
              ? <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Verified</span>
              : <span className="px-2 py-1 bg-sand text-clay rounded-full text-xs font-medium">Not verified</span>
            }
          </div>
        </div>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notifications">
        <div className="space-y-3">
          {['Connection requests', 'Viewing reminders', 'Listing freshness alerts', 'Platform updates'].map((item) => {
            const [val, setVal] = useState(true);
            return (
              <div key={item} className="flex items-center justify-between py-2 border-b border-charcoal/[0.05] last:border-0">
                <p className="text-sm text-charcoal">{item}</p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={val} onChange={(e) => setVal(e.target.checked)} className="sr-only peer" />
                  <div className="w-10 h-5 bg-sand peer-checked:bg-brand-500 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5" />
                </label>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Danger zone */}
      <Section icon={Trash2} title="Danger zone">
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-red-50 border border-red-100">
            <p className="text-sm font-semibold text-red-700 mb-1">Delete account</p>
            <p className="text-xs text-red-600 mb-3">
              This permanently deletes your profile, listings, connections and data. This cannot be undone.
            </p>
            <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
              Delete my account
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => { await logout(); navigate('/login'); }}
            className="flex items-center gap-2 text-charcoal/80"
          >
            <LogOut size={14} /> Sign out of all devices
          </Button>
        </div>
      </Section>

      {/* Delete confirmation modal */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete account">
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-xl">
            <p className="text-sm text-red-700">
              This will permanently delete your account, profile, listings and all associated data.
              <strong> This cannot be undone.</strong>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">
              Type <strong>DELETE</strong> to confirm
            </label>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="input-field"
              placeholder="DELETE"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={deleteConfirm !== 'DELETE'}
              onClick={handleDelete}
              className="flex-1"
            >
              Permanently delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
