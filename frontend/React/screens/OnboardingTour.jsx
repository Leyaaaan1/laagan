/**
 * OnboardingTour.jsx
 * Full-screen guided onboarding for new users.
 * Shows real app screens (static/non-interactive) with
 * a highlight box + tooltip overlay on each step.
 *
 * Usage in MainNavigator.jsx:
 *   <Stack.Screen name="OnboardingTour" component={OnboardingTour} />
 *
 * Triggered from AuthScreen.jsx after first successful login/register.
 */

import React, {useRef, useCallback, useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Dimensions,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import colors from '../styles/tokens/colors';
import spacing from '../styles/tokens/spacing';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const {width: W, height: H} = Dimensions.get('window');

// ─── Static mock data ───────────────────────────────────────────────────────
const MOCK_PARTICIPANTS = [
  {id: '1', name: 'lean_paninsoro',     status: 'Glabaca · 2273m away', active: true},
  {id: '2', name: 'alayon_alyanna26',   status: 'Waiting for location...', active: true},
  {id: '3', name: 'leandropaninsoro',   status: 'Glabaca · 2274m away', active: true},
];

// ─── Step definitions ───────────────────────────────────────────────────────
// screen: which mock screen to show (0-5)
// tipTitle / tipDesc: tooltip content
// tipPos: 'above' | 'below' — where the tooltip appears relative to highlight
// highlightKey: string key that matches a ref registered in each screen
const STEPS = [
  // ── Screen 0: Home — Create Ride entry point ────────────────────────────
  {screen: 0, highlightKey: 'plusBtn',
    tipTitle: 'Create a Ride',
    tipDesc: 'Tap the + button to start creating a new group ride for you and your friends.',
    tipPos: 'below'},

  // ── Screen 1: Create Ride Details ──────────────────────────────────────
  {screen: 1, highlightKey: 'name',
    tipTitle: 'Name your ride',
    tipDesc: 'Give your adventure a memorable name that all participants will see.',
    tipPos: 'below'},
  {screen: 1, highlightKey: 'when',
    tipTitle: 'Set date & bike type',
    tipDesc: 'Choose when the ride happens and select your bike type.',
    tipPos: 'below'},
  {screen: 1, highlightKey: 'desc',
    tipTitle: 'Describe your route',
    tipDesc: 'Add terrain notes, highlights, or special stops for your riders.',
    tipPos: 'above'},
  {screen: 1, highlightKey: 'cta',
    tipTitle: 'Continue to location',
    tipDesc: 'Tap here to open the map and pin your ride location.',
    tipPos: 'above'},

  // ── Screen 2: Set Location (map) ────────────────────────────────────────
  {screen: 2, highlightKey: 'search',
    tipTitle: 'Search your location',
    tipDesc: 'Type a place name or tap the map to drop a location pin.',
    tipPos: 'below'},
  {screen: 2, highlightKey: 'hint',
    tipTitle: 'Tap the map',
    tipDesc: 'Tap anywhere on the map to set your meeting point.',
    tipPos: 'above'},

  // ── Screen 3: Start / End point picker ──────────────────────────────────
  {screen: 3, highlightKey: 'startRow',
    tipTitle: 'Set your start point',
    tipDesc: 'Tap SET to drop a pin for where the ride begins.',
    tipPos: 'above'},
  {screen: 3, highlightKey: 'endRow',
    tipTitle: 'Set your end point',
    tipDesc: 'Then set the destination where your group finishes the ride.',
    tipPos: 'above'},

  // ── Screen 4: Active ride / Participant tracking ─────────────────────────
  {screen: 4, highlightKey: 'participants',
    tipTitle: 'Live participant tracking',
    tipDesc: 'See each rider\'s real-time location. Green = active, gray = waiting.',
    tipPos: 'below'},
  {screen: 4, highlightKey: 'pill',
    tipTitle: 'Details & Leave',
    tipDesc: '"Details" opens ride info. Tap "Leave" to exit the ride at any time.',
    tipPos: 'above'},

  // ── Screen 5: Checkpoint Arrivals modal ─────────────────────────────────
  {screen: 5, highlightKey: 'modal',
    tipTitle: 'Checkpoint Arrivals',
    tipDesc: 'Tap the checkpoints button to see which riders arrived at each stop.',
    tipPos: 'above'},
  {screen: 5, highlightKey: 'arrival',
    tipTitle: 'Arrival record',
    tipDesc: 'Each entry shows the rider\'s name and exact arrival timestamp.',
    tipPos: 'above'},
];

// Total steps per screen (used for dot indicators)
const SCREEN_STEP_COUNTS = [1, 4, 2, 2, 2, 2];

// ─── Highlight + Tooltip overlay ────────────────────────────────────────────
const StepOverlay = ({
  targetLayout,
  tipTitle,
  tipDesc,
  tipPos,
  stepLabel,
  onNext,
}) => {
  if (!targetLayout) return null;

  const {x, y, width, height} = targetLayout;
  const PAD = 8;

  const hlTop = y - PAD;
  const hlLeft = x - PAD;
  const hlW = width + PAD * 2;
  const hlH = height + PAD * 2;

  const TIP_W = 220;
  let tipLeft = hlLeft + (hlW - TIP_W) / 2;
  if (tipLeft < 8) tipLeft = 8;
  if (tipLeft + TIP_W > W - 8) tipLeft = W - 8 - TIP_W;

  const TIP_H_APPROX = 110;
  let tipTop =
    tipPos === 'below' ? hlTop + hlH + 10 : hlTop - TIP_H_APPROX - 10;
  if (tipTop < 40) tipTop = hlTop + hlH + 10;
  if (tipTop + TIP_H_APPROX > H - 80) tipTop = hlTop - TIP_H_APPROX - 10;

  return (
    <>
      {/* Tap anywhere to advance */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={onNext}
        style={StyleSheet.absoluteFill}
      />
      {/* Dim everything */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {/* Top */}
        <View
          style={[styles.dimBlock, {top: 0, left: 0, right: 0, height: hlTop}]}
        />
        {/* Bottom */}
        <View
          style={[
            styles.dimBlock,
            {top: hlTop + hlH, left: 0, right: 0, bottom: 0},
          ]}
        />
        {/* Left */}
        <View
          style={[
            styles.dimBlock,
            {top: hlTop, left: 0, width: hlLeft, height: hlH},
          ]}
        />
        {/* Right */}
        <View
          style={[
            styles.dimBlock,
            {top: hlTop, left: hlLeft + hlW, right: 0, height: hlH},
          ]}
        />
        {/* Highlight border */}
        <View
          style={[
            styles.hlBorder,
            {top: hlTop, left: hlLeft, width: hlW, height: hlH},
          ]}
        />
      </View>

      {/* Tooltip */}
      <View
        pointerEvents="none"
        style={[styles.tooltip, {top: tipTop, left: tipLeft, width: TIP_W}]}>
        <Text style={styles.tipStep}>{stepLabel}</Text>
        <Text style={styles.tipTitle}>{tipTitle}</Text>
        <Text style={styles.tipDesc}>{tipDesc}</Text>
      </View>
    </>
  );
};

// ─── Mock screens ────────────────────────────────────────────────────────────


/** Screen 0 — Home (RiderPage) — highlights the + button */
const MockHomePage = ({refs, insets}) => (
  <View style={mock.screen}>
    {/* ── Header ── */}
    <View style={[mock.homeHeader, {paddingTop: insets.top + 12}]}>
      {/* Avatar + username */}
      <View style={mock.homeUserRow}>
        <View style={mock.homeAvatar}>
          <FontAwesome name="motorcycle" size={16} color="#fff" />
        </View>
        <View style={{marginLeft: 10}}>
          <Text style={mock.homeUsername}>Lean Paninsoro</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
            <FontAwesome name="motorcycle" size={10} color="#888" />
            <Text style={mock.homeUserSub}>No type</Text>
          </View>
        </View>
      </View>
      {/* Right action buttons */}
      <View style={mock.homeActions}>
        <View style={mock.homeRideIdBtn}>
          <Text style={mock.homeRideIdTxt}>Ride ID</Text>
          <FontAwesome
            name="search"
            size={12}
            color="#fff"
            style={{marginLeft: 4}}
          />
        </View>
        <View style={mock.homeQrBtn}>
          <FontAwesome name="qrcode" size={16} color="#fff" />
        </View>
        {/* ← THIS IS THE HIGHLIGHTED + BUTTON */}
        <View ref={refs.plusBtn} style={mock.homePlusBtn}>
          <FontAwesome name="plus" size={16} color="#fff" />
        </View>
      </View>
    </View>

    {/* ── Active Ride section ── */}
    <View style={mock.homeSection}>
      <Text style={mock.homeSectionTitle}>Active Ride</Text>
      <Text style={mock.homeNoRide}>No active ride</Text>
    </View>

    {/* ── Ride Card ── */}
    <View style={mock.homeCard}>
      {/* Card header */}
      <View
        style={{
          padding: 14,
          borderBottomWidth: 1,
          borderBottomColor: '#2a2a2a',
        }}>
        <Text style={mock.homeCardTitle}>DAHILAYAN ADVENTURE PARK</Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 4,
          }}>
          <Text style={{fontSize: 11, color: '#888'}}>ID: #5F74527788F3</Text>
          <View style={mock.inactiveBadge}>
            <Text style={mock.inactiveTxt}>INACTIVE</Text>
          </View>
        </View>
      </View>

      {/* Meta row */}
      <View style={{padding: 14, paddingBottom: 8}}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}>
          <Text style={{fontSize: 15, fontWeight: '800', color: '#fff'}}>
            Bukidnon Rides
          </Text>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
            <FontAwesome name="motorcycle" size={13} color={colors.primary} />
            <Text style={{fontSize: 13, fontWeight: '700', color: '#fff'}}>
              144 km
            </Text>
          </View>
        </View>

        {/* Route row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginBottom: 6,
          }}>
          <FontAwesome name="map-marker" size={12} color={colors.primary} />
          <Text
            style={{fontSize: 12, fontWeight: '700', color: colors.primary}}>
            Toril District
          </Text>
          <FontAwesome name="arrow-right" size={10} color="#666" />
          <Text style={{fontSize: 12, color: '#ccc'}} numberOfLines={1}>
            Dahilayan Adventure Pa...
          </Text>
        </View>

        {/* Date row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginBottom: 6,
          }}>
          <FontAwesome name="calendar" size={12} color="#888" />
          <Text style={{fontSize: 12, color: '#888'}}>
            July 02, 2026, 11:10 AM
          </Text>
        </View>

        {/* Creator row */}
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
          <FontAwesome name="user-circle" size={12} color="#888" />
          <Text style={{fontSize: 11, color: '#666'}}>
            Created by lean_paninsoro
          </Text>
        </View>
      </View>

      {/* Map thumbnail placeholder */}
      <View style={mock.homeMapThumb}>
        <View
          style={{
            flex: 1,
            backgroundColor: '#d5e8c8',
            borderRadius: 10,
            margin: 2,
            overflow: 'hidden',
          }}>
          <Text
            style={{
              position: 'absolute',
              top: 8,
              left: 30,
              fontSize: 9,
              color: '#555',
            }}>
            Mountain Pines Place
          </Text>
          <Text
            style={{
              position: 'absolute',
              top: 38,
              left: 55,
              fontSize: 9,
              color: '#555',
            }}>
            Dahilayan
          </Text>
          <Text
            style={{
              position: 'absolute',
              top: 48,
              left: 55,
              fontSize: 9,
              color: '#555',
            }}>
            Adventure Park
          </Text>
          <View
            style={{
              position: 'absolute',
              top: 34,
              left: 70,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: colors.primary,
              borderWidth: 1.5,
              borderColor: '#fff',
            }}
          />
        </View>
      </View>

      {/* Description */}
      <View
        style={{
          padding: 14,
          backgroundColor: '#1a1a1a',
          borderBottomLeftRadius: 14,
          borderBottomRightRadius: 14,
        }}>
        <Text style={{fontSize: 13, color: '#ccc', lineHeight: 19}}>
          Bukidnon is home to multiple famous destinations, but the most popular
          is Dahilayan Adventure Park in Manolo Fortich
        </Text>
      </View>
    </View>
  </View>
);

/** Screen 1 — Create Ride Details */
const MockCreateRide = ({refs}) => (
  <View style={mock.screen}>
    {/* header */}
    <View style={mock.topbar}>
      <View>
        <Text style={mock.topbarTitle}>CREATE RIDE</Text>
        <Text style={mock.topbarSub}>Step 1 of 3 — Details</Text>
      </View>
      <View style={[mock.redBtn, {opacity: 0.4}]}>
        <Text style={mock.redBtnTxt}>Next</Text>
        <FontAwesome name="arrow-right" size={12} color="#fff" />
      </View>
    </View>

    <ScrollView scrollEnabled={false} contentContainerStyle={{padding: spacing.md, paddingBottom: 70}}>
      {/* Name card */}
      <View ref={refs.name} style={mock.card}>
        <Text style={mock.cardTitle}>Name Your Ride</Text>
        <Text style={mock.cardSub}>Give your adventure a memorable name</Text>
        <View style={mock.inputLight}><Text style={{color:'#aaa',fontSize:14}}>Epic Bukidnon Adventure</Text></View>
      </View>

      {/* When card */}
      <View ref={refs.when} style={mock.card}>
        <Text style={mock.cardTitle}>When &amp; How</Text>
        <Text style={mock.cardSub}>Select Date &amp; Time</Text>
        <View style={mock.dateBox}>
          <Text style={{fontSize:14,fontWeight:'700',color:'#111'}}>Thursday, June 4, 2026</Text>
          <Text style={{fontSize:11,color:'#555',marginTop:2}}>10:57 PM</Text>
        </View>
        <Text style={[mock.cardSub,{marginTop:10}]}>Choose Your Bike</Text>
        <View style={mock.selectBox}>
          <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
            <FontAwesome name="motorcycle" size={15} color={colors.primary} />
            <Text style={{fontSize:13,color:'#333',fontWeight:'500'}}>ADV 160</Text>
          </View>
          <FontAwesome name="chevron-down" size={12} color="#888" />
        </View>
      </View>

      {/* Description card */}
      <View ref={refs.desc} style={mock.card}>
        <Text style={mock.cardTitle}>Describe Your Route</Text>
        <Text style={mock.cardSub}>Share details about terrain, highlights, or special stops</Text>
        <View style={[mock.inputLight, {height: 70}]}>
          <Text style={{color:'#aaa',fontSize:12}}>Tell us about the terrain, highlights, or any special stops...</Text>
        </View>
      </View>

      {/* CTA */}
      <View ref={refs.cta} style={mock.cta}>
        <Text style={{color:'#fff',fontSize:14,fontWeight:'700'}}>Continue to Location</Text>
        <FontAwesome name="arrow-right" size={14} color="#fff" style={{marginLeft:8}} />
      </View>
    </ScrollView>
  </View>
);

/** Screen 1 — Set Location (map) */
const MockSetLocation = ({refs}) => (
  <View style={mock.screen}>
    {/* floating navbar */}
    <View style={mock.floatingNav}>
      <View style={mock.backBtn}>
        <FontAwesome name="arrow-left" size={12} color={colors.primary} />
        <Text style={{fontSize:12,fontWeight:'700',color:colors.primary,marginLeft:4}}>Back</Text>
      </View>
      <Text style={{fontSize:12,fontWeight:'700',color:'#333'}}>SET LOCATION</Text>
      <View style={mock.redBtn}><Text style={mock.redBtnTxt}>Next</Text><FontAwesome name="arrow-right" size={11} color="#fff" /></View>
    </View>

    {/* search bar */}
    <View ref={refs.search} style={mock.searchBar}>
      <FontAwesome name="search" size={14} color="#888" style={{marginRight:8}} />
      <Text style={{fontSize:13,color:'#aaa'}}>Where do you want to ride?</Text>
    </View>

    {/* map placeholder */}
    <View style={mock.mapBox}>
      <View style={mock.mapFill}>
        <Text style={mock.mapLabel}>Lubogan</Text>
        <Text style={[mock.mapLabel,{top:55,left:40}]}>Bato</Text>
        <Text style={[mock.mapLabel,{top:80,left:140}]}>Crossing Bayabas</Text>
        <Text style={[mock.mapLabel,{top:110,left:120}]}>Toril</Text>
        <Text style={[mock.mapLabel,{top:130,left:60}]}>Marapangi</Text>
        <Text style={[mock.mapLabel,{top:150,left:80}]}>Lizada</Text>
        <Text style={[mock.mapLabel,{top:150,left:190}]}>Daliao</Text>
        <Text style={[mock.mapLabel,{top:190,left:30}]}>Sirawan</Text>
        {/* pin */}
        <View style={mock.pin} />
      </View>
    </View>

    {/* hint */}
    <View ref={refs.hint} style={mock.hintPill}>
      <FontAwesome name="map-marker" size={13} color="#fff" style={{marginRight:6}} />
      <Text style={{fontSize:12,color:'#fff',fontWeight:'500'}}>Tap the map or search above to set your location</Text>
    </View>
  </View>
);

/** Screen 2 — Start / End point picker */
const MockPointPicker = ({refs}) => (
  <View style={mock.screen}>
    <View style={[mock.floatingNav,{backgroundColor:'rgba(255,255,255,0.92)'}]}>
      <View style={mock.backBtn}><FontAwesome name="arrow-left" size={12} color={colors.primary} /><Text style={{fontSize:12,fontWeight:'700',color:colors.primary,marginLeft:4}}>Back</Text></View>
      <Text style={{fontSize:12,fontWeight:'700',color:'#333'}}>START POINT</Text>
      <View style={[mock.redBtn,{opacity:.4}]}><Text style={mock.redBtnTxt}>Create</Text><FontAwesome name="check" size={11} color="#fff" /></View>
    </View>
    <View style={mock.searchBar}>
      <FontAwesome name="search" size={14} color="#888" style={{marginRight:8}} />
      <Text style={{fontSize:13,color:'#aaa'}}>Search starting point</Text>
    </View>
    <View style={[mock.mapBox,{height:200}]}>
      <View style={mock.mapFill}>
        <Text style={mock.mapLabel}>Lubogan</Text>
        <Text style={[mock.mapLabel,{top:60,left:120}]}>Crossing Bayabas</Text>
        <Text style={[mock.mapLabel,{top:95,left:120}]}>Toril</Text>
        <Text style={[mock.mapLabel,{top:120,left:50}]}>Marapangi</Text>
        <View style={[mock.pin,{top:130,left:155}]} />
      </View>
    </View>

    {/* point sheet */}
    <View style={mock.pointSheet}>
      <View style={mock.sheetHandle} />
      <View ref={refs.startRow} style={[mock.pointRow, mock.pointRowActive]}>
        <View style={[mock.pointDot,{backgroundColor:'#22c55e'}]} />
        <View style={{flex:1}}>
          <Text style={mock.pointLabel}>START</Text>
          <Text style={mock.pointVal}>Not set</Text>
        </View>
        <Text style={mock.setBtn}>Set</Text>
      </View>
      <View ref={refs.endRow} style={mock.pointRow}>
        <View style={[mock.pointDot,{backgroundColor:colors.primary,borderRadius:3}]} />
        <View style={{flex:1}}>
          <Text style={mock.pointLabel}>END</Text>
          <Text style={mock.pointVal}>Not set</Text>
        </View>
        <Text style={mock.setBtn}>Set</Text>
      </View>
    </View>
  </View>
);

/** Screen 3 — Active ride with live participant panel */
const MockStartedRide = ({refs}) => (
  <View style={mock.screen}>
    {/* live map */}
    <View style={mock.liveMapBox}>
      <View style={mock.mapFill}>
        <Text style={[mock.mapLabel,{top:15,left:40,color:'#777'}]}>CAMP MARY HILL</Text>
        <Text style={[mock.mapLabel,{top:40,left:30,color:'#999'}]}>TABI</Text>
        <Text style={[mock.mapLabel,{top:40,left:130,color:'#999'}]}>PUROK 7</Text>
        <Text style={[mock.mapLabel,{top:100,left:70,color:'#888'}]}>Santo Niño</Text>
        <Text style={[mock.mapLabel,{top:115,left:120,color:'#888'}]}>ARAPANGI</Text>
        {/* route line */}
        <View style={mock.routeLine} />
        {/* user emoji marker */}
        <View style={mock.emojiMarker}><Text style={{fontSize:18}}>🚀</Text></View>
      </View>

      {/* participant panel */}
      <View ref={refs.participants} style={mock.participantPanel}>
        <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:8}}>
          <FontAwesome name="map-marker" size={14} color="#fff" />
          <FontAwesome name="chevron-up" size={12} color="#888" />
        </View>
        {MOCK_PARTICIPANTS.map(p => (
          <View key={p.id} style={mock.pCard}>
            <View style={mock.pAvatar}><Text style={{color:'#fff',fontSize:13,fontWeight:'700'}}>{p.name[0].toUpperCase()}</Text></View>
            <View style={{flex:1,minWidth:0}}>
              <Text style={mock.pName} numberOfLines={1}>{p.name}</Text>
              <Text style={[mock.pStatus, p.status.includes('Waiting') && mock.pStatusWaiting]} numberOfLines={1}>{p.status}</Text>
            </View>
            <View style={mock.pDot} />
          </View>
        ))}
      </View>
    </View>

    {/* leaflet footer */}
    <View style={{backgroundColor:'#1a1a1a',paddingVertical:6,alignItems:'center',borderTopWidth:1,borderTopColor:'#222'}}>
      <Text style={{fontSize:10,color:'#888'}}>Leaflet | © OpenStreetMap contributors</Text>
    </View>

    {/* bottom action pill */}
    <View ref={refs.pill} style={mock.actionPill}>
      <FontAwesome name="info-circle" size={13} color="rgba(255,255,255,0.6)" />
      <Text style={mock.pillLabel}>Details</Text>
      <View style={mock.pillSep} />
      <View style={mock.leaveBtn}>
        <FontAwesome name="sign-out" size={12} color="#fff" />
        <Text style={{fontSize:12,fontWeight:'700',color:'#fff',marginLeft:5}}>Leave</Text>
      </View>
    </View>
  </View>
);

/** Screen 4 — Checkpoint Arrivals modal */
const MockCheckpointModal = ({refs}) => (

  <View style={mock.screen}>
    {/* dimmed map behind */}
    <View style={[mock.liveMapBox, {opacity: 0.4}]}>
      <View style={mock.mapFill}>
        <Text style={[mock.mapLabel, {top: 15, left: 40, color: '#777'}]}>
          CAMP MARY HILL
        </Text>
        <Text style={[mock.mapLabel, {top: 100, left: 70, color: '#888'}]}>
          Santo Niño
        </Text>
        <View style={mock.routeLine} />
        <View style={mock.emojiMarker}>
          <Text style={{fontSize: 16}}>🚀</Text>
        </View>
      </View>
      <View style={[mock.participantPanel, {opacity: 0.7}]}>
        {MOCK_PARTICIPANTS.slice(0, 2).map(p => (
          <View key={p.id} style={mock.pCard}>
            <View style={mock.pAvatar}>
              <Text style={{color: '#fff', fontSize: 12, fontWeight: '700'}}>
                {p.name[0].toUpperCase()}
              </Text>
            </View>
            <View style={{flex: 1}}>
              <Text style={mock.pName} numberOfLines={1}>
                {p.name}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>

    {/* modal */}
    <View ref={refs.modal} style={mock.modal}>
      <View style={mock.modalHeader}>
        <Text style={mock.modalTitle}>Checkpoint Arrivals</Text>
        <View style={mock.modalClose}>
          <FontAwesome name="times" size={13} color="#fff" />
        </View>
      </View>

      {/* warning */}
      <View style={mock.warningRow}>
        <FontAwesome
          name="exclamation-triangle"
          size={14}
          color="#ff6b6b"
          style={{marginRight: 8, marginTop: 1}}
        />
        <Text style={mock.warningTxt}>
          You haven't reached the finish line yet.
        </Text>
      </View>

      {/* force end */}
      <View style={mock.forceRow}>
        <View style={mock.forceDot} />
        <Text style={mock.forceTxt}>Force End Ride</Text>
      </View>

      {/* arrival */}
      <View
        ref={refs.arrival}
        style={{paddingHorizontal: 16, paddingBottom: 12}}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 8,
            marginBottom: 8,
          }}>
          <FontAwesome
            name="map-marker"
            size={15}
            color={colors.primary}
            style={{marginTop: 2}}
          />
          <View>
            <Text style={{fontSize: 15, fontWeight: '700', color: '#fff'}}>
              Coronon
            </Text>
            <Text style={{fontSize: 11, color: '#888', marginTop: 1}}>
              1 rider
            </Text>
          </View>
        </View>
        <View style={mock.arrivalCard}>
          <View style={mock.arrivalAvatar}>
            <Text style={{color: '#fff', fontSize: 15, fontWeight: '700'}}>
              L
            </Text>
          </View>
          <View style={{flex: 1}}>
            <Text style={{fontSize: 13, fontWeight: '700', color: '#fff'}}>
              leandropaninsoro
            </Text>
            <Text style={{fontSize: 11, color: '#888', marginTop: 2}}>
              12:21:16 PM
            </Text>
          </View>
          <View style={mock.checkCircle}>
            <FontAwesome name="check" size={11} color="#fff" />
          </View>
        </View>
      </View>

      {/* footer */}
      <View style={mock.modalFooter}>
        <View style={mock.refreshBtn}>
          <FontAwesome
            name="refresh"
            size={12}
            color="#fff"
            style={{marginRight: 5}}
          />
          <Text style={{fontSize: 13, fontWeight: '600', color: '#fff'}}>
            Refresh
          </Text>
        </View>
        <View style={mock.closeBtn}>
          <FontAwesome
            name="times"
            size={12}
            color="#fff"
            style={{marginRight: 5}}
          />
          <Text style={{fontSize: 13, fontWeight: '600', color: '#fff'}}>
            Close
          </Text>
        </View>
      </View>
    </View>
  </View>
);

// ─── Main OnboardingTour component ───────────────────────────────────────────
const OnboardingTour = ({navigation, route}) => {
  const [stepIdx, setStepIdx]             = useState(0);

  const [targetLayout, setTargetLayout]   = useState(null);
  const fadeAnim                          = useRef(new Animated.Value(1)).current;

  // One ref-map per screen
  const refs = {
    // screen 0
    plusBtn: useRef(null),
    // screen 1
    name:    useRef(null),
    when:    useRef(null),
    desc:    useRef(null),
    cta:     useRef(null),
    // screen 1
    search:  useRef(null),
    hint:    useRef(null),
    // screen 3
    startRow:useRef(null),
    endRow:  useRef(null),
    // screen 4
    participants: useRef(null),
    pill:    useRef(null),
    // screen 5
    modal:   useRef(null),
    arrival: useRef(null),
  };

  const containerRef = useRef(null);

  const currentStep  = STEPS[stepIdx];
  const totalSteps   = STEPS.length;


  // Measure target element relative to container each time step changes
  useEffect(() => {
    setTargetLayout(null);
    const timer = setTimeout(() => {
      const ref = refs[currentStep.highlightKey];
      if (ref?.current && containerRef?.current) {
        ref.current.measureLayout(
          containerRef.current,
          (x, y, width, height) => {
            setTargetLayout({x, y, width, height});
          },
          () => {},
        );
      }
    }, 120);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx]);

  const onComplete = route?.params?.onComplete;
  const finishOnboarding = useCallback(() => {
    // Signal completion via serializable param instead of a function
    navigation.setParams({completed: true});
  }, [navigation]);


  const handleNext = useCallback(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {toValue: 0, duration: 120, useNativeDriver: true}),
      Animated.timing(fadeAnim, {toValue: 1, duration: 180, useNativeDriver: true}),
    ]).start();

    if (stepIdx >= totalSteps - 1) {
      finishOnboarding();
    } else {
      setStepIdx(s => s + 1);
    }
  }, [stepIdx, totalSteps, fadeAnim, finishOnboarding]);

  // Dot indicators for current screen
  const screenStepCount = SCREEN_STEP_COUNTS[currentStep.screen];
  // index within current screen
  let localIdx = 0;
  let seen = 0;
  for (let i = 0; i < currentStep.screen; i++) seen += SCREEN_STEP_COUNTS[i];
  localIdx = stepIdx - seen;

  const stepLabel = `STEP ${stepIdx + 1} OF ${totalSteps}`;
  const insets = useSafeAreaInsets();

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View ref={containerRef} style={styles.container} collapsable={false}>
        <Animated.View style={[styles.screenWrap, {opacity: fadeAnim}]}>
          {currentStep.screen === 0 && <MockHomePage refs={refs} insets={insets} />}
          {currentStep.screen === 1 && <MockCreateRide refs={refs} insets={insets} />}
          {currentStep.screen === 2 && <MockSetLocation refs={refs} insets={insets} />}
          {currentStep.screen === 3 && <MockPointPicker refs={refs} insets={insets} />}
          {currentStep.screen === 4 && <MockStartedRide refs={refs} insets={insets} />}
          {currentStep.screen === 5 && <MockCheckpointModal refs={refs} insets={insets} />}
        </Animated.View>

        {/* Overlay */}
        <StepOverlay
          targetLayout={targetLayout}
          tipTitle={currentStep.tipTitle}
          tipDesc={currentStep.tipDesc}
          tipPos={currentStep.tipPos}
          stepLabel={stepLabel}
        />
      </View>

      {/* ── Bottom nav bar ── */}
      <View style={[styles.navBar, {paddingBottom: insets.bottom + 12}]}>
        <TouchableOpacity onPress={finishOnboarding} style={styles.skipBtn}>
          <Text style={styles.skipTxt}>Skip tour</Text>
        </TouchableOpacity>

        {/* dots */}
        <View style={styles.dotsRow}>
          {Array.from({length: screenStepCount}).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === localIdx && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          style={styles.nextBtn}
          activeOpacity={0.85}>
          <Text style={styles.nextTxt}>
            {stepIdx >= totalSteps - 1 ? 'Start' : 'Next'}
          </Text>
          <FontAwesome
            name={stepIdx >= totalSteps - 1 ? 'flag-checkered' : 'arrow-right'}
            size={12}
            color="#fff"
            style={{marginLeft: 5}}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingTour;

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea:   {flex:1, backgroundColor:'#000'},
  container:  {flex:1, overflow:'hidden'},
  screenWrap: {flex:1},

  // overlay
  dimBlock:   {position:'absolute', backgroundColor:'rgba(0,0,0,0.68)'},
  hlBorder:   {position:'absolute', borderRadius:12, borderWidth:2, borderColor:'rgba(255,255,255,0.35)'},
  tooltip: {
    position:'absolute',
    backgroundColor:'#fff',
    borderRadius:14,
    padding:14,
    shadowColor:'#000',
    shadowOffset:{width:0,height:4},
    shadowOpacity:0.3,
    shadowRadius:10,
    elevation:12,
  },
  tipStep:  {fontSize:9, fontWeight:'700', letterSpacing:1.2, textTransform:'uppercase', color:colors.primary, marginBottom:3},
  tipTitle: {fontSize:13, fontWeight:'700', color:'#111', marginBottom:4, lineHeight:17},
  tipDesc:  {fontSize:11, color:'#555', lineHeight:15},

  // bottom nav
  navBar: {
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    backgroundColor:'rgba(0,0,0,0.97)',
    borderTopWidth:1,
    borderTopColor:'#1f1f1f',
    paddingHorizontal:16,
    paddingVertical:12,
  },
  skipBtn:  {paddingVertical:8, paddingHorizontal:10},
  skipTxt:  {fontSize:12, color:'#666'},
  dotsRow:  {flexDirection:'row', gap:5, alignItems:'center'},
  dot:      {width:5, height:5, borderRadius:50, backgroundColor:'#333'},
  dotActive:{width:16, borderRadius:3, backgroundColor:colors.primary},
  nextBtn:  {
    backgroundColor:colors.primary,
    borderRadius:50,
    paddingVertical:8,
    paddingHorizontal:18,
    flexDirection:'row',
    alignItems:'center',
  },
  nextTxt:  {fontSize:12, fontWeight:'700', color:'#fff'},
});

// ─── Mock screen styles ───────────────────────────────────────────────────────
const mock = StyleSheet.create({
  screen:   {flex:1, backgroundColor:'#000'},
  topbar:   {backgroundColor:'#111', flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:14, borderBottomWidth:1, borderBottomColor:'#222'},
  topbarTitle:{fontSize:16, fontWeight:'800', color:'#fff'},
  topbarSub:{fontSize:11, color:'#888', marginTop:1},
  redBtn:   {backgroundColor:'#9b2626', borderRadius:22, paddingVertical:7, paddingHorizontal:14, flexDirection:'row', alignItems:'center', gap:5},
  redBtnTxt:{fontSize:12, fontWeight:'700', color:'#fff'},
  card:     {backgroundColor:'#1a1a1a', borderRadius:14, padding:14, marginBottom:10, borderWidth:1, borderColor:'#2a2a2a'},
  cardTitle:{fontSize:16, fontWeight:'700', color:'#fff', marginBottom:2},
  cardSub:  {fontSize:11, color:'#666', marginBottom:8},
  inputLight:{backgroundColor:'#f1f5f9', borderRadius:12, padding:12},
  dateBox:  {backgroundColor:'#e0e0e0', borderRadius:12, padding:14, alignItems:'center'},
  selectBox:{backgroundColor:'#e0e0e0', borderRadius:12, padding:12, flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:6},
  cta:      {backgroundColor:'#9b2626', borderRadius:12, padding:14, flexDirection:'row', justifyContent:'center', alignItems:'center'},

  // map
  floatingNav:{
    position:'absolute',top:10,left:10,right:10,zIndex:5,
    backgroundColor:'rgba(255,255,255,0.92)',
    flexDirection:'row',justifyContent:'space-between',alignItems:'center',
    padding:10, borderRadius:16,
  },
  backBtn:  {flexDirection:'row', alignItems:'center', backgroundColor:'rgba(255,255,255,0.9)', padding:8, borderRadius:20},
  searchBar:{
    position:'absolute',top:62,left:10,right:10,zIndex:5,
    backgroundColor:'#fff', borderRadius:14, padding:12,
    flexDirection:'row', alignItems:'center',
    shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.1, shadowRadius:6, elevation:4,
  },
  mapBox:   {marginTop:50, flex:1, position:'relative'},
  liveMapBox:{height:260, position:'relative'},
  mapFill:  {flex:1, backgroundColor:'#e8e4dc', position:'relative', overflow:'hidden'},
  mapLabel: {position:'absolute', top:20, left:80, fontSize:10, color:'#666'},
  pin:      {position:'absolute', top:140, left:155, width:14, height:14, borderRadius:7, backgroundColor:'#4a90d9', borderWidth:2, borderColor:'#fff'},
  hintPill: {
    position:'absolute', bottom:80, left:20, right:20, zIndex:5,
    backgroundColor:'rgba(30,30,30,0.85)', borderRadius:14,
    padding:12, flexDirection:'row', alignItems:'center',
  },

  // point picker
  pointSheet:{backgroundColor:'#111', borderRadius:16, padding:14, margin:10, borderWidth:1, borderColor:'#222'},
  sheetHandle:{width:36, height:4, backgroundColor:'#333', borderRadius:2, alignSelf:'center', marginBottom:12},
  pointRow: {flexDirection:'row', alignItems:'center', gap:10, padding:12, borderRadius:10, borderWidth:1.5, borderColor:'#333', marginBottom:8},
  pointRowActive:{borderColor:'#9b2626'},
  pointDot: {width:14, height:14, borderRadius:7},
  pointLabel:{fontSize:10, fontWeight:'700', letterSpacing:0.8, color:'#666'},
  pointVal: {fontSize:13, fontWeight:'700', color:'#fff', marginTop:1},
  setBtn:   {fontSize:11, fontWeight:'700', color:'#9b2626', marginLeft:'auto'},

  // participants
  participantPanel:{
    position:'absolute',top:30,right:8,
    backgroundColor:'#1a1a1a', borderRadius:14, padding:10,
    width:175, borderWidth:1, borderColor:'#2a2a2a',
  },
  pCard:    {flexDirection:'row', alignItems:'center', gap:7, backgroundColor:'#111', borderRadius:8, borderWidth:1, borderColor:'#2a2a2a', padding:8, marginBottom:5},
  pAvatar:  {width:30, height:30, borderRadius:15, backgroundColor:'#534AB7', alignItems:'center', justifyContent:'center'},
  pName:    {fontSize:10, fontWeight:'700', color:'#fff'},
  pStatus:  {fontSize:9, color:'#22c55e', marginTop:1},
  pStatusWaiting:{color:'#888'},
  pDot:     {width:7, height:7, borderRadius:50, backgroundColor:'#22c55e', marginLeft:'auto'},

  // route
  routeLine:{position:'absolute', top:80, left:80, width:120, height:3, backgroundColor:'#3366cc'},
  emojiMarker:{position:'absolute', top:70, left:100, width:32, height:32, borderRadius:16, backgroundColor:'#22c55e', alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:'#fff'},

  // action pill
  actionPill:{
    position:'absolute', bottom:72, alignSelf:'center',
    backgroundColor:'rgba(28,28,30,0.94)', borderRadius:99,
    paddingVertical:8, paddingLeft:16, paddingRight:8,
    flexDirection:'row', alignItems:'center', gap:8,
    borderWidth:0.5, borderColor:'rgba(255,255,255,0.1)',
  },
  pillLabel:{fontSize:12, color:'rgba(255,255,255,0.75)', fontWeight:'600'},
  pillSep:  {width:0.5, height:18, backgroundColor:'rgba(255,255,255,0.15)'},
  leaveBtn: {backgroundColor:'#9b2626', borderRadius:99, paddingVertical:6, paddingHorizontal:14, flexDirection:'row', alignItems:'center'},

  // checkpoint modal
  modal:    {backgroundColor:'#1a1a1a', borderRadius:20, margin:0, borderTopWidth:1, borderTopColor:'#2a2a2a'},
  modalHeader:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16},
  modalTitle:{fontSize:17, fontWeight:'700', color:'#fff'},
  modalClose:{width:28, height:28, borderRadius:14, backgroundColor:'#2a2a2a', alignItems:'center', justifyContent:'center'},
  warningRow:{flexDirection:'row', alignItems:'flex-start', padding:10, marginHorizontal:12, backgroundColor:'rgba(255,59,48,0.1)', borderLeftWidth:3, borderLeftColor:'#ff3b30', borderRadius:0},
  warningTxt:{fontSize:11, color:'#ff6b6b', lineHeight:16},
  forceRow: {flexDirection:'row', alignItems:'center', gap:8, padding:12, paddingHorizontal:16},
  forceDot: {width:13, height:13, borderRadius:50, backgroundColor:'#9b2626'},
  forceTxt: {fontSize:13, color:'#fff', fontWeight:'600'},
  arrivalCard:{flexDirection:'row', alignItems:'center', gap:10, padding:12, backgroundColor:'#111', borderRadius:12, borderWidth:1, borderColor:'#2a2a2a'},
  arrivalAvatar:{width:36, height:36, borderRadius:18, backgroundColor:'#9b2626', alignItems:'center', justifyContent:'center'},
  checkCircle:{width:22, height:22, borderRadius:11, backgroundColor:'#22c55e', alignItems:'center', justifyContent:'center', marginLeft:'auto'},
  modalFooter:{flexDirection:'row', gap:8, padding:12, borderTopWidth:1, borderTopColor:'#2a2a2a'},
  refreshBtn:{flex:1, backgroundColor:'#2a2a2a', borderRadius:99, padding:10, flexDirection:'row', alignItems:'center', justifyContent:'center'},
  closeBtn:  {flex:1, backgroundColor:'#9b2626', borderRadius:99, padding:10, flexDirection:'row', alignItems:'center', justifyContent:'center'},

  // home screen
  homeHeader:   {backgroundColor:'#111', flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:14, paddingVertical:12, borderBottomWidth:1, borderBottomColor:'#222'},
  homeUserRow:  {flexDirection:'row', alignItems:'center'},
  homeAvatar:   {width:38, height:38, borderRadius:19, backgroundColor:'#9b2626', alignItems:'center', justifyContent:'center'},
  homeUsername: {fontSize:15, fontWeight:'800', color:'#fff'},
  homeUserSub:  {fontSize:11, color:'#888'},
  homeActions:  {flexDirection:'row', alignItems:'center', gap:6},
  homeRideIdBtn:{flexDirection:'row', alignItems:'center', borderWidth:1.5, borderColor:'#9b2626', borderRadius:8, paddingVertical:6, paddingHorizontal:10},
  homeRideIdTxt:{fontSize:12, fontWeight:'700', color:'#fff'},
  homeQrBtn:    {width:34, height:34, borderRadius:8, backgroundColor:'#1e1e1e', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'#333'},
  homePlusBtn:  {width:34, height:34, borderRadius:8, backgroundColor:'#9b2626', alignItems:'center', justifyContent:'center'},
  homeSection:  {backgroundColor:'#1a1a1a', margin:10, borderRadius:12, padding:14, borderWidth:1, borderColor:'#2a2a2a'},
  homeSectionTitle:{fontSize:13, fontWeight:'700', color:'#fff', marginBottom:4},
  homeNoRide:   {fontSize:12, color:'#555'},
  homeCard:     {backgroundColor:'#1a1a1a', marginHorizontal:10, borderRadius:14, borderWidth:1, borderColor:'#2a2a2a', overflow:'hidden'},
  homeCardTitle:{fontSize:17, fontWeight:'900', color:'#fff', letterSpacing:0.5},
  inactiveBadge:{borderWidth:1, borderColor:'#555', borderRadius:4, paddingHorizontal:6, paddingVertical:2},
  inactiveTxt:  {fontSize:10, fontWeight:'700', color:'#888', letterSpacing:0.5},
  homeMapThumb: {height:110, marginHorizontal:14, marginBottom:0, borderRadius:10, overflow:'hidden', backgroundColor:'#d5e8c8'},
});