import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, StyleSheet, View, Alert, BackHandler } from "react-native";
// import { useNavigation } from "@react-navigation/core"; // No longer needed here if all navigation handled by props
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { LinearGradient } from "expo-linear-gradient";
import SearchBar from "../components/meetups/SearchBar";
import FilterModal from "../components/meetups/FiltersModal";
import EventCard from "../components/meetups/EventCard";
import SponsoredEventCard from "../components/meetups/SponsoredEventCard";
import { Ionicons } from '@expo/vector-icons';
// No longer import EventDetailsModal or CreateMeetupScreen directly here,
// as they are managed by TabNavigator and passed via props.

const tags = [
  "Music", "Sports", "Karaoke", "Clubs", "Beach", "Dating",
  "Study", "Language Exchange", "Games", "Hiking", "Cooking",
  "Art", "Theater", "Movies", "Volunteer", "Meetups", "Video Games", "Tourism"
];

const groupSizes = Array.from({ length: 25 }, (_, i) => (i + 1) * 2);

// MeetupScreen now accepts onOpenEventDetailsModal and onOpenCreateMeetupModal as props
const MeetupScreen = ({ onOpenEventDetailsModal, onOpenCreateMeetupModal }) => {
  // const navigation = useNavigation(); // Remove if not directly navigating elsewhere
  const [allRecommendedMeetups, setAllRecommendedMeetups] = useState([]);
  const [allSponsoredMeetups, setAllSponsoredMeetups] = useState([]);

  const [filteredRecommendedMeetups, setFilteredRecommendedMeetups] = useState([]);
  const [filteredSponsoredMeetups, setFilteredSponsoredMeetups] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedGroupSize, setSelectedGroupSize] = useState(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // Removed isEventDetailsModalVisible, selectedEventId, selectedSourceCollection,
  // isCreateMeetupModalVisible, createMeetupMode, createMeetupEventData

  const isFilterActive = searchTerm !== "" || selectedTags.length > 0 || selectedGroupSize !== null;

  // Handle Android back button for FilterModal only now
  useEffect(() => {
    const backAction = () => {
      if (isFilterVisible) {
        setIsFilterVisible(false);
        return true; // Consume the back button press
      }
      return false; // Let default back button behavior happen for other navigation
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [isFilterVisible]);


  useEffect(() => {
    const fetchMeetups = async () => {
      try {
        const recommendedSnapshot = await getDocs(collection(db, "meetups", "Recommended_Meetups", "events"));
        const recommendedData = recommendedSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          sourceCollection: "Recommended_Meetups",
        }));
        setAllRecommendedMeetups(recommendedData);
        setFilteredRecommendedMeetups(recommendedData);

        const sponsoredSnapshot = await getDocs(collection(db, "meetups", "Sponsored_Meetups", "events"));
        const sponsoredData = sponsoredSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          sourceCollection: "Sponsored_Meetups",
        }));
        setAllSponsoredMeetups(sponsoredData);
        setFilteredSponsoredMeetups(sponsoredData);

      } catch (error) {
        console.error("Error fetching meetups:", error);
        Alert.alert("Error", "Failed to load meetups");
      }
    };

    fetchMeetups();
  }, []);

  useEffect(() => {
    applyAllFilters(searchTerm, selectedTags, selectedGroupSize);
  }, [searchTerm, selectedTags, selectedGroupSize, allRecommendedMeetups, allSponsoredMeetups]);


  const handleSearch = (text) => {
    setSearchTerm(text);
  };

  const handleTagFilter = (tag) => {
    const updatedSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter((selectedTag) => selectedTag !== tag)
      : [...selectedTags, tag];
    setSelectedTags(updatedSelectedTags);
  };

  const handleGroupSizeSelect = (size) => {
    setSelectedGroupSize(size);
  };

  const applyAllFilters = (currentSearchTerm, currentTags, currentGroupSize) => {
    let filteredRec = allRecommendedMeetups;
    if (currentSearchTerm) {
      filteredRec = filteredRec.filter((event) =>
        event.title.toLowerCase().includes(currentSearchTerm.toLowerCase())
      );
    }
    if (currentTags.length > 0) {
      filteredRec = filteredRec.filter((event) =>
        event.tags && event.tags.some((tag) => currentTags.includes(tag))
      );
    }
    if (currentGroupSize) {
      filteredRec = filteredRec.filter((event) => event.groupSize <= currentGroupSize);
    }
    setFilteredRecommendedMeetups(filteredRec);

    let filteredSpon = allSponsoredMeetups;
    if (currentSearchTerm) {
      filteredSpon = filteredSpon.filter((event) =>
        event.title.toLowerCase().includes(currentSearchTerm.toLowerCase())
      );
    }
    if (currentTags.length > 0) {
      filteredSpon = filteredSpon.filter((event) =>
        event.tags && event.tags.some((tag) => currentTags.includes(tag))
      );
    }
    if (currentGroupSize) {
      filteredSpon = filteredSpon.filter((event) => event.groupSize <= currentGroupSize);
    }
    setFilteredSponsoredMeetups(filteredSpon);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedTags([]);
    setSelectedGroupSize(null);
    setIsFilterVisible(false);
  };

  const toggleFilterVisibility = () => {
    setIsFilterVisible(!isFilterVisible);
  };

  return (
    <LinearGradient colors={["#D9043D", "#730220"]} style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.searchFilterContainer}>
          <SearchBar value={searchTerm} onChangeText={handleSearch} />

          <TouchableOpacity
            onPress={toggleFilterVisibility}
            style={[
              styles.filterButton,
              isFilterActive ? styles.filterButtonActive : styles.filterButtonInactive
            ]}
          >
            <Ionicons
              name="filter"
              size={24}
              color={isFilterActive ? "#D9043D" : "#0367A6"}
            />
          </TouchableOpacity>
        </View>

        {isFilterVisible && (
          <View style={styles.filterSection}>
            <FilterModal
              tags={tags}
              selectedTags={selectedTags}
              onTagSelect={handleTagFilter}
              groupSizes={groupSizes}
              selectedGroupSize={selectedGroupSize}
              onGroupSizeSelect={handleGroupSizeSelect}
              onClose={() => setIsFilterVisible(false)}
              onResetFilters={handleResetFilters}
            />
          </View>
        )}

        <Text style={styles.title}>Sponsored Meetup Ideas</Text>
        {filteredSponsoredMeetups.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventsGallery}>
            {filteredSponsoredMeetups.map((item) => (
              <SponsoredEventCard
                key={item.id}
                event={item}
                // Call the prop function
                onPress={() => onOpenEventDetailsModal(item.id, item.sourceCollection)}
              />
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noEventsText}>No sponsored events match your filters.</Text>
        )}

        <Text style={styles.title}>Rauxa Meetup Ideas</Text>
        {filteredRecommendedMeetups.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventsGallery}>
            {filteredRecommendedMeetups.map((item) => (
              <EventCard
                key={item.id}
                event={item}
                // Call the prop function
                onPress={() => onOpenEventDetailsModal(item.id, item.sourceCollection)}
              />
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noEventsText}>No recommended events match your filters.</Text>
        )}

        <Text style={styles.title}>Got Your Own Idea?</Text>
        <TouchableOpacity
          style={styles.createButton}
          // Call the prop function
          onPress={() => onOpenCreateMeetupModal('create', {})}
        >
          <Text style={styles.createButtonText}>Create Your Own Meetup!</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* EventDetailsModal and CreateMeetupScreen are now rendered by TabNavigator */}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
  },
  searchFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 50,
    paddingLeft: 20,
    paddingRight: 20,
  },
  filterButton: {
    padding: 10,
    borderRadius: 50,
  },
  filterButtonActive: {
    backgroundColor: '#000',
  },
  filterButtonInactive: {
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "left",
    marginBottom: 5,
    marginLeft: 25,
    marginTop: 10,
  },
  eventsGallery: {
    paddingLeft: 10,
  },
  filterSection: {
    marginTop: 0,
  },
  noEventsText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF80",
    marginLeft: 25,
    marginTop: 10,
  },
  createButton: {
    backgroundColor: "#0367A6",
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 0,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default MeetupScreen;