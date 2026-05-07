import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Alert,
  Image, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft, Send, MoreVertical, Paperclip, Mic, MicOff, ImageIcon,
  FileText, Play, Pause, X,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as SecureStore from 'expo-secure-store';
import { messagingApi } from '../../services/api';
import { API_BASE_URL, WS_BASE_URL } from '../../constants/backend';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ActiveChatScreen() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);

  // Reply state (#13)
  const [replyTo, setReplyTo] = useState<any>(null);
  // Edit state (#15)
  const [editingMsg, setEditingMsg] = useState<any>(null);

  // #11: Attachment state
  const [pendingAttachments, setPendingAttachments] = useState<{ uri: string; name: string; type: string }[]>([]);

  // #12: Voice note recording
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchMessages();
    messagingApi.markRead(id as string).catch(() => {});
  }, [id]);

  // WebSockets for real-time (Phase 5)
  const wsRef = useRef<WebSocket | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    let ws: WebSocket;
    let isActive = true;

    const connectWs = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        const wsUrl = `${WS_BASE_URL}/ws/chat/${id}/?token=${token || ''}`;

        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => console.log('✅ WebSocket Connected:', id);
        
        ws.onmessage = (e) => {
          if (!isActive) return;
          try {
            const payload = JSON.parse(e.data);
            if (payload.type === 'chat_message') {
              const newMsg = payload.message;
              setMessages(prev => {
                if (prev.find(m => m.id === newMsg.id)) return prev; // Prevent duplicate
                return [{
                  ...newMsg,
                  content: newMsg.body || newMsg.content,
                  is_me: newMsg.isOwn ?? false,
                  created_at: newMsg.createdAt || new Date().toISOString(),
                  attachments: newMsg.attachments || [],
                }, ...prev];
              });
            } else if (payload.type === 'typing') {
              setIsTyping(payload.isTyping);
            } else if (payload.type === 'user_status') {
              setOtherUser((prev: any) => ({ ...prev, isOnline: payload.isOnline }));
            }
          } catch (err) {}
        };

        ws.onclose = () => console.log('❌ WebSocket Disconnected');
      } catch (err) {
        console.log('WS Init Error', err);
      }
    };

    connectWs();
    return () => {
      isActive = false;
      if (wsRef.current) wsRef.current.close();
    };
  }, [id]);

  // Pulse animation for recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const fetchMessages = async (silent = false) => {
    try {
      const res = await messagingApi.getMessages(id as string);
      const msgs = res.data.messages || [];
      const mappedMessages = msgs.map((m: any) => ({
        ...m,
        content: m.body || m.content,
        is_me: m.isOwn ?? m.is_me,
        created_at: m.createdAt || m.created_at,
        replied_to: m.repliedTo || m.replied_to || null,
        attachments: m.attachments || [],
      })).reverse();
      setMessages(mappedMessages);
      
      if (res.data.conversation?.otherUser) {
        setOtherUser(res.data.conversation.otherUser);
      }
    } catch (e) {
      if (!silent) console.error('Failed to fetch messages:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // ── #11: Pick image/file ────────────────────────────────────
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets) {
      const newFiles = result.assets.map((a) => ({
        uri: a.uri,
        name: a.fileName || `image_${Date.now()}.jpg`,
        type: a.mimeType || 'image/jpeg',
      }));
      setPendingAttachments(prev => [...prev, ...newFiles].slice(0, 5));
    }
  };

  const removeAttachment = (idx: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  // ── #12: Voice note recording ───────────────────────────────
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Microphone access is required to record voice notes.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(rec);
      setIsRecording(true);
      setRecordDuration(0);
      recordTimerRef.current = setInterval(() => {
        setRecordDuration(d => d + 1);
      }, 1000);
    } catch (e) {
      console.error('Failed to start recording:', e);
      Alert.alert('Error', 'Could not start recording.');
    }
  };

  const stopRecording = async (send = true) => {
    if (!recording) return;
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (send && uri) {
        // Send voice note as attachment
        setSending(true);
        try {
          await messagingApi.sendMessageWithAttachments(
            id as string,
            '',
            [{ uri, name: `voice_${Date.now()}.m4a`, type: 'audio/m4a' }],
            [{ durationSeconds: recordDuration }],
          );
          await fetchMessages(true);
        } catch (e) {
          Alert.alert('Error', 'Failed to send voice note.');
        } finally {
          setSending(false);
        }
      }
      setRecordDuration(0);
    } catch (e) {
      console.error('Failed to stop recording:', e);
      setRecording(null);
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ── Send message ────────────────────────────────────────────
  const handleTextChange = (v: string) => {
    setText(v);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing', isTyping: v.length > 0 }));
    }
  };

  const handleSend = async () => {
    if ((!text.trim() && pendingAttachments.length === 0) || sending) return;
    setSending(true);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing', isTyping: false }));
    }
    try {
      if (editingMsg) {
        await messagingApi.editMessage(editingMsg.id, text.trim());
        setMessages(prev => prev.map(m => m.id === editingMsg.id ? { ...m, content: text.trim() } : m));
        setEditingMsg(null);
        setText('');
      } else if (pendingAttachments.length > 0) {
        // #11: Send with attachments
        const meta = pendingAttachments.map(() => ({ durationSeconds: null }));
        await messagingApi.sendMessageWithAttachments(
          id as string,
          text.trim(),
          pendingAttachments,
          meta,
        );
        setText('');
        setPendingAttachments([]);
        setReplyTo(null);
        await fetchMessages(true);
      } else {
        const res = await messagingApi.sendMessage(
          id as string,
          text.trim(),
          replyTo?.id,
        );
        const newMsg = res.data.message;
        if (newMsg) {
          setMessages(prev => [{
            ...newMsg,
            content: newMsg.body || newMsg.content,
            is_me: newMsg.isOwn ?? true,
            created_at: newMsg.createdAt || new Date().toISOString(),
            attachments: newMsg.attachments || [],
          }, ...prev]);
        }
        setText('');
        setReplyTo(null);
      }
    } catch (e) {
      const fallbackMsg = {
        id: Math.random(),
        content: text,
        is_me: true,
        created_at: new Date().toISOString(),
        attachments: [],
      };
      setMessages(prev => [fallbackMsg, ...prev]);
      setText('');
      setReplyTo(null);
      setPendingAttachments([]);
    } finally {
      setSending(false);
    }
  };

  // #16: Long-press context menu
  const showMessageActions = (msg: any) => {
    const actions: any[] = [{ text: 'Cancel', style: 'cancel' }];
    actions.push({ text: '↩ Reply', onPress: () => { setReplyTo(msg); setEditingMsg(null); } });
    if (msg.is_me) {
      actions.push({ text: '✏ Edit', onPress: () => { setEditingMsg(msg); setReplyTo(null); setText(msg.content || ''); } });
      actions.push({
        text: '⤴ Unsend', style: 'destructive',
        onPress: async () => { try { await messagingApi.unsendMessage(msg.id); setMessages(prev => prev.filter(m => m.id !== msg.id)); } catch {} },
      });
    }
    actions.push({
      text: '🗑 Delete for me', style: 'destructive',
      onPress: async () => { try { await messagingApi.deleteMessage(msg.id); setMessages(prev => prev.filter(m => m.id !== msg.id)); } catch {} },
    });
    Alert.alert('Message', (msg.content || '').substring(0, 50), actions);
  };

  // ── Render attachment in message ────────────────────────────
  const renderAttachment = (att: any) => {
    if (att.type === 'image') {
      return (
        <Image key={att.id} source={{ uri: att.url }} style={styles.attachmentImage} resizeMode="cover" />
      );
    }
    if (att.type === 'audio') {
      return (
        <View key={att.id} style={styles.voiceNoteRow}>
          <Play color="#d946ef" size={16} />
          <View style={styles.voiceNoteBar} />
          <Text style={styles.voiceNoteDuration}>
            {att.durationSeconds ? formatDuration(att.durationSeconds) : '0:00'}
          </Text>
        </View>
      );
    }
    return (
      <View key={att.id} style={styles.fileAttachment}>
        <FileText color="#47e8ff" size={16} />
        <Text style={styles.fileName} numberOfLines={1}>{att.name || 'File'}</Text>
      </View>
    );
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.is_me;
    const hasAttachments = item.attachments && item.attachments.length > 0;
    
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={() => showMessageActions(item)}
        style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowThem]}
      >
        {item.replied_to && (
          <View style={styles.replyQuote}>
            <View style={styles.replyBar} />
            <Text style={styles.replyText} numberOfLines={1}>
              {item.replied_to.body || item.replied_to.content || '...'}
            </Text>
          </View>
        )}
        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleThem]}>
          {hasAttachments && item.attachments.map((att: any) => renderAttachment(att))}
          {item.content ? (
            <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextThem]}>
              {item.content}
            </Text>
          ) : null}
        </View>
        <Text style={styles.messageTime}>
          {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.bgWrapper}>
          <LinearGradient colors={['rgba(7, 11, 23, 0.96)', 'rgba(7, 11, 23, 0.86)']} style={StyleSheet.absoluteFillObject} />
        </View>

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <ArrowLeft color="#fff" size={22} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                if (otherUser?.sql_user_id) router.push({ pathname: `/profile/${otherUser.sql_user_id}` as any });
              }}
            >
              <Text style={styles.headerTitle}>{otherUser?.username || otherUser?.full_name || 'Chat'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.headerSubtitle}>{otherUser?.isOnline ? 'Online' : 'Offline'}</Text>
                {isTyping && <Text style={styles.typingIndicator}>• typing...</Text>}
              </View>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.headerBtn}>
             <MoreVertical color="#fff" size={22} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
             <ActivityIndicator size="large" color="#d946ef" />
          </View>
        ) : (
          <FlatList
            data={messages}
            inverted
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Reply/Edit preview bar */}
          {(replyTo || editingMsg) && (
            <View style={styles.previewBar}>
              <View style={styles.previewBarContent}>
                <Text style={styles.previewBarLabel}>
                  {editingMsg ? '✏ Editing message' : `↩ Replying to ${replyTo?.is_me ? 'yourself' : otherUser?.username || 'user'}`}
                </Text>
                <Text style={styles.previewBarText} numberOfLines={1}>
                  {editingMsg?.content || replyTo?.content || ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setReplyTo(null); setEditingMsg(null); setText(''); }}>
                <Text style={styles.previewBarCancel}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Pending attachments preview (#11) */}
          {pendingAttachments.length > 0 && (
            <View style={styles.attachmentPreview}>
              {pendingAttachments.map((att, idx) => (
                <View key={idx} style={styles.attachmentPreviewItem}>
                  {att.type.startsWith('image') ? (
                    <Image source={{ uri: att.uri }} style={styles.attachmentThumb} />
                  ) : (
                    <View style={styles.attachmentThumbPlaceholder}>
                      <FileText color="#94a3b8" size={16} />
                    </View>
                  )}
                  <TouchableOpacity style={styles.attachmentRemoveBtn} onPress={() => removeAttachment(idx)}>
                    <X color="#fff" size={12} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Voice recording indicator (#12) */}
          {isRecording ? (
            <View style={styles.recordingBar}>
              <Animated.View style={[styles.recordingPulse, { transform: [{ scale: pulseAnim }] }]}>
                <View style={styles.recordingDot} />
              </Animated.View>
              <Text style={styles.recordingLabel}>Recording</Text>
              <Text style={styles.recordingTimer}>{formatDuration(recordDuration)}</Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={styles.recordingCancelBtn} onPress={() => stopRecording(false)}>
                <X color="#f87171" size={18} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.recordingSendBtn} onPress={() => stopRecording(true)}>
                <Send color="#fff" size={18} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputContainer}>
              {/* Attachment button */}
              <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
                <Paperclip color="#94a3b8" size={20} />
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor="#64748b"
                value={text}
                onChangeText={handleTextChange}
                multiline
              />

              {/* Voice note or Send button */}
              {!text.trim() && pendingAttachments.length === 0 ? (
                <TouchableOpacity style={styles.micBtn} onPress={startRecording}>
                  <Mic color="#d946ef" size={20} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending}>
                  <LinearGradient colors={['#7c3aed', '#d946ef']} start={{x:0, y:0}} end={{x:1,y:1}} style={styles.sendBtnGradient}>
                    {sending ? <ActivityIndicator color="#fff" size="small" /> : <Send color="#fff" size={18} />}
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070b17' },
  container: { flex: 1, backgroundColor: '#070b17' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bgWrapper: { position: 'absolute', width: '100%', height: '100%', zIndex: 0 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, zIndex: 10,
    backgroundColor: 'rgba(14, 20, 44, 0.88)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)'
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: { fontFamily: 'Sora_700Bold', color: '#fff', fontSize: 16 },
  headerSubtitle: { fontFamily: 'Sora_400Regular', color: '#4ade80', fontSize: 11 },
  typingIndicator: { fontFamily: 'Sora_400Regular', color: '#d946ef', fontSize: 10, fontStyle: 'italic' },

  listContent: { paddingHorizontal: 16, paddingVertical: 20 },
  
  messageRow: { marginBottom: 16, maxWidth: '80%' },
  messageRowMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  messageRowThem: { alignSelf: 'flex-start', alignItems: 'flex-start' },

  // Reply quote
  replyQuote: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, paddingLeft: 4, gap: 6 },
  replyBar: { width: 3, height: 16, borderRadius: 2, backgroundColor: '#d946ef' },
  replyText: { fontFamily: 'Sora_400Regular', fontSize: 11, color: '#94a3b8', maxWidth: 200 },

  messageBubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, overflow: 'hidden' },
  messageBubbleMe: { backgroundColor: '#7c3aed', borderBottomRightRadius: 4 },
  messageBubbleThem: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },

  messageText: { fontFamily: 'Sora_400Regular', fontSize: 15, lineHeight: 22 },
  messageTextMe: { color: '#fff' },
  messageTextThem: { color: '#f8f9ff' },
  messageTime: { fontFamily: 'Sora_400Regular', fontSize: 10, color: '#64748b', marginTop: 4, marginHorizontal: 4 },

  // Inline attachments
  attachmentImage: { width: SCREEN_WIDTH * 0.55, height: SCREEN_WIDTH * 0.4, borderRadius: 12, marginBottom: 6 },
  voiceNoteRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, marginBottom: 4 },
  voiceNoteBar: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
  voiceNoteDuration: { fontFamily: 'Sora_600SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  fileAttachment: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, marginBottom: 4 },
  fileName: { fontFamily: 'Sora_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.8)', maxWidth: 180 },

  // Preview bar (reply/edit)
  previewBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderTopWidth: 1, borderTopColor: 'rgba(124, 58, 237, 0.2)',
  },
  previewBarContent: { flex: 1 },
  previewBarLabel: { fontFamily: 'Sora_700Bold', fontSize: 11, color: '#d946ef', marginBottom: 2 },
  previewBarText: { fontFamily: 'Sora_400Regular', fontSize: 12, color: '#94a3b8' },
  previewBarCancel: { fontFamily: 'Sora_700Bold', fontSize: 16, color: '#94a3b8', paddingLeft: 16 },

  // #11: Attachment preview
  attachmentPreview: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(14, 20, 44, 0.88)',
    borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  attachmentPreviewItem: { position: 'relative' },
  attachmentThumb: { width: 56, height: 56, borderRadius: 10 },
  attachmentThumbPlaceholder: { width: 56, height: 56, borderRadius: 10, backgroundColor: 'rgba(30, 41, 59, 0.6)', justifyContent: 'center', alignItems: 'center' },
  attachmentRemoveBtn: {
    position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#f87171', justifyContent: 'center', alignItems: 'center',
  },

  // #12: Recording bar
  recordingBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
    borderTopWidth: 1, borderTopColor: 'rgba(248, 113, 113, 0.2)',
  },
  recordingPulse: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#f87171' },
  recordingLabel: { fontFamily: 'Sora_700Bold', fontSize: 13, color: '#f87171' },
  recordingTimer: { fontFamily: 'Sora_600SemiBold', fontSize: 13, color: '#f8f9ff' },
  recordingCancelBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(248, 113, 113, 0.15)', justifyContent: 'center', alignItems: 'center',
  },
  recordingSendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center',
  },

  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: 'rgba(14, 20, 44, 0.88)',
    borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)'
  },
  attachBtn: {
    width: 40, height: 44, justifyContent: 'center', alignItems: 'center',
  },
  micBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(217, 70, 239, 0.1)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(217, 70, 239, 0.2)',
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 100,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 22, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    color: '#fff', fontFamily: 'Sora_400Regular', fontSize: 15,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  sendBtnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
