import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StatusBar,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import DatePicker from 'react-native-date-picker';
import layout from '../../styles/base/layout';
import header from '../../styles/base/header';
import inputs from '../../styles/base/inputs';
import buttons from '../../styles/base/buttons';
import cards from '../../styles/base/cards';
import text from '../../styles/base/text';
import rideCreation from '../../styles/screens/rideCreation';

const RideStep1 = ({
                     error, rideName, setRideName, riderType, setRiderType,
                     participants, setParticipants, description, date, setDate,
                     isRiderSearching, handleSearchRiders, setDescription, nextStep,
                   }) => {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateError, setDateError] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleDateConfirm = (selectedDate) => {
    if (selectedDate < today) {
      setDateError('Please select a future date');
      return;
    }
    setDateError('');
    setDate(selectedDate);
    setDatePickerOpen(false);
  };

  return (
    <View style={layout.screen}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={header.bar}>
        <View style={header.left}>
          <Text style={header.title}>CREATE RIDE</Text>
          <Text style={header.subtitle}>Step 1 of 3 — Details</Text>
        </View>
        <TouchableOpacity
          style={[buttons.row, { paddingVertical: 8 }]}
          onPress={nextStep}
          activeOpacity={0.8}
        >
          <Text style={buttons.textSm}>Next</Text>
          <FontAwesome name="arrow-right" size={14} color="#fff" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={layout.flex1}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Error Banner ── */}
        {!!error && (
          <View style={[cards.base, { backgroundColor: '#fef2f2', borderColor: '#fecaca', marginBottom: 16 }]}>
            <Text style={text.errorText}>{error}</Text>
          </View>
        )}

        {/* ── Ride Name ── */}
        <View style={[cards.elevated, { marginBottom: 16 }]}>
          <Text style={[text.sectionTitle, { marginBottom: 4 }]}>Name Your Ride</Text>
          <Text style={[text.labelLight, { marginBottom: 12 }]}>
            Give your adventure a memorable name
          </Text>
          <TextInput
            style={[
              inputs.light,
              focusedInput === 'rideName' && inputs.lightFocused,
            ]}
            value={rideName}
            onChangeText={setRideName}
            onFocus={() => setFocusedInput('rideName')}
            onBlur={() => setFocusedInput(null)}
            placeholder="Epic Bukidnon Adventure"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* ── Date & Ride Type ── */}
        <View style={[cards.elevated, { marginBottom: 16 }]}>
          <Text style={[text.sectionTitle, { marginBottom: 4 }]}>When &amp; How</Text>

          {/* Date picker row */}
          <Text style={[text.labelLight, { marginBottom: 8 }]}>Select Date &amp; Time</Text>
          <TouchableOpacity
            onPress={() => setDatePickerOpen(true)}
            activeOpacity={0.7}
          >
            {date ? (
              <View style={{
                backgroundColor: '#f8fafc',
                borderRadius: 12,
                padding: 14,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#e2e8f0',
              }}>
                <Text style={{ color: '#1e293b', fontSize: 15, fontWeight: '600' }}>
                  {date.toLocaleDateString(undefined, {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </Text>
                <Text style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                  {date.toLocaleTimeString(undefined, {
                    hour: '2-digit', minute: '2-digit', hour12: true,
                  })}
                </Text>
              </View>
            ) : (
              <View style={{
                backgroundColor: '#f8fafc',
                borderRadius: 12,
                padding: 14,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#e2e8f0',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}>
                <FontAwesome name="calendar" size={16} color="#94a3b8" />
                <Text style={{ color: '#94a3b8', fontSize: 14 }}>Tap to select date &amp; time</Text>
              </View>
            )}
          </TouchableOpacity>
          {!!dateError && (
            <Text style={[inputs.errorText, { marginTop: 6 }]}>{dateError}</Text>
          )}

          {/* Ride type */}
          <Text style={[text.labelLight, { marginTop: 20, marginBottom: 8 }]}>Choose Ride Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 4 }}
          >
            {[
              { type: 'car',         icon: 'car',         label: 'Car' },
              { type: 'motor',       icon: 'motorcycle',  label: 'Motorcycle' },
              { type: 'run',         icon: 'shoe-prints', label: 'Run' },
              { type: 'bike',        icon: 'bicycle',     label: 'Bike' },
              { type: 'cafe Racers', icon: 'rocket',      label: 'Cafe Racers' },
            ].map(({ type, icon, label }) => (
              <TouchableOpacity
                key={type}
                style={[
                  rideCreation.rideTypeOption,
                  riderType === type && rideCreation.rideTypeSelected,
                ]}
                onPress={() => setRiderType(type)}
                activeOpacity={0.8}
              >
                <FontAwesome
                  name={icon}
                  size={24}
                  color={riderType === type ? '#fff' : '#64748b'}
                />
                <Text style={{
                  marginTop: 8,
                  color: riderType === type ? '#fff' : '#64748b',
                  fontSize: 12,
                  fontWeight: '500',
                  textAlign: 'center',
                }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Description ── */}
        <View style={[cards.elevated, { marginBottom: 16 }]}>
          <Text style={[text.sectionTitle, { marginBottom: 4 }]}>Describe Your Route</Text>
          <Text style={[text.labelLight, { marginBottom: 12 }]}>
            Share details about terrain, highlights, or special stops
          </Text>
          <TextInput
            style={[
              inputs.multiline,
              focusedInput === 'description' && inputs.lightFocused,
            ]}
            value={description}
            onChangeText={setDescription}
            onFocus={() => setFocusedInput('description')}
            onBlur={() => setFocusedInput(null)}
            placeholder="Tell us about the terrain, highlights, or any special stops along the way..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* ── Next CTA ── */}
        <TouchableOpacity
          style={buttons.primary}
          onPress={nextStep}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={buttons.textPrimary}>Continue to Location</Text>
            <FontAwesome name="arrow-right" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

      </ScrollView>

      <DatePicker
        modal
        open={datePickerOpen}
        date={date || new Date()}
        minimumDate={today}
        onConfirm={handleDateConfirm}
        onCancel={() => setDatePickerOpen(false)}
        mode="datetime"
      />
    </View>
  );
};

export default RideStep1;