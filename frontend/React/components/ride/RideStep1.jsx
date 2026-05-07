import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import DatePicker from 'react-native-date-picker';
import layout from '../../styles/base/layout';
import header from '../../styles/base/header';
import inputs from '../../styles/base/inputs';
import buttons from '../../styles/base/buttons';
import cards from '../../styles/base/cards';
import text from '../../styles/base/text';
import spacing from '../../styles/tokens/spacing';
import {splitDateTime} from './utilities/RideStepUtils';
import RideTypeSelector from '../../commons/RideTypeSelector';

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Shows the currently selected date/time or a placeholder prompt. */
const DateDisplay = ({date}) => {
  if (!date) {
    return (
      <View
        style={[inputs.searchRow, {justifyContent: 'center', gap: spacing.sm}]}>
        <FontAwesome name="calendar" size={16} color="#94a3b8" />
        <Text style={[text.labelLight, {marginBottom: 0}]}>
          Tap to select date &amp; time
        </Text>
      </View>
    );
  }

  const {dateStr, timeStr} = splitDateTime(date);
  return (
    <View
      style={[
        inputs.searchRow,
        {
          justifyContent: 'center',
          flexDirection: 'column',
          height: 'auto',
          paddingVertical: 12,
        },
      ]}>
      <Text style={[text.bodyMd, {fontWeight: '600'}]}>{dateStr}</Text>
      <Text style={text.caption}>{timeStr}</Text>
    </View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const RideStep1 = ({
  error,
  rideName,
  setRideName,
  riderType,
  setRiderType,
  participants,
  setParticipants,
  description,
  setDescription,
  date,
  setDate,
  nextStep,
}) => {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateError, setDateError] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleDateConfirm = selectedDate => {
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
          style={[buttons.row, {paddingVertical: 8}]}
          onPress={nextStep}
          activeOpacity={0.8}>
          <Text style={buttons.textSm}>Next</Text>
          <FontAwesome
            name="arrow-right"
            size={14}
            color="#fff"
            style={{marginLeft: spacing.sm}}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={layout.flex1}
        contentContainerStyle={{padding: spacing.md, paddingBottom: 40}}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* ── Error banner ── */}
        {!!error && (
          <View
            style={[
              cards.base,
              {
                backgroundColor: '#fef2f2',
                borderColor: '#fecaca',
                marginBottom: spacing.md,
              },
            ]}>
            <Text style={text.errorText}>{error}</Text>
          </View>
        )}

        {/* ── Ride name ── */}
        <View style={[cards.elevated, {marginBottom: spacing.md}]}>
          <Text style={[text.sectionTitle, {marginBottom: 4}]}>
            Name Your Ride
          </Text>
          <Text style={[text.labelLight, {marginBottom: spacing.md}]}>
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

        {/* ── Date & ride type ── */}
        <View style={[cards.elevated, {marginBottom: spacing.md}]}>
          <Text style={[text.sectionTitle, {marginBottom: 4}]}>
            When &amp; How
          </Text>

          <Text style={[text.labelLight, {marginBottom: spacing.sm}]}>
            Select Date &amp; Time
          </Text>
          <TouchableOpacity
            onPress={() => setDatePickerOpen(true)}
            activeOpacity={0.7}>
            <DateDisplay date={date} />
          </TouchableOpacity>
          {!!dateError && (
            <Text style={[inputs.errorText, {marginTop: spacing.sm}]}>
              {dateError}
            </Text>
          )}

          <Text
            style={[
              text.labelLight,
              {marginTop: spacing.lg, marginBottom: spacing.sm},
            ]}>
            Choose Your Bike
          </Text>
          <RideTypeSelector
            selectedType={riderType}
            onSelectType={setRiderType}
          />
        </View>

        {/* ── Description ── */}
        <View style={[cards.elevated, {marginBottom: spacing.md}]}>
          <Text style={[text.sectionTitle, {marginBottom: 4}]}>
            Describe Your Route
          </Text>
          <Text style={[text.labelLight, {marginBottom: spacing.md}]}>
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
          activeOpacity={0.85}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
            }}>
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
