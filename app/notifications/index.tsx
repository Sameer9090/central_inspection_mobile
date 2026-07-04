import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useNotification } from "../../context/NotificationContext";

import AppHeader from "../../components/AppHeader";

import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
} from "../../services/notificationService";

import { Notification } from "../../types/notification";

export default function NotificationsScreen() {

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const { refreshUnreadCount } = useNotification();

    const loadNotifications = async () => {

        try {

            const response = await getNotifications();

            setNotifications(response.notifications);

        } catch {

            Alert.alert(
                "Error",
                "Unable to load notifications."
            );

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        loadNotifications();

    }, []);

    const readNotification = async (id: string) => {

        try {

            await markNotificationRead(id);

            await refreshUnreadCount();

            await loadNotifications();

        } catch (e) {

            console.log(e);

        }

    };

    const markAll = async () => {

        try {

            await markAllNotificationsRead();

            await refreshUnreadCount();

            await loadNotifications();

        } catch (e) {

            console.log(e);

        }

    };

    if (loading) {

        return (

            <SafeAreaView style={styles.loader}>

                <ActivityIndicator
                    size="large"
                    color="#2563EB"
                />

            </SafeAreaView>

        );

    }

    return (

        <SafeAreaView style={styles.container}>

            <AppHeader />

            <View style={styles.topBar}>

                <View>

                    <Text style={styles.heading}>
                        Notifications
                    </Text>

                    <Text style={styles.subHeading}>
                        View all recent application activities
                    </Text>

                </View>

                <TouchableOpacity
                    style={styles.markAll}
                    onPress={markAll}
                >

                    <Text style={styles.markAllText}>
                        Mark All Read
                    </Text>

                </TouchableOpacity>

            </View>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (

                    <TouchableOpacity
                        style={[
                            styles.card,
                            !item.readAt && styles.unread
                        ]}
                        onPress={() => readNotification(item.id)}
                    >

                        <Text style={styles.title}>
                            {item.title}
                        </Text>

                        <Text style={styles.message}>
                            {item.message}
                        </Text>

                        {item.remarks ? (

                            <View style={styles.remarksBox}>

                                <Text style={styles.remarksTitle}>
                                    Remarks
                                </Text>

                                <Text>
                                    {item.remarks}
                                </Text>

                            </View>

                        ) : null}

                        <Text style={styles.time}>
                            {item.createdAt}
                        </Text>

                    </TouchableOpacity>

                )}
            />

        </SafeAreaView>

    );

}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#F4F6FA",
    },

    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    topBar: {
        padding: 18,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    heading: {
        fontSize: 22,
        fontWeight: "700",
    },

    subHeading: {
        color: "#64748B",
        marginTop: 4,
    },

    markAll: {
        backgroundColor: "#2563EB",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },

    markAllText: {
        color: "#fff",
        fontWeight: "700",
    },

    card: {
        backgroundColor: "#fff",
        marginHorizontal: 16,
        marginBottom: 14,
        borderRadius: 14,
        padding: 18,
        elevation: 2,
        borderLeftWidth: 5,
        borderLeftColor: "#E5E7EB",
    },

    unread: {
        borderLeftColor: "#2563EB",
    },

    title: {
        fontWeight: "700",
        fontSize: 16,
    },

    message: {
        color: "#555",
        marginTop: 5,
        lineHeight: 21,
    },

    remarksBox: {
        marginTop: 12,
        backgroundColor: "#F8FAFC",
        borderRadius: 8,
        padding: 12,
    },

    remarksTitle: {
        fontWeight: "700",
        marginBottom: 5,
    },

    time: {
        marginTop: 12,
        color: "#777",
        fontSize: 12,
    },

});