import React from 'react';
import { TouchableOpacity, Text, View, ScrollView, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';

const FilterModal = ({ tags, selectedTags, onTagSelect, groupSizes, selectedGroupSize, onGroupSizeSelect, onClose }) => {
  const sliderSize = selectedGroupSize || 2;
  
  return (
    <View style={styles.filterModal}>
      <View style={styles.header}>
        <Text style={styles.modalTitle}>Filter:</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={16} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Tags Row with Icon */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag-outline" size={24} color="#FFFFFF" style={styles.sectionIcon} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagsContainer} 
            >
              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagChip, 
                    selectedTags.includes(tag) && styles.selectedTagChip
                  ]}
                  onPress={() => onTagSelect(tag)}
                >
                  <Text 
                    style={[
                      styles.tagText, 
                      selectedTags.includes(tag) && styles.selectedTagText
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Group Size with Icon inline with slider */}
        <View style={styles.section}>
          <View style={styles.sliderContainer}>
            <Ionicons name="people-outline" size={24} color="#FFFFFF" style={styles.sectionIcon} />
            <View style={styles.sliderWrapper}>
              <Slider
                style={styles.slider}
                minimumValue={4}
                maximumValue={30}
                step={1}
                value={sliderSize}
                onValueChange={onGroupSizeSelect}
                minimumTrackTintColor="#0367A6"
                maximumTrackTintColor="#EAEAEA"
                thumbTintColor="#0367A6"
              />
              <View style={[styles.sliderValueBubble, {
                left: `${((sliderSize - 4) / 26) * 100}%`
              }]}>
                <Text style={styles.sliderValueText}>{sliderSize}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  filterModal: {
    padding: 12,
    borderRadius: 12,
    overflow: "visible",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: '#FFFFFF',
  },
  content: {
    gap: 10,
  },
  section: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    paddingVertical: 0,
  },
  tagChip: {
    backgroundColor: "#0367A6",
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 6,
    borderRadius: 12,
  },
  selectedTagChip: {
    backgroundColor: "#D9043D",
    borderColor: "#0367A6",
  },
  tagText: {
    fontSize: 14,
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  selectedTagText: {
    color: "#FFFFFF",
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderWrapper: {
    flex: 1,
    height: 28,
    justifyContent: 'center',
    position: 'relative',
  },
  slider: {
    width: '100%',
    height: 28,
  },
  sliderValueBubble: {
    position: 'absolute',
    backgroundColor: '#0367A6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12, // Half the width of the bubble to center it
    top: 25,
  },
  sliderValueText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  minValue: {
    fontSize: 11,
    color: '#FFFFFF',
    width: 15,
    marginRight: 4,
  },
  maxValue: {
    fontSize: 11,
    color: '#FFFFFF',
    width: 15,
    textAlign: 'right',
    marginLeft: 4,
  },
});

export default FilterModal;