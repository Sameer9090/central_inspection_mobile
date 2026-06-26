import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API } from "../services/api";

const { width } = Dimensions.get("window");
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;
const BOTTOM_NAV_HEIGHT = Platform.OS === "ios" ? 20 : 32;

const Icons = {
  Calendar: () => <Feather name="calendar" size={14} color="#fff" />,
  FileText: () => <Feather name="file-text" size={14} color="#fff" />,
  MapPin: () => <Feather name="map-pin" size={12} color="#666" />,
  Clock: () => <Feather name="clock" size={12} color="#666" />,
  ChevronRight: () => <Feather name="chevron-right" size={16} color="#fff" />,
  ChevronLeft: () => <Feather name="chevron-left" size={16} color="#fff" />,
  Inbox: () => <Feather name="inbox" size={40} color="#ccc" />,
  ArrowLeft: () => <Feather name="arrow-left" size={20} color="#fff" />,
  Search: () => <Feather name="search" size={16} color="#666" />,
  X: () => <Feather name="x" size={16} color="#666" />,
  Filter: () => <Feather name="filter" size={14} color="#fff" />,
  ChevronDown: () => <Feather name="chevron-down" size={16} color="#666" />,
};

export default function ApplicationsScreen() {
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [debouncedSearch, selectedLocation, allApplications]);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  const loadApplications = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await API.get("/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data.data || [];
      setAllApplications(data);

      const uniqueLocations = [
        ...new Set(
          data.map((item: any) => item.submission_location).filter(Boolean),
        ),
      ];
      setLocations(uniqueLocations as string[]);
    } catch (error: any) {
      console.log(error?.response?.data);
      Alert.alert("Error", "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...allApplications];

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.appl_ref_no?.toLowerCase().includes(query) ||
          item.name_of_the_establishment?.toLowerCase().includes(query),
      );
    }

    if (selectedLocation) {
      filtered = filtered.filter(
        (item) => item.submission_location === selectedLocation,
      );
    }

    setFilteredApplications(filtered);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredApplications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredApplications.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setDebouncedSearch("");
  };

  const clearLocationFilter = () => {
    setSelectedLocation("");
    setShowLocationDropdown(false);
  };

  const saveInspectionDate = async (
    applRefNo: string,
    inspectionDate: string,
    onSuccess: () => void,
  ) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await API.post(
        "/set-inspection-date",
        { appl_ref_no: applRefNo, inspection_date: inspectionDate },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      Alert.alert("Success", "Inspection Date Saved Successfully");
      onSuccess();
    } catch (error: any) {
      console.log("FULL ERROR:", error?.response?.data);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to Save Inspection Date",
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, styles.center]}
        edges={["top", "left", "right"]}
      >
        <StatusBar barStyle="light-content" backgroundColor="#1a1a4e" />
        <View style={styles.statusBarBg} />
        <ActivityIndicator size="large" color="#1a1a4e" />
        <Text style={styles.loadingText}>Loading Applications...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a4e" />

      {/* Just a thin status bar background, no extra spacer */}
      <View style={styles.statusBarBg} />

      {/* Compact Header - single row, minimal padding */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icons.ArrowLeft />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Applications</Text>
          <Text style={styles.headerSubtitle}>
            In Queue • {filteredApplications.length}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Search & Filter Section */}
      <View style={styles.filterContainer}>
        <View style={styles.searchWrapper}>
          <Icons.Search />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ref no, establishment..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Icons.X />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.locationFilterWrapper}>
          <TouchableOpacity
            style={styles.locationDropdown}
            onPress={() => setShowLocationDropdown(!showLocationDropdown)}
          >
            <View style={styles.locationDropdownLeft}>
              <Icons.Filter />
              <Text
                style={[
                  styles.locationDropdownText,
                  selectedLocation && styles.locationDropdownTextActive,
                ]}
                numberOfLines={1}
              >
                {selectedLocation || "Filter by Location"}
              </Text>
            </View>
            <Feather
              name={showLocationDropdown ? "chevron-up" : "chevron-down"}
              size={16}
              color="#666"
            />
          </TouchableOpacity>

          {selectedLocation ? (
            <TouchableOpacity
              style={styles.clearFilterBtn}
              onPress={clearLocationFilter}
            >
              <Icons.X />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Location Dropdown */}
      {showLocationDropdown && locations.length > 0 && (
        <View style={styles.dropdownContainer}>
          <FlatList
            data={locations}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.dropdownItem,
                  selectedLocation === item && styles.dropdownItemActive,
                ]}
                onPress={() => {
                  setSelectedLocation(item);
                  setShowLocationDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    selectedLocation === item && styles.dropdownItemTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {item}
                </Text>
                {selectedLocation === item && (
                  <Feather name="check" size={14} color="#1a1a4e" />
                )}
              </TouchableOpacity>
            )}
            style={styles.dropdownList}
            showsVerticalScrollIndicator={true}
          />
        </View>
      )}

      {/* Content */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <FlatList
          data={paginatedData}
          keyExtractor={(item) => item.appl_ref_no}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <ApplicationCard
              item={item}
              index={index}
              onSave={saveInspectionDate}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icons.Inbox />
              <Text style={styles.emptyTitle}>No Applications Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || selectedLocation
                  ? "Try adjusting your search or filters"
                  : "Check back later for new items"}
              </Text>
            </View>
          }
        />
      </Animated.View>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <View style={styles.paginationWrapper}>
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[
                styles.pageButton,
                currentPage === 1 && styles.pageButtonDisabled,
              ]}
              onPress={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <Icons.ChevronLeft />
            </TouchableOpacity>

            <View style={styles.pageNumbers}>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1),
                )
                .map((page, index, arr) => (
                  <React.Fragment key={page}>
                    {index > 0 && arr[index - 1] !== page - 1 && (
                      <Text style={styles.pageEllipsis}>...</Text>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.pageNumberButton,
                        currentPage === page && styles.pageNumberButtonActive,
                      ]}
                      onPress={() => goToPage(page)}
                    >
                      <Text
                        style={[
                          styles.pageNumberText,
                          currentPage === page && styles.pageNumberTextActive,
                        ]}
                      >
                        {page}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
            </View>

            <TouchableOpacity
              style={[
                styles.pageButton,
                currentPage === totalPages && styles.pageButtonDisabled,
              ]}
              onPress={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <Icons.ChevronRight />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Spacer for Android Home Button */}
      <View style={styles.bottomSpacer} />
    </SafeAreaView>
  );
}

function ApplicationCard({
  item,
  index,
  onSave,
}: {
  item: any;
  index: number;
  onSave: (refNo: string, date: string, onSuccess: () => void) => void;
}) {
  const [inspectionDate, setInspectionDate] = useState(
    item.inspection_scheduled_on || "",
  );
  const [showPicker, setShowPicker] = useState(false);
  const [isDateSaved, setIsDateSaved] = useState(
    !!item.inspection_scheduled_on,
  );

  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSave = () => {
    if (!inspectionDate) {
      Alert.alert("Validation", "Please select an inspection date");
      return;
    }
    onSave(item.appl_ref_no, inspectionDate, () => setIsDateSaved(true));
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
      if (event.type === "dismissed") return;
      if (selectedDate) {
        setInspectionDate(selectedDate.toISOString().split("T")[0]);
      }
    } else if (selectedDate) {
      setInspectionDate(selectedDate.toISOString().split("T")[0]);
    }
  };

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: cardAnim,
          transform: [
            {
              translateY: cardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.refBadge}>
            <Text style={styles.refBadgeText} numberOfLines={1}>
              {item.appl_ref_no}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isDateSaved ? styles.statusSaved : styles.statusPending,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isDateSaved ? styles.statusSavedText : styles.statusPendingText,
              ]}
            >
              {isDateSaved ? "Scheduled" : "Pending"}
            </Text>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <Text style={styles.establishment} numberOfLines={2}>
            {item.name_of_the_establishment}
          </Text>

          <View style={styles.infoRow}>
            <Icons.MapPin />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.submission_location}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icons.Clock />
            <Text style={styles.infoText}>
              Submitted: {item.submission_date}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Inspection Date Section */}
        <View style={styles.dateSection}>
          <Text style={styles.dateLabel}>Inspection Date</Text>

          <TouchableOpacity
            style={[styles.dateInput, isDateSaved && styles.dateInputSaved]}
            onPress={() => !isDateSaved && setShowPicker(true)}
            disabled={isDateSaved}
            activeOpacity={isDateSaved ? 1 : 0.7}
          >
            <View style={styles.dateInputLeft}>
              <Feather
                name="calendar"
                size={14}
                color={isDateSaved ? "#2ECC71" : "#1a1a4e"}
              />
              <Text
                style={[
                  styles.dateInputText,
                  isDateSaved && styles.dateInputTextSaved,
                ]}
              >
                {inspectionDate
                  ? new Date(inspectionDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "Select Date"}
              </Text>
            </View>
            {isDateSaved && (
              <View style={styles.savedIcon}>
                <Feather name="check-circle" size={16} color="#2ECC71" />
              </View>
            )}
          </TouchableOpacity>

          {showPicker && !isDateSaved && (
            <DateTimePicker
              value={inspectionDate ? new Date(inspectionDate) : new Date()}
              mode="date"
              minimumDate={new Date()}
              onChange={onDateChange}
            />
          )}

          {/* Action Buttons */}
          {!isDateSaved ? (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Icons.Calendar />
              <Text style={styles.saveButtonText}>Save Date</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.formButton}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: "/inspection-form",
                  params: { refNo: item.appl_ref_no },
                })
              }
            >
              <Icons.FileText />
              <Text style={styles.formButtonText}>Inspection Form</Text>
              <Icons.ChevronRight />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  // Thin status bar background only
  statusBarBg: {
    height: STATUS_BAR_HEIGHT,
    backgroundColor: "#1a1a4e",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  // Compact Header - minimal height
  header: {
    backgroundColor: "#1a1a4e",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#8ab4d9",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  headerRight: {
    width: 32,
  },
  // Filter Section
  filterContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e8eaf6",
    gap: 8,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f2f5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1a1a4e",
    fontWeight: "500",
    paddingVertical: 0,
  },
  locationFilterWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationDropdown: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0f2f5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  locationDropdownLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  locationDropdownText: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
    flex: 1,
  },
  locationDropdownTextActive: {
    color: "#1a1a4e",
    fontWeight: "600",
  },
  clearFilterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffebee",
    justifyContent: "center",
    alignItems: "center",
  },
  // Dropdown
  dropdownContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: -4,
    marginBottom: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e8eaf6",
    maxHeight: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  dropdownList: {
    paddingVertical: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f2f5",
  },
  dropdownItemActive: {
    backgroundColor: "#e8eaf6",
  },
  dropdownItemText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  dropdownItemTextActive: {
    color: "#1a1a4e",
    fontWeight: "700",
  },
  // List
  listContent: {
    padding: 12,
    paddingBottom: 8,
  },
  // Card
  cardContainer: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    paddingBottom: 8,
  },
  refBadge: {
    backgroundColor: "#f0f2f5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
  },
  refBadgeText: {
    color: "#1a1a4e",
    fontSize: 11,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: "#fff3e0",
  },
  statusSaved: {
    backgroundColor: "#e8f5e9",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusPendingText: {
    color: "#e65100",
  },
  statusSavedText: {
    color: "#2e7d32",
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  establishment: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a4e",
    marginBottom: 6,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 5,
  },
  infoText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#e8eaf6",
    marginHorizontal: 12,
  },
  // Date Section
  dateSection: {
    padding: 12,
    backgroundColor: "#fafbfc",
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1a1a4e",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e1e4e8",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  dateInputSaved: {
    borderColor: "#2ECC71",
    backgroundColor: "#f1f8e9",
  },
  dateInputLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateInputText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a4e",
  },
  dateInputTextSaved: {
    color: "#2e7d32",
  },
  savedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
  },
  // Buttons
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0066cc",
    padding: 10,
    borderRadius: 10,
    shadowColor: "#0066cc",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  formButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#2ECC71",
    padding: 10,
    borderRadius: 10,
    shadowColor: "#2ECC71",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  formButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#999",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#bbb",
    marginTop: 4,
  },
  // Pagination
  paginationWrapper: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e8eaf6",
  },
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  pageButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1a1a4e",
    justifyContent: "center",
    alignItems: "center",
  },
  pageButtonDisabled: {
    backgroundColor: "#c5cae9",
  },
  pageNumbers: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pageNumberButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f2f5",
    justifyContent: "center",
    alignItems: "center",
  },
  pageNumberButtonActive: {
    backgroundColor: "#1a1a4e",
  },
  pageNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
  },
  pageNumberTextActive: {
    color: "#fff",
  },
  pageEllipsis: {
    fontSize: 12,
    fontWeight: "700",
    color: "#999",
    paddingHorizontal: 2,
  },
  // Bottom Spacer
  bottomSpacer: {
    height: BOTTOM_NAV_HEIGHT,
    backgroundColor: "#f0f2f5",
  },
});
