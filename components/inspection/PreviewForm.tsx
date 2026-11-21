import { API } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,

    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import InspectionTable from "./InspectionTable";

export default function PreviewForm({
    application,
    common,
    inspectionASE,
    inspectionContract,
    inspectionMW,
    inspectionCombined,
    eodbCommon,
    eodbAse,
    combinedInspectionRecord,
    selectedTypes,
    onEdit,
    onSubmit,
    loading,
}: any) {

    const employer = common?.common_data?.employer || {};
    const establishment = common?.common_data?.establishment || {};
    const files = common?.common_data?.files || {};
    const gpsLocation = common?.common_data?.gps_location || null;
    const [estPhotoUri, setEstPhotoUri] = useState("");
    const [emplSignUri, setEmplSignUri] = useState("");
    const [inspectorSignUri, setInspectorSignUri] = useState("");



    // ─── Helper to build image URI from path ───
    const getImageUri = async (path: string): Promise<string> => {
        const token = await AsyncStorage.getItem("token");

        const res = await API.get("/private-file-base64", {
            params: {
                path, // Use the function parameter
            },
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return `data:image/jpeg;base64,${res.data.base64}`;
    }

    // ─── Image paths from common data ───
    const estPhotoPath = files?.est_photo || "";
    const emplSignPath = files?.empl_sign || "";
    const inspectorSignPath = files?.inspector_sign || "";


    // ─── Establishment photos (up to 3) ───
    const estPhotos = [
        files?.est_photo_1 || files?.est_photo || "",
        files?.est_photo_2 || "",
        files?.est_photo_3 || "",
    ].filter(Boolean);

    useEffect(() => {
        const loadImages = async () => {
            try {
                if (emplSignPath) {
                    const uri = await getImageUri(emplSignPath);
                    setEmplSignUri(uri);
                }

                if (inspectorSignPath) {
                    const uri = await getImageUri(inspectorSignPath);
                    setInspectorSignUri(uri);
                }

                if (estPhotoPath) {
                    const uri = await getImageUri(estPhotoPath);
                    setEstPhotoUri(uri);
                }


            } catch (err) {
                console.log("Image loading error:", err);
            }
        };

        loadImages();
    }, [emplSignPath, inspectorSignPath, estPhotoPath]);

    return (
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={previewStyles.container}
            showsVerticalScrollIndicator={false}
        >
            <Text style={previewStyles.title}>
                Labour Inspection Report
            </Text>

            <View style={previewStyles.card}>
                <Row
                    label="Selected Inspection Typs"
                    value={selectedTypes.join(", ").toUpperCase()}
                />
            </View>

            <Section title="Employer Details">
                <Row label="First Name" value={employer.first_name} />
                <Row label="Last Name" value={employer.last_name} />
                <Row label="Mobile" value={employer.mobile} />
                <Row label="Email" value={employer.email} />
            </Section>

            <Section title="Establishment">
                <Row
                    label="Name"
                    value={application?.name_of_the_establishment}
                />
                <Row
                    label="Address"
                    value={[
                        establishment.address_1,
                        establishment.address_2,
                        establishment.address_3,
                    ]
                        .filter(Boolean)
                        .join(", ")}
                />
                <Row label="State" value={"Assam"} />
                <Row label="District" value={establishment.district} />
                <Row label="Ward" value={establishment.ward_no} />

                {/* ─── GPS Location ─── */}
                {gpsLocation && (
                    <>
                        <Row
                            label="Latitude"
                            value={gpsLocation.latitude?.toString() || "-"}
                            valueColor="#1f928c"
                        />
                        <Row
                            label="Longitude"
                            value={gpsLocation.longitude?.toString() || "-"}
                            valueColor="#1f928c"
                        />
                    </>
                )}

                {/* ─── Establishment Photos ─── */}

            </Section>

            {/* ─── Signatures Section ─── */}
            <Section title="Signatures & Photos">
                {/* Inspector Signature */}
                {inspectorSignPath ? (
                    <View style={{ marginBottom: 12 }}>
                        <Text style={previewStyles.subSectionTitle}>Inspector Signature</Text>
                        {inspectorSignUri ? (
                            <Image
                                source={{ uri: inspectorSignUri }}
                                style={previewStyles.signatureImage}
                                resizeMode="contain"
                            />
                        ) : null}
                    </View>
                ) : (
                    <Row label="Inspector Signature" value="Not provided" valueColor="#E53935" />
                )}

                {/* Employer Signature */}
                {emplSignPath ? (
                    <View style={{ marginBottom: 12 }}>
                        <Text style={previewStyles.subSectionTitle}>Employer Signature</Text>
                        {emplSignUri ? (
                            <Image
                                source={{ uri: emplSignUri }}
                                style={previewStyles.signatureImage}
                                resizeMode="contain"
                            />
                        ) : null}
                    </View>
                ) : (
                    <Row label="Employer Signature" value="Not provided" valueColor="#E53935" />
                )}

                {/* Establishment Photo (single main photo) */}
                {estPhotoPath ? (
                    <View style={{ marginBottom: 12 }}>
                        <Text style={previewStyles.subSectionTitle}>Establishment Photo</Text>
                        {estPhotoUri ? (
                            <Image
                                source={{ uri: estPhotoUri }}
                                style={previewStyles.signatureImage}
                                resizeMode="contain"
                            />
                        ) : null}
                    </View>
                ) : (
                    <Row label="Establishment Photo" value="Not provided" valueColor="#E53935" />
                )}
            </Section>

            <TouchableOpacity
                style={previewStyles.editButton}
                onPress={() => onEdit("common")}
            >
                <Text style={previewStyles.editText}>
                    ✏ Edit Common Details
                </Text>
            </TouchableOpacity>

            {selectedTypes.includes("combined") && (
                <CombinedPreview
                    data={inspectionCombined}
                    eodbCommon={eodbCommon}
                    eodbAse={eodbAse}
                    common={common}
                    inspectionRecord={combinedInspectionRecord}
                    referenceNumber={application?.appl_ref_no}
                    onEdit={() => onEdit("combined")}
                />
            )}

            {selectedTypes.includes("ase") && (
                <ASEPreview
                    data={inspectionASE}
                    onEdit={() => onEdit("ase")}
                />
            )}

            {selectedTypes.includes("contract") && (
                <ContractPreview
                    data={inspectionContract}
                    onEdit={() => onEdit("contract")}
                />
            )}

            {selectedTypes.includes("minimumwage") && (
                <MWPreview
                    data={inspectionMW}
                    onEdit={() => onEdit("minimumwage")}
                />
            )}

            <TouchableOpacity
                style={[
                    previewStyles.submitButton,
                    loading && { opacity: 0.7 },
                ]}
                onPress={onSubmit}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={previewStyles.submitText}>
                        Submit Inspection
                    </Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

function Section({ title, children }: any) {
    return (
        <View style={previewStyles.section}>
            <Text style={previewStyles.sectionTitle}>
                {title}
            </Text>
            {children}
        </View>
    );
}

function Row({ label, value, valueColor }: any) {
    return (
        <View style={previewStyles.row}>
            <Text style={previewStyles.label}>{label}</Text>
            <Text
                style={[
                    previewStyles.value,
                    valueColor && { color: valueColor, fontWeight: "700" },
                ]}
            >
                {value || "-"}
            </Text>
        </View>
    );
}


// ─── Combined Inspection Preview ───────────────────────────────
const COMBINED_CHECKLIST_PREVIEW = [
    {
        title: "A. Records and Registers", fields: [
            ["appointment_letters_issued", "Appointment letters issued to workers"],
            ["attendance_register_maintained", "Muster roll / attendance register maintained"],
            ["wage_overtime_register_maintained", "Wage register and overtime records maintained"],
            ["leave_weeklyoff_records_maintained", "Leave and weekly-off records maintained"],
            ["accident_register_maintained", "Accident and dangerous occurrence register maintained"],
            ["medical_records_maintained", "Medical examination records maintained"],
            ["contractor_records_maintained", "Records of contractors and contract workers maintained"],
            ["fines_deductions_register_maintained", "Register of fines and deductions maintained"],
        ]
    },
    {
        title: "B. Safety and Health", fields: [
            ["fire_extinguishers_available", "Fire extinguishers available and accessible"],
            ["fire_exits_alarm_working", "Fire exits and alarm system working"],
            ["mock_drills_conducted", "Mock drills conducted and recorded"],
            ["machinery_guards_in_place", "Machinery guards in place"],
            ["lifting_machines_tested", "Lifting machines / pressure vessels tested"],
            ["electrical_installations_safe", "Electrical installations safe"],
            ["ventilation_lighting_adequate", "Ventilation and lighting adequate"],
            ["hazardous_process_controls", "Hazardous process controls in place"],
            ["ppe_provided_and_used", "PPE provided and used"],
            ["safety_committee_constituted", "Safety committee constituted"],
            ["safety_officer_appointed", "Safety officer appointed"],
            ["emergency_plan_displayed", "Emergency plan displayed"],
            ["first_aid_facility_available", "First-aid facility available"],
        ]
    },
    {
        title: "C. Welfare Facilities", fields: [
            ["safe_drinking_water_available", "Safe drinking water available"],
            ["toilet_facilities_available", "Toilet facilities available"],
            ["washing_bathing_facilities", "Washing and bathing facilities"],
            ["canteen_available", "Canteen available"],
            ["creche_available", "Creche available"],
            ["rest_room_available", "Rest room / shelter available"],
            ["migrant_accommodation_adequate", "Migrant worker accommodation adequate"],
        ]
    },
    {
        title: "D. Working Conditions", fields: [
            ["working_hours_within_limits", "Working hours within limits"],
            ["rest_intervals_observed", "Rest intervals observed"],
            ["overtime_within_limits", "Overtime within limits"],
            ["weekly_rest_and_leave_given", "Weekly rest and leave provided"],
            ["annual_health_checkup_conducted", "Annual health check-up conducted"],
            ["women_night_work_safety_ensured", "Women night-shift safety ensured"],
            ["wages_paid_on_time", "Wages paid on time"],
            ["principal_employer_responsibility_discharged", "Principal employer responsibilities discharged"],
        ]
    },
];

function CombinedPreview({ data = {}, eodbCommon, eodbAse, common, inspectionRecord, referenceNumber, onEdit }: any) {

    const [violationPhotoUri, setViolationPhotoUri] = useState("");
    const [photoError, setPhotoError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadViolationPhoto = async () => {
            const photoPath = data?.combined_violation_photo;

            if (!photoPath) {
                setViolationPhotoUri("");
                return;
            }

            setPhotoError(false);
            setViolationPhotoUri("");

            console.log("Loading Combined violation photo:", photoPath);

            try {
                const token = await AsyncStorage.getItem("token");

                const res = await API.get("/private-file-base64", {
                    params: {
                        path: photoPath,
                    },
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (isMounted && res.data?.base64) {
                    setViolationPhotoUri(
                        `data:${res.data.mime || "image/jpeg"};base64,${res.data.base64}`
                    );
                } else if (isMounted) {
                    setPhotoError(true);
                }

            } catch (error: any) {
                console.log("Combined violation photo loading failed:", {
                    path: photoPath,
                    status: error?.response?.status,
                    response: error?.response?.data,
                    message: error?.message,
                });

                if (isMounted) {
                    setPhotoError(true);
                }
            }
        };

        loadViolationPhoto();

        return () => {
            isMounted = false;
        };
    }, [data?.combined_violation_photo]);

    const directions = Array.isArray(data?.combined_directions)
        ? data.combined_directions
        : [];

    const rows = (fields: string[][]) => fields.map(([key, label]) => ({
        label,
        value: data?.[key] ?? "-",
        remarks: data?.[`${key}_remarks`] || "",
    }));

    return (
        <View style={previewStyles.card}>
            <Text style={previewStyles.sectionTitle}>Combined Inspection Report</Text>

            <Text style={previewStyles.subSectionTitle}>Inspection Details</Text>
            <InspectionTable rows={[
                { label: "UBIN", value: eodbCommon?.ubin },
                { label: "Reference Number", value: referenceNumber },
                { label: "Establishment Name", value: eodbCommon?.name_of_the_establishment },
                { label: "Submission Location", value: eodbCommon?.submission_location },
                { label: "Inspector Name", value: inspectionRecord?.inspected_by || common?.common_data?.inspector?.name },
                { label: "Inspector Designation", value: common?.common_data?.inspector?.designation },
                { label: "Inspection Date", value: inspectionRecord?.inspection_date || common?.common_data?.inspector?.date },
                { label: "Inspection Time", value: common?.common_data?.inspector?.time },
                { label: "GPS Latitude", value: common?.common_data?.gps_location?.latitude },
                { label: "GPS Longitude", value: common?.common_data?.gps_location?.longitude },
            ]} />

            <Text style={previewStyles.subSectionTitle}>Workforce and Other Details</Text>
            <InspectionTable rows={[
                { label: "Registration / License Number", value: data?.registration_number || eodbAse?.registration_number },
                { label: "Nature of Activity", value: data?.nature_of_activity || eodbAse?.nature_of_business },
                { label: "Direct Workers", value: data?.combined_workers_direct },
                { label: "Women Workers", value: data?.combined_women_workers },
                { label: "Migrant Workers", value: data?.combined_migrant_workers },
                { label: "Shifts", value: data?.combined_shifts },
            ]} />

            {COMBINED_CHECKLIST_PREVIEW.map(section => (
                <View key={section.title} style={previewStyles.combinedChecklistSection}>
                    <Text style={previewStyles.subSectionTitle}>{section.title}</Text>
                    {section.fields.map(([key, label], index) => (
                        <View key={key} style={previewStyles.combinedChecklistItem}>
                            <View style={previewStyles.combinedChecklistHeader}>
                                <Text style={previewStyles.combinedChecklistNumber}>{index + 1}.</Text>
                                <Text style={previewStyles.combinedChecklistLabel}>{label}</Text>
                            </View>
                            <View style={previewStyles.combinedFindingRow}>
                                <Text style={previewStyles.combinedFindingCaption}>Finding</Text>
                                <Text style={previewStyles.combinedFindingValue}>{data?.[key] || "-"}</Text>
                            </View>
                            <View style={previewStyles.combinedRemarksRow}>
                                <Text style={previewStyles.combinedRemarksCaption}>Remarks / Evidence</Text>
                                <Text style={previewStyles.combinedRemarksValue}>{data?.[`${key}_remarks`] || "-"}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            ))}

            <Text style={previewStyles.subSectionTitle}>Inspection Findings</Text>
            <InspectionTable rows={[
                { label: "Violations Observed", value: data?.combined_violations_observed },
                { label: "Imminent Danger", value: data?.combined_imminent_danger },
                { label: "Compliance Deadline", value: data?.combined_compliance_deadline },
                { label: "Follow-up Date", value: data?.combined_followup_date },
                {
                    label: "Authorised Signatory Name",
                    value:
                        common?.common_data?.employer?.authorised_signatory_name ||
                        data?.authorised_signatory_name,
                },
                {
                    label: "Authorised Signatory Designation",
                    value:
                        common?.common_data?.employer?.authorised_signatory_designation ||
                        data?.authorised_signatory_designation,
                },
            ]} />

            {data?.combined_violation_photo ? (
                <View style={{ marginTop: 15, marginBottom: 15 }}>
                    <Text style={previewStyles.subSectionTitle}>
                        Violation Evidence Photo
                    </Text>

                    {violationPhotoUri ? (
                        <Image
                            source={{ uri: violationPhotoUri }}
                            style={{
                                width: "100%",
                                height: 230,
                                borderRadius: 8,
                                backgroundColor: "#f2f2f2",
                            }}
                            resizeMode="contain"
                        />
                    ) : photoError ? (
                        <Text style={previewStyles.remarksText}>
                            Unable to load violation evidence photo.
                        </Text>
                    ) : (
                        <Text style={previewStyles.remarksText}>
                            Loading violation evidence photo...
                        </Text>
                    )}
                </View>
            ) : (
                <Text style={previewStyles.remarksText}>
                    Violation evidence photo: Not provided
                </Text>
            )}

            {directions.length > 0 && (
                <>
                    <Text style={previewStyles.subSectionTitle}>Directions</Text>
                    {directions.map((direction: any, index: number) => (
                        <Text key={index} style={previewStyles.bulletItem}>
                            • {typeof direction === "string" ? direction : direction?.direction || "-"}
                        </Text>
                    ))}
                </>
            )}

            <TouchableOpacity style={previewStyles.editButton} onPress={onEdit}>
                <Text style={previewStyles.editText}>✏ Edit Combined Inspection</Text>
            </TouchableOpacity>
        </View>
    );
}


// ─── ASE Preview ───────────────────────────────────────────────
function ASEPreview({ data, onEdit }: any) {
    // ── Establishment / Employer Details ──
    const establishmentRows = [
        { label: "Name and address of Employer / Proprietor / Managing Director / Partner / Manager / Contractor", value: data?.name_address_of_employer },
        { label: "Name and Address of the Establishment", value: data?.establishment_name },
        { label: "Labour Identification Number (LIN)", value: data?.lin },
        { label: "Date of Application", value: data?.date_of_application },
        { label: "Nature of Business", value: data?.nature_of_business },
        { label: "Number of Employees", value: data?.no_of_employees },
        { label: "Category of Business", value: data?.category_of_business },
        { label: "Date of expiry of previous license", value: data?.date_of_expiry_previous_license },
        { label: "No. of workers mentioned in previous license", value: data?.previous_license_worker_count },
        { label: "Contact Number and e-mail", value: data?.contact_number_email },
        { label: "Date of Commencement of business", value: data?.date_of_commencement },
        { label: "Opening and closing hours (under Sec-34)", value: data?.opening_and_closing_hours },
        { label: "Certificate of Registration and Date of Registration (Obtained / Not obtained)", value: data?.certificate_registration_date },
        { label: "Registration Number", value: data?.registration_number },
        { label: "Certificate of Renewal of Registration under Sec-7 (Obtained / Not obtained)", value: data?.certificate_renewal_obtained },
        { label: "Whether Registration / Renewal Certificate displayed or not (under Sec-6)", value: data?.whether_certificate_displayed },
    ];

    // ── Workplace Safety and Health Measures ──
    const safetyRows = [
        { label: "Ensuring proper cleanliness in the workplace", value: data?.cleanliness_workplace_ase },
        { label: "Providing adequate lighting in all work areas", value: data?.adequate_lighting_ase },
        { label: "Maintaining proper ventilation to ensure a healthy working environment", value: data?.proper_ventilation_ase },
        { label: "Taking necessary measures for prevention of fire, including safety arrangements and emergency preparedness", value: data?.fire_prevention_measures_ase },
        { label: "Taking all necessary preventive measures to avoid accidents at the workplace", value: data?.accident_prevention_ase },
        { label: "Drinking Water (Section 18)", value: data?.drinking_water_ase },
        { label: "Latrine & Urinal (Section 19)", value: data?.latrine_urinal_ase },
        { label: "First Aid (Section 19)", value: data?.first_aid_ase },
        { label: "Creche Facility (Section 20)", value: data?.creche_facility_ase },
        { label: "Canteen (Section 22)", value: data?.canteen_ase },
    ];

    // ── Inspection Findings ──
    const findingsRows = [
        { label: "Issue of appointment letters (Section 16)", value: data?.issue_of_appointment_letters_ase },
        { label: "Issue of identity cards (Section 16)", value: data?.issue_of_identity_card_ase },
        { label: "Issue of payslips", value: data?.issue_of_payslip_ase },
        { label: "Applicability of ESIC to the establishment as per the Employees' State Insurance Act, 1948", value: data?.applicable_of_ESIC_ase },
        { label: "Number of employees covered under ESIC", value: data?.ESIC_ase_no_of_empl },
        { label: "Maintenance of registers against each employee (Section 25)", value: data?.maintenance_of_registers_ase },
        { label: "Whether annual return is submitted or not? (Section 26)", value: data?.whether_annual_rep_submitted_ase },
        { label: "Has any adolescent been employed?", value: data?.is_adolescent_employed_ase },
        { label: "Intimation Obtained (Section 7)", value: data?.intimation_obtained_ase },
        { label: "Overtime Wages Paid for Extra Working Hours (Section 14)", value: data?.overtime_wages_paid_ase },
        { label: "Annual Leave, Casual Leave, Sick Leave and Other Prescribed Holidays Provided (Section 17)", value: data?.leaves_and_holidays_provided_ase },
    ];

    const womenNightShiftRows = [
        { label: "Written Consent Taken", value: data?.women_written_consent_ase },
        { label: "Women Security Guards Available", value: data?.women_security_guards_ase },
        { label: "CCTV Available", value: data?.cctv_available_ase },
        { label: "Transportation Provided", value: data?.transportation_provided_ase },
        { label: "Separate Restrooms Provided", value: data?.separate_restrooms_ase },
    ];

    // ── Adolescent Worker Details ──
    const adolescents = data?.adolescent_details_ase || [];

    // ── Directions ──
    const hasDirections = data?.has_directions_ase || ((data?.ase_directions || []).some((item: any) => String(item ?? "").trim()) ? "Yes" : "No");
    const directions = hasDirections === "Yes" ? (data?.ase_directions || []) : [];

    return (
        <View style={previewStyles.card}>
            <Text style={previewStyles.sectionTitle}>ASE Inspection Report</Text>

            {/* Establishment / Employer Details */}
            <Text style={previewStyles.subSectionTitle}>Establishment / Employer Details</Text>
            <InspectionTable rows={establishmentRows} />

            {/* Workplace Safety and Health Measures */}
            {/* Inspection Findings */}
            <Text style={previewStyles.subSectionTitle}>Inspection Findings</Text>
            <InspectionTable rows={findingsRows} />

            <Text style={previewStyles.subSectionTitle}>Engagement of Women Employees in Night Shifts (Section 11(2))</Text>
            <InspectionTable rows={womenNightShiftRows} />

            {/* Adolescent Worker Details */}
            {adolescents.length > 0 && (
                <>
                    <Text style={previewStyles.subSectionTitle}>Adolescent Worker Details</Text>
                    {adolescents.map((ado: any, idx: number) => (
                        <View key={idx} style={previewStyles.nestedCard}>
                            <Row label="Whether intimation has been provided to the concerned Labour Office" value={ado.labour_office_intimation} />
                            <Row label="Name of the adolescent" value={ado.name} />
                            <Row label="Address of the adolescent" value={ado.address} />
                            <Row label="Age of the adolescent" value={ado.age} />
                            <Row
                                label="Age proof (Upload document)"
                                value={ado.age_proof_name || (ado.age_proof ? "Uploaded" : "-")}
                            />
                            <Row label="Whether engaged in hazardous occupations" value={ado.hazardous_work} />
                            <Row label="Working hours" value={ado.working_hours} />
                            <Row label="Whether maintains register or not" value={ado.maintain_register} />
                            <Row label="Wage paid to the adolescent" value={ado.wage_amount} />
                        </View>
                    ))}
                </>
            )}

            {/* Permanent Workers */}
            <Text style={previewStyles.subSectionTitle}>Number of workers employed (Permanent / Regular Workers)</Text>
            {renderWorkerTable(data, "permanent")}

            {/* Temporary/Casual Workers */}
            <Text style={previewStyles.subSectionTitle}>Number of workers employed (Temporary/Casual worker)</Text>
            {renderWorkerTable(data, "temporary", true)}

            {/* Contract Labour */}
            <Text style={previewStyles.subSectionTitle}>Number of workers employed (Contract labour)</Text>
            {renderWorkerTable(data, "contract")}

            {/* Rate of wages paid */}
            <Text style={previewStyles.subSectionTitle}>Rate of wages paid</Text>
            {renderWorkerTable(data, "wages_paid")}

            {/* Wages & Work */}
            <Text style={previewStyles.subSectionTitle}>Wages & Work</Text>
            <InspectionTable rows={[
                { label: "Whether the notified wages have been paid (Yes/No)", value: data?.whether_notified_wages_paid },
                { label: "Hours of Work in a day of the workers (under Sec-13)", value: data?.hours_of_work_a_day },
                { label: "Working hours of female employees under Sec 11(2)", value: data?.working_hours_of_female },
                { label: "Whether weekly holidays provided to employees under Sec-15(2)", value: data?.whether_weekly_holidays_provided },
            ]} />

            {/* Prescribed Registers */}
            <Text style={previewStyles.subSectionTitle}>Whether prescribed registers are maintained under Sec-25</Text>
            <InspectionTable rows={[
                { label: "Whether prescribed registers are maintained under Sec-25", value: data?.wheather_prescribed_reg_maintained },
                { label: "(a) Register of hours of work and interval of rest", value: data?.register_of_hours_of_work },
                { label: "(b) Register of overtime", value: data?.register_of_overtime },
                { label: "(c) Register of employment", value: data?.register_of_employment },
                { label: "(d) Register of Leave", value: data?.register_of_leave },
            ]} />

            {/* Violations */}
            <Text style={previewStyles.subSectionTitle}>Any other violation of the provisions of the Act noticed</Text>
            <InspectionTable rows={[
                { label: "Any other violation of the provisions of the Act noticed", value: data?.violation_of_provisions },
            ]} />

            {/* Directions */}
            <Text style={previewStyles.subSectionTitle}>Directions</Text>
            <InspectionTable rows={[{ label: "Is there any directions to be mentioned?", value: hasDirections || "-" }]} />
            {directions.length > 0 && (
                <>
                    {directions.map((dir: string, idx: number) => (
                        <Text key={idx} style={previewStyles.bulletItem}>• {dir}</Text>
                    ))}
                </>
            )}

            {/* Remarks */}
            <Text style={previewStyles.subSectionTitle}>Remarks</Text>
            <Text style={previewStyles.remarksText}>{data?.additional_remarks || "-"}</Text>

            <TouchableOpacity style={previewStyles.editButton} onPress={onEdit}>
                <Text style={previewStyles.editText}>✏ Edit ASE</Text>
            </TouchableOpacity>
        </View>
    );
}

// Helper to render worker/wage tables
function renderWorkerTable(data: any, prefix: string, showApprentice = false) {
    const categories = [
        { key: "unskilled", label: "Unskilled" },
        { key: "semiskilled", label: "Semi-Skilled" },
        { key: "skilled", label: "Skilled" },
        { key: "highly_skilled", label: "Highly Skilled" },
    ];

    return (
        <View style={{ marginBottom: 12 }}>
            <View style={previewStyles.tableRow}>
                <Text style={[previewStyles.tableCell, previewStyles.tableCellHeader, { flex: 2 }]}>Category</Text>
                <Text style={[previewStyles.tableCell, previewStyles.tableCellHeader]}>Male</Text>
                <Text style={[previewStyles.tableCell, previewStyles.tableCellHeader]}>Female</Text>
            </View>
            {categories.map((cat) => (
                <View key={cat.key} style={previewStyles.tableRow}>
                    <Text style={[previewStyles.tableCell, { flex: 2 }]}>{cat.label}</Text>
                    <Text style={[previewStyles.tableCell, previewStyles.tableCellCenter]}>
                        {data?.[`${prefix}_${cat.key}_male`] || "-"}
                    </Text>
                    <Text style={[previewStyles.tableCell, previewStyles.tableCellCenter]}>
                        {data?.[`${prefix}_${cat.key}_female`] || "-"}
                    </Text>
                </View>
            ))}
            {showApprentice && (
                <View style={previewStyles.tableRow}>
                    <Text style={[previewStyles.tableCell, { flex: 2 }]}>Apprentice</Text>
                    <Text style={[previewStyles.tableCell, previewStyles.tableCellCenter]}>
                        {data?.[`${prefix}_apprentice_male`] || "-"}
                    </Text>
                    <Text style={[previewStyles.tableCell, previewStyles.tableCellCenter]}>
                        {data?.[`${prefix}_apprentice_female`] || "-"}
                    </Text>
                </View>
            )}
        </View>
    );
}

// ─── Contract Labour Preview ─────────────────────────────────
function ContractPreview({ data, onEdit }: any) {
    const contractRows = [
        { label: "Whether License obtained while executing contract work through contract labour [Section 47]", value: data?.whether_license_obtained },
        { label: "Whether contract labour exceeds maximum number specified in licence [Section 48]", value: data?.whether_contract_labour_numbering },
        { label: "Whether notices regarding rates of wages, hours of work, wage period etc. displayed [Section 31(1)]", value: data?.whether_notices_regarding_rates_of_wages },
        { label: "Whether copy of displayed notices sent to Inspector [Section 31(2)]", value: data?.whether_copy_of_each_notice_displayed },
        { label: "Whether electronic wage disbursement is maintained and intimated digitally to the Principal Employer with proof? [Section 55(2)]", value: data?.electronic_wage_disbursement_and_digital_intimation_contract },
        { label: "Whether intimation of commencement/completion submitted within 30 days [Section 5(1)]", value: data?.whether_intimation_of_commencement },
        { label: "Whether Yearly Return in Form X submitted [Section 33(d)]", value: data?.whether_half_yearly_return },
        { label: "Whether contractor ensured payment of wages within prescribed time [Section 55(1)]", value: data?.whether_contractor_ensured_payment_of_wages },
        { label: "Whether register of persons employed maintained [Section 33(a)]", value: data?.whether_register_of_person_maintained },
        { label: "Whether wage register maintained [Section 33(a)]", value: data?.whether_wage_register_maintained },
        { label: "Whether welfare facilities provided (water, latrine, washing) [Section 53]", value: data?.whether_welfare_facilities_regarding_drinking_water },
        { label: "Whether creche facility provided [Section 53]", value: data?.whether_contractor_creche_facility },
        { label: "Whether canteen facility provided when 100+ contract labour employed [Section 53]", value: data?.whether_contractor_provides_canteen_facility },
        { label: "Whether rest rooms provided for night halt [Section 53]", value: data?.whether_contractor_prvides_rest_rooms },
        { label: "Whether first aid facilities provided [Section 53]", value: data?.whether_first_aid_provided },
        { label: "Whether Letter of Appointment issued to each worker [Section 6(1)(f)]", value: data?.issue_of_appointment_letters_contract },
        { label: "Whether experience certificate issued on termination [Section 56]", value: data?.whether_contractor_issued_service_certificate },
        { label: "Whether wage slips in Form XIX issued before wage disbursement [Section 33]", value: data?.whether_wage_slips_formxix_issued },
        { label: "Whether safe workplace and machinery provided? [Section 6 and Section 18]", value: data?.safe_workplace_and_machinery_contract },
        { label: "Whether PPE provided? [Section 82(d)]", value: data?.ppe_provided_contract },
        { label: "Whether fire safety and emergency arrangement provided? [Section 80, 84(4)]", value: data?.fire_prevention_measures_contract },
        { label: "Whether Safety instructions and training provided? [Section 6(2)(c)]", value: data?.safety_instructions_and_training_contract },
        { label: "Whether proper cleanliness and hygiene is maintained at the workplace? [Section 23(2)(i)]", value: data?.cleanliness_workplace_contract },
        { label: "Whether adequate lighting is provided in all work areas? [Section 23(2)(vii)]", value: data?.adequate_lighting_contract },
        { label: "Whether proper ventilation and suitable temperature are maintained for a healthy working environment? [Section 23(2)(ii)]", value: data?.proper_ventilation_contract },
        { label: "Whether Identity Cards have been issued to all contract workers? [Section 33(a)]", value: data?.issue_of_identity_card_contract },
        { label: "Whether the establishment has obtained a valid Establishment Registration Certificate? [Section 3(3)]", value: data?.valid_establishment_registration_certificate_contract },
        { label: "Whether the Contractor has intimated the Principal Employer upon receiving the Work Order? [Section 50(1)]", value: data?.contractor_work_order_intimation_to_principal_employer_contract },
        { label: "Whether documentary proof (bank statements/NEFT records) of electronic wage payment is maintained? [Section 55(2)]", value: data?.electronic_wage_payment_documentary_proof_contract },
        { label: "Whether leave and holiday registers are maintained in the prescribed format? [Section 32 and Section 33(a)(v)]", value: data?.leave_and_holiday_registers_maintained_contract },
        { label: "Whether accident, injury, and dangerous occurrence records are properly maintained? [Section 10 and Section 33(a)(v)]", value: data?.accident_injury_dangerous_occurrence_records_contract },
        { label: "Whether medical examination and health records of workers are maintained, where applicable? [Section 6(1)(c) and Section 85(c)]", value: data?.medical_examination_and_health_records_contract },
        { label: "Has any adolescent been employed, and if so, are the specific registers maintained? [Section 32(1)(ii) and Section 33(a)(vii)]", value: data?.is_adolescent_employed_contract },
        { label: "Whether wages paid at applicable rates? [Section 5 under Code on Wages, 2019]", value: data?.wages_paid_at_applicable_rates_contract },
        { label: "Whether wages paid within prescribed time? [Section 17 under Code on Wages, 2019]", value: data?.wages_paid_within_prescribed_time_code_wages_contract },
        { label: "Whether unauthorized/unlawful wage deductions happen? [Section 18 under Code on Wages, 2019]", value: data?.unauthorised_wage_deductions_contract },
        { label: "Whether the establishment is registered and covered under EPFO and ESIC? [Section 3 read with the First Schedule]", value: data?.establishment_registered_and_covered_epfo_esic_contract },
        { label: "Whether the construction workers are registered as beneficiaries under the BOCW Welfare Board? [Section 106]", value: data?.construction_workers_registered_bocw_welfare_board_contract },
    ];

    const adolescents = Array.isArray(data?.adolescent_details_contract) ? data.adolescent_details_contract : [];
    const directions = Array.isArray(data?.contract_directions) ? data.contract_directions : [];
    const hasDirections = data?.has_directions_contract || data?.contract_has_directions ||
        (directions.some((item: any) => String(item ?? "").trim()) ? "Yes" : "No");

    return (
        <View style={previewStyles.card}>
            <Text style={previewStyles.sectionTitle}>Contract Labour Inspection Report</Text>

            <Text style={previewStyles.subSectionTitle}>
                Inspection Report on The Contract Labour (Under Occupational Safety, Health and Working Conditions Code, 2020)
            </Text>
            <InspectionTable rows={contractRows} />

            {data?.is_adolescent_employed_contract === "Yes" && adolescents.length > 0 && (
                <>
                    <Text style={previewStyles.subSectionTitle}>Adolescent Worker Details</Text>
                    {adolescents.map((ado: any, idx: number) => {
                        const proofName = typeof ado?.age_proof === "string"
                            ? ado.age_proof.split("/").pop()
                            : ado?.age_proof_name || ado?.age_proof?.name || "Not Uploaded";
                        return (
                            <View key={idx} style={previewStyles.nestedCard}>
                                <Row label="Labour Office Intimation" value={ado.labour_office_intimation} />
                                <Row label="Name" value={ado.name} />
                                <Row label="Address" value={ado.address} />
                                <Row label="Age" value={ado.age} />
                                <Row label="Age Proof" value={proofName} />
                                <Row label="Hazardous Work" value={ado.hazardous_work} />
                                <Row label="Working Hours" value={ado.working_hours} />
                                <Row label="Maintain Register" value={ado.maintain_register} />
                                <Row label="Wage Amount" value={ado.wage_amount} />
                            </View>
                        );
                    })}
                </>
            )}

            <Text style={previewStyles.subSectionTitle}>Directions</Text>
            <InspectionTable rows={[{ label: "Is there any directions to be mentioned?", value: hasDirections || "-" }]} />
            {hasDirections === "Yes" && directions.filter((dir: any) => String(dir ?? "").trim()).length > 0 && (
                <View style={previewStyles.nestedCard}>
                    {directions.filter((dir: any) => String(dir ?? "").trim()).map((dir: string, idx: number) => (
                        <Text key={idx} style={previewStyles.bulletItem}>• {dir}</Text>
                    ))}
                </View>
            )}

            <Text style={previewStyles.subSectionTitle}>Additional Remarks</Text>
            <Text style={previewStyles.remarksText}>{data?.additional_remarks2 || "-"}</Text>

            <TouchableOpacity style={previewStyles.editButton} onPress={onEdit}>
                <Text style={previewStyles.editText}>✏ Edit Contract Labour</Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── Minimum Wage Preview ────────────────────────────────────
function MWPreview({ data, onEdit }: any) {
    // Minimum Wage Observations
    const mwObsRows = [
        { label: "1. Issue of appointment letters", value: data?.issue_of_appointment_letters_mw },
        { label: "2. Issue of identity cards", value: data?.issue_of_identity_card_mw },
        { label: "3. Issue of payslips", value: data?.issue_of_payslip_mw },
        { label: "4. Applicability of ESIC", value: data?.applicable_of_ESIC_mw },
        { label: "    Number of employees covered under ESIC", value: data?.ESIC_mw_no_of_empl },
        { label: "5. Maintenance of registers against each employee", value: data?.maintenance_of_registers_mw },
        { label: "6. Whether annual return is submitted", value: data?.whether_annual_rep_submitted_mw },
        { label: "7. Has any adolescent been employed", value: data?.is_adolescent_employed_mw },
    ];

    // Section A: Code on Wages Observations
    const sectionARows = [
        { label: "1. Whether Muster-roll maintained? [Section 50]", value: data?.whether_master_roll_maintained },
        { label: "2. Whether Register of wages maintained? [Section 50]", value: data?.whether_register_of_wages_maintained },
        { label: "3. Whether fine and deductions are recorded in appropriate register/form? [Section 50]", value: data?.whether_fine_deductions_recorded_appropriately },
        { label: "4. Whether Wage Slips in prescribed form are being issued and signature/thumb impression taken? [Section 50(3)]", value: data?.whether_wage_slips_prescribed },
        { label: "5. Whether Annual Return in Form III submitted before 1st February? [Section 67(2)zc]", value: data?.whether_annual_return_form3_submitted },
        { label: "6. Number of employees where wages were paid after statutory time limit [Section 50]", value: data?.no_of_employees_paid_after_statutory },
        { label: "7. Whether Overtime Register of workers maintained? [Section 50]", value: data?.whether_overtime_registered },
        { label: "8. Number of cases where overtime wages were not paid as per Rule 25", value: data?.number_of_cases_where_overtime_wages_not_paid },
        { label: "9. Whether weekly rest is allowed to the workers? [Section 13]", value: data?.whether_weekly_rest_is_allowed },
        { label: "10. Whether notices are displayed (Abstract, Inspector name, Schedule of Minimum Rates) [Section 50(2)]", value: data?.whether_notices_displayed_abstract_name_schedule },
        { label: "11. Whether minimum wages fixed by Govt. are being paid? [Section 5]", value: data?.whether_minimum_wages_fixed_by_govt_paid },
        { label: "12. Number of employees paid wages less than the minimum rate [Section 5]", value: data?.no_of_employees_paid_at_a_lesser_rate },
    ];

    // Section B: Payment of Wages
    const sectionBRows = [
        { label: "1. Whether Register of fines has been maintained? [Section 50]", value: data?.whether_register_fines_maintained },
        { label: "2. Whether Register of Deduction for damage or loss has been maintained? [Section 50]", value: data?.whether_register_deduction_for_damage_maintained },
        { label: "3. Whether Register of wages has been maintained? [Section 50]", value: data?.whether_register_fines_maintained_rule5 },
        { label: "4. Whether wages are paid on time? [Section 17]", value: data?.whether_wages_paid_on_time },
        { label: "5. Whether employees are paid salaries/wages in their bank accounts? [Section 15]", value: data?.whether_salaries_paid_in_their_bank_accounts },
        { label: "6. Whether Annual Return submitted in Form IV? [Section 67(2)zc]", value: data?.whether_annual_return_submitted_rule17 },
    ];

    // Section C: Equal Remuneration
    const sectionCRows = [
        { label: "1. Whether employer pays equal remuneration to men and women workers for the same work?", value: data?.whether_equal_renumeration_paid_men_women_workers },
        { label: "2. Whether register is maintained by the employer? (Section 8 of the Act)", value: data?.whether_register_maintained_by_employes_section8 },
    ];

    const adolescents = data?.adolescent_details_minimumwage || [];
    const workers = data?.workers_detail_mw || [];
    const hasDirections =
        data?.has_directions_minimumwage ||
        data?.minimumwage_has_directions ||
        ((data?.minimumwage_directions || []).some((item: any) => String(item ?? "").trim()) ? "Yes" : "No");
    const directions = hasDirections === "Yes"
        ? (Array.isArray(data?.minimumwage_directions) ? data.minimumwage_directions : [])
            .filter((item: any) => String(item ?? "").trim())
        : [];

    // Employee count helpers
    const renderEmployeeTable = (title: string, prefix: string) => (
        <View style={{ marginBottom: 12 }}>
            <Text style={previewStyles.tableHeader}>{title}</Text>
            <View style={previewStyles.tableRow}>
                <Text style={[previewStyles.tableCell, previewStyles.tableCellHeader]}>Category</Text>
                <Text style={[previewStyles.tableCell, previewStyles.tableCellHeader]}>Male</Text>
                <Text style={[previewStyles.tableCell, previewStyles.tableCellHeader]}>Female</Text>
            </View>
            {["unskilled", "semiskilled", "skilled", "highlyskilled"].map((cat) => (
                <View key={cat} style={previewStyles.tableRow}>
                    <Text style={previewStyles.tableCell}>{cat.replace("highlyskilled", "Highly Skilled").replace("semiskilled", "Semi-Skilled").replace("unskilled", "Unskilled").replace("skilled", "Skilled")}</Text>
                    <Text style={[previewStyles.tableCell, previewStyles.tableCellCenter]}>{data?.[`${prefix}_${cat}_male`] || "-"}</Text>
                    <Text style={[previewStyles.tableCell, previewStyles.tableCellCenter]}>{data?.[`${prefix}_${cat}_female`] || "-"}</Text>
                </View>
            ))}
            {prefix.includes("permanent") && (
                <View style={previewStyles.tableRow}>
                    <Text style={previewStyles.tableCell}>Apprentice</Text>
                    <Text style={[previewStyles.tableCell, previewStyles.tableCellCenter]}>{data?.[`${prefix}_apprentice_male`] || "-"}</Text>
                    <Text style={[previewStyles.tableCell, previewStyles.tableCellCenter]}>{data?.[`${prefix}_apprentice_female`] || "-"}</Text>
                </View>
            )}
        </View>
    );

    return (
        <View style={previewStyles.card}>
            <Text style={previewStyles.sectionTitle}>Minimum Wage Inspection Report</Text>

            {/* Minimum Wage Observations */}
            <Text style={previewStyles.subSectionTitle}>Minimum Wage Observations</Text>
            <InspectionTable rows={mwObsRows} />

            {/* Adolescent Worker Details */}
            {adolescents.length > 0 && (
                <>
                    <Text style={previewStyles.subSectionTitle}>Adolescent Worker Details</Text>
                    {adolescents.map((ado: any, idx: number) => (
                        <View key={idx} style={previewStyles.nestedCard}>
                            <Row label="Labour Office Intimation" value={ado.labour_office_intimation} />
                            <Row label="Name" value={ado.name} />
                            <Row label="Address" value={ado.address} />
                            <Row label="Age" value={ado.age} />
                            <Row label="Hazardous Work" value={ado.hazardous_work} />
                            <Row label="Working Hours" value={ado.working_hours} />
                            <Row label="Maintain Register" value={ado.maintain_register} />
                            <Row label="Wage Amount" value={ado.wage_amount} />
                            <Row label="Age Proof" value={ado.age_proof_name || (ado.age_proof ? "Uploaded" : "Not uploaded")} />
                        </View>
                    ))}
                </>
            )}

            {/* Section A */}
            <Text style={previewStyles.subSectionTitle}>A) Observations made during the course of Inspection under the Code of Wages</Text>
            <InspectionTable rows={sectionARows} />

            {/* Section B */}
            <Text style={previewStyles.subSectionTitle}>B) Observations made during the course of Inspection under Code On Wages</Text>
            <InspectionTable rows={sectionBRows} />

            {/* Section C */}
            <Text style={previewStyles.subSectionTitle}>C) Observations made during the course of Inspection under Code On Wages</Text>
            <InspectionTable rows={sectionCRows} />

            {/* Section D: General Details of Employees */}
            <Text style={previewStyles.subSectionTitle}>D. General Details of Employees</Text>

            {renderEmployeeTable("Permanent / Regular Workers", "permanent_employees")}
            <Text style={previewStyles.remarksText}><Text style={{ fontWeight: "700" }}>Remarks:</Text> {data?.permanent_employees_remarks || "-"}</Text>

            {renderEmployeeTable("Temporary / Casual Workers", "temporary_employees")}
            <Text style={previewStyles.remarksText}><Text style={{ fontWeight: "700" }}>Remarks:</Text> {data?.temporary_employees_remarks || "-"}</Text>

            {renderEmployeeTable("Contract Labour", "contract_employees")}
            <Text style={previewStyles.remarksText}><Text style={{ fontWeight: "700" }}>Remarks:</Text> {data?.contract_employees_remarks || "-"}</Text>

            {/* Individual Workers */}
            {workers.length > 0 && (
                <>
                    <Text style={previewStyles.subSectionTitle}>Individual Workers</Text>
                    <View style={{ marginBottom: 12 }}>
                        <View style={previewStyles.tableRow}>
                            <Text style={[previewStyles.tableCell, previewStyles.tableCellHeader]}>Name</Text>
                            <Text style={[previewStyles.tableCell, previewStyles.tableCellHeader]}>Designation</Text>
                            <Text style={[previewStyles.tableCell, previewStyles.tableCellHeader]}>DOJ</Text>
                            <Text style={[previewStyles.tableCell, previewStyles.tableCellHeader]}>Wages</Text>
                            <Text style={[previewStyles.tableCell, previewStyles.tableCellHeader]}>Payslip</Text>
                        </View>
                        {workers.map((w: any, idx: number) => (
                            <View key={idx} style={previewStyles.tableRow}>
                                <Text style={previewStyles.tableCell}>{w.name || "-"}</Text>
                                <Text style={[previewStyles.tableCell, previewStyles.tableCellCenter]}>{w.designation || "-"}</Text>
                                <Text style={[previewStyles.tableCell, previewStyles.tableCellCenter]}>{w.doj || "-"}</Text>
                                <Text style={[previewStyles.tableCell, previewStyles.tableCellCenter]}>{w.wages || "-"}</Text>
                                <Text style={[previewStyles.tableCell, previewStyles.tableCellCenter]}>{w.payslip_name || (w.payslip ? "Uploaded" : "Not uploaded")}</Text>
                            </View>
                        ))}
                    </View>
                </>
            )}

            {/* Directions */}
            <Text style={previewStyles.subSectionTitle}>Directions</Text>
            <InspectionTable rows={[
                { label: "Is there any directions to be mentioned?", value: hasDirections || "-" },
            ]} />
            {hasDirections === "Yes" && directions.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                    {directions.map((dir: string, idx: number) => (
                        <Text key={idx} style={previewStyles.bulletItem}>• {dir}</Text>
                    ))}
                </View>
            )}

            {/* Additional Remarks */}
            <Text style={previewStyles.subSectionTitle}>Additional Remarks</Text>
            <Text style={previewStyles.remarksText}>{data?.additional_remarks3 || "-"}</Text>

            <TouchableOpacity style={previewStyles.editButton} onPress={onEdit}>
                <Text style={previewStyles.editText}>✏ Edit Minimum Wage</Text>
            </TouchableOpacity>
        </View>
    );
}

const previewStyles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 60,
        backgroundColor: "#f5f5f5",
    },
    govt: {
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
        color: "#1a1a4e",
    },
    title: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 20,
        fontWeight: "600",
    },
    card: {
        backgroundColor: "#ffffff",
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        backgroundColor: "#1a1a4e",
        color: "#fff",
        padding: 10,
        borderRadius: 6,
        marginBottom: 10,
    },
    subSectionTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1a1a4e",
        marginTop: 14,
        marginBottom: 8,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    label: {
        fontWeight: "600",
        width: "45%",
        fontSize: 13,
        color: "#333",
    },
    value: {
        width: "55%",
        textAlign: "right",
        fontSize: 13,
        color: "#555",
    },
    nestedCard: {
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    bulletItem: {
        fontSize: 13,
        color: "#444",
        marginBottom: 4,
        paddingLeft: 4,
    },
    combinedChecklistSection: {
        marginBottom: 12,
    },
    combinedChecklistItem: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e2e2e2",
        borderRadius: 8,
        padding: 11,
        marginBottom: 9,
    },
    combinedChecklistHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    combinedChecklistNumber: {
        width: 25,
        color: "#1a1a4e",
        fontWeight: "700",
        fontSize: 14,
    },
    combinedChecklistLabel: {
        flex: 1,
        color: "#333",
        fontSize: 14,
        fontWeight: "600",
    },
    combinedFindingRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#f5f7fb",
        borderRadius: 6,
        padding: 8,
        marginBottom: 6,
    },
    combinedFindingCaption: {
        color: "#555",
        fontSize: 12,
        fontWeight: "600",
    },
    combinedFindingValue: {
        color: "#16803c",
        fontSize: 13,
        fontWeight: "700",
    },
    combinedRemarksRow: {
        paddingHorizontal: 8,
        paddingTop: 3,
    },
    combinedRemarksCaption: {
        color: "#555",
        fontSize: 12,
        fontWeight: "700",
        marginBottom: 3,
    },
    combinedRemarksValue: {
        color: "#333",
        fontSize: 13,
        lineHeight: 18,
    },
    remarksText: {
        fontSize: 13,
        color: "#555",
        marginBottom: 10,
        lineHeight: 20,
    },
    tableHeader: {
        fontSize: 12,
        fontWeight: "700",
        color: "#1a1a4e",
        marginBottom: 6,
        marginTop: 8,
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        paddingVertical: 6,
    },
    tableCell: {
        flex: 1,
        fontSize: 12,
        color: "#444",
        paddingHorizontal: 4,
    },
    tableCellHeader: {
        fontWeight: "700",
        color: "#1a1a4e",
        backgroundColor: "#f0f0f0",
        paddingVertical: 6,
    },
    tableCellCenter: {
        textAlign: "center",
    },
    editButton: {
        backgroundColor: "#F39C12",
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        marginTop: 10,
    },
    editText: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "700",
    },
    submitButton: {
        backgroundColor: "#1f928c",
        padding: 16,
        borderRadius: 8,
        marginTop: 15,
    },
    submitText: {
        color: "#fff",
        fontWeight: "700",
        textAlign: "center",
        fontSize: 16,
    },
    // ─── Photo grid styles ───
    photoGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 8,
    },
    photoWrapper: {
        width: "30%",
        aspectRatio: 1,
        borderRadius: 8,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#ddd",
        backgroundColor: "#f9f9f9",
    },
    photoThumb: {
        width: "100%",
        height: "75%",
    },
    photoLabel: {
        fontSize: 10,
        color: "#666",
        textAlign: "center",
        paddingVertical: 4,
        fontWeight: "600",
        backgroundColor: "#f0f0f0",
    },
    // ─── Signature & large photo styles ───
    signatureImage: {
        width: "100%",
        height: 120,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        backgroundColor: "#fafafa",
    },
    estPhotoLarge: {
        width: "100%",
        height: 200,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ddd",
    },
});