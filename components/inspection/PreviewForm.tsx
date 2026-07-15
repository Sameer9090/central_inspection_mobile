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

// ─── ASE Preview ───────────────────────────────────────────────
function ASEPreview({ data, onEdit }: any) {
    // ── Establishment / Employer Details ──
    const establishmentRows = [
        { label: "Name and address of Employer / Proprietor / Managing Director / Partner / Manager / Contractor", value: data?.name_address_of_employer },
        { label: "Name and Address of the Establishment", value: data?.establishment_name },
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
    ];

    // ── Adolescent Worker Details ──
    const adolescents = data?.adolescent_details_ase || [];

    // ── Directions ──
    const directions = data?.ase_directions || [];

    return (
        <View style={previewStyles.card}>
            <Text style={previewStyles.sectionTitle}>ASE Inspection Report</Text>

            {/* Establishment / Employer Details */}
            <Text style={previewStyles.subSectionTitle}>Establishment / Employer Details</Text>
            <InspectionTable rows={establishmentRows} />

            {/* Workplace Safety and Health Measures */}
            <Text style={previewStyles.subSectionTitle}>Workplace Safety and Health Measures</Text>
            <InspectionTable rows={safetyRows} />

            {/* Inspection Findings */}
            <Text style={previewStyles.subSectionTitle}>Inspection Findings</Text>
            <InspectionTable rows={findingsRows} />

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
            {directions.length > 0 && (
                <>
                    <Text style={previewStyles.subSectionTitle}>Directions</Text>
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
    // Workplace Safety
    const safetyRows = [
        { label: "Ensuring proper cleanliness in the workplace", value: data?.cleanliness_workplace_contract },
        { label: "Providing adequate lighting in all work areas", value: data?.adequate_lighting_contract },
        { label: "Maintaining proper ventilation", value: data?.proper_ventilation_contract },
        { label: "Prevention of fire, safety arrangements and emergency preparedness", value: data?.fire_prevention_measures_contract },
        { label: "Preventive measures to avoid accidents", value: data?.accident_prevention_contract },
    ];

    // Inspection Findings
    const findingsRows = [
        { label: "1. Issue of appointment letters", value: data?.issue_of_appointment_letters_contract },
        { label: "2. Issue of identity cards", value: data?.issue_of_identity_card_contract },
        { label: "3. Issue of payslips", value: data?.issue_of_payslip_contract },
        { label: "4. Applicability of ESIC", value: data?.applicable_of_ESIC_contract },
        { label: "    Number of employees covered under ESIC", value: data?.ESIC_contract_no_of_empl },
        { label: "5. Maintenance of registers against each employee", value: data?.maintenance_of_registers_contract },
        { label: "6. Whether annual return is submitted", value: data?.whether_annual_rep_submitted_contract },
        { label: "7. Has any adolescent been employed", value: data?.is_adolescent_employed_contract },
    ];

    // Contract Labour Act Provisions
    const contractActRows = [
        { label: "1. Whether License obtained while executing contract work [Section 47]", value: data?.whether_license_obtained },
        { label: "2. Whether contract labour exceeds maximum number specified in licence [Section 48]", value: data?.whether_contract_labour_numbering },
        { label: "3. Whether notices regarding rates of wages, hours of work, wage period etc. displayed [Section 31(1)]", value: data?.whether_notices_regarding_rates_of_wages },
        { label: "4. Whether notice of Inspector's name & address displayed [Rule 81(i)]", value: data?.whether_notice_regarding_names },
        { label: "5. Whether copy of displayed notices sent to Inspector [Section 31(2)]", value: data?.whether_copy_of_each_notice_displayed },
        { label: "6. Whether wage period & disbursement notices informed digitally to Principal Employer [Section 55(2)]", value: data?.whether_notices_showing_wage_period },
        { label: "7. Whether intimation of commencement/completion submitted within 30 days [Section 5(1)]", value: data?.whether_intimation_of_commencement },
        { label: "8. Whether Yearly Return in Form X submitted [Section 33(d)]", value: data?.whether_half_yearly_return },
        { label: "9. Whether authorised representative present during wage disbursement [Section 55(2)]", value: data?.whether_contractor_has_ensured_presence_of_representative },
        { label: "10. Whether contractor ensured payment of wages within prescribed time [Section 55(2)]", value: data?.whether_contractor_ensured_payment_of_wages },
        { label: "11. Whether register of persons employed maintained [Section 33(a)]", value: data?.whether_register_of_person_maintained },
        { label: "12. Whether wage register maintained [Section 33(a)]", value: data?.whether_wage_register_maintained },
        { label: "13. Whether signature/thumb impression obtained on wage register [Section 33(a)]", value: data?.whether_contractor_obtained_sig_thumb_impression },
        { label: "14. Whether welfare facilities provided (water, latrine, washing) [Section 53]", value: data?.whether_welfare_facilities_regarding_drinking_water },
        { label: "15. Whether creche facility provided when 20+ women employed [Section 53]", value: data?.whether_contractor_creche_facility },
        { label: "16. Whether canteen facility provided when 100+ contract labour employed [Section 53]", value: data?.whether_contractor_provides_canteen_facility },
        { label: "17. Whether rest rooms provided for night halt [Section 53]", value: data?.whether_contractor_prvides_rest_rooms },
        { label: "18. Whether first aid facilities provided [Section 53]", value: data?.whether_first_aid_provided },
        { label: "19. Whether employment id issued to each worker [Section 6(1)(f)]", value: data?.whether_contractor_issued_employment_card },
        { label: "20. Whether employment card maintained up to date [Section 6(1)(f)]", value: data?.whether_date_maintained_in_employment_card },
        { label: "21. Whether experience certificate issued on termination [Section 56]", value: data?.whether_contractor_issued_service_certificate },
        { label: "22. Whether wage slips in Form XIX issued before wage disbursement [Section 33(c)]", value: data?.whether_wage_slips_formxix_issued },
    ];

    const adolescents = data?.adolescent_details_contract || [];
    const directions = data?.contract_directions || [];

    return (
        <View style={previewStyles.card}>
            <Text style={previewStyles.sectionTitle}>Contract Labour Inspection Report</Text>

            {/* Workplace Safety */}
            <Text style={previewStyles.subSectionTitle}>Workplace Safety and Health Measures</Text>
            <InspectionTable rows={safetyRows} />

            {/* Inspection Findings */}
            <Text style={previewStyles.subSectionTitle}>Inspection Findings</Text>
            <InspectionTable rows={findingsRows} />

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
                            <Row
                                label="Age Proof"
                                value={
                                    ado.age_proof
                                        ? ado.age_proof.split("/").pop()
                                        : "Not Uploaded"
                                }
                            />
                        </View>
                    ))}
                </>
            )}

            {/* Contract Labour Act */}
            <Text style={previewStyles.subSectionTitle}>
                Inspection Report on The Contract Labour (Under Occupational Safety, Health and Working Conditions Code, 2000)
            </Text>
            <InspectionTable rows={contractActRows} />

            {/* Directions */}
            {directions.length > 0 && (
                <>
                    <Text style={previewStyles.subSectionTitle}>Directions</Text>
                    {directions.map((dir: string, idx: number) => (
                        <Text key={idx} style={previewStyles.bulletItem}>• {dir}</Text>
                    ))}
                </>
            )}

            {/* Additional Remarks */}
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
    const directions = data?.minimumwage_directions || [];

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
                            <Row label="Age Proof" value={ado.age_proof ? "Uploaded" : "Not uploaded"} />
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
                                <Text style={[previewStyles.tableCell, previewStyles.tableCellCenter]}>{w.payslip ? "Uploaded" : "Not uploaded"}</Text>
                            </View>
                        ))}
                    </View>
                </>
            )}

            {/* Directions */}
            {directions.length > 0 && (
                <>
                    <Text style={previewStyles.subSectionTitle}>Directions</Text>
                    {directions.map((dir: string, idx: number) => (
                        <Text key={idx} style={previewStyles.bulletItem}>• {dir}</Text>
                    ))}
                </>
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