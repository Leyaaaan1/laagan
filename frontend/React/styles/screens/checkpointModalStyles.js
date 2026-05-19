import {StyleSheet} from 'react-native';

const checkpointModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#f44336',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: '#1e40af',
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  checkpointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 8,
  },
  checkpointIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  checkpointTitleContainer: {
    flex: 1,
  },
  checkpointTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  checkpointCount: {
    fontSize: 12,
    color: '#999',
  },
  arriverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  arriverAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  arriverInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  arriverInfo: {
    flex: 1,
  },
  arriverUsername: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  arriverTime: {
    fontSize: 12,
    color: '#999',
  },
  divider: {
    height: 8,
  },
  closeBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default checkpointModalStyles;
