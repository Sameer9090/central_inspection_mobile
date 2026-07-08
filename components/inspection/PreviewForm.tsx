import React from "react";
import {
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
}: any) {





    const employer = common?.common_data?.employer || {};
    const establishment = common?.common_data?.establishment || {};

    return (
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={previewStyles.container}
            showsVerticalScrollIndicator={false}
        >
            <Text style={previewStyles.govt}>
                GOVERNMENT OF ASSAM
            </Text>

            <Text style={previewStyles.title}>
                Labour Inspection Report
            </Text>

            <View style={previewStyles.card}>
                <Row
                    label="Reference Number"
                    value={application?.appl_ref_no}
                />
                <Row
                    label="UBIN"
                    value={application?.ubin}
                />
                <Row
                    label="Inspection Types"
                    value={selectedTypes.join(", ")}
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
                style={previewStyles.submitButton}
                onPress={onSubmit}
            >
                <Text style={previewStyles.submitText}>
                    Submit Inspection
                </Text>
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
    const rows = [
        { label: "Issue of appointment letters", value: data?.issue_of_appointment_letters_ase },
        { label: "Issue of identity cards", value: data?.issue_of_identity_card_ase },
        { label: "Issue of payslips", value: data?.issue_of_payslip_ase },
        { label: "Applicability of ESIC", value: data?.applicable_of_ESIC_ase },
        { label: "Maintenance of Registers", value: data?.maintenance_of_registers_ase },
        { label: "Annual Return Submitted", value: data?.whether_annual_rep_submitted_ase },
        { label: "Adolescent Employed", value: data?.is_adolescent_employed_ase },
    ];

    return (
        <View style={previewStyles.card}>
            <Text style={previewStyles.sectionTitle}>ASE Inspection</Text>
            <InspectionTable rows={rows} />
            <TouchableOpacity style={previewStyles.editButton} onPress={onEdit}>
                <Text style={previewStyles.editText}>✏ Edit ASE</Text>
            </TouchableOpacity>
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
        backgroundColor: "#27AE60",
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
});