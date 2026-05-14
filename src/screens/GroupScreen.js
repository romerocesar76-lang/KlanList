// src/screens/GroupScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Share, Alert, TextInput, Modal, Pressable,
  ScrollView, ActivityIndicator,
} from 'react-native';
import {
  collection, onSnapshot, query, orderBy,
  doc, updateDoc, setDoc,
} from 'firebase/firestore';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase/config';
import Avatar from '../components/Avatar';
import { colors, radius, shadow } from '../theme';

export default function GroupScreen({ username, groupCode, groupName, onUsernameChange, onLeave }) {
  const [members, setMembers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [copied, setCopied]         = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newName, setNewName]       = useState(username);

  useEffect(() => {
    const q = query(
      collection(db, 'groups', groupCode, 'members'),
      orderBy('joinedAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [groupCode]);

  async function copyCode() {
    await Clipboard.setStringAsync(groupCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareCode() {
    await Share.share({
      message: `¡Unite a nuestro grupo en KlanList!\nNombre: ${groupName}\nCódigo: ${groupCode}\n\nDescargá KlanList e ingresá el código al abrir la app.`,
    });
  }

  async function saveNewName() {
    const name = newName.trim();
    if (name.length < 2 || name === username) { setShowEditModal(false); return; }

    // Add new member doc, remove old one if name changed
    await setDoc(doc(db, 'groups', groupCode, 'members', name), {
      name,
      joinedAt: new Date(),
    });
    await AsyncStorage.setItem('kl_username', name);
    onUsernameChange(name);
    setShowEditModal(false);
  }

  async function leaveGroup() {
    Alert.alert(
      'Salir del grupo',
      '¿Seguro que querés salir del grupo? Perderás acceso a los chats y listas. Para volver, tendrás que ingresar el código nuevamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir', style: 'destructive',
          onPress: async () => {
            // Delete member doc
            await deleteDoc(doc(db, 'groups', groupCode, 'members', username));
            // Clear storage and leave
            onLeave();
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>

      {/* ── Group card ── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>TU GRUPO</Text>
        <Text style={styles.groupName}>{groupName}</Text>

        {/* Code display */}
        <View style={styles.codeBox}>
          <Text style={styles.codeText}>{groupCode}</Text>
          <TouchableOpacity style={styles.codeAction} onPress={copyCode} activeOpacity={0.7}>
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={copied ? colors.green : colors.accent} />
            <Text style={[styles.codeActionText, copied && { color: colors.green }]}>
              {copied ? 'Copiado' : 'Copiar'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.codeHint}>
          Compartí este código con quien quieras que se una al grupo.
        </Text>

        <TouchableOpacity style={styles.shareBtn} onPress={shareCode} activeOpacity={0.8}>
          <Ionicons name="share-social-outline" size={18} color={colors.white} />
          <Text style={styles.shareBtnText}>Compartir por WhatsApp u otra app</Text>
        </TouchableOpacity>
      </View>

      {/* ── Your profile ── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>TU PERFIL</Text>
        <View style={styles.profileRow}>
          <Avatar name={username} size={44} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{username}</Text>
            <Text style={styles.profileSub}>Así te ven los demás</Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => { setNewName(username); setShowEditModal(true); }}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil-outline" size={18} color={colors.accent} />
            <Text style={styles.editBtnText}>Editar</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.leaveBtn} onPress={leaveGroup} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color={colors.red} />
          <Text style={styles.leaveBtnText}>Salir del grupo</Text>
        </TouchableOpacity>
      </View>

      {/* ── Members ── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>MIEMBROS ({members.length})</Text>
        {loading
          ? <ActivityIndicator color={colors.accent} />
          : members.map(m => (
            <View key={m.id} style={styles.memberRow}>
              <Avatar name={m.name} size={36} />
              <Text style={styles.memberName}>{m.name}</Text>
              {m.name === username && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>vos</Text>
                </View>
              )}
            </View>
          ))
        }
      </View>

      {/* ── Edit name modal ── */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setShowEditModal(false)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <Text style={styles.modalTitle}>Cambiar tu nombre</Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Tu nombre..."
              placeholderTextColor={colors.text3}
              autoFocus
              maxLength={20}
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={saveNewName}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setShowEditModal(false)} activeOpacity={0.7}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnConfirm, newName.trim().length < 2 && styles.btnDisabled]}
                onPress={saveNewName}
                disabled={newName.trim().length < 2}
                activeOpacity={0.8}
              >
                <Text style={styles.btnConfirmText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: colors.bgSoft },
  content:         { padding: 16, gap: 14, paddingBottom: 32 },
  card:            { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, gap: 12, borderWidth: 1, borderColor: colors.border, ...shadow },
  sectionLabel:    { fontSize: 11, fontWeight: '700', color: colors.text3, letterSpacing: 0.8 },
  groupName:       { fontSize: 22, fontWeight: '800', color: colors.text },

  // Code
  codeBox:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.accentSoft, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14 },
  codeText:        { fontSize: 22, fontWeight: '800', color: colors.accent, letterSpacing: 2 },
  codeAction:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  codeActionText:  { fontSize: 13, fontWeight: '700', color: colors.accent },
  codeHint:        { fontSize: 13, color: colors.text2, lineHeight: 18 },
  shareBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 13 },
  shareBtnText:    { fontSize: 14, fontWeight: '700', color: colors.white },

  // Profile
  profileRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileInfo:     { flex: 1 },
  profileName:     { fontSize: 17, fontWeight: '700', color: colors.text },
  profileSub:      { fontSize: 12, color: colors.text3, marginTop: 1 },
  editBtn:         { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1, borderColor: colors.borderMd },
  editBtnText:     { fontSize: 13, fontWeight: '600', color: colors.accent },
  leaveBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1, borderColor: colors.red, marginTop: 8 },
  leaveBtnText:    { fontSize: 13, fontWeight: '600', color: colors.red },

  // Members
  memberRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  memberName:      { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  youBadge:        { backgroundColor: colors.accentSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  youBadgeText:    { fontSize: 11, fontWeight: '700', color: colors.accentDark },

  // Modal
  backdrop:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modal:           { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 24, paddingBottom: 40, gap: 14 },
  modalTitle:      { fontSize: 18, fontWeight: '700', color: colors.text },
  modalInput:      { borderWidth: 1.5, borderColor: colors.borderMd, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 13, fontSize: 16, color: colors.text, backgroundColor: colors.bgSoft },
  modalActions:    { flexDirection: 'row', gap: 10 },
  btnCancel:       { flex: 1, borderWidth: 1, borderColor: colors.borderMd, borderRadius: radius.md, paddingVertical: 13, alignItems: 'center' },
  btnCancelText:   { fontSize: 15, fontWeight: '700', color: colors.text2 },
  btnConfirm:      { flex: 1, backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 13, alignItems: 'center' },
  btnConfirmText:  { fontSize: 15, fontWeight: '700', color: colors.white },
  btnDisabled:     { opacity: 0.35 },
});
