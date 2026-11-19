import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Linking,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../components/AppHeader";
import { getHistory } from "../services/historyService";

type AnyRecord = Record<string, any>;

const STATUS: Record<string, { label: string; icon: string; color: string; bg: string }> = {
    INSPECTION_FORM_SUBMITTED: { label: "Inspection Report Submitted by Inspector", icon: "✓", color: "#047857", bg: "#ECFDF5" },
    INSPECTION_FORM_RESUBMITTED: { label: "Inspection Report Resubmitted by Inspector", icon: "✓", color: "#047857", bg: "#ECFDF5" },
    INSPECTION_CLOSED: { label: "Inspection Closed", icon: "✓", color: "#047857", bg: "#ECFDF5" },
    PROSECUTION_INITIATED: { label: "Prosecution Initiated", icon: "⚖", color: "#6D28D9", bg: "#F5F3FF" },
    PROSECUTION_APPLIED: { label: "Prosecution Request Applied", icon: "⚖", color: "#6D28D9", bg: "#F5F3FF" },
    PROSECUTION_COMPLETE: { label: "Prosecution Concluded", icon: "⚖", color: "#6D28D9", bg: "#F5F3FF" },
    PULL_BACK: { label: "Pulled Back", icon: "↩", color: "#B91C1C", bg: "#FEF2F2" },
    PULLED_APPLICATIONS: { label: "Application Pulled", icon: "➜", color: "#1D4ED8", bg: "#EFF6FF" },
    FORWARDED: { label: "Forwarded", icon: "→", color: "#1D4ED8", bg: "#EFF6FF" },
    AUTO_ALLOCATED: { label: "Auto Allocated", icon: "✦", color: "#7C3AED", bg: "#F5F3FF" },
    RE_INITIATE_INSPECTION: { label: "Inspection Re-Initiated", icon: "↻", color: "#0F766E", bg: "#F0FDFA" },
    PENDING: { label: "Pending", icon: "●", color: "#B45309", bg: "#FFFBEB" },
    INSPECTION_CLOSE_REQUEST: { label: "Inspection Close Requested", icon: "⌛", color: "#B45309", bg: "#FFFBEB" },
};

const FINAL_STATUSES = ["INSPECTION_CLOSED", "PROSECUTION_INITIATED"];
const txt = (value: any, fallback = "—") =>
    value === null || value === undefined || value === "" ? fallback : String(value);
const first = (value: any) => txt(value, "N/A").trim().charAt(0).toUpperCase() || "N";
const formatDate = (value: any) => {
    if (!value) return "Date unavailable";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
const humanize = (value: any) => txt(value).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}
function Info({ label, value }: { label: string; value: any }) {
    return <View style={styles.info}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{txt(value)}</Text></View>;
}
function PersonCard({ label, name, role, office, highlight, tint }: AnyRecord) {
    return (
        <View style={[styles.personCard, highlight && styles.personHighlight]}>
            <Text style={[styles.personLabel, tint ? { color: tint } : null]}>{label}</Text>
            <View style={styles.personRow}>
                <View style={[styles.avatar, tint ? { backgroundColor: tint } : null]}><Text style={styles.avatarText}>{first(name)}</Text></View>
                <View style={styles.personDetails}>
                    <Text style={styles.personName}>{txt(name, "N/A")}</Text>
                    <Text style={styles.muted}>{txt(role, "--")}</Text>
                    {!!office && <Text style={styles.muted}>{office}</Text>}
                </View>
            </View>
        </View>
    );
}
function DocumentLink({ title, url }: { title: string; url?: string }) {
    if (!url) return null;
    return <Pressable accessibilityRole="link" onPress={() => Linking.openURL(url)} style={styles.documentButton}>
        <Text style={styles.documentButtonText}>↗  {title}</Text>
    </Pressable>;
}
function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return <View style={styles.accordion}>
        <Pressable onPress={() => setOpen(!open)} style={styles.accordionHead}>
            <Text style={styles.accordionTitle}>{title}</Text><Text style={styles.accordionChevron}>{open ? "−" : "+"}</Text>
        </Pressable>
        {open && <View style={styles.accordionBody}>{children}</View>}
    </View>;
}

function ComplianceDetails({
    complianceData,
    documentBaseUrl,
}: {
    complianceData: AnyRecord;
    documentBaseUrl?: string;
}) {
    const official = Array.isArray(
        complianceData?.official_compliance_data
    )
        ? complianceData.official_compliance_data
        : [];

    const employer = Array.isArray(
        complianceData?.employer_compliance_data
    )
        ? complianceData.employer_compliance_data
        : [];

    const types = [
        { key: "ase", title: "ASE Inspection" },
        { key: "contract", title: "Contract Inspection" },
        { key: "minimumwage", title: "Minimum Wage Inspection" },
    ];

    const documentUrl = (path: any) => {
        if (!path) return undefined;

        const value = String(path);

        if (/^https?:\/\//i.test(value)) {
            return value;
        }

        if (!documentBaseUrl) {
            return undefined;
        }

        return `${documentBaseUrl.replace(/\/+$/, "")}/${value.replace(
            /^\/+/,
            ""
        )}`;
    };

    return (
        <View style={styles.complianceWrap}>
            <Text style={styles.subheading}>
                Compliance &amp; inspection details
            </Text>

            {official.length === 0 ? (
                <Text style={styles.muted}>
                    No official inspection details available.
                </Text>
            ) : (
                types.map(({ key, title }) => {
                    const hasType = official.some(
                        (row: AnyRecord) => row?.[key]
                    );

                    if (!hasType) return null;

                    return (
                        <Accordion key={key} title={title}>
                            {official.map(
                                (row: AnyRecord, rowIndex: number) => {
                                    const data = row?.[key];

                                    if (!data) return null;

                                    const directions = Array.isArray(data.directions)
                                        ? data.directions
                                        : [];

                                    const rawReports = data.inspection_report;

                                    const reports = rawReports
                                        ? Array.isArray(rawReports)
                                            ? rawReports
                                            : [rawReports]
                                        : [];

                                    const employerRow = employer[rowIndex]?.[key];

                                    const responses = Array.isArray(employerRow)
                                        ? employerRow
                                        : employerRow
                                            ? [employerRow]
                                            : [];

                                    return (
                                        <View
                                            key={`${key}-${rowIndex}`}
                                            style={styles.complianceStep}
                                        >
                                            <Text style={styles.stepTitle}>
                                                Step {rowIndex + 1}
                                            </Text>

                                            {/* Official remarks */}
                                            {!!data.remark && (
                                                <View
                                                    style={[
                                                        styles.directionCard,
                                                        { borderLeftColor: "#6366F1" },
                                                    ]}
                                                >
                                                    <Text style={styles.infoLabel}>
                                                        Official Remarks
                                                    </Text>
                                                    <Text style={styles.infoValue}>
                                                        {txt(data.remark)}
                                                    </Text>
                                                </View>
                                            )}

                                            {/* Inspection reports */}
                                            {reports.map((path: any, index: number) => (
                                                <View
                                                    key={`${key}-report-${rowIndex}-${index}`}
                                                    style={styles.reportCard}
                                                >
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.reportTitle}>
                                                            Inspection Report {index + 1}
                                                        </Text>
                                                        <Text style={styles.muted}>
                                                            Official uploaded document
                                                        </Text>
                                                    </View>

                                                    <DocumentLink
                                                        title="View Report"
                                                        url={documentUrl(path)}
                                                    />
                                                </View>
                                            ))}

                                            {/* Directions and employer responses */}
                                            {directions.length > 0 ? (
                                                directions.map(
                                                    (direction: any, index: number) => {
                                                        const response = responses[index];

                                                        return (
                                                            <View
                                                                key={`${key}-direction-${rowIndex}-${index}`}
                                                                style={styles.directionRow}
                                                            >
                                                                <View
                                                                    style={[
                                                                        styles.directionCard,
                                                                        { borderLeftColor: "#6366F1" },
                                                                    ]}
                                                                >
                                                                    <Text style={styles.infoLabel}>
                                                                        Official Direction {index + 1}
                                                                    </Text>
                                                                    <Text style={styles.infoValue}>
                                                                        {txt(direction)}
                                                                    </Text>
                                                                </View>

                                                                <View
                                                                    style={[
                                                                        styles.directionCard,
                                                                        { borderLeftColor: "#0891B2" },
                                                                    ]}
                                                                >
                                                                    <Text style={styles.infoLabel}>
                                                                        Employer Response
                                                                    </Text>

                                                                    {response ? (
                                                                        <>
                                                                            <Text style={styles.infoValue}>
                                                                                {txt(
                                                                                    response.direction,
                                                                                    "No response provided"
                                                                                )}
                                                                            </Text>

                                                                            <Text style={styles.muted}>
                                                                                Status:{" "}
                                                                                {txt(response.resolved, "Pending")}
                                                                            </Text>

                                                                            <DocumentLink
                                                                                title={
                                                                                    response.prev_official_opinion ===
                                                                                        "non_satisfactory"
                                                                                        ? "View Re-uploaded Document"
                                                                                        : "View Document"
                                                                                }
                                                                                url={documentUrl(
                                                                                    response.document
                                                                                )}
                                                                            />
                                                                        </>
                                                                    ) : (
                                                                        <Text style={styles.muted}>
                                                                            No employer response submitted yet.
                                                                        </Text>
                                                                    )}
                                                                </View>
                                                            </View>
                                                        );
                                                    }
                                                )
                                            ) : (
                                                <Text style={styles.muted}>
                                                    No official directions provided.
                                                </Text>
                                            )}
                                        </View>
                                    );
                                }
                            )}
                        </Accordion>
                    );
                })
            )}
        </View>
    );
}

function ShowCauseDetails({ data, historyRef, documentBaseUrl }: { data: AnyRecord; historyRef: string; documentBaseUrl?: string }) {
    const notice = data?.snapshot_data?.showcase_notice ?? data?.showcase_notice ?? {};
    const reply = data?.complianceData?.showcase_notice?.employer_reply ?? data?.complianceData?.showcase_notice?.employer_reply ?? {};
    const base = documentBaseUrl?.replace(/\/$/, "");
    const noticeUrl = data?.noticePdfUrl ?? (base ? `${base}/showcause/${encodeURIComponent(historyRef)}` : undefined);
    const replyUrl = reply?.replyUrl ?? (reply?.reply_path && base ? `${base}/storage/${String(reply.reply_path).replace(/^\//, "")}` : undefined);

    return <View style={styles.showCause}>
        {!!data?.old_status && <Text style={styles.muted}>After {humanize(data.old_status)}</Text>}
        <View style={styles.noticeBox}>
            <Text style={styles.noticeTitle}>⚠  Issued by Officer</Text>
            <Info label="Officer Name" value={data?.officerName ?? data?.officer_data?.name ?? data?.officer_data?.firstname} />
            <Info label="Notice Date" value={formatDate(data?.created_at)} />
            {!!notice?.officer_notice?.pdf_path && <DocumentLink title="View Notice PDF" url={noticeUrl} />}
        </View>
        <View style={styles.noticeArrow}><Text style={styles.noticeArrowText}>↓</Text></View>
        <View style={[styles.noticeBox, styles.replyBox]}>
            <Text style={[styles.noticeTitle, { color: "#047857" }]}>↩  Employer Reply</Text>
            {!!data?.reply_date && <Info label="Reply Date" value={formatDate(data.reply_date)} />}
            {reply && (reply.reply_text || reply.reply_path) ? <>
                <Info label="Response" value={reply.reply_text} />
                <DocumentLink title="View Reply PDF" url={replyUrl} />
            </> : <Text style={styles.pendingText}>◷  Employer reply pending...</Text>}
        </View>
    </View>;
}

export default function TrackHistoryScreen() {
    const params = useLocalSearchParams<{ applRefNo?: string | string[] }>();
    const applRefNo = Array.isArray(params.applRefNo) ? params.applRefNo[0] : params.applRefNo;
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [payload, setPayload] = useState<AnyRecord>({ history: [] });

    const loadHistory = useCallback(async (refresh = false) => {
        if (refresh) setRefreshing(true); else setLoading(true);
        setError("");
        try {
            if (!applRefNo) throw new Error("Application reference number is missing.");
            const response = await getHistory(applRefNo);
            console.log("RESPONSE KEYS:", Object.keys(response ?? {}));
            console.log("HISTORY:", response?.history);
            console.log("COMPLIANCE:", response?.complianceData);
            console.log("COMPLIANCE SNAKE CASE:", response?.compliance_data);
            console.log("SHOW CAUSE:", response?.showCuaseFlag);
            setPayload(response ?? { history: [] });
        } catch (e: any) {
            setError(e?.message ?? "Unable to load application history.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [applRefNo]);

    useEffect(() => { loadHistory(); }, [loadHistory]);

    const history: AnyRecord[] = useMemo(() => {
        const rows = payload?.history;
        return Array.isArray(rows) ? rows : [];
    }, [payload]);
    const firstItem = history[0] ?? {};
    const complianceData = payload?.complianceData ?? payload?.compliance_data;
    console.log('test',complianceData);
    const showCause = payload?.showCuaseFlag ?? payload?.showCauseFlag ?? payload?.show_cause_flag;
    const showCauseData = payload?.complainceHistoryShowCause ?? payload?.complianceHistoryShowCause ?? payload?.showCause;
    const documentBaseUrl = payload?.documentBaseUrl ?? payload?.document_base_url;
    const currentStatus = history.length ? txt(history[history.length - 1]?.application_status) : "";

    if (loading) return <SafeAreaView style={styles.loader}><ActivityIndicator size="large" color="#2563EB" /><Text style={styles.loadingText}>Loading application history…</Text></SafeAreaView>;

    return <>
        <AppHeader />
        <SafeAreaView style={styles.screen} edges={["bottom"]}>
            <View style={styles.topBar}>
                <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
                <View style={{ flex: 1 }}><Text style={styles.pageTitle}>Application History</Text><Text style={styles.pageSubtitle}>Processing timeline and official updates</Text></View>
            </View>
            {error ? <View style={styles.stateCard}><Text style={styles.stateTitle}>Couldn't load history</Text><Text style={styles.muted}>{error}</Text><Pressable onPress={() => loadHistory()} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Try again</Text></Pressable></View>
                : history.length === 0 ? <View style={styles.stateCard}><Text style={styles.emptyIcon}>▤</Text><Text style={styles.stateTitle}>No Processing History Found</Text><Text style={styles.muted}>This application hasn't been processed yet or the history is not available.</Text><Pressable onPress={() => router.back()} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Back to Applications</Text></Pressable></View>
                    : <FlatList
                        data={history}
                        keyExtractor={(item, index) => String(item.id ?? `${item.application_status ?? "history"}-${item.created_at ?? index}`)}
                        contentContainerStyle={styles.listContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadHistory(true)} tintColor="#2563EB" />}
                        ListHeaderComponent={<View style={styles.caseCard}>
                            <View style={styles.refRow}><Text style={styles.refTag}>REF</Text><Text selectable style={styles.refNumber}>{txt(firstItem.appl_ref_no, txt(applRefNo))}</Text></View>
                            <View style={styles.caseLocation}><Text style={styles.pin}>⌖</Text><Text style={styles.caseLocationText}>{txt(firstItem.submission_location ?? firstItem.submissionLocation)}</Text></View>
                            <View style={styles.caseBottom}><View style={styles.activeTag}><View style={styles.activeDot} /><Text style={styles.activeText}>Application record</Text></View><Text style={styles.eventCount}>{history.length} {history.length === 1 ? "stage" : "stages"}</Text></View>
                            <View style={styles.currentStatusBox}><Text style={styles.infoLabel}>LATEST STATUS</Text><Text style={styles.currentStatus}>{humanize(currentStatus)}</Text></View>
                        </View>}
                        renderItem={({ item, index }) => {
                            const statusCode = txt(item.application_status ?? item.status, "UNKNOWN");
                            const status = STATUS[statusCode] ?? { label: humanize(statusCode), icon: "○", color: "#475569", bg: "#F1F5F9" };
                            const isLast = index === history.length - 1;
                            const isFinal = FINAL_STATUSES.includes(statusCode);
                            const isCurrent = isLast && !isFinal;
                            const isCompleted = !isLast;
                            const pulledBack = statusCode === "PULL_BACK";
                            const inspectionSubmitted = ["INSPECTION_FORM_SUBMITTED", "INSPECTION_FORM_RESUBMITTED"].includes(statusCode);
                            const days = Number(item.held_for);
                            const remarks = item.remarks;
                            return <View style={styles.timelineRow}>
                                <View style={styles.timelineRail}><View style={[styles.timelineDot, isCompleted || isFinal ? styles.dotDone : isCurrent ? styles.dotCurrent : null]}><Text style={[styles.timelineDotText, isCompleted || isFinal ? styles.dotDoneText : null]}>{isCompleted ? "✓" : status.icon}</Text></View>{!isLast && <View style={styles.timelineLine} />}</View>
                                <View style={[styles.eventCard, isCurrent && styles.currentCard, isFinal && styles.finalCard]}>
                                    <View style={styles.eventHeader}>
                                        <View style={styles.eventTags}><Text style={styles.stepTag}>STEP {index + 1}</Text><View style={[styles.statusPill, { backgroundColor: status.bg }]}><Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text></View></View>
                                        {isCurrent && <Text style={styles.currentTag}>CURRENT</Text>}{isFinal && <Text style={styles.finalTag}>FINAL</Text>}
                                        <Text style={styles.dateText}>{formatDate(item.created_at ?? item.date)}</Text>
                                    </View>
                                    <View style={styles.eventBody}>
                                        {inspectionSubmitted ? <PersonCard label="Current Holder" name={item.receiver_fullname ?? item.receiverName} role={item.receiver_role_name ?? item.receiverRole} office={item.receiver_office ?? item.receiverOffice} highlight tint="#2563EB" /> :
                                            pulledBack ? <View style={styles.peopleFlow}><PersonCard label="Pulled Back From" name={item.receiver_fullname ?? item.receiverName} role={item.receiver_role_name ?? item.receiverRole} office={item.receiver_office ?? item.receiverOffice} tint="#DC2626" /><Text style={styles.flowArrow}>←</Text><PersonCard label="Returned To" name={item.sender_fullname ?? item.senderName} role={item.sender_role_name ?? item.senderRole} office={item.sender_office ?? item.senderOffice} tint="#D97706" /></View> :
                                                <View style={styles.peopleFlow}><PersonCard label="From" name={item.sender_fullname ?? item.senderName} role={item.sender_role_name ?? item.senderRole} office={item.sender_office ?? item.senderOffice} /><Text style={styles.flowArrow}>→</Text><PersonCard label="To" name={item.receiver_fullname ?? item.receiverName} role={item.receiver_role_name ?? item.receiverRole} office={item.receiver_office ?? item.receiverOffice} highlight={isLast} tint={isLast ? "#2563EB" : "#64748B"} /></View>}
                                        {!!item.submission_location || !!item.submissionLocation ? <View style={styles.locationBox}><Text style={styles.locationIcon}>⌖</Text><Text style={styles.locationValue}>{txt(item.submission_location ?? item.submissionLocation)}</Text></View> : null}
                                        {!!item.held_for && Number.isFinite(days) && <View style={[styles.durationTag, days > 30 && styles.overdueTag]}><Text style={[styles.durationText, days > 30 && styles.overdueText]}>◷  {days} {days === 1 ? "day" : "days"}{days > 30 ? "  ·  OVERDUE" : ""}</Text></View>}
                                        <View style={styles.remarksBox}><View style={styles.remarksHeader}><Text style={styles.remarksTitle}>OFFICIAL REMARKS</Text>{!!remarks && <Text style={styles.recordedTag}>RECORDED</Text>}</View><Text style={styles.remarksText}>{txt(remarks, "No remarks recorded for this stage.")}</Text></View>
                                      {complianceData && (
                                        <ComplianceDetails
                                            complianceData={complianceData}
                                            documentBaseUrl={documentBaseUrl}
                                        />
                                        )}
                                        {!!showCause && isLast && !!showCauseData && <Accordion title="Show Cause Notice"><ShowCauseDetails data={{ ...showCauseData, complianceData }} historyRef={txt(firstItem.appl_ref_no, txt(applRefNo))} documentBaseUrl={documentBaseUrl} /></Accordion>}
                                    </View>
                                </View>
                            </View>;
                        }}
                        ListFooterComponent={<View style={styles.footer}><Text style={styles.footerText}>End of processing history</Text></View>}
                    />}
        </SafeAreaView>
    </>;
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#F4F7FB" },
    loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F7FB" },
    loadingText: { marginTop: 12, color: "#64748B", fontSize: 14 },
    topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 15, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
    backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
    backText: { color: "#2563EB", fontSize: 32, lineHeight: 36, marginTop: -3 },
    pageTitle: { color: "#0F172A", fontSize: 19, fontWeight: "800" },
    pageSubtitle: { color: "#64748B", fontSize: 12, marginTop: 3 },
    listContent: { padding: 16, paddingBottom: 32 },
    caseCard: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E2E8F0", padding: 17, marginBottom: 24 },
    refRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    refTag: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2, color: "#2563EB", backgroundColor: "#EFF6FF", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7, overflow: "hidden" },
    refNumber: { color: "#0F172A", fontSize: 17, fontWeight: "800", flexShrink: 1 },
    caseLocation: { flexDirection: "row", alignItems: "center", marginTop: 14, gap: 8 },
    pin: { fontSize: 20, color: "#2563EB" },
    caseLocationText: { color: "#475569", fontSize: 13, flex: 1 },
    caseBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 },
    activeTag: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#ECFDF5", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
    activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#059669" },
    activeText: { color: "#047857", fontWeight: "700", fontSize: 11 },
    eventCount: { color: "#64748B", fontSize: 12 },
    currentStatusBox: { marginTop: 15, padding: 12, backgroundColor: "#F8FAFC", borderRadius: 11 },
    infoLabel: { fontSize: 10, color: "#64748B", fontWeight: "800", letterSpacing: 0.8, marginBottom: 6 },
    currentStatus: { color: "#1E293B", fontSize: 14, fontWeight: "700" },
    timelineRow: { flexDirection: "row", alignItems: "stretch", marginBottom: 18 },
    timelineRail: { width: 34, alignItems: "center" },
    timelineDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#CBD5E1", alignItems: "center", justifyContent: "center", zIndex: 1 },
    timelineDotText: { color: "#64748B", fontSize: 13, fontWeight: "800" },
    dotDone: { backgroundColor: "#ECFDF5", borderColor: "#6EE7B7" },
    dotDoneText: { color: "#047857" },
    dotCurrent: { backgroundColor: "#EFF6FF", borderColor: "#93C5FD" },
    timelineLine: { width: 2, flex: 1, backgroundColor: "#D8E1EC", minHeight: 30 },
    eventCard: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 15, borderWidth: 1, borderColor: "#E2E8F0", overflow: "hidden" },
    currentCard: { borderColor: "#93C5FD" },
    finalCard: { borderColor: "#6EE7B7" },
    eventHeader: { padding: 13, backgroundColor: "#F8FAFC", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
    eventTags: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 7 },
    stepTag: { color: "#64748B", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
    statusPill: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6, maxWidth: "100%" },
    statusPillText: { fontSize: 11, fontWeight: "700" },
    currentTag: { alignSelf: "flex-start", marginTop: 8, color: "#1D4ED8", backgroundColor: "#DBEAFE", overflow: "hidden", borderRadius: 5, paddingHorizontal: 7, paddingVertical: 4, fontSize: 9, fontWeight: "900" },
    finalTag: { alignSelf: "flex-start", marginTop: 8, color: "#047857", backgroundColor: "#D1FAE5", overflow: "hidden", borderRadius: 5, paddingHorizontal: 7, paddingVertical: 4, fontSize: 9, fontWeight: "900" },
    dateText: { color: "#64748B", fontSize: 11, marginTop: 9 },
    eventBody: { padding: 13 },
    peopleFlow: { gap: 8 },
    personCard: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 11, padding: 11, flex: 1, minWidth: 0 },
    personHighlight: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
    personLabel: { color: "#64748B", fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 9 },
    personRow: { flexDirection: "row", alignItems: "center", gap: 9 },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#64748B", alignItems: "center", justifyContent: "center" },
    avatarText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },
    personDetails: { flex: 1, minWidth: 0 },
    personName: { color: "#1E293B", fontSize: 13, fontWeight: "800" },
    muted: { color: "#64748B", fontSize: 11, marginTop: 4, lineHeight: 16 },
    flowArrow: { alignSelf: "center", color: "#2563EB", fontSize: 20, fontWeight: "700" },
    locationBox: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 12, padding: 10, borderRadius: 9, backgroundColor: "#EFF6FF" },
    locationIcon: { color: "#2563EB", fontSize: 17 },
    locationValue: { color: "#1D4ED8", fontSize: 12, fontWeight: "700", flex: 1 },
    durationTag: { alignSelf: "flex-start", backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 7, paddingHorizontal: 9, paddingVertical: 6, marginTop: 11 },
    durationText: { color: "#475569", fontSize: 11, fontWeight: "700" },
    overdueTag: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
    overdueText: { color: "#B91C1C" },
    remarksBox: { marginTop: 13, backgroundColor: "#F8FAFC", borderColor: "#E2E8F0", borderWidth: 1, borderRadius: 11, padding: 12 },
    remarksHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 },
    remarksTitle: { color: "#64748B", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
    recordedTag: { color: "#047857", backgroundColor: "#D1FAE5", fontSize: 9, fontWeight: "900", paddingHorizontal: 7, paddingVertical: 4, borderRadius: 5, overflow: "hidden" },
    remarksText: { color: "#334155", fontSize: 13, lineHeight: 20 },
    complianceWrap: { marginTop: 16 },
    subheading: { color: "#0F172A", fontWeight: "800", fontSize: 14, marginBottom: 10 },
    accordion: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 11, overflow: "hidden", marginTop: 9, backgroundColor: "#FFFFFF" },
    accordionHead: { minHeight: 48, paddingHorizontal: 13, paddingVertical: 12, backgroundColor: "#EFF6FF", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    accordionTitle: { color: "#1D4ED8", fontSize: 13, fontWeight: "800", flex: 1 },
    accordionChevron: { color: "#1D4ED8", fontSize: 22, fontWeight: "500" },
    accordionBody: { padding: 11 },
    complianceStep: { marginBottom: 12 },
    stepTitle: { color: "#2563EB", fontSize: 11, fontWeight: "900", letterSpacing: 0.8, marginBottom: 9 },
    reportCard: { backgroundColor: "#EEF2FF", borderRadius: 10, padding: 11, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 9 },
    reportTitle: { color: "#3730A3", fontSize: 12, fontWeight: "800" },
    documentButton: { alignSelf: "flex-start", backgroundColor: "#EFF6FF", borderColor: "#BFDBFE", borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginTop: 7 },
    documentButtonText: { color: "#1D4ED8", fontSize: 11, fontWeight: "800" },
    directionRow: { gap: 8, marginBottom: 10 },
    directionCard: { borderLeftWidth: 3, borderRadius: 8, backgroundColor: "#F8FAFC", padding: 11 },
    info: { marginTop: 8 },
    infoValue: { color: "#334155", fontSize: 12, lineHeight: 18 },
    opinion: { alignSelf: "flex-start", overflow: "hidden", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5, marginTop: 8, fontSize: 10, fontWeight: "800" },
    good: { color: "#047857", backgroundColor: "#D1FAE5" },
    bad: { color: "#B91C1C", backgroundColor: "#FEE2E2" },
    showCause: { paddingTop: 3 },
    noticeBox: { borderWidth: 1, borderColor: "#FECACA", borderRadius: 10, padding: 12, backgroundColor: "#FFF7F7" },
    replyBox: { borderColor: "#A7F3D0", backgroundColor: "#F0FDF4" },
    noticeTitle: { color: "#B91C1C", fontSize: 13, fontWeight: "900", marginBottom: 7 },
    noticeArrow: { alignItems: "center", padding: 5 },
    noticeArrowText: { color: "#64748B", fontSize: 22 },
    pendingText: { color: "#B45309", backgroundColor: "#FFFBEB", padding: 10, borderRadius: 8, fontSize: 12, fontWeight: "700" },
    footer: { paddingVertical: 12, alignItems: "center" },
    footerText: { color: "#94A3B8", fontSize: 11 },
    stateCard: { margin: 20, padding: 24, backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", gap: 10 },
    emptyIcon: { fontSize: 34, color: "#94A3B8" },
    stateTitle: { color: "#0F172A", fontWeight: "800", fontSize: 17, textAlign: "center" },
    primaryButton: { backgroundColor: "#2563EB", paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10, marginTop: 8 },
    primaryButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },
});
