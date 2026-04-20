import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

interface DatePickerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (date: Date) => void;
  initialDate?: Date;
}

export default function DatePickerModal({ visible, onClose, onSave, initialDate }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(initialDate || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate || null);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
  };

  const renderCalendarDays = () => {
    const days = [];
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }
    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected = selectedDate && 
        selectedDate.getDate() === d && 
        selectedDate.getMonth() === currentMonth.getMonth() && 
        selectedDate.getFullYear() === currentMonth.getFullYear();

      days.push(
        <TouchableOpacity
          key={`day-${d}`}
          onPress={() => handleDateSelect(d)}
          style={[styles.dayCell, styles.dayCellActive, isSelected && styles.dayCellSelected]}
        >
          <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{d}</Text>
        </TouchableOpacity>
      );
    }
    return days;
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(2, 6, 23, 0.75)' }]}>
          <Pressable style={styles.backdropPressable} onPress={onClose} />
        </View>
      </Animated.View>

      <View style={styles.modalContainer} pointerEvents="box-none">
        <Animated.View 
          entering={SlideInDown.springify().damping(18).stiffness(150)} 
          exiting={SlideOutDown.duration(250)}
          style={styles.cardContainer}
        >
          <LinearGradient
            colors={['rgba(15, 23, 42, 0.92)', 'rgba(15, 23, 42, 0.85)', 'rgba(46, 16, 101, 0.7)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Select Event Date</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X color="#9ca3af" size={20} />
              </TouchableOpacity>
            </View>

            {/* Calendar Nav */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                <ChevronLeft color="#f8f9ff" size={20} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowYearPicker(!showYearPicker)} style={styles.monthLabelBtn}>
                <Text style={styles.monthLabelText}>
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                <ChevronRight color="#f8f9ff" size={20} />
              </TouchableOpacity>
            </View>

            {/* Weekdays */}
            <View style={styles.weekdaysRow}>
              {weekDays.map((day) => (
                <Text key={day} style={styles.weekdayText}>{day}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {renderCalendarDays()}
            </View>

            {/* Preview text */}
            <Text style={styles.previewText}>
              {selectedDate ? selectedDate.toDateString() : "No date selected"}
            </Text>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.clearBtn} onPress={() => setSelectedDate(null)}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={() => onSave(selectedDate || new Date())}
              >
                <Text style={styles.saveBtnText}>Save date</Text>
              </TouchableOpacity>
            </View>

          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropPressable: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: '94%',
    maxWidth: 420,
    borderRadius: 24,
    shadowColor: '#d946ef',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  cardGradient: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(103, 232, 249, 0.2)',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_900Black',
    color: '#fff',
  },
  closeBtn: {
    padding: 4,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  monthLabelText: {
    color: '#f8f9ff',
    fontSize: 16,
    fontWeight: '700',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayText: {
    fontSize: 12,
    color: 'rgba(248, 249, 255, 0.52)',
    width: '14.28%',
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  dayCellActive: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    margin: 2,
    width: '13%',
  },
  dayCellSelected: {
    backgroundColor: 'rgba(219, 39, 119, 0.62)',
    borderColor: 'rgba(71, 232, 255, 0.55)',
    shadowColor: '#0891b2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  dayText: {
    color: 'rgba(248, 249, 255, 0.92)',
    fontSize: 14,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '800',
  },
  previewText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#67e8f9',
    marginTop: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  clearBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  clearBtnText: {
    color: '#d1d5db',
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(8, 145, 178, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(8, 145, 178, 0.4)',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#a5f3fc',
    fontWeight: '600',
    fontSize: 15,
  }
});
