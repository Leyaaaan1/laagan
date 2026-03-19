// ─────────────────────────────────────────────────────────────────────────────
// views/RiderProfileEditScreen.jsx
//
// Editable form for updating the rider's profile.
// Receives current profile as a route param and saves changes via PUT /api/profiles/me.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { updateMyProfile } from '../services/profileService';
import profileStyles from '../styles/screens/Profilestyles';


// ── Available rider types ─────────────────────────────────────────────────────
// Adjust this list to match your backend's RiderType values.
const ALL_RIDER_TYPES = ['driver', 'passenger', 'organizer', 'marshal'];

// ── Type toggle chip ──────────────────────────────────────────────────────────
function TypeChip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[profileStyles.typeChip, active && profileStyles.typeChipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[profileStyles.typeChipText, active && profileStyles.typeChipTextActive]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Labelled text input ───────────────────────────────────────────────────────
function FormField({ label, value, onChangeText, multiline, placeholder, keyboardType }) {
  const [focused, setFocused] = useState(false);
  const baseStyle = multiline
    ? profileStyles.inputFieldMultiline
    : profileStyles.inputField;
  return (
    <View>
      <Text style={profileStyles.inputLabel}>{label}</Text>
      <TextInput
        style={[baseStyle, focused && profileStyles.inputFieldFocused]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || ''}
        placeholderTextColor="#94a3b8"
        multiline={multiline}
        keyboardType={keyboardType || 'default'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ProfileEdit({ route, navigation }) {
  const existing = route?.params?.profile ?? {};

  const [displayName, setDisplayName]     = useState(existing.displayName   ?? '');
  const [bio, setBio]                     = useState(existing.bio           ?? '');
  const [profilePictureUrl, setPfpUrl]    = useState(existing.profilePictureUrl ?? '');
  const [phoneNumber, setPhoneNumber]     = useState(existing.phoneNumber   ?? '');
  const [selectedTypes, setSelectedTypes] = useState(
    new Set(existing.riderTypes ?? [])
  );

  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState(null);

  // ── Toggle a rider type ───────────────────────────────────────────────
  const toggleType = (type) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateMyProfile({
        displayName:       displayName.trim()   || null,
        bio:               bio.trim()           || null,
        profilePictureUrl: profilePictureUrl.trim() || null,
        phoneNumber:       phoneNumber.trim()   || null,
        riderTypeNames:    [...selectedTypes],
      });
      navigation?.goBack();
    } catch (err) {
      setError(err.message || 'Failed to save profile.');
      Alert.alert('Error', err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#000' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 20 }}>
          Edit Profile
        </Text>

        {/* Error banner */}
        {error && (
          <View style={{ backgroundColor: '#ff000022', borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <Text style={profileStyles.errorText}>{error}</Text>
          </View>
        )}

        {/* Form fields */}
        <FormField
          label="Display Name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="How should other riders see you?"
        />
        <FormField
          label="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="+63 900 000 0000"
          keyboardType="phone-pad"
        />
        <FormField
          label="Profile Picture URL"
          value={profilePictureUrl}
          onChangeText={setPfpUrl}
          placeholder="https://..."
          keyboardType="url"
        />
        <FormField
          label="Bio"
          value={bio}
          onChangeText={setBio}
          multiline
          placeholder="Tell other riders about yourself..."
        />

        {/* Rider types */}
        <Text style={profileStyles.inputLabel}>Rider Types</Text>
        <View style={profileStyles.typeChipRow}>
          {ALL_RIDER_TYPES.map((type) => (
            <TypeChip
              key={type}
              label={type}
              active={selectedTypes.has(type)}
              onPress={() => toggleType(type)}
            />
          ))}
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={{
            backgroundColor: saving ? '#888' : '#cc0000',
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 8,
          }}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              Save Changes
            </Text>
          )}
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity
          style={{ marginTop: 12, alignItems: 'center' }}
          onPress={() => navigation?.goBack()}
        >
          <Text style={{ color: '#888', fontSize: 14 }}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}