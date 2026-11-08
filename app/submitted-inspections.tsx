import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../components/AppHeader";
import ScrollNavigation from "../components/ScrollNavigation";
import { API } from "../services/api";

interface SubmittedInspection {
    application_ref_no: string;
    name_of_the_establishment: string | null;
    status: string;
    submitted_at: string;
}

type FilterMode = "date" | "month";

const ITEMS_PER_PAGE = 10;

const getDateOnly = (value: string) => {
    if (!value) return "";
    // Preserve the date sent by Laravel; avoid timezone shifting.
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];

    const parsed = new Date(value.replace(" ", "T"));
    if (Number.isNaN(parsed.getTime())) return "";
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export default function SubmittedInspectionsScreen() {
    const [records, setRecords] = useState<SubmittedInspection[]>([]);
    const [totalSubmitted, setTotalSubmitted] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<FilterMode>("date");
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const listRef = useRef<FlatList<SubmittedInspection>>(null);

    const [scrollY, setScrollY] = useState(0);
    const [contentHeight, setContentHeight] = useState(0);
    const [scrollViewHeight, setScrollViewHeight] = useState(0);

    const loadRecords = useCallback(async (refresh = false) => {
        try {
            if (refresh) setRefreshing(true);
            else setLoading(true);

            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Session Expired", "Please log in again.");
                return;
            }

            // The endpoint is paginated. Retrieve each API page once so that
            // the date/month filter and numbered pagination operate on the
            // complete result set rather than only the currently loaded page.
            const firstResponse = await API.get("/submitted-inspections?page=1", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (firstResponse.data?.success !== true) {
                throw new Error(
                    firstResponse.data?.message || "Unable to retrieve records."
                );
            }

            const firstPage = firstResponse.data.data;
            const allRecords: SubmittedInspection[] = [
                ...(firstPage?.data || []),
            ];
            const lastPage = Number(firstPage?.last_page || 1);
            const total = Number(firstPage?.total || allRecords.length);

            for (let page = 2; page <= lastPage; page += 1) {
                const pageResponse = await API.get(
                    `/submitted-inspections?page=${page}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                        },
                    }
                );

                if (pageResponse.data?.success !== true) {
                    throw new Error(
                        pageResponse.data?.message ||
                        `Unable to retrieve page ${page}.`
                    );
                }

                const pageData = pageResponse.data.data;
                allRecords.push(...(pageData?.data || []));
            }

            setRecords(allRecords);
            setTotalSubmitted(total);
            setCurrentPage(1);
        } catch (error: any) {
            console.log(
                "SUBMITTED INSPECTIONS ERROR:",
                error?.response?.data || error.message
            );
            Alert.alert(
                "Error",
                error?.response?.data?.message ||
                error?.message ||
                "Failed to load submitted inspections."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadRecords();
        }, [loadRecords])
    );

    const filteredRecords = useMemo(() => {
        if (!selectedDate) return records;

        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getDate()).padStart(2, "0");
        const selectedDateKey = `${year}-${month}-${day}`;
        const selectedMonthKey = `${year}-${month}`;

        return records.filter((item) => {
            const submittedDate = getDateOnly(item.submitted_at);
            if (!submittedDate) return false;

            return selectedFilter === "date"
                ? submittedDate === selectedDateKey
                : submittedDate.slice(0, 7) === selectedMonthKey;
        });
    }, [records, selectedDate, selectedFilter]);

    const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
    const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    const paginatedRecords = filteredRecords.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
    );

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const clearFilter = () => {
        setSelectedDate(null);
        setCurrentPage(1);
        setShowDatePicker(false);
    };

    const onDateChange = (_event: any, date?: Date) => {
        if (Platform.OS === "android") setShowDatePicker(false);
        if (date) {
            setSelectedDate(date);
            setCurrentPage(1);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString.replace(" ", "T"));
        if (Number.isNaN(date.getTime())) return dateString;

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const filterLabel = selectedDate
        ? selectedFilter === "date"
            ? selectedDate.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            })
            : selectedDate.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
            })
        : "Select date / month";

    const renderItem = ({ item }: { item: SubmittedInspection }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Feather name="check-circle" size={22} color="#15803D" />
                </View>

                <View style={styles.establishmentContainer}>
                    <Text style={styles.establishmentName}>
                        {item.name_of_the_establishment || "Establishment Name Not Available"}
                    </Text>
                    <Text style={styles.referenceNumber}>
                        {item.application_ref_no}
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Submission Date</Text>
                <Text style={styles.detailValue}>
                    {formatDate(item.submitted_at)}
                </Text>
            </View>

            <View style={styles.statusRow}>
                <View style={styles.statusBadge}>
                    <Feather name="check" size={13} color="#15803D" />
                    <Text style={styles.statusText}>Successfully Submitted</Text>
                </View>

                <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() =>
                        router.push({
                            pathname: "/submitted-inspection-view",
                            params: {
                                refNo: item.application_ref_no,
                                establishmentName: item.name_of_the_establishment || "",
                            },
                        })
                    }
                >
                    <Text style={styles.viewButtonText}>View</Text>
                    <Feather name="arrow-right" size={15} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <AppHeader />

            <View style={styles.container}>
                <View style={styles.headingContainer}>
                    <Text style={styles.heading}>
                        Successfully Submitted Inspections
                    </Text>
                    <Text style={styles.subHeading}>
                        Inspections submitted successfully by you.
                    </Text>
                </View>

                <View style={styles.countContainer}>
                    <Text style={styles.countLabel}>
                        {selectedDate ? "Filtered Inspections" : "Total Submitted"}
                    </Text>
                    <Text style={styles.countValue}>
                        {selectedDate ? filteredRecords.length : totalSubmitted}
                    </Text>
                </View>

                <View style={styles.filterContainer}>
                    <View style={styles.filterModeRow}>
                        <TouchableOpacity
                            style={[
                                styles.filterModeButton,
                                selectedFilter === "date" && styles.filterModeButtonActive,
                            ]}
                            onPress={() => {
                                setSelectedFilter("date");
                                setCurrentPage(1);
                            }}
                        >
                            <Text
                                style={[
                                    styles.filterModeText,
                                    selectedFilter === "date" && styles.filterModeTextActive,
                                ]}
                            >
                                Filter by Date
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.filterModeButton,
                                selectedFilter === "month" && styles.filterModeButtonActive,
                            ]}
                            onPress={() => {
                                setSelectedFilter("month");
                                setCurrentPage(1);
                            }}
                        >
                            <Text
                                style={[
                                    styles.filterModeText,
                                    selectedFilter === "month" && styles.filterModeTextActive,
                                ]}
                            >
                                Filter by Month
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.dateFilterRow}>
                        <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Feather name="calendar" size={16} color="#1A1A4E" />
                            <Text style={styles.datePickerText}>{filterLabel}</Text>
                            <Feather name="chevron-down" size={16} color="#6B7280" />
                        </TouchableOpacity>
                        {selectedDate && (
                            <TouchableOpacity
                                style={styles.clearFilterButton}
                                onPress={clearFilter}
                            >
                                <Feather name="x" size={17} color="#B91C1C" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={selectedDate || new Date()}
                            mode="date"
                            display={Platform.OS === "ios" ? "compact" : "default"}
                            onChange={onDateChange}
                            maximumDate={new Date()}
                        />
                    )}
                    {selectedDate && (
                        <Text style={styles.filterHint}>
                            {selectedFilter === "date"
                                ? `Showing inspections submitted on ${filterLabel}`
                                : `Showing inspections submitted in ${filterLabel}`}
                        </Text>
                    )}
                </View>

                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#15803D" />
                        <Text style={styles.loaderText}>
                            Loading submitted inspections...
                        </Text>
                    </View>
                ) : (
                    <>

                        <View style={{ flex: 1, position: "relative" }}>
                            <FlatList
                                ref={listRef}
                                data={paginatedRecords}
                                keyExtractor={(item) => item.application_ref_no}
                                renderItem={renderItem}
                                contentContainerStyle={styles.listContent}
                                showsVerticalScrollIndicator={false}
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
                                refreshControl={
                                    <RefreshControl
                                        refreshing={refreshing}
                                        onRefresh={() => loadRecords(true)}
                                        colors={["#15803D"]}
                                    />
                                }
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <Feather name="inbox" size={45} color="#9CA3AF" />
                                        <Text style={styles.emptyTitle}>
                                            No Submitted Inspections
                                        </Text>
                                        <Text style={styles.emptyText}>
                                            {selectedDate
                                                ? "No inspections match the selected date/month."
                                                : "You have no successfully submitted inspections."}
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


                        {totalPages > 1 && (
                            <View style={styles.paginationWrapper}>
                                <View style={styles.paginationContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.pageButton,
                                            safeCurrentPage === 1 && styles.pageButtonDisabled,
                                        ]}
                                        onPress={() => goToPage(safeCurrentPage - 1)}
                                        disabled={safeCurrentPage === 1}
                                    >
                                        <Feather name="chevron-left" size={17} color="#FFFFFF" />
                                    </TouchableOpacity>

                                    <View style={styles.pageNumbers}>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter((page) =>
                                                page === 1 ||
                                                page === totalPages ||
                                                (page >= safeCurrentPage - 1 &&
                                                    page <= safeCurrentPage + 1)
                                            )
                                            .map((page, index, pages) => (
                                                <React.Fragment key={page}>
                                                    {index > 0 && pages[index - 1] !== page - 1 && (
                                                        <Text style={styles.pageEllipsis}>...</Text>
                                                    )}
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.pageNumberButton,
                                                            safeCurrentPage === page &&
                                                            styles.pageNumberButtonActive,
                                                        ]}
                                                        onPress={() => goToPage(page)}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.pageNumberText,
                                                                safeCurrentPage === page &&
                                                                styles.pageNumberTextActive,
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
                                            safeCurrentPage === totalPages &&
                                            styles.pageButtonDisabled,
                                        ]}
                                        onPress={() => goToPage(safeCurrentPage + 1)}
                                        disabled={safeCurrentPage === totalPages}
                                    >
                                        <Feather name="chevron-right" size={17} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.pageInfo}>
                                    Page {safeCurrentPage} of {totalPages}
                                </Text>
                            </View>
                        )}
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    container: {
        flex: 1,
        paddingHorizontal: 16,
        backgroundColor: "#F5F7FA",
    },
    headingContainer: {
        paddingTop: 18,
        paddingBottom: 14,
    },
    heading: {
        fontSize: 19,
        fontWeight: "700",
        color: "#1A1A4E",
    },
    subHeading: {
        fontSize: 13,
        color: "#6B7280",
        marginTop: 5,
    },
    countContainer: {
        backgroundColor: "#FFFFFF",
        padding: 15,
        borderRadius: 10,
        marginBottom: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    countLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
    },
    countValue: {
        fontSize: 21,
        fontWeight: "700",
        color: "#15803D",
    },
    filterContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
    },
    filterModeRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 10,
    },
    filterModeButton: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 7,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
    },
    filterModeButtonActive: {
        backgroundColor: "#1A1A4E",
    },
    filterModeText: {
        color: "#4B5563",
        fontSize: 12,
        fontWeight: "600",
    },
    filterModeTextActive: {
        color: "#FFFFFF",
    },
    dateFilterRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    datePickerButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingVertical: 11,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        backgroundColor: "#FFFFFF",
        gap: 8,
    },
    datePickerText: {
        flex: 1,
        color: "#1F2937",
        fontSize: 13,
        fontWeight: "600",
    },
    clearFilterButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FEE2E2",
        borderRadius: 8,
    },
    filterHint: {
        color: "#6B7280",
        fontSize: 11,
        marginTop: 8,
    },
    listContent: {
        paddingBottom: 12,
        flexGrow: 1,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        padding: 15,
        marginBottom: 13,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 10,
        backgroundColor: "#DCFCE7",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    establishmentContainer: {
        flex: 1,
    },
    establishmentName: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1F2937",
    },
    referenceNumber: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 5,
    },
    divider: {
        height: 1,
        backgroundColor: "#E5E7EB",
        marginVertical: 13,
    },
    detailsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 13,
    },
    detailLabel: {
        fontSize: 12,
        color: "#6B7280",
    },
    detailValue: {
        fontSize: 12,
        fontWeight: "600",
        color: "#374151",
    },
    statusRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#DCFCE7",
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: "#15803D",
        fontSize: 11,
        fontWeight: "600",
        marginLeft: 4,
    },
    viewButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1A1A4E",
        paddingHorizontal: 15,
        paddingVertical: 9,
        borderRadius: 7,
    },
    viewButtonText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "600",
        marginRight: 7,
    },
    loaderContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    loaderText: {
        color: "#6B7280",
        marginTop: 10,
        fontSize: 13,
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#374151",
        marginTop: 12,
    },
    emptyText: {
        fontSize: 13,
        color: "#6B7280",
        textAlign: "center",
        marginTop: 6,
    },
    paginationWrapper: {
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        paddingTop: 10,
        paddingBottom: 8,
        marginHorizontal: -16,
    },
    paginationContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
    },
    pageButton: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: "#1A1A4E",
        alignItems: "center",
        justifyContent: "center",
    },
    pageButtonDisabled: {
        backgroundColor: "#9CA3AF",
    },
    pageNumbers: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    pageNumberButton: {
        minWidth: 32,
        height: 32,
        paddingHorizontal: 8,
        borderRadius: 7,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F3F4F6",
    },
    pageNumberButtonActive: {
        backgroundColor: "#15803D",
    },
    pageNumberText: {
        color: "#374151",
        fontSize: 12,
        fontWeight: "600",
    },
    pageNumberTextActive: {
        color: "#FFFFFF",
    },
    pageEllipsis: {
        color: "#6B7280",
        fontSize: 12,
    },
    pageInfo: {
        textAlign: "center",
        color: "#6B7280",
        fontSize: 11,
        marginTop: 6,
    },
});
