import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { TouchableOpacity, Text, View, ScrollView, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';

const FilterModal = ({
    tags,
    selectedTags,
    onTagSelect,
    groupSizes,
    selectedGroupSize,
    onGroupSizeSelect, // This will now be called onSlidingComplete
    onClose,
    onResetFilters
}) => {
    const maxGroupSize = groupSizes[groupSizes.length - 1];

    // Use internal state for the slider's current position
    // Initialize it based on the prop, or the first group size
    const [currentSliderValue, setCurrentSliderValue] = useState(
        selectedGroupSize && groupSizes.includes(selectedGroupSize) ? selectedGroupSize : groupSizes[0]
    );

    // Keep the internal slider value in sync if selectedGroupSize changes from parent (e.g., on reset)
    useEffect(() => {
        if (selectedGroupSize === null || !groupSizes.includes(selectedGroupSize)) {
            // If selectedGroupSize is reset or invalid, default to the smallest group size
            setCurrentSliderValue(groupSizes[0]);
        } else if (currentSliderValue !== selectedGroupSize) {
            // Only update if the prop is different from the internal state
            setCurrentSliderValue(selectedGroupSize);
        }
    }, [selectedGroupSize, groupSizes]); // Add groupSizes to dependencies as it can change (though unlikely here)


    const getNearestGroupSize = (value) => {
        return groupSizes.reduce((prev, curr) =>
            (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev)
        );
    };

    return (
        <View style={styles.filterModalContainer}>
            <View style={styles.filterModal}>
                <View style={styles.header}>
                    <Text style={styles.modalTitle}>Filter Meetups</Text>
                    <View style={styles.headerActionIcons}>
                        <TouchableOpacity onPress={onResetFilters} style={styles.headerIconButton}>
                            <Ionicons name="refresh-outline" size={24} color="#EAEAEA" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onClose} style={styles.headerIconButton}>
                            <Ionicons name="checkmark-circle-outline" size={24} color="#D9043D" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.content}>
                    {/* Tags Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="pricetag-outline" size={24} color="#EAEAEA" style={styles.sectionIcon} />
                            <Text style={styles.sectionTitle}>Tags</Text>
                        </View>
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

                    {/* Group Size Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="people-outline" size={24} color="#EAEAEA" style={styles.sectionIcon} />
                            <Text style={styles.sectionTitle}>Group Size</Text>
                        </View>
                        <View style={styles.sliderWrapper}>
                            <Slider
                                style={styles.slider}
                                minimumValue={groupSizes[0]}
                                maximumValue={maxGroupSize}
                                step={1} // Keep step=1 for smooth dragging between discrete points
                                value={currentSliderValue} // Now controlled by internal state
                                onValueChange={(value) => setCurrentSliderValue(value)} // Update internal state on drag
                                onSlidingComplete={(value) => onGroupSizeSelect(getNearestGroupSize(value))} // Only update parent state when dragging stops
                                minimumTrackTintColor="#D9043D"
                                maximumTrackTintColor="#888"
                                thumbTintColor="#EAEAEA"
                            />
                            <View style={[
                                styles.sliderValueBubble,
                                {
                                    // Recalculate position based on currentSliderValue
                                    left: `${((currentSliderValue - groupSizes[0]) / (maxGroupSize - groupSizes[0])) * 100}%`,
                                    transform: [{ translateX: -15 }]
                                }
                            ]}>
                                <Text style={styles.sliderValueText}>{getNearestGroupSize(currentSliderValue)}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    filterModalContainer: {
        flex: 1,
        marginHorizontal: 20,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0)',
    },
    filterModal: {
        backgroundColor: '#000',
        borderRadius: 25,
        padding: 20,
        paddingBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: '#EAEAEA',
    },
    headerActionIcons: {
        flexDirection: 'row',
        gap: 15,
    },
    headerIconButton: {
        padding: 5,
    },
    content: {
        gap: 20,
        marginBottom: 0,
    },
    section: {
        marginBottom: 0,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionIcon: {
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#EAEAEA',
    },
    tagsContainer: {
        flexDirection: "row",
        paddingVertical: 5,
    },
    tagChip: {
        backgroundColor: '#730220',
        paddingVertical: 8,
        paddingHorizontal: 15,
        marginRight: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedTagChip: {
        backgroundColor: '#D9043D',
        borderColor: '#EAEAEA',
        borderWidth: 1.5,
    },
    tagText: {
        fontSize: 14,
        color: 'white',
        fontWeight: "bold",
        textAlign: "center",
    },
    selectedTagText: {},
    sliderWrapper: {
        flex: 1,
        height: 40,
        justifyContent: 'center',
        position: 'relative',
        paddingHorizontal: 5,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderValueBubble: {
        position: 'absolute',
        backgroundColor: '#D9043D',
        borderRadius: 15,
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignItems: 'center',
        justifyContent: 'center',
        bottom: 30,
    },
    sliderValueText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 'bold',
    },
});

export default FilterModal;