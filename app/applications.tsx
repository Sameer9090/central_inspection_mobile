import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
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
import AppHeader from "../components/AppHeader";
import ScrollNavigation from "../components/ScrollNavigation";
import { API } from "../services/api";
import {
  getApplicationQueue,
  getOfflineDownloadProgress,
  getOfflineDownloadRecords,
  resetInterruptedOfflineDownloads,
  saveApplicationQueue,
  saveCachedApplication,
  saveOfflineDownloadRecords,
  updateOfflineDownloadStatus,
} from "../services/offlineStorage";

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

// Restore the locally saved inspection date when the API/cache queue does not
// contain it. The download table is the durable local source for scheduled dates.
const mergeInspectionDates = (applications: any[], records: any[]) => {
  const recordsByReference = new Map(
    records.map((record: any) => [
      String(record.reference_number),
      record,
    ])
  );

  return applications.map((item: any) => {
    const record = recordsByReference.get(String(item.appl_ref_no));
    return {
      ...item,
      inspection_scheduled_on:
        item.inspection_scheduled_on || record?.inspection_date || null,
    };
  });
};

export default function ApplicationsScreen() {
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState({
    total: 0,
    downloaded: 0,
    pending: 0,
    downloading: 0,
    failed: 0,
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlatList<any>>(null);

  const [scrollY, setScrollY] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    refreshDownloadProgress();
  }, [allApplications]);

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
      const offlineMode = await AsyncStorage.getItem("offline_mode");

      // ==========================================
      // OFFLINE MODE: READ DIRECTLY FROM SQLITE
      // ==========================================
      if (offlineMode === "true") {
        const [cachedData, downloadRecords] = await Promise.all([
          getApplicationQueue(),
          getOfflineDownloadRecords(),
        ]);

        if (cachedData && cachedData.length > 0) {
          const restoredApplications = mergeInspectionDates(
            cachedData,
            downloadRecords as any[]
          );

          setAllApplications(restoredApplications);

          const uniqueLocations: string[] = Array.from(
            new Set<string>(
              (restoredApplications as any[])
                .map((item: any) => item.submission_location)
                .filter((location: any): location is string =>
                  typeof location === "string" && location.length > 0
                )
            )
          );

          setLocations(uniqueLocations as string[]);
          await refreshDownloadProgress(restoredApplications);
        } else {
          setAllApplications([]);
          setLocations([]);

          Alert.alert(
            "Offline Applications",
            "No previously downloaded applications are available on this device."
          );
        }

        return;
      }

      // ==========================================
      // ONLINE MODE
      // ==========================================
      await resetInterruptedOfflineDownloads();

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await API.get("/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data.data || [];
      const existingDownloadRecords = await getOfflineDownloadRecords();
      const restoredApplications = mergeInspectionDates(
        data,
        existingDownloadRecords as any[]
      );

      // Save the merged queue so a server response that omits a previously
      // scheduled date cannot erase the date needed during the next offline login.
      await saveOfflineDownloadRecords(
        restoredApplications.filter((item: any) => item.inspection_scheduled_on)
      );
      await saveApplicationQueue(restoredApplications);

      setAllApplications(restoredApplications);

      const uniqueLocations = [
        ...new Set(
          restoredApplications.map((item: any) => item.submission_location).filter(Boolean)
        ),
      ];

      setLocations(uniqueLocations as string[]);

    } catch (error: any) {
      console.log("Unable to fetch applications:", error?.message);

      const [cachedData, downloadRecords] = await Promise.all([
        getApplicationQueue(),
        getOfflineDownloadRecords(),
      ]);

      if (cachedData) {
        const restoredApplications = mergeInspectionDates(
          cachedData,
          downloadRecords as any[]
        );
        setAllApplications(restoredApplications);

        const uniqueLocations = [
          ...new Set(
            restoredApplications
              .map((item: any) => item.submission_location)
              .filter(Boolean)
          ),
        ];

        setLocations(uniqueLocations as string[]);

        Alert.alert(
          "Offline Mode",
          "Showing previously downloaded applications."
        );
      } else {
        Alert.alert(
          "Error",
          "No internet connection and no cached applications available."
        );
      }
    } finally {
      setLoading(false);
    }
  };




  const refreshDownloadProgress = async (
    applications: any[] = allApplications
  ) => {
    // const records = await getOfflineDownloadRecords();

    const records = (await getOfflineDownloadRecords()) as Array<{
      reference_number: string;
      download_status: string;
      inspection_date?: string | null;
    }>;

    // The Scheduled count comes from the applications list, not from the
    // download table. A newly scheduled application must count immediately,
    // even before the inspector downloads its form.
    const scheduledRefs = new Set(
      applications
        .filter((item: any) => item.inspection_scheduled_on)
        .map((item: any) => String(item.appl_ref_no))
    );

    const currentRecords = records.filter((record: any) =>
      scheduledRefs.has(String(record.reference_number))
    );

    const downloaded = currentRecords.filter(
      (record: any) => record.download_status === "downloaded"
    ).length;
    const downloading = currentRecords.filter(
      (record: any) => record.download_status === "downloading"
    ).length;
    const failed = currentRecords.filter(
      (record: any) => record.download_status === "failed"
    ).length;

    // Treat scheduled applications without a download-table row as pending.
    // This prevents the Scheduled count from waiting for the Download button.
    const pending = Math.max(
      0,
      scheduledRefs.size - downloaded - downloading - failed
    );

    setDownloadProgress({
      total: scheduledRefs.size,
      downloaded,
      pending,
      downloading,
      failed,
    });
  };

  const downloadScheduledApplications = async () => {
    if (isDownloading) return;
    const offlineMode = await AsyncStorage.getItem("offline_mode");

    if (offlineMode === "true") {
      Alert.alert(
        "Offline Mode",
        "You are currently offline. Previously downloaded forms are available, but downloading new forms requires an internet connection."
      );
      return;
    }
    const scheduledApplications = allApplications.filter(
      (item: any) => item.inspection_scheduled_on
    );

    if (scheduledApplications.length === 0) {
      Alert.alert(
        "No Scheduled Applications",
        "Please save an inspection date for at least one application."
      );
      return;
    }

    try {
      setIsDownloading(true);

      // Register only applications with saved inspection dates.
      // Register only applications with saved inspection dates.
      await saveOfflineDownloadRecords(scheduledApplications);

      // Reset downloads interrupted by an app closure or network interruption.
      await resetInterruptedOfflineDownloads();

      const records = await getOfflineDownloadRecords();
      console.log(
        "OFFLINE DOWNLOAD RECORDS:",
        records.map((record: any) => ({
          reference_number: record.reference_number,
          inspection_date: record.inspection_date,
          download_status: record.download_status,
        }))
      );
      // Process only scheduled applications that are not already downloaded.
      const scheduledRefs = new Set(
        scheduledApplications.map((item: any) => String(item.appl_ref_no))
      );

      const recordsToDownload = records.filter(
        (record: any) =>
          scheduledRefs.has(String(record.reference_number)) &&
          ["pending", "failed"].includes(record.download_status)
      );

      await refreshDownloadProgress();

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      for (const record of recordsToDownload) {
        const refNo = String(record.reference_number);

        try {
          await updateOfflineDownloadStatus(refNo, "downloading");
          await refreshDownloadProgress();

          const response = await API.get(
            `/inspection-form/${encodeURIComponent(refNo)}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          // Laravel returns success and the inspection payload at the top level.
          // Cache the complete response so online and offline restoration use
          // exactly the same data structure.
          const apiData = response.data;

          if (
            !apiData ||
            apiData.success !== true ||
            !Object.prototype.hasOwnProperty.call(apiData, "application") ||
            !Array.isArray(apiData.inspections)
          ) {
            throw new Error(
              apiData?.message ||
              "The inspection form API returned an unexpected response."
            );
          }

          await saveCachedApplication(refNo, apiData);

          await updateOfflineDownloadStatus(refNo, "downloaded");
        } catch (error: any) {
          console.log(
            `Offline download failed for ${refNo}:`,
            error?.response?.data || error?.message
          );

          await updateOfflineDownloadStatus(
            refNo,
            "failed",
            error?.response?.data?.message ||
            error?.message ||
            "Download failed"
          );
        }

        await refreshDownloadProgress();
      }

      await refreshDownloadProgress();


      const finalRecords = await getOfflineDownloadRecords();

      const finalScheduledRecords = finalRecords.filter(
        (record: any) =>
          scheduledRefs.has(String(record.reference_number))
      );

      const finalDownloaded = finalScheduledRecords.filter(
        (record: any) => record.download_status === "downloaded"
      ).length;

      const finalFailed = finalScheduledRecords.filter(
        (record: any) => record.download_status === "failed"
      ).length;

      if (finalFailed > 0) {
        Alert.alert(
          "Download Completed with Errors",
          `${finalDownloaded} of ${scheduledApplications.length} scheduled applications downloaded successfully. ${finalFailed} failed. You can retry the failed downloads.`
        );
      } else {
        Alert.alert(
          "Download Complete",
          `${finalDownloaded} scheduled applications downloaded successfully.`
        );
      }

    } catch (error: any) {
      console.log("Bulk download error:", error?.message);

      Alert.alert(
        "Download Error",
        error?.message || "Unable to download applications."
      );
    } finally {
      setIsDownloading(false);
      await refreshDownloadProgress();
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
      // The offline-login flag can remain true after connectivity returns.
      // Use the current network state to decide whether the API can be called.
      const network = await NetInfo.fetch();
      const isOffline =
        network.isConnected === false ||
        network.isInternetReachable === false;

      if (isOffline) {
        Alert.alert(
          "Offline Mode",
          "Inspection dates can only be scheduled while connected to the internet."
        );
        return;
      }

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert(
          "Session Expired",
          "Please log in again to schedule an inspection."
        );
        return;
      }

      const response = await API.post(
        "/set-inspection-date",
        { appl_ref_no: applRefNo, inspection_date: inspectionDate },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data?.success !== true) {
        throw new Error(
          response.data?.message ||
          "The server did not confirm the inspection date."
        );
      }

      const updatedApplications = allApplications.map((item: any) =>
        item.appl_ref_no === applRefNo
          ? { ...item, inspection_scheduled_on: inspectionDate }
          : item
      );

      await saveOfflineDownloadRecords([
        {
          appl_ref_no: applRefNo,
          inspection_scheduled_on: inspectionDate,
        },
      ]);
      await saveApplicationQueue(updatedApplications);

      setAllApplications(updatedApplications);
      await refreshDownloadProgress(updatedApplications);

      onSuccess();

      Alert.alert(
        "Inspection Date Saved",
        response.data?.message ||
        "The inspection date has been saved successfully."
      );
    } catch (error: any) {
      console.log(
        "INSPECTION DATE SAVE ERROR:",
        error?.response?.data || error?.message
      );
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save inspection date."
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, styles.center]}
        edges={["left", "right"]}
      >

        <StatusBar barStyle="light-content" backgroundColor="#1a1a4e" />
        <ActivityIndicator size="large" color="#1a1a4e" />
        <Text style={styles.loadingText}>Loading Applications...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a4e" />

      {/* ✅ FIXED: AppHeader at top */}
      <AppHeader />

      {/* ✅ FIXED: Page header as a separate white/light section below AppHeader */}
      <View style={styles.pageHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color="#1a1a4e" />
        </TouchableOpacity>
        <View style={styles.pageHeaderCenter}>
          <Text style={styles.pageHeaderTitle}>Applications</Text>
          <Text style={styles.pageHeaderSubtitle}>
            In Queue • {filteredApplications.length}
          </Text>
        </View>
        <View style={styles.pageHeaderRight} />
      </View>

      {/* Offline Download Panel */}
      <View style={styles.offlinePanel}>
        <View style={styles.offlinePanelHeader}>
          <View>
            <Text style={styles.offlinePanelTitle}>
              Offline Form Downloads
            </Text>
            <Text style={styles.offlinePanelSubtitle}>
              Only applications with saved inspection dates
            </Text>
          </View>
          <Feather name="download-cloud" size={23} color="#1a1a4e" />
        </View>

        <View style={styles.downloadStats}>
          <View style={styles.downloadStat}>
            <Text style={styles.downloadTotal}>
              {downloadProgress.total}
            </Text>
            <Text style={styles.downloadStatLabel}>Scheduled</Text>
          </View>

          <View style={styles.downloadStat}>
            <Text style={styles.downloadSuccess}>
              {downloadProgress.downloaded}
            </Text>
            <Text style={styles.downloadStatLabel}>Downloaded</Text>
          </View>

          <View style={styles.downloadStat}>
            <Text style={styles.downloadPending}>
              {downloadProgress.pending + downloadProgress.downloading}
            </Text>
            <Text style={styles.downloadStatLabel}>Remaining</Text>
          </View>

          <View style={styles.downloadStat}>
            <Text style={styles.downloadFailed}>
              {downloadProgress.failed}
            </Text>
            <Text style={styles.downloadStatLabel}>Failed</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${downloadProgress.total > 0
                  ? (downloadProgress.downloaded / downloadProgress.total) * 100
                  : 0
                  }%`,
              },
            ]}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.offlineDownloadButton,
            isDownloading && styles.offlineDownloadButtonDisabled,
          ]}
          onPress={downloadScheduledApplications}
          disabled={isDownloading || downloadProgress.total === 0}
        >
          {isDownloading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Feather name="download" size={17} color="#fff" />
          )}

          <Text style={styles.offlineDownloadButtonText}>
            {isDownloading
              ? "Downloading..."
              : "Download Scheduled Forms"}
          </Text>
        </TouchableOpacity>

        {downloadProgress.failed > 0 && (
          <TouchableOpacity
            style={styles.retryDownloadButton}
            onPress={downloadScheduledApplications}
            disabled={isDownloading}
          >
            <Feather name="refresh-cw" size={15} color="#E53935" />
            <Text style={styles.retryDownloadText}>
              Retry Failed Downloads
            </Text>
          </TouchableOpacity>
        )}
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
              <Feather name="filter" size={14} color="#1a1a4e" />
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

      {/* Content */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={{ flex: 1, position: "relative" }}>
          <FlatList
            ref={listRef}
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
            onScroll={(event) => {
              setScrollY(event.nativeEvent.contentOffset.y);
            }}
            scrollEventThrottle={16}
            onContentSizeChange={(width, height) => {
              setContentHeight(height);
            }}
            onLayout={(event) => {
              setScrollViewHeight(event.nativeEvent.layout.height);
            }}
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

          <ScrollNavigation
            scrollY={scrollY}
            contentHeight={contentHeight}
            scrollViewHeight={scrollViewHeight}
            onScrollToTop={() => {
              listRef.current?.scrollToOffset({
                offset: 0,
                animated: true,
              });
            }}
            onScrollToBottom={() => {
              listRef.current?.scrollToEnd({
                animated: true,
              });
            }}
          />
        </View>
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

  // Keep the card's controlled date/status in sync when its restored item changes.
  useEffect(() => {
    const savedDate = item.inspection_scheduled_on || "";
    setInspectionDate(savedDate);
    setIsDateSaved(!!savedDate);
  }, [item.appl_ref_no, item.inspection_scheduled_on]);

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
          <TouchableOpacity
            style={styles.reportClosedButton}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "/report-closed",
                params: { refNo: item.appl_ref_no },
              })
            }
          >
            <Feather name="camera" size={17} color="#E53935" />
            <Text style={styles.reportClosedButtonText}>
              Report Establishment Closed
            </Text>
          </TouchableOpacity>
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  // ✅ FIXED: Page header — white background, separate from AppHeader
  pageHeader: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8eaf6",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f2f5",
    justifyContent: "center",
    alignItems: "center",
  },
  pageHeaderCenter: {
    alignItems: "center",
    flex: 1,
  },
  pageHeaderTitle: {
    color: "#1a1a4e",
    fontSize: 18,
    fontWeight: "700",
  },
  pageHeaderSubtitle: {
    color: "#888",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  pageHeaderRight: {
    width: 36,
  },
  // Filter Section
  filterContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8eaf6",
    gap: 10,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f6f8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    gap: 8,
  },
  locationDropdown: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f6f8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffebee",
    justifyContent: "center",
    alignItems: "center",
  },
  // Dropdown
  dropdownContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -6,
    marginBottom: 8,
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
    padding: 16,
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
    padding: 14,
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
    paddingHorizontal: 14,
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
    marginHorizontal: 14,
  },
  // Date Section
  dateSection: {
    padding: 14,
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
    paddingVertical: 10,
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
  reportClosedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFF1F0",
    borderWidth: 1,
    borderColor: "#E53935",
    padding: 11,
    borderRadius: 10,
    marginTop: 10,
  },

  reportClosedButtonText: {
    color: "#E53935",
    fontSize: 13,
    fontWeight: "700",
  },

  offlinePanel: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },

  offlinePanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  offlinePanelTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a4e",
  },

  offlinePanelSubtitle: {
    fontSize: 11,
    color: "#777",
    marginTop: 3,
  },

  downloadStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  downloadStat: {
    alignItems: "center",
    flex: 1,
  },

  downloadTotal: {
    fontSize: 21,
    fontWeight: "700",
    color: "#245BB5",
  },

  downloadSuccess: {
    fontSize: 21,
    fontWeight: "700",
    color: "#21864A",
  },

  downloadPending: {
    fontSize: 21,
    fontWeight: "700",
    color: "#D99022",
  },

  downloadFailed: {
    fontSize: 21,
    fontWeight: "700",
    color: "#E53935",
  },

  downloadStatLabel: {
    fontSize: 10,
    color: "#777",
    marginTop: 3,
  },

  progressTrack: {
    height: 8,
    backgroundColor: "#E7E9EF",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 14,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#2684E8",
    borderRadius: 10,
  },

  offlineDownloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1a1a4e",
    padding: 12,
    borderRadius: 9,
  },

  offlineDownloadButtonDisabled: {
    opacity: 0.6,
  },

  offlineDownloadButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  retryDownloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: 10,
    marginTop: 6,
  },

  retryDownloadText: {
    color: "#E53935",
    fontSize: 12,
    fontWeight: "700",
  },

});