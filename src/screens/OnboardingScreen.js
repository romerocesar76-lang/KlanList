// src/screens/OnboardingScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import {
  doc, setDoc, getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase/config';
import { colors, radius } from '../theme';

// Generates a code like "KLAN-8F3T"
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'KLAN-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function OnboardingScreen({ onDone }) {
  const [step, setStep]         = useState('name');   // 'name' | 'choice' | 'create' | 'join'
  const [username, setUsername] = useState('');
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode]   = useState('');
  const [loading, setLoading]     = useState(false);

  // ── STEP 1: name ──────────────────────────────────
  function handleNameNext() {
    if (username.trim().length < 2) return;
    setStep('choice');
  }

  // ── STEP 2a: create group ─────────────────────────
  async function handleCreate() {
    if (groupName.trim().length < 2) return;
    setLoading(true);
    try {
      const code = generateCode();
      const groupRef = doc(db, 'groups', code);
      await setDoc(groupRef, {
        name:      groupName.trim(),
        code,
        createdAt: serverTimestamp(),
      });
      // Add member
      await setDoc(doc(db, 'groups', code, 'members', username.trim()), {
        name:     username.trim(),
        joinedAt: serverTimestamp(),
      });
      await AsyncStorage.multiSet([
        ['kl_username',  username.trim()],
        ['kl_groupCode', code],
        ['kl_groupName', groupName.trim()],
      ]);
      onDone({ username: username.trim(), groupCode: code, groupName: groupName.trim() });
    } catch (e) {
      console.error('handleCreate error', e);
      Alert.alert('Error', `No se pudo crear el grupo. ${e.message || 'Verificá tu conexión.'}`);
    } finally {
      setLoading(false);
    }
  }

  // ── STEP 2b: join group ───────────────────────────
  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) return;
    setLoading(true);
    try {
      const groupSnap = await getDoc(doc(db, 'groups', code));
      if (!groupSnap.exists()) {
        Alert.alert(
          'Código incorrecto',
          'No encontramos ningún grupo con ese código.\nVerificá que esté bien escrito e intentá de nuevo.',
          [{ text: 'Reintentar', style: 'default' }]
        );
        setLoading(false);
        return;
      }
      const groupData = groupSnap.data();
      await setDoc(doc(db, 'groups', code, 'members', username.trim()), {
        name:     username.trim(),
        joinedAt: serverTimestamp(),
      });
      await AsyncStorage.multiSet([
        ['kl_username',  username.trim()],
        ['kl_groupCode', code],
        ['kl_groupName', groupData.name],
      ]);
      onDone({ username: username.trim(), groupCode: code, groupName: groupData.name });
    } catch (e) {
      console.error('handleJoin error', e);
      Alert.alert('Error', `No se pudo conectar. ${e.message || 'Verificá tu conexión a internet.'}`);
    } finally {
      setLoading(false);
    }
  }

  // ── RENDER ────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoIcon}>🏠</Text>
          <Text style={styles.logoName}>KlanList</Text>
        </View>

        {/* ── Name step ── */}
        {step === 'name' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>¿Cuál es tu nombre?</Text>
            <Text style={styles.cardSub}>Así te van a ver los demás miembros de tu grupo.</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Tu nombre..."
              placeholderTextColor={colors.text3}
              maxLength={20}
              autoFocus
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={handleNameNext}
            />
            <TouchableOpacity
              style={[styles.btnPrimary, username.trim().length < 2 && styles.btnDisabled]}
              onPress={handleNameNext}
              disabled={username.trim().length < 2}
              activeOpacity={0.8}
            >
              <Text style={styles.btnPrimaryText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Choice step ── */}
        {step === 'choice' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Hola, {username.trim()} 👋</Text>
            <Text style={styles.cardSub}>¿Querés crear un grupo nuevo o unirte a uno existente?</Text>
            <TouchableOpacity style={styles.choiceBtn} onPress={() => setStep('create')} activeOpacity={0.8}>
              <Text style={styles.choiceIcon}>✨</Text>
              <View style={styles.choiceText}>
                <Text style={styles.choiceName}>Crear grupo nuevo</Text>
                <Text style={styles.choiceSub}>Para vos y tu familia o grupo</Text>
              </View>
              <Text style={styles.choiceArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.choiceBtn} onPress={() => setStep('join')} activeOpacity={0.8}>
              <Text style={styles.choiceIcon}>🔗</Text>
              <View style={styles.choiceText}>
                <Text style={styles.choiceName}>Unirme a un grupo</Text>
                <Text style={styles.choiceSub}>Tengo un código de invitación</Text>
              </View>
              <Text style={styles.choiceArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('name')} activeOpacity={0.6}>
              <Text style={styles.backLink}>← Cambiar nombre</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Create step ── */}
        {step === 'create' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nombre del grupo</Text>
            <Text style={styles.cardSub}>Por ejemplo: "Familia García", "Depto 4B", "Casa de la Playa".</Text>
            <TextInput
              style={styles.input}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Nombre del grupo..."
              placeholderTextColor={colors.text3}
              maxLength={30}
              autoFocus
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            {loading
              ? <ActivityIndicator color={colors.accent} size="large" style={{ marginTop: 8 }} />
              : (
                <TouchableOpacity
                  style={[styles.btnPrimary, groupName.trim().length < 2 && styles.btnDisabled]}
                  onPress={handleCreate}
                  disabled={groupName.trim().length < 2}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnPrimaryText}>Crear grupo</Text>
                </TouchableOpacity>
              )
            }
            <TouchableOpacity onPress={() => setStep('choice')} activeOpacity={0.6}>
              <Text style={styles.backLink}>← Volver</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Join step ── */}
        {step === 'join' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Código de invitación</Text>
            <Text style={styles.cardSub}>Pedíselo a quien creó el grupo. Tiene el formato KLAN-XXXX.</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={joinCode}
              onChangeText={t => setJoinCode(t.toUpperCase())}
              placeholder="KLAN-XXXX"
              placeholderTextColor={colors.text3}
              maxLength={9}
              autoFocus
              autoCorrect={false}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={handleJoin}
            />
            {loading
              ? <ActivityIndicator color={colors.accent} size="large" style={{ marginTop: 8 }} />
              : (
                <TouchableOpacity
                  style={[styles.btnPrimary, joinCode.trim().length < 4 && styles.btnDisabled]}
                  onPress={handleJoin}
                  disabled={joinCode.trim().length < 4}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnPrimaryText}>Unirme</Text>
                </TouchableOpacity>
              )
            }
            <TouchableOpacity onPress={() => setStep('choice')} activeOpacity={0.6}>
              <Text style={styles.backLink}>← Volver</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  inner:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 28 },
  logoWrap:      { alignItems: 'center', gap: 8 },
  logoIcon:      { fontSize: 56 },
  logoName:      { fontSize: 32, fontWeight: '800', color: colors.accent, letterSpacing: -0.5 },
  card:          { width: '100%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: 24, gap: 14, borderWidth: 1, borderColor: colors.border },
  cardTitle:     { fontSize: 20, fontWeight: '700', color: colors.text },
  cardSub:       { fontSize: 14, color: colors.text2, lineHeight: 20 },
  input:         { borderWidth: 1.5, borderColor: colors.borderMd, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 13, fontSize: 16, color: colors.text, backgroundColor: colors.bgSoft },
  codeInput:     { fontWeight: '700', fontSize: 20, letterSpacing: 2, textAlign: 'center' },
  btnPrimary:    { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  btnDisabled:   { opacity: 0.35 },
  btnPrimaryText:{ color: colors.white, fontSize: 16, fontWeight: '700' },
  choiceBtn:     { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 16 },
  choiceIcon:    { fontSize: 24 },
  choiceText:    { flex: 1 },
  choiceName:    { fontSize: 15, fontWeight: '700', color: colors.text },
  choiceSub:     { fontSize: 13, color: colors.text2, marginTop: 2 },
  choiceArrow:   { fontSize: 22, color: colors.text3 },
  backLink:      { fontSize: 14, color: colors.text2, textAlign: 'center', paddingVertical: 4 },
});
