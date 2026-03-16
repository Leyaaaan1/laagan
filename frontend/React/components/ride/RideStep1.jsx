import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, ScrollView} from 'react-native';
import FontAwesome from "react-native-vector-icons/FontAwesome";
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
                       participants, setParticipants, description, date, setDate, isRiderSearching, handleSearchRiders, setDescription, nextStep,
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
      {/* Navigation Header */}
            <View style={header.barSurface}>
              <Text style={header.title}>RIDE DETAILS</Text>
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                    onPress={nextStep}
                >
                    <Text style={buttons.textPrimary}>Next</Text>
                    <FontAwesome name="arrow-right" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error ? (
                <View style={[cards.elevated, { backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1 }]}>
                    <Text style={text.errorText}>{error}</Text>
                </View>
            ) : null}

            {/* Ride Name Section */}
            <View style={cards.elevated}>
                <Text style={text.sectionTitle}>Name Your Ride</Text>
                <Text style={text.label}>Give your adventure a memorable name</Text>
                <TextInput
                    style={[
                        inputs.centered,
                        focusedInput === 'rideName' && inputs.centered,
                    ]}
                    value={rideName}
                    onChangeText={setRideName}
                    onFocus={() => setFocusedInput('rideName')}
                    onBlur={() => setFocusedInput(null)}
                    placeholder="Epic Bukidnon Adventure"
                    placeholderTextColor="#94a3b8"
                />
            </View>

            {/* Date and Ride Type Section */}
        <View style={cards.elevated}>
          <Text style={text.sectionTitle}>When & How</Text>

          {/* Date Picker */}
          <View style={{ marginBottom: 20 }}>
            <Text style={text.labelLight}>Select Date & Time</Text>
            <View style={layout.rowBetween}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => setDatePickerOpen(true)}
                activeOpacity={0.7}
              >
                {date && (
                  <View style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, alignItems: 'center' }}>
                    <Text style={{ color: '#1e293b', fontSize: 16, fontWeight: '500' }}>
                      {date.toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                    <Text style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
                      {date.toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            {dateError ? <Text style={inputs.errorText}>{dateError}</Text> : null}
          </View>

          {/* Ride Type Selection */}
          <View>
            <Text style={text.labelLight}>Choose Ride Type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 8 }}
            >
              {[
                { type: 'car',        icon: 'car',        label: 'Car' },
                { type: 'motor',      icon: 'motorcycle', label: 'Motorcycle' },
                { type: 'run',        icon: 'shoe-prints', label: 'Run' },
                { type: 'bike',       icon: 'bicycle',    label: 'Bike' },
                { type: 'cafe Racers',icon: 'rocket',     label: 'Cafe Racers' },
              ].map(({ type, icon, label }) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    rideCreation.rideTypeOption,
                    riderType === type && rideCreation.rideTypeSelected,
                  ]}
                  onPress={() => setRiderType(type)}
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
                  }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>


            {/* Description Section */}
        <View style={cards.elevated}>
          <Text style={text.sectionTitle}>Describe Your Route</Text>
          <Text style={text.labelLight}>Share details about terrain, highlights, or special stops</Text>
          <TextInput
            style={[
              inputs.multiline,
              focusedInput === 'description' && inputs.lightFocused,
              { textAlignVertical: 'top' }
            ]}
            value={description}
            onChangeText={setDescription}
            onFocus={() => setFocusedInput('description')}
            onBlur={() => setFocusedInput(null)}
            placeholder="Tell us about the terrain, highlights, or any special stops along the way..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={6}
          />
        </View>
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
