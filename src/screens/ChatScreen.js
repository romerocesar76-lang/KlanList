// src/screens/ChatScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import {
  collection, addDoc, query, orderBy,
  onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase/config';
import Avatar from '../components/Avatar';
import { colors, radius, shadow } from '../theme';

export default function ChatScreen({ username, groupCode }) {
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(true);
  const listRef = useRef(null);

  useEffect(() => {
    const q = query(
      collection(db, 'groups', groupCode, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    });
    return unsub;
  }, [groupCode]);

  async function send() {
    const t = text.trim();
    if (!t) return;
    setText('');
    await addDoc(collection(db, 'groups', groupCode, 'messages'), {
      user:      username,
      text:      t,
      createdAt: serverTimestamp(),
    });
  }

  function fmtTime(ts) {
    if (!ts?.toDate) return '';
    const d = ts.toDate();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function renderItem({ item, index }) {
    const mine    = item.user === username;
    const prev    = messages[index - 1];
    const showAv  = !mine; // Show avatar for all non-own messages
    const showName = showAv && prev?.user !== item.user;

    return (
      <View style={[styles.row, mine && styles.rowMine]}>
        {/* Avatar for others */}
        {!mine && (
          <View style={styles.avCol}>
            {showAv ? <Avatar name={item.user} size={30} /> : <View style={{ width: 30 }} />}
          </View>
        )}
        <View style={[styles.msgWrap, mine && styles.msgWrapMine]}>
          {showName && <Text style={styles.nameLabel}>{item.user}</Text>}
          <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
            <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.text}</Text>
          </View>
          <Text style={[styles.timeLabel, mine && { textAlign: 'right' }]}>{fmtTime(item.createdAt)}</Text>
        </View>
      </View>
    );
  }

  if (loading) return <View style={styles.loader}><ActivityIndicator color={colors.accent} size="large" /></View>;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>Nadie ha escrito todavía.{'\n'}¡Sé el primero!</Text>
          </View>
        }
      />
      <View style={styles.footer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Escribir mensaje..."
          placeholderTextColor={colors.text3}
          returnKeyType="send"
          onSubmitEditing={send}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send} activeOpacity={0.8}>
          <Ionicons name="send" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bgSoft },
  loader:         { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSoft },
  listContent:    { padding: 12, paddingBottom: 8, gap: 2 },
  empty:          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyIcon:      { fontSize: 40 },
  emptyText:      { fontSize: 15, color: colors.text2, textAlign: 'center', lineHeight: 22 },
  row:            { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6, gap: 8 },
  rowMine:        { flexDirection: 'row-reverse' },
  avCol:          { alignSelf: 'flex-end', marginBottom: 16 },
  msgWrap:        { maxWidth: '72%', gap: 2 },
  msgWrapMine:    { alignItems: 'flex-end' },
  nameLabel:      { fontSize: 11, fontWeight: '700', color: colors.text2, paddingLeft: 4 },
  bubble:         { borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9 },
  bubbleTheirs:   { backgroundColor: colors.surface, borderBottomLeftRadius: 4, ...shadow },
  bubbleMine:     { backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  bubbleText:     { fontSize: 15, color: colors.text, lineHeight: 21 },
  bubbleTextMine: { color: colors.white },
  timeLabel:      { fontSize: 10, color: colors.text3, paddingHorizontal: 4 },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
  },
  input: {
    flex: 1, backgroundColor: colors.bgSoft, borderWidth: 1, borderColor: colors.borderMd,
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: colors.text, maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
});
