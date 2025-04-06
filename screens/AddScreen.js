import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/core";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { LinearGradient } from "expo-linear-gradient";
import SearchBar from "../components/meetups/SearchBar";
import FilterModal from "../components/meetups/FiltersModal";
import EventCard from "../components/meetups/EventCard";
import { Ionicons } from '@expo/vector-icons';

const tags = [
  "Music", "Sports", "Karaoke", "Clubs", "Beach", "Dating",
  "Study", "Language Exchange", "Games", "Hiking", "Cooking",
  "Art", "Theater", "Movies", "Volunteer", "Meetups", "Video Games", "Tourism"
];

const groupSizes = [2, 4, 6, 10, 20];

const MeetupScreen = () => {
  const navigation = useNavigation();
  const [recommendedMeetups, setRecommendedMeetups] = useState([]);
  const [filteredMeetups, setFilteredMeetups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedGroupSize, setSelectedGroupSize] = useState(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  useEffect(() => {
    const fetchRecommendedMeetups = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "meetups", "Recommended_Meetups", "events"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecommendedMeetups(data);
        setFilteredMeetups(data);
      } catch (error) {
        console.error("Error fetching recommended meetups:", error);
      }
    };

    fetchRecommendedMeetups();
  }, []);

  const handleSearch = (text) => {
    setSearchTerm(text);
    filterEvents(text, selectedTags, selectedGroupSize);
  };

  const handleTagFilter = (tag) => {
    const updatedSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter((selectedTag) => selectedTag !== tag)
      : [...selectedTags, tag];

    setSelectedTags(updatedSelectedTags);
    filterEvents(searchTerm, updatedSelectedTags, selectedGroupSize);
  };

  const handleGroupSizeSelect = (size) => {
    setSelectedGroupSize(size);
    filterEvents(searchTerm, selectedTags, size);
  };

  const filterEvents = (searchTerm, tags, groupSize) => {
    let filtered = recommendedMeetups;

    if (searchTerm) {
      filtered = filtered.filter((event) =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (tags.length > 0) {
      filtered = filtered.filter((event) =>
        event.tags.some((tag) => tags.includes(tag))
      );
    }

    if (groupSize) {
      filtered = filtered.filter((event) => event.groupSize <= groupSize);
    }

    setFilteredMeetups(filtered);
  };

  const toggleFilterVisibility = () => {
    setIsFilterVisible(!isFilterVisible);
  };

  return (
    <LinearGradient colors={["#D9043D", "#730220"]} style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.searchFilterContainer}>
          <SearchBar value={searchTerm} onChangeText={handleSearch} />
          
          {/* Filter Icon */}
          <TouchableOpacity onPress={toggleFilterVisibility} style={styles.filterButton}>
            <Ionicons 
              name="filter" 
              size={24} 
              color={selectedTags.length > 0 || selectedGroupSize ? "red" : "#0367A6"}
            />
          </TouchableOpacity>
        </View>

        {/* Conditional Filter Section */}
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
            />
          </View>
        )}

        <Text style={styles.title}>Recommended Meetups</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventsGallery}>
          {filteredMeetups.map((item) => (
            <EventCard
              key={item.id}
              event={item}
              onPress={() => navigation.navigate("EventDetails", { eventId: item.id })}
            />
          ))}
        </ScrollView>
        <Text style={styles.title}>Sponsored Meetups</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventsGallery}>
          {filteredMeetups.map((item) => (
            <EventCard
              key={item.id}
              event={item}
              onPress={() => navigation.navigate("EventDetails", { eventId: item.id })}
            />
          ))}
        </ScrollView>
      </ScrollView>
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
    backgroundColor: "#fff",
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
    marginTop: 0,  // Ensures the filter section pushes content down
  },
});

export default MeetupScreen;
