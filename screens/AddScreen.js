import React, { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, TouchableOpacity, StyleSheet, View, Alert, BackHandler, ActivityIndicator } from "react-native";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "../firebase";
import { LinearGradient } from "expo-linear-gradient";
import SearchBar from "../components/meetups/SearchBar";
import FilterModal from "../components/meetups/FiltersModal";
import EventCard from "../components/meetups/EventCard";
import SponsoredEventCard from "../components/meetups/SponsoredEventCard";
import { Ionicons } from '@expo/vector-icons';

// Removed global definitions of tags, groupSizes, and INITIAL_LOAD_LIMIT from here.

const MeetupScreen = ({ onOpenEventDetailsModal, onOpenCreateMeetupModal }) => {
  // Define constants INSIDE the component to ensure proper scoping
  const tags = [
    "Music", "Sports", "Karaoke", "Clubs", "Beach", "Dating",
    "Study", "Language Exchange", "Games", "Hiking", "Cooking",
    "Art", "Theater", "Movies", "Volunteer", "Meetups", "Video Games", "Tourism"
  ];

  const groupSizes = Array.from({ length: 25 }, (_, i) => (i + 1) * 2);

  const INITIAL_LOAD_LIMIT = 10; // Define here within the component's scope

  const [allRecommendedMeetups, setAllRecommendedMeetups] = useState([]);
  const [allSponsoredMeetups, setAllSponsoredMeetups] = useState([]);

  const [filteredRecommendedMeetups, setFilteredRecommendedMeetups] = useState([]);
  const [filteredSponsoredMeetups, setFilteredSponsoredMeetups] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedGroupSize, setSelectedGroupSize] = useState(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const isFilterActive = searchTerm !== "" || selectedTags.length > 0 || selectedGroupSize !== null;

  // Removed BackHandler-related useEffect hook as it's not applicable in web environments.
  // If this is strictly a React Native mobile app, you would re-add it.

  useEffect(() => {
    const fetchMeetups = async () => {
      setLoading(true);
      try {
        const recommendedQuery = query(collection(db, "meetups", "Recommended_Meetups", "events"), limit(INITIAL_LOAD_LIMIT));
        const recommendedSnapshot = await getDocs(recommendedQuery);
        const recommendedData = recommendedSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          sourceCollection: "Recommended_Meetups",
        }));
        setAllRecommendedMeetups(recommendedData);
        setFilteredRecommendedMeetups(recommendedData);

        const sponsoredQuery = query(collection(db, "meetups", "Sponsored_Meetups", "events"), limit(INITIAL_LOAD_LIMIT));
        const sponsoredSnapshot = await getDocs(sponsoredQuery);
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
      } finally {
        setLoading(false);
      }
    };

    fetchMeetups();
  }, []);

  useEffect(() => {
    if (!loading) {
      applyAllFilters(searchTerm, selectedTags, selectedGroupSize);
    }
  }, [searchTerm, selectedTags, selectedGroupSize, allRecommendedMeetups, allSponsoredMeetups, loading]);


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

  // Render a loading spinner or skeleton if loading
  if (loading) {
    return (
      <LinearGradient colors={["#D9043D", "#730220"]} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading meetups...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#D9043D", "#730220"]} style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.searchFilterContainer}>
          <SearchBar value={searchTerm} onChangeText={handleSearch} />

          {/* Updated Filter Button */}
          <TouchableOpacity
            onPress={toggleFilterVisibility}
            style={[
              styles.filterButton,
              isFilterActive ? styles.filterButtonActive : {}
            ]}
          >
            <Ionicons
              name={isFilterActive ? "options" : "options-outline"}
              size={24}
              color="white" // Icon color is white
            />
          </TouchableOpacity>
        </View>

        {isFilterVisible && (
          <View style={styles.filterSection}>
            <FilterModal
              tags={tags} // Now correctly scoped
              selectedTags={selectedTags}
              onTagSelect={handleTagFilter}
              groupSizes={groupSizes} // Now correctly scoped
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
          onPress={() => onOpenCreateMeetupModal('create', {})}
        >
          <Text style={styles.createButtonText}>Create Your Own Meetup!</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D9043D',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
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
    backgroundColor: '#F2BB47', // Nice yellow background
    borderRadius: 15, // Rounded corners
    padding: 10, // Padding around the icon
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterButtonActive: {
    backgroundColor: '#E0A800', // Slightly darker yellow when active for feedback
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