import React, {useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import inputs from '../styles/base/inputs';
import {getRideTypeIcon} from '../utilities/rideTypes';
import spacing from '../styles/tokens/spacing';
import badges from '../styles/base/badges';
import colors from '../styles/tokens/colors';
import text from '../styles/base/text';
import layout from '../styles/base/layout';


// ─── All known bike models grouped by manufacturer ────────────────────────────
export const ALL_RIDE_TYPES = {
  Honda: [
    'ADV 160',
    'Beat',
    'CB150R',
    'CB400',
    'CB500F',
    'CBR150R',
    'CBR300R',
    'CBR600RR',
    'Click 125i',
    'Click 160',
    'CRF150L',
    'CRF300L',
    'Forza 350',
    'PCX 160',
    'RS150R',
    'Sonic 150R',
    'Tmx 125 Alpha',
    'Tmx Supremo',
    'Wave 110',
    'XR150L',
  ],
  Yamaha: [
    'Aerox 155',
    'FZ 150i',
    'FZ-S V3',
    'Mio Gravis',
    'Mio i 125',
    'Mio M3',
    'Mio Soul i 125',
    'MT-03',
    'MT-15',
    'NMAX 155',
    'R3',
    'R15 V4',
    'Sniper 150 MXi',
    'Sniper 155R',
    'Vixion R',
    'XSR 155',
    'Y16ZR',
  ],
  Suzuki: [
    'Address 115',
    'Burgman Street 125',
    'GSX-R150',
    'GSX-S150',
    'Raider J 115 Fi',
    'Raider R150 Fi',
    'Skydrive Sport 125',
    'Smash 115',
    'V-Strom 650',
  ],
  Kawasaki: [
    'Barako 175',
    'CT125',
    'KLX 150',
    'KLX 230',
    'Ninja 400',
    'Ninja 650',
    'Ninja ZX-6R',
    'Rouser NS160',
    'Rouser NS200',
    'W175',
    'Z400',
    'Z650',
  ],
};

/** * Dropdown ride-type selector - reusable across RideStep1 and RiderProfile * Shows a trigger button; when open, renders a scrollable grouped list */
export const RideTypeSelector = ({
  selectedType,
  onSelectType,
  label = 'Select your bike model',
  maxHeight = 260,
}) => {
  const [open, setOpen] = useState(false);

  const handleSelect = model => {
    onSelectType(model);
    setOpen(false);
  };

  return (
    <View>
      {/* ── Trigger ── */}
      <TouchableOpacity
        style={[
          inputs.searchRow,
          {justifyContent: 'space-between'},
          open && inputs.searchRowFocused,
        ]}
        onPress={() => setOpen(prev => !prev)}
        activeOpacity={0.8}>
        <View style={layout.row}>
          <FontAwesome
            name={selectedType ? getRideTypeIcon(selectedType) : 'motorcycle'}
            size={16}
            color={selectedType ? colors.primary : '#94a3b8'}
            style={{marginRight: spacing.sm}}
          />
          <Text
            style={
              selectedType ? text.bodyMd : [text.labelLight, {marginBottom: 0}]
            }>
            {selectedType || label}
          </Text>
        </View>
        <FontAwesome
          name={open ? 'chevron-up' : 'chevron-down'}
          size={12}
          color="#94a3b8"
        />
      </TouchableOpacity>

      {/* ── Dropdown panel ── */}
      {open && (
        <View style={[inputs.resultsList, {maxHeight, marginTop: spacing.xs}]}>
          <ScrollView
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled">
            {Object.entries(ALL_RIDE_TYPES).map(([brand, models]) => (
              <View key={brand}>
                {/* Brand header */}
                <View
                  style={[
                    layout.rowBetween,
                    {
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      backgroundColor: '#f8fafc',
                    },
                  ]}>
                  <Text style={text.label}>{brand}</Text>
                  <View style={badges.countBadge}>
                    <Text style={badges.countBadgeText}>{models.length}</Text>
                  </View>
                </View>

                {/* Models */}
                {models.map((model, idx) => {
                  const isSelected = selectedType === model;
                  const isLast = idx === models.length - 1;
                  return (
                    <TouchableOpacity
                      key={model}
                      style={[
                        inputs.resultItem,
                        isLast && inputs.resultItemLast,
                        isSelected && {backgroundColor: colors.primaryAlpha10},
                      ]}
                      onPress={() => handleSelect(model)}
                      activeOpacity={0.7}>
                      <FontAwesome
                        name={getRideTypeIcon(model)}
                        size={14}
                        color={isSelected ? colors.primary : '#94a3b8'}
                        style={{marginRight: spacing.md, width: 16}}
                      />
                      <Text
                        style={[
                          inputs.resultName,
                          {marginBottom: 0, flex: 1},
                          isSelected && {color: colors.primary},
                        ]}>
                        {model}
                      </Text>
                      {isSelected && (
                        <FontAwesome
                          name="check"
                          size={13}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default RideTypeSelector;
