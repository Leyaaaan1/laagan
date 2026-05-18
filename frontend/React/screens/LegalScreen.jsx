import React, {} from 'react';
import {View, Text, ScrollView, TouchableOpacity} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import layout from '../styles/base/layout';
import colors from '../styles/tokens/colors';
import spacing from '../styles/tokens/spacing';
import {fontSize} from '../styles/tokens/typography';

const PRIVACY_POLICY = `Privacy Policy for laagan

Last updated: May 17, 2026

This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.

We use Your Personal Data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy.

Interpretation and Definitions

Account means a unique account created for You to access our Service or parts of our Service.

Company refers to laagan.

Country refers to: Philippines

Device means any device that can access the Service such as a computer, a cell phone or a digital tablet.

Personal Data is any information that relates to an identified or identifiable individual.

Service refers to the Application.

Collections of Your Personal Data

Types of Data Collected

Personal Data
While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to:

• Email address
• Usage Data

Usage Data is collected automatically when using the Service. Usage Data may include information such as Your Device's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that You visit, the time and date of Your visit, the time spent on those pages, unique device identifiers and other diagnostic data.

When You access the Service by or through a mobile device, We may collect certain information automatically, including, but not limited to, the type of mobile device You use, Your mobile device's unique ID, the IP address of Your mobile device, Your mobile operating system.

Information Collected while Using the Application

While using Our Application, in order to provide features of Our Application, We may collect, with Your prior permission:

• Information regarding your location

We use this information to provide features of Our Service, to improve and customize Our Service. You can enable or disable access to this information at any time, through Your Device settings.

Use of Your Personal Data

The Company may use Personal Data for the following purposes:

• To provide and maintain our Service
• To manage Your Account
• To contact You regarding updates or informative communications
• To provide You with news, special offers, and general information
• To manage Your requests

Retention of Your Personal Data

The Company will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use Your Personal Data to the extent necessary to comply with our legal obligations.

Account Information: retained for the duration of your account relationship plus up to 24 months after account closure.

Usage Data: up to 24 months to understand feature adoption and service improvements.

Server logs: up to 24 months for security monitoring.

Delete Your Personal Data

You have the right to delete or request that We assist in deleting the Personal Data that We have collected about You.

You may update, amend, or delete Your information at any time by signing in to Your Account and visiting the account settings section.

Security of Your Personal Data

The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet is 100% secure. While We strive to use commercially reasonable means to protect Your Personal Data, We cannot guarantee its absolute security.

Children's Privacy

Our Service does not address anyone under the age of 16. We do not knowingly collect personally identifiable information from anyone under the age of 16.

Changes to this Privacy Policy

We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy in the app.

Contact Us

If you have any questions about this Privacy Policy, You can contact us at:
paninsorolean@gmail.com`;

export default function LegalScreen({navigation}) {
  return (
    <View style={layout.screen}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="chevron-left" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            color: colors.white,
            fontSize: 18,
            fontWeight: '600',
          }}>
          Privacy Policy
        </Text>
        <View style={{width: 20}} />
      </View>

      {/* Content */}
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
        }}>
        <Text
          style={{
            color: colors.white,
            fontSize: fontSize.body,
            lineHeight: 24,
          }}>
          {PRIVACY_POLICY}
        </Text>
      </ScrollView>
    </View>
  );
}
