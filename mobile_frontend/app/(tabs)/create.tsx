import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EVENT_CATEGORIES, eventApi } from '@/services/api';
import { BrandHeader, Chip, Glass, GradientButton, Screen } from '@/components/happnix/kit';
import { colors, fonts } from '@/constants/brand';

export default function CreateScreen() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    locationName: '',
    date: '',
    time: '',
    category: 'House party',
    price: '',
    maxAttendees: '',
  });
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function publish() {
    if (!form.title || !form.description || !form.locationName) {
      Alert.alert('Missing details', 'Title, description, and location are required.');
      return;
    }

    const formData = new FormData();
    formData.append('title', form.title.trim());
    formData.append('description', form.description.trim());
    formData.append('locationName', form.locationName.trim());
    formData.append('latitude', '26.9124');
    formData.append('longitude', '75.7873');
    formData.append('eventCategory', form.category);
    formData.append('price', form.price || '0');
    formData.append('currency', 'INR');
    formData.append('maxAttendees', form.maxAttendees || '0');
    if (form.date || form.time) formData.append('startLabel', `${form.date} ${form.time}`.trim());

    setLoading(true);
    try {
      await eventApi.create(formData);
      Alert.alert('Published', 'Your Happnix event is live.');
      setForm({ title: '', description: '', locationName: '', date: '', time: '', category: 'House party', price: '', maxAttendees: '' });
    } catch (error: any) {
      Alert.alert('Could not publish', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <BrandHeader title="Create" subtitle="Host a party, gig, meetup, or private experience" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Glass style={styles.card}>
              <Text style={styles.section}>Event Builder</Text>
              <Input label="Event title" value={form.title} onChangeText={(v) => update('title', v)} placeholder="Club Utopia DJ Set" />
              <Input label="Description" value={form.description} onChangeText={(v) => update('description', v)} placeholder="Tell people the vibe..." multiline style={styles.textArea} />
              <Input label="Location" value={form.locationName} onChangeText={(v) => update('locationName', v)} placeholder="C-Scheme, Jaipur" />
              <View style={styles.row}>
                <Input label="Date" value={form.date} onChangeText={(v) => update('date', v)} placeholder="2026-06-06" wrapperStyle={{ flex: 1 }} />
                <Input label="Time" value={form.time} onChangeText={(v) => update('time', v)} placeholder="22:00" wrapperStyle={{ flex: 1 }} />
              </View>
              <Text style={styles.section}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {EVENT_CATEGORIES.slice(0, 14).map((item) => (
                  <Chip key={item} label={item} active={form.category === item} onPress={() => update('category', item)} />
                ))}
              </ScrollView>
              <View style={styles.row}>
                <Input label="Price" value={form.price} onChangeText={(v) => update('price', v.replace(/\D/g, ''))} placeholder="0" keyboardType="number-pad" wrapperStyle={{ flex: 1 }} />
                <Input label="Capacity" value={form.maxAttendees} onChangeText={(v) => update('maxAttendees', v.replace(/\D/g, ''))} placeholder="100" keyboardType="number-pad" wrapperStyle={{ flex: 1 }} />
              </View>
              <GradientButton label="Publish Event" onPress={publish} loading={loading} />
            </Glass>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Screen>
  );
}

type InputProps = React.ComponentProps<typeof TextInput> & {
  label: string;
  wrapperStyle?: object;
};

function Input({ label, wrapperStyle, style, ...props }: InputProps) {
  return (
    <View style={[{ gap: 7 }, wrapperStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} placeholderTextColor={colors.faint} style={[styles.input, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 120 },
  card: { padding: 16, gap: 14 },
  section: { fontFamily: fonts.black, color: colors.faint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2 },
  row: { flexDirection: 'row', gap: 12 },
  chips: { gap: 8, paddingBottom: 2 },
  label: { fontFamily: fonts.black, color: colors.faint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 14,
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  textArea: { minHeight: 110, textAlignVertical: 'top', paddingTop: 14 },
});
