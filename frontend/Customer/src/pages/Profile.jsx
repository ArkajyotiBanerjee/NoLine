import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userProfile as defaultProfile } from '../data/mockData';
import { addNotification } from '../utils/notifications';
import Toast from '../components/Toast';
import {
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  ListBulletIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// ── Load profile: localStorage first, fallback to mockData ────────────────────
const loadProfile = () => {
  try {
    const stored = localStorage.getItem('userProfile');
    if (stored) return JSON.parse(stored);
  } catch {}
  // Seed from mockData (normalise field names)
  return {
    name:  defaultProfile.name,
    age:   defaultProfile.age,
    phone: defaultProfile.mobile || defaultProfile.phone || '',
    email: defaultProfile.email,
  };
};

// ── Read-only field row ────────────────────────────────────────────────────────
const FieldRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 py-3 text-sm">
    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </div>
    <span className="font-semibold text-gray-800 dark:text-gray-100">{value}</span>
  </div>
);

// ── Editable field row ────────────────────────────────────────────────────────
const EditFieldRow = ({ icon: Icon, label, name, value, onChange, type = 'text' }) => (
  <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 py-3 text-sm">
    <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
    <label className="text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-gray-800 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition"
    />
  </div>
);

// ── Profile page ──────────────────────────────────────────────────────────────
const Profile = ({ viewMode }) => {
  const [profile, setProfile] = useState(loadProfile);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [activeQueues, setActiveQueues] = useState([]);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const isDesktop = viewMode === 'desktop';

  useEffect(() => {
    const data = localStorage.getItem('joinedQueues');
    if (data) setActiveQueues(JSON.parse(data));
  }, []);

  const isSenior = Number(profile.age) >= 60;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDraft((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = () => {
    setDraft({ ...profile });
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
  };

  const handleSave = () => {
    const updated = {
      name:  draft.name?.trim()  || profile.name,
      age:   draft.age,
      phone: draft.phone?.trim() || profile.phone,
      email: draft.email?.trim() || profile.email,
    };
    localStorage.setItem('userProfile', JSON.stringify(updated));
    setProfile(updated);
    setEditMode(false);
    addNotification('Profile updated');
    setToast({ message: 'Profile updated ✅', type: 'success' });
  };

  const initials = profile.name ? profile.name.charAt(0).toUpperCase() : '?';

  return (
    <div className={`p-4 ${isDesktop ? 'max-w-2xl mx-auto' : ''}`}>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Profile</h1>

      {/* ── Profile Card ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden mb-4">

        {/* Banner */}
        <div className="bg-blue-600 py-6 flex flex-col items-center gap-2 relative">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
            <span className="text-2xl font-bold text-blue-600">{initials}</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-white font-bold text-lg">{profile.name}</p>
            {isSenior && (
              <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">
                Senior Citizen
              </span>
            )}
          </div>
          {/* Edit / Save / Cancel buttons */}
          <div className="absolute top-3 right-3 flex gap-2">
            {editMode ? (
              <>
                <button
                  id="profile-save-btn"
                  onClick={handleSave}
                  className="flex items-center gap-1 bg-white text-blue-600 text-xs font-bold px-3 py-1.5 rounded-full shadow hover:bg-blue-50 transition-colors"
                >
                  <CheckIcon className="w-3.5 h-3.5" /> Save
                </button>
                <button
                  id="profile-cancel-btn"
                  onClick={handleCancel}
                  className="flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors"
                >
                  <XMarkIcon className="w-3.5 h-3.5" /> Cancel
                </button>
              </>
            ) : (
              <button
                id="profile-edit-btn"
                onClick={handleEdit}
                className="flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors"
              >
                <PencilSquareIcon className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="p-5">
          {editMode ? (
            <>
              <EditFieldRow icon={CalendarDaysIcon} label="Name"  name="name"  value={draft.name}  onChange={handleChange} />
              <EditFieldRow icon={CalendarDaysIcon} label="Age"   name="age"   value={draft.age}   onChange={handleChange} type="number" />
              <EditFieldRow icon={PhoneIcon}        label="Phone" name="phone" value={draft.phone} onChange={handleChange} type="tel" />
              <EditFieldRow icon={EnvelopeIcon}     label="Email" name="email" value={draft.email} onChange={handleChange} type="email" />
              {Number(draft.age) >= 60 && (
                <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-medium text-center">
                  🏷️ Senior Citizen badge will be applied
                </p>
              )}
            </>
          ) : (
            <>
              <FieldRow icon={CalendarDaysIcon} label="Age"   value={`${profile.age} years`} />
              <FieldRow icon={PhoneIcon}        label="Phone" value={profile.phone} />
              <FieldRow icon={EnvelopeIcon}     label="Email" value={profile.email} />
            </>
          )}
        </div>
      </div>

      {/* ── Active Queues Section ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ListBulletIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-bold text-gray-800 dark:text-white">Active Queues</h2>
          </div>
          <Link to="/my-queues" className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
            View All →
          </Link>
        </div>

        {activeQueues.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-2">
            You haven't joined any queues yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Summary badge */}
            <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg px-4 py-3 mb-2">
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{activeQueues.length}</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {activeQueues.length === 1 ? 'queue' : 'queues'} currently active
              </span>
            </div>
            {/* Queue list */}
            {activeQueues.map((q) => {
              const isGroup = q.groupSize && q.groupSize > 1;
              return (
                <button
                  key={q.id}
                  onClick={() => navigate(`/my-queues/${q.id}`)}
                  className="flex items-center justify-between w-full text-left px-3 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{q.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Position #{q.position} &bull; {q.peopleAhead} ahead &bull;{' '}
                      {q.token && <span className="font-mono text-blue-600 dark:text-blue-400">#{q.token}</span>} &bull;{' '}
                      <span className={isGroup ? 'text-purple-600 dark:text-purple-400' : ''}>
                        {isGroup ? `Group of ${q.groupSize}` : 'Individual'}
                      </span>
                    </p>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
