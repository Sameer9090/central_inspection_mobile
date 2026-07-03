import React, { useEffect, useState } from "react";
import {
    SafeAreaView,
    View,
    Text,
    FlatList,
    ActivityIndicator,
    StyleSheet,
} from "react-native";

import { useLocalSearchParams, router } from "expo-router";
import { TouchableOpacity } from "react-native";
import StatusBadge from "../components/track/StatusBadge";

import { getHistory } from "../services/historyService";

export default function TrackHistoryScreen() {
    const { applRefNo } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<any[]>([]);

    const loadHistory = async () => {
        try {
            const response = await getHistory(applRefNo as string);

            console.log(JSON.stringify(response, null, 2));

            setHistory(response.history);
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={styles.loader}>
                <ActivityIndicator size="large" color="#2563EB" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>

                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>

                <View style={{ flex: 1 }}>

                    <Text style={styles.headerTitle}>
                        Application History
                    </Text>

                    <Text style={styles.refNo}>
                        {applRefNo}
                    </Text>

                </View>

            </View>
            <FlatList
                data={history}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }) => (

                    <View style={styles.timelineRow}>

                        <View style={styles.timeline}>

                            <View style={styles.circle} />

                            {index !== history.length - 1 && (
                                <View style={styles.line} />
                            )}

                        </View>

                        <View style={styles.card}>

                            <StatusBadge status={item.status} />

                            <Text style={styles.date}>
                                {item.date}
                            </Text>

                            <View style={styles.locationBox}>
                                <Text style={styles.locationText}>
                                    📍 {item.submissionLocation}
                                </Text>
                            </View>

                            <Text style={styles.heading}>
                                Remarks
                            </Text>

                            <Text style={styles.value}>
                                {item.remarks}
                            </Text>

                            <View style={styles.separator} />

                            <Text style={styles.heading}>
                                FROM
                            </Text>

                            <Text style={styles.person}>
                                {item.senderName}
                            </Text>

                            <Text style={styles.role}>
                                {item.senderRole}
                            </Text>

                            <Text style={styles.office}>
                                {item.senderOffice}
                            </Text>

                            <Text style={styles.arrow}>
                                ↓
                            </Text>

                            <Text style={styles.heading}>
                                TO
                            </Text>

                            <Text style={styles.person}>
                                {item.receiverName}
                            </Text>

                            <Text style={styles.role}>
                                {item.receiverRole}
                            </Text>

                            <Text style={styles.office}>
                                {item.receiverOffice}
                            </Text>

                        </View>

                    </View>

                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
        padding: 16,
    },

    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    card: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
    },

    ref: {
        fontWeight: "700",
        marginBottom: 5,
        fontSize: 16,
    },
    heading: {
        marginTop: 12,
        fontWeight: "700",
        color: "#64748B",
        fontSize: 13,
        textTransform: "uppercase",
    },

    value: {
        fontSize: 16,
        color: "#1E293B",
        marginTop: 3,
    },

    subValue: {
        color: "#64748B",
        fontSize: 14,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: "#fff",
        marginBottom: 10,
        elevation: 2,
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#EFF6FF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    backArrow: {
        fontSize: 22,
        color: "#2563EB",
        fontWeight: "700",
    },

    headerTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#1E293B",
    },

    refNo: {
        color: "#64748B",
        marginTop: 3,
    },

    timelineRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 20,
    },

    timeline: {
        width: 28,
        alignItems: "center",
    },

    circle: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: "#2563EB",
    },

    line: {
        width: 2,
        flex: 1,
        backgroundColor: "#CBD5E1",
        marginTop: 2,
    },

    date: {
        marginTop: 10,
        color: "#64748B",
        fontSize: 13,
    },

    locationBox: {
        marginTop: 10,
        backgroundColor: "#EFF6FF",
        padding: 10,
        borderRadius: 8,
    },

    locationText: {
        color: "#2563EB",
        fontWeight: "600",
    },

    heading: {
        marginTop: 15,
        color: "#64748B",
        fontWeight: "700",
        fontSize: 12,
    },

    value: {
        marginTop: 4,
        fontSize: 15,
        color: "#1E293B",
    },

    separator: {
        height: 1,
        backgroundColor: "#E2E8F0",
        marginVertical: 16,
    },

    person: {
        fontWeight: "700",
        fontSize: 16,
        marginTop: 5,
    },

    role: {
        color: "#64748B",
    },

    office: {
        color: "#64748B",
        marginBottom: 5,
    },

    arrow: {
        alignSelf: "center",
        fontSize: 26,
        color: "#2563EB",
        marginVertical: 8,
    },
});