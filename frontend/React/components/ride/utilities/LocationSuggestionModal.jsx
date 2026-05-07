import React from 'react';
import {Modal, View, Text, TouchableOpacity, StatusBar} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import buttons from '../../../styles/base/buttons';
import modal from '../../../styles/components/modal';
import spacing from '../../../styles/tokens/spacing';
import text from '../../../styles/base/text';
import colors from '../../../styles/tokens/colors';

const LocationSuggestionModal = ({
  visible,
  locationName,
  onUseAsEnd,
  onDismiss,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onDismiss}>
    <StatusBar
      translucent
      backgroundColor="transparent"
      barStyle="dark-content"
    />
    <View style={modal.overlay}>
      <View
        style={{
          backgroundColor: colors.surfaceDark,
          borderRadius: 20,
          padding: spacing.lg,
          width: '75%',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.border,
        }}>
        {/* Icon */}
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: colors.primaryAlpha10,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing.md,
          }}>
          <FontAwesome name="map-marker" size={28} color={colors.primary} />
        </View>

        {/* Label */}
        <Text
          style={[
            text.label,
            {marginBottom: spacing.sm, color: colors.textMuted},
          ]}>
          USE THIS LOCATION?
        </Text>

        {/* Location Name */}
        <Text
          style={[
            text.body,
            {
              color: colors.textPrimary,
              fontWeight: '700',
              marginBottom: spacing.md,
              textAlign: 'center',
            },
          ]}
          numberOfLines={3}>
          {locationName}
        </Text>

        {/* Description */}
        <Text
          style={[
            text.caption,
            {
              color: colors.textMuted,
              marginBottom: spacing.lg,
              textAlign: 'center',
            },
          ]}>
          Set as ending destination?
        </Text>

        {/* Action Buttons */}
        <View
          style={{
            flexDirection: 'row',
            gap: spacing.md,
            width: '100%',
          }}>
          <TouchableOpacity
            style={[buttons.outline, {flex: 1}]}
            onPress={onDismiss}
            activeOpacity={0.8}>
            <Text style={buttons.textDark}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[buttons.primary, {flex: 1}]}
            onPress={onUseAsEnd}
            activeOpacity={0.85}>
            <Text style={buttons.textPrimary}>Use This</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

export default LocationSuggestionModal;
