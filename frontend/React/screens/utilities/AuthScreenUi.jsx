import React, {useRef, useState, useEffect} from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import inputs from '../../styles/base/inputs';
import buttons from '../../styles/base/buttons';
import text from '../../styles/base/text';
import layout from '../../styles/base/layout';
import authStyle from '../../styles/screens/authStyles';
import colors from '../../styles/tokens/colors';
import spacing from '../../styles/tokens/spacing';
import {
  CONFIRM_RULES,
  EMAIL_RULES,
  PASSWORD_RULES,
  evaluateRules,
} from '../../utilities/validator/Authvalidation';
import {createMemoCompare} from '../../utilities/propsComparison';

// ─────────────────────────────────────────────────────────────────────────────
// ValidationChecklist Component
// ─────────────────────────────────────────────────────────────────────────────
export const ValidationChecklist = React.memo(
  ({rules, value, touched, isLogin}) => {
    if (isLogin || !touched || value.length === 0) return null;

    const {rules: evaluated} = evaluateRules(rules, value);

    return (
      <View style={authStyle.container}>
        {evaluated.map(rule => {
          const isPending = value.length === 0;
          const dotStyle = isPending
            ? authStyle.dotPending
            : rule.passed
            ? authStyle.dotPassed
            : authStyle.dotFailed;
          const labelStyle = isPending
            ? authStyle.ruleTextPending
            : rule.passed
            ? authStyle.ruleTextPassed
            : authStyle.ruleTextFailed;

          return (
            <View key={rule.key} style={authStyle.ruleRow}>
              <View style={[authStyle.dot, dotStyle]} />
              <Text style={[authStyle.ruleText, labelStyle]}>{rule.label}</Text>
            </View>
          );
        })}
      </View>
    );
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Input Border Style Utility
// ─────────────────────────────────────────────────────────────────────────────
export const getInputBorderStyle = (rules, value, touched, isLogin) => {
  if (isLogin || !touched || value.length === 0) return null;
  const {allPassed} = evaluateRules(rules, value);
  return allPassed ? authStyle.inputSuccess : authStyle.inputError;
};

// ─────────────────────────────────────────────────────────────────────────────
// AuthForm Component
// ─────────────────────────────────────────────────────────────────────────────
export const AuthForm = React.memo(
  ({
    isLogin,
    email,
    password,
    confirmPassword,
    setEmail,
    setPassword,
    setConfirmPassword,
    handleAuth,
    toggleMode,
    touched,
    setTouched,
    loading,
    handleFacebookLogin,
    handleGoogleLogin,
  }) => (
    <KeyboardAvoidingView
      style={layout.center}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text
        style={[
          text.titleCenter,
          {marginBottom: spacing.lg, letterSpacing: 1},
        ]}>
        {isLogin ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
      </Text>

      <Text
        style={[
          text.bodyMuted,
          {textAlign: 'center', marginBottom: spacing.lg},
        ]}>
        {isLogin
          ? 'Sign in to continue laags'
          : 'Join the community and start riding'}
      </Text>

      {/* ── Email ── */}
      <View style={authStyle.fieldBlock}>
        <TextInput
          placeholder="Email"
          placeholderTextColor="#64748b"
          value={email}
          onChangeText={setEmail}
          onFocus={() => setTouched(prev => ({...prev, email: true}))}
          style={[
            inputs.auth,
            getInputBorderStyle(EMAIL_RULES, email, touched.email, isLogin),
          ]}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={254}
          editable={!loading}
        />
        <ValidationChecklist
          rules={EMAIL_RULES}
          value={email}
          touched={touched.email}
          isLogin={isLogin}
        />
      </View>

      {/* ── Password ── */}
      <View style={authStyle.fieldBlock}>
        <TextInput
          placeholder="Password"
          placeholderTextColor="#64748b"
          value={password}
          onChangeText={setPassword}
          onFocus={() => setTouched(prev => ({...prev, password: true}))}
          style={[
            inputs.auth,
            getInputBorderStyle(
              PASSWORD_RULES,
              password,
              touched.password,
              isLogin,
            ),
          ]}
          secureTextEntry
          autoCorrect={false}
          maxLength={128}
          editable={!loading}
        />
        <ValidationChecklist
          rules={PASSWORD_RULES}
          value={password}
          touched={touched.password}
          isLogin={isLogin}
        />
      </View>

      {/* ── Confirm Password (register only) ── */}
      {!isLogin && (
        <View style={authStyle.fieldBlock}>
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#64748b"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onFocus={() =>
              setTouched(prev => ({...prev, confirmPassword: true}))
            }
            style={[
              inputs.auth,
              getInputBorderStyle(
                CONFIRM_RULES(password),
                confirmPassword,
                touched.confirmPassword,
              ),
            ]}
            secureTextEntry
            autoCorrect={false}
            maxLength={128}
            editable={!loading}
          />
          <ValidationChecklist
            rules={CONFIRM_RULES(password)}
            value={confirmPassword}
            touched={touched.confirmPassword}
          />
        </View>
      )}

      {/* ── Submit ── */}
      <TouchableOpacity
        style={[
          buttons.pill,
          {width: 280, marginBottom: spacing.sm, opacity: loading ? 0.7 : 1},
        ]}
        onPress={handleAuth}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={[text.white, {fontSize: 16}]}>
            {isLogin ? 'Login' : 'Register'}
          </Text>
        )}
      </TouchableOpacity>

      {isLogin && (
        <TouchableOpacity
          style={[
            buttons.pill,
            {width: 280, marginBottom: spacing.sm, backgroundColor: '#1877F2'},
          ]}
          onPress={handleFacebookLogin}
          disabled={loading}>
          <Text style={[text.white, {fontSize: 16}]}>
            Continue with Facebook
          </Text>
        </TouchableOpacity>
      )}

      {isLogin && (
        <TouchableOpacity
          style={[
            buttons.pill,
            {width: 280, marginBottom: spacing.sm, backgroundColor: '#4285F4'},
          ]}
          onPress={handleGoogleLogin}
          disabled={loading}>
          <Text style={[text.white, {fontSize: 16}]}>Continue with Google</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[buttons.ghost, {marginTop: spacing.xs}]}
        onPress={toggleMode}
        disabled={loading}>
        <Text style={text.muted}>
          {isLogin
            ? "Don't have an account? Register"
            : 'Already have an account? Login'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  ),
  createMemoCompare([
    'setEmail',
    'setPassword',
    'setConfirmPassword',
    'setTouched',
    'handleAuth',
    'toggleMode',
    'handleFacebookLogin',
    'handleGoogleLogin',
  ]),
);

// ─────────────────────────────────────────────────────────────────────────────
// VerifyingState Component
// ─────────────────────────────────────────────────────────────────────────────
const VerifyingState = () => (
  <View
    style={[layout.screen, {alignItems: 'center', justifyContent: 'center'}]}>
    <StatusBar barStyle="light-content" backgroundColor={colors.black} />
    <ActivityIndicator
      color={colors.white}
      size="large"
      style={{marginBottom: spacing.lg}}
    />
    <Text style={[text.titleCenter, {marginBottom: spacing.sm}]}>
      Verifying
    </Text>
    <Text style={[text.bodyMuted, {textAlign: 'center'}]}>
      Confirming your email address{'\n'}and creating your account…
    </Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// ErrorState Component
// ─────────────────────────────────────────────────────────────────────────────
const ErrorState = ({errorMessage, onRetry, onBack}) => (
  <View
    style={[
      layout.screen,
      {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
      },
    ]}>
    <StatusBar barStyle="light-content" backgroundColor={colors.black} />
    <Text style={{fontSize: 48, marginBottom: spacing.lg, textAlign: 'center'}}>
      ✕
    </Text>
    <Text style={[text.titleCenter, {marginBottom: spacing.sm}]}>
      Verification Failed
    </Text>
    <Text
      style={[text.bodyMuted, {textAlign: 'center', marginBottom: spacing.lg}]}>
      {errorMessage}
    </Text>
    <TouchableOpacity
      style={[buttons.pill, {width: 280, marginBottom: spacing.sm}]}
      onPress={onRetry}>
      <Text style={[text.white, {fontSize: 16}]}>Try Again</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[buttons.ghost, {marginTop: spacing.xs}]}
      onPress={onBack}>
      <Text style={text.muted}>Back to Login</Text>
    </TouchableOpacity>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// WaitingState Component
// ─────────────────────────────────────────────────────────────────────────────
const WaitingState = ({
  pendingEmail,
  onBack,
  onManualRetry,
  pulseAnim,
  dotCount,
}) => {
  const dots = '.'.repeat(dotCount);

  return (
    <View
      style={[
        layout.screen,
        {alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32},
      ]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.black} />

      <Animated.Text
        style={{
          fontSize: 64,
          marginBottom: spacing.lg,
          opacity: pulseAnim,
          textAlign: 'center',
        }}>
        ✉️
      </Animated.Text>

      <Text
        style={[
          text.titleCenter,
          {marginBottom: spacing.sm, letterSpacing: 1},
        ]}>
        CHECK YOUR EMAIL
      </Text>

      <Text
        style={[
          text.bodyMuted,
          {textAlign: 'center', marginBottom: spacing.lg, letterSpacing: 0.5},
        ]}>
        Waiting for verification{dots}
      </Text>

      <Text
        style={[
          text.bodyMuted,
          {
            textAlign: 'center',
            marginBottom: spacing.lg,
            paddingHorizontal: 8,
            lineHeight: 22,
          },
        ]}>
        We sent a link to{'\n'}
        <Text style={{color: colors.white, fontWeight: '600'}}>
          {pendingEmail}
        </Text>
        {'\n\n'}
        Open your email app and tap the link to complete registration. This
        screen will update automatically once verified.
      </Text>

      <View
        style={{
          borderWidth: 1,
          borderColor: '#334155',
          borderRadius: 10,
          padding: spacing.md,
          marginBottom: spacing.lg,
          width: '100%',
        }}>
        <Text
          style={[
            text.bodyMuted,
            {textAlign: 'center', fontSize: 13, lineHeight: 20},
          ]}>
          💡 Check your spam folder if you don't see it within a minute.
          {'\n'}The link expires in 24 hours.
        </Text>
      </View>

      <TouchableOpacity
        style={[
          buttons.pill,
          {width: 280, marginBottom: spacing.sm, backgroundColor: '#1e293b'},
        ]}
        onPress={onManualRetry}>
        <Text style={[text.white, {fontSize: 14}]}>
          I already clicked the link
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[buttons.ghost, {marginTop: spacing.xs}]}
        onPress={onBack}>
        <Text style={text.muted}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};
