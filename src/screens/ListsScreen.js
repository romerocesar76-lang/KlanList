// src/screens/ListsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
  Modal, Pressable,
} from 'react-native';
import {
  collection, addDoc, doc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase/config';
import { colors, radius, shadow } from '../theme';

export default function ListsScreen({ username, groupCode, groupName }) {
  const [lists, setLists]             = useState([]);
  const [currentListId, setCurrentListId] = useState(null);
  const [items, setItems]             = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [newListName, setNewListName] = useState('');
  const [showNewListModal, setShowNewListModal] = useState(false);

  // Real-time: lists
  useEffect(() => {
    const q = query(
      collection(db, 'groups', groupCode, 'lists'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      const ls = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLists(ls);
      setLoadingLists(false);
      setCurrentListId(prev => {
        if (!prev && ls.length > 0) return ls[0].id;
        if (prev && !ls.find(l => l.id === prev)) return ls[0]?.id ?? null;
        return prev;
      });
    });
    return unsub;
  }, [groupCode]);

  // Real-time: items of selected list
  useEffect(() => {
    if (!currentListId) { setItems([]); return; }
    setLoadingItems(true);
    const q = query(
      collection(db, 'groups', groupCode, 'lists', currentListId, 'items'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingItems(false);
    });
    return unsub;
  }, [currentListId, groupCode]);

  // ── Create list ───────────────────────────────────
  async function createList() {
    const name = newListName.trim();
    if (!name) return;
    const ref = await addDoc(
      collection(db, 'groups', groupCode, 'lists'),
      { name, createdBy: username, createdAt: serverTimestamp() }
    );
    setNewListName('');
    setShowNewListModal(false);
    setCurrentListId(ref.id);
  }

  // ── Delete list (with confirmation) ──────────────
  function askDeleteList(listId, listName) {
    Alert.alert(
      'Borrar lista',
      `¿Seguro que querés borrar "${listName}"?\nSe van a eliminar todos sus ítems y no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar', style: 'destructive', onPress: () => deleteList(listId) },
      ]
    );
  }

  async function deleteList(listId) {
    // Delete all items first, then the list document
    const itemsSnap = await getDocs(
      collection(db, 'groups', groupCode, 'lists', listId, 'items')
    );
    await Promise.all(itemsSnap.docs.map(d => deleteDoc(d.ref)));
    await deleteDoc(doc(db, 'groups', groupCode, 'lists', listId));
  }

  // ── Add item ──────────────────────────────────────
  async function addItem() {
    const text = newItemText.trim();
    if (!text || !currentListId) return;
    setNewItemText('');
    await addDoc(
      collection(db, 'groups', groupCode, 'lists', currentListId, 'items'),
      { text, done: false, by: username, createdAt: serverTimestamp() }
    );
  }

  // ── Toggle item done ──────────────────────────────
  async function toggleItem(item) {
    await updateDoc(
      doc(db, 'groups', groupCode, 'lists', currentListId, 'items', item.id),
      { done: !item.done }
    );
  }

  // ── Delete single item ────────────────────────────
  async function deleteItem(itemId) {
    await deleteDoc(
      doc(db, 'groups', groupCode, 'lists', currentListId, 'items', itemId)
    );
  }

  // ── Clear checked items ───────────────────────────
  function askClearDone() {
    const doneCount = items.filter(i => i.done).length;
    if (doneCount === 0) return;
    Alert.alert(
      'Limpiar tachados',
      `¿Eliminar los ${doneCount} ítem${doneCount > 1 ? 's' : ''} tachados?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar', style: 'destructive',
          onPress: () => Promise.all(
            items.filter(i => i.done).map(i => deleteItem(i.id))
          ),
        },
      ]
    );
  }

  // ── Render item row ───────────────────────────────
  function renderItem({ item }) {
    return (
      <View style={[styles.itemCard, item.done && styles.itemCardDone]}>
        <TouchableOpacity
          style={[styles.checkCircle, item.done && styles.checkCircleDone]}
          onPress={() => toggleItem(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          {item.done && <Ionicons name="checkmark" size={15} color={colors.white} />}
        </TouchableOpacity>

        <View style={styles.itemInfo}>
          <Text style={[styles.itemText, item.done && styles.itemTextDone]} numberOfLines={2}>
            {item.text}
          </Text>
          <Text style={styles.itemBy}>por {item.by}</Text>
        </View>

        <TouchableOpacity
          style={styles.delItemBtn}
          onPress={() => deleteItem(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
        >
          <Ionicons name="trash-outline" size={18} color={colors.red} />
        </TouchableOpacity>
      </View>
    );
  }

  const activeList  = lists.find(l => l.id === currentListId);
  const doneCount   = items.filter(i => i.done).length;

  return (
    <View style={styles.root}>

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {groupName || 'Listas'}
        </Text>
        <TouchableOpacity
          style={styles.newListBtn}
          onPress={() => setShowNewListModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color={colors.accentDark} />
          <Text style={styles.newListBtnText}>Nueva lista</Text>
        </TouchableOpacity>
      </View>

      {/* ── List tabs ── */}
      {!loadingLists && lists.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContent}
        >
          {lists.map(l => {
            const active = l.id === currentListId;
            return (
              <View key={l.id} style={styles.tabGroup}>
                <TouchableOpacity
                  style={[styles.tabPill, active && styles.tabPillActive]}
                  onPress={() => setCurrentListId(l.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {l.name}
                  </Text>
                </TouchableOpacity>
                {/* Delete list button — visible and tappable */}
                <TouchableOpacity
                  style={[styles.tabDelBtn, active && styles.tabDelBtnActive]}
                  onPress={() => askDeleteList(l.id, l.name)}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="close-circle"
                    size={17}
                    color={active ? colors.accent : colors.text3}
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── Items ── */}
      <View style={styles.content}>
      {loadingLists || loadingItems ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : lists.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>
            No hay listas todavía.{'\n'}Creá la primera con el botón de arriba.
          </Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>
            Lista vacía.{'\n'}Agregá el primer ítem abajo.
          </Text>
        </View>
      ) : (
        <View style={styles.itemsBody}>
          {/* Clear done items shortcut */}
          {doneCount > 0 && (
            <TouchableOpacity style={styles.clearDoneBtn} onPress={askClearDone} activeOpacity={0.7}>
              <Ionicons name="checkmark-done-outline" size={14} color={colors.text2} />
              <Text style={styles.clearDoneText}>
                Limpiar {doneCount} tachado{doneCount > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          )}
          <FlatList
            key={currentListId}
            style={styles.itemsFlatList}
            data={items}
            keyExtractor={i => i.id}
            renderItem={renderItem}
            contentContainerStyle={styles.itemsList}
          />
        </View>
      )}
      </View>

      {/* ── Add item footer ── */}
      {currentListId && (
        <View style={styles.footer}>
          <TextInput
            style={styles.footerInput}
            value={newItemText}
            onChangeText={setNewItemText}
            placeholder={activeList ? `Agregar a "${activeList.name}"...` : 'Agregar ítem...'}
            placeholderTextColor={colors.text3}
            returnKeyType="done"
            onSubmitEditing={addItem}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addItem} activeOpacity={0.8}>
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Modal: nueva lista ── */}
      <Modal
        visible={showNewListModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewListModal(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setShowNewListModal(false)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <Text style={styles.modalTitle}>Nueva lista</Text>
            <TextInput
              style={styles.modalInput}
              value={newListName}
              onChangeText={setNewListName}
              placeholder="Ej: Supermercado, Ferretería, Tareas..."
              placeholderTextColor={colors.text3}
              autoFocus
              maxLength={30}
              returnKeyType="done"
              onSubmitEditing={createList}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => { setShowNewListModal(false); setNewListName(''); }}
                activeOpacity={0.7}
              >
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnConfirm, !newListName.trim() && styles.btnDisabled]}
                onPress={createList}
                disabled={!newListName.trim()}
                activeOpacity={0.8}
              >
                <Text style={styles.btnConfirmText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: colors.bgSoft },
  content:         { flex: 1, minHeight: 0 },
  loader:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:           { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyIcon:       { fontSize: 44 },
  emptyText:       { fontSize: 15, color: colors.text2, textAlign: 'center', lineHeight: 22 },

  // Top bar
  topBar:          { flexShrink: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.bgSoft, borderBottomWidth: 1, borderBottomColor: colors.border },
  topBarTitle:     { fontSize: 17, fontWeight: '700', color: colors.text },
  newListBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accentSoft, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full },
  newListBtnText:  { fontSize: 13, fontWeight: '700', color: colors.accentDark },

  // Tabs
  tabsScroll:      { flexGrow: 0, flexShrink: 0, height: 54, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabsContent:     { height: 54, flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center' },
  tabGroup:        { flexDirection: 'row', alignItems: 'center', gap: 0 },
  tabPill:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1, borderColor: colors.borderMd, backgroundColor: colors.bg },
  tabPillActive:   { backgroundColor: colors.accent, borderColor: colors.accent },
  tabText:         { fontSize: 13, fontWeight: '600', color: colors.text2 },
  tabTextActive:   { color: colors.white },
  tabDelBtn:       { width: 30, height: 36, alignItems: 'center', justifyContent: 'center' },
  tabDelBtnActive: { color: colors.blackSoft }, 

  // Clear done
  clearDoneBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', marginRight: 14, marginTop: 10, marginBottom: 2, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  clearDoneText:   { fontSize: 12, color: colors.text2, fontWeight: '600' },

  // Items
  itemsBody:       { flex: 1 },
  itemsFlatList:   { flex: 1 },
  itemsList:       { padding: 12, gap: 8, paddingBottom: 16 },
  itemCard:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 13, borderWidth: 1, borderColor: colors.border, ...shadow },
  itemCardDone:    { opacity: 0.5 },
  checkCircle:     { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.borderMd, alignItems: 'center', justifyContent: 'center' },
  checkCircleDone: { backgroundColor: colors.green, borderColor: colors.green },
  itemInfo:        { flex: 1 },
  itemText:        { fontSize: 15, fontWeight: '600', color: colors.text },
  itemTextDone:    { textDecorationLine: 'line-through', color: colors.text3 },
  itemBy:          { fontSize: 11, color: colors.text3, marginTop: 2 },
  delItemBtn:      { padding: 6, borderRadius: radius.sm, backgroundColor: colors.redSoft },

  // Footer
  footer:          { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  footerInput:     { flex: 1, backgroundColor: colors.bgSoft, borderWidth: 1, borderColor: colors.borderMd, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: colors.text },
  addBtn:          { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },

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
