import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  Share,
} from 'react-native';
import {fetchMyRides} from '../../../services/rideService';
import {joinService} from '../../../services/joinService';
import {inviteService} from '../../../services/inviteService';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import modal from '../../../styles/components/modal';
import feedback from '../../../styles/base/feedback';
import badges from '../../../styles/base/badges';

// token prop removed — all services auto-read from AsyncStorage via ApiClient
const ParticipantList = ({
  visible,
  onClose,
  participants,
  generatedRidesId,
  username,
  currentUsername,
}) => {
  const [state, setState] = useState({
    rides: [],
    joinRequests: [],
    loading: false,
    error: '',
    activeTab: 'participants',
    qrCodeUrl: '',
    qrCodeBase64: '',
    inviteLink: '',
    loadingQr: false,
  });

  const isOwner = username === currentUsername;

  const handleShareQrCode = async () => {
    try {
      if (state.inviteLink) {
        await Share.share({
          message: `Join my ride!\n\nUse this link to join:\n${state.inviteLink}`,
          title: 'Join My Ride',
        });
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const loadQrCode = useCallback(async () => {
    setState(prev => ({...prev, loadingQr: true}));
    try {
      const inviteData = await inviteService.getAllInviteData(generatedRidesId);
      setState(prev => ({
        ...prev,
        qrCodeUrl: inviteData.qrUrl || '',
        qrCodeBase64: inviteData.qrBase64 || '',
        inviteLink: inviteData.inviteLink || '',
      }));
    } catch (err) {
      console.error('Error loading QR code:', err);
    } finally {
      setState(prev => ({...prev, loadingQr: false}));
    }
  }, [generatedRidesId]);

  const loadMyRides = useCallback(async () => {
    try {
      setState(prev => ({...prev, loading: true, error: ''}));
      const result = await fetchMyRides();
      setState(prev => ({...prev, rides: result}));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to load your rides',
      }));
    } finally {
      setState(prev => ({...prev, loading: false}));
    }
  }, []);

  const loadJoinRequests = useCallback(async () => {
    setState(prev => ({...prev, loading: true, error: ''}));
    try {
      const data = await joinService.getJoinersByRide(generatedRidesId);
      setState(prev => ({...prev, joinRequests: data || []}));
    } catch (err) {
      setState(prev => ({...prev, error: 'Failed to load join requests'}));
    } finally {
      setState(prev => ({...prev, loading: false}));
    }
  }, [generatedRidesId]);

  const handleApproveRequest = async joinId => {
    try {
      await joinService.approveJoinRequest(joinId);
      Alert.alert('Success', 'Request has been approved');
      loadJoinRequests();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to approve join request');
    }
  };

  const handleRejectRequest = async joinId => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this request?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await joinService.rejectJoinRequest(joinId);
              Alert.alert('Success', 'Request has been rejected');
              loadJoinRequests();
            } catch (err) {
              Alert.alert(
                'Error',
                err.message || 'Failed to reject join request',
              );
            }
          },
        },
      ],
    );
  };

  const handleApproveAll = async () => {
    const pending = state.joinRequests.filter(r => r.status === 'PENDING');
    if (!pending.length) return;
    Alert.alert(
      'Approve All',
      `Approve all ${pending.length} pending requests?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Approve All',
          onPress: async () => {
            try {
              await Promise.all(
                pending.map(r => joinService.approveJoinRequest(r.joinId)),
              );
              Alert.alert('Success', 'All requests approved');
              await loadJoinRequests();
            } catch (err) {
              Alert.alert(
                'Error',
                err.message || 'Failed to approve all requests',
              );
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    if (!visible) return;
    if (state.activeTab === 'rides') loadMyRides();
    else if (state.activeTab === 'requests' && generatedRidesId && isOwner)
      loadJoinRequests();
    if (isOwner && generatedRidesId) loadQrCode();
  }, [
    visible,
    state.activeTab,
    isOwner,
    loadMyRides,
    loadJoinRequests,
    loadQrCode,
    generatedRidesId,
  ]);

  const getStatusStyle = status => {
    switch (status) {
      case 'PENDING':
        return modal.statusPending;
      case 'APPROVED':
        return modal.statusApproved;
      case 'REJECTED':
        return modal.statusRejected;
      default:
        return modal.statusPending;
    }
  };

  const formatDate = dateString => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const renderRequestItem = ({item}) => {
    const isPending = item.status === 'PENDING';
    return (
      <View style={modal.requestCard}>
        <View style={modal.requestContent}>
          <View style={modal.requestUserInfo}>
            <View style={modal.requestAvatar}>
              <FontAwesome name="user" size={16} color="#666" />
            </View>
            <View style={{flex: 1}}>
              <Text style={modal.requestUsername}>{item.username}</Text>
              <Text style={getStatusStyle(item.status)}>{item.status}</Text>
              {item.requestedAt && (
                <Text style={modal.requestDate}>
                  {formatDate(item.requestedAt)}
                </Text>
              )}
            </View>
          </View>
          {isPending && (
            <View style={modal.requestActions}>
              <TouchableOpacity
                style={[modal.actionButton, modal.approveButton]}
                onPress={() => handleApproveRequest(item.joinId)}>
                <FontAwesome name="check" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[modal.actionButton, modal.rejectButton]}
                onPress={() => handleRejectRequest(item.joinId)}>
                <FontAwesome name="times" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderParticipantItem = ({item, index}) => {
    const participantName = typeof item === 'object' ? item.username : item;
    const isRideOwner = participantName === username;
    return (
      <View style={modal.participantCard}>
        <View style={modal.participantNumber}>
          <Text style={modal.participantNumberText}>{index + 1}</Text>
        </View>
        <View style={modal.participantInfo}>
          <Text style={modal.participantName}>{participantName}</Text>
          {isRideOwner && (
            <View style={badges.owner}>
              <FontAwesome name="star" size={10} color="#fbbf24" />
              <Text style={badges.ownerText}>Owner</Text>
            </View>
          )}
        </View>
        <FontAwesome name="motorcycle" size={16} color="#666" />
      </View>
    );
  };

  const pendingCount = state.joinRequests.filter(
    r => r.status === 'PENDING',
  ).length;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modal.overlay}>
        <View style={modal.container}>
          {isOwner && (
            <View style={modal.qrSection}>
              <TouchableOpacity onPress={onClose} style={modal.closeButton}>
                <FontAwesome name="times" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={modal.qrTitle}>Share Your Ride</Text>
              {state.loadingQr ? (
                <View style={feedback.loadingInline}>
                  <ActivityIndicator size="small" color="#8c2323" />
                  <Text style={feedback.loadingText}>Loading QR...</Text>
                </View>
              ) : state.qrCodeUrl ? (
                <View style={modal.qrContainer}>
                  <Image
                    source={{uri: state.qrCodeUrl}}
                    style={modal.qrImage}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <View style={feedback.imagePlaceholder}>
                  <FontAwesome name="qrcode" size={60} color="#cbd5e1" />
                  <Text style={feedback.imagePlaceholderText}>
                    QR Code Unavailable
                  </Text>
                </View>
              )}
              <View style={modal.qrActions}>
                <TouchableOpacity
                  style={modal.qrActionButton}
                  onPress={handleShareQrCode}
                  disabled={!state.inviteLink}>
                  <FontAwesome name="share-alt" size={16} color="#fff" />
                  <Text style={modal.qrActionButtonText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[modal.qrActionButton, modal.qrActionButtonSecondary]}
                  onPress={loadQrCode}>
                  <FontAwesome name="refresh" size={16} color="#fff" />
                  <Text style={modal.qrActionButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={modal.tabContainer}>
            <TouchableOpacity
              style={[
                modal.tab,
                state.activeTab === 'participants' && modal.tabActive,
              ]}
              onPress={() =>
                setState(prev => ({...prev, activeTab: 'participants'}))
              }>
              <FontAwesome
                name="users"
                size={16}
                color={state.activeTab === 'participants' ? '#8c2323' : '#666'}
                style={{marginRight: 8}}
              />
              <Text
                style={[
                  modal.tabText,
                  state.activeTab === 'participants' && modal.tabTextActive,
                ]}>
                Riders
              </Text>
              {Array.isArray(participants) && participants.length > 0 && (
                <View style={modal.tabBadge}>
                  <Text style={modal.tabBadgeText}>{participants.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            {isOwner && (
              <TouchableOpacity
                style={[
                  modal.tab,
                  state.activeTab === 'requests' && modal.tabActive,
                ]}
                onPress={() =>
                  setState(prev => ({...prev, activeTab: 'requests'}))
                }>
                <FontAwesome
                  name="clock-o"
                  size={16}
                  color={state.activeTab === 'requests' ? '#8c2323' : '#666'}
                  style={{marginRight: 8}}
                />
                <Text
                  style={[
                    modal.tabText,
                    state.activeTab === 'requests' && modal.tabTextActive,
                  ]}>
                  Requests
                </Text>
                {pendingCount > 0 && (
                  <View style={[modal.tabBadge, {backgroundColor: '#8c2323'}]}>
                    <Text style={modal.tabBadgeText}>{pendingCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={modal.content}>
            {!isOwner && (
              <TouchableOpacity onPress={onClose} style={modal.closeButton}>
                <FontAwesome name="times" size={20} color="#fff" />
              </TouchableOpacity>
            )}
            {state.activeTab === 'participants' && (
              <View style={{flex: 1}}>
                {Array.isArray(participants) && participants.length > 0 ? (
                  <FlatList
                    data={participants}
                    renderItem={renderParticipantItem}
                    keyExtractor={(item, index) => `participant-${index}`}
                    contentContainerStyle={{paddingBottom: 8}}
                    showsVerticalScrollIndicator={false}
                  />
                ) : (
                  <View style={feedback.emptyContainer}>
                    <FontAwesome name="users" size={48} color="#333" />
                    <Text style={feedback.emptyText}>No riders yet</Text>
                    <Text style={feedback.emptySubtext}>
                      Share your QR code to invite riders
                    </Text>
                  </View>
                )}
              </View>
            )}
            {state.activeTab === 'requests' && isOwner && (
              <View style={{flex: 1}}>
                {pendingCount > 0 && (
                  <TouchableOpacity
                    style={[modal.qrActionButton, {marginBottom: 16}]}
                    onPress={handleApproveAll}>
                    <FontAwesome name="check-circle" size={16} color="#fff" />
                    <Text style={modal.qrActionButtonText}>
                      Approve All ({pendingCount})
                    </Text>
                  </TouchableOpacity>
                )}
                {state.loading ? (
                  <View style={feedback.loadingContainer}>
                    <ActivityIndicator size="large" color="#8c2323" />
                    <Text style={feedback.loadingText}>
                      Loading requests...
                    </Text>
                  </View>
                ) : state.error ? (
                  <View style={feedback.errorContainer}>
                    <FontAwesome
                      name="exclamation-circle"
                      size={32}
                      color="#8c2323"
                    />
                    <Text style={feedback.errorTextPrimary}>{state.error}</Text>
                  </View>
                ) : (
                  <FlatList
                    data={state.joinRequests}
                    renderItem={renderRequestItem}
                    keyExtractor={(item, index) =>
                      `request-${item.joinId || index}`
                    }
                    contentContainerStyle={{paddingBottom: 8}}
                    ListEmptyComponent={
                      <View style={feedback.emptyContainer}>
                        <FontAwesome name="inbox" size={48} color="#333" />
                        <Text style={feedback.emptyText}>No join requests</Text>
                        <Text style={feedback.emptySubtext}>
                          Requests will appear here when riders want to join
                        </Text>
                      </View>
                    }
                    showsVerticalScrollIndicator={false}
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ParticipantList;
