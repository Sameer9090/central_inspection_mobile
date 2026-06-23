import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';

export default function PreviewSection({
  commonData,
  aseData,
  contractData,
  mwData,
  inspectionTypes,
  onEdit,
  onSubmit,
}) {
  const [activePreview, setActivePreview] = useState('common');

  const typeLabels = {
    ase: 'ASE Inspection',
    contract: 'Contract Labour',
    minimumwage: 'Minimum Wage',
  };

  const renderCommonPreview = () => (
    <View style={styles.previewCard}>
      <Text style={styles.previewTitle}>Inspection Report - Common Details</Text>

      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>Basic Details</Text>
        {renderPreviewRow('UBIN', commonData.ubin)}
        {renderPreviewRow('Application Ref No', commonData.application_ref_no)}
        {renderPreviewRow('Submission Location', commonData.submission_location)}
        {renderPreviewRow('Name of Inspector', commonData.name_of_inspector)}
        {renderPreviewRow('Date of Inspection', commonData.date_of_inspection)}
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>Employer Details</Text>
        {renderPreviewRow('First Name', commonData.empl_first_name)}
        {renderPreviewRow('Last Name', commonData.empl_last_name)}
        {renderPreviewRow('Mobile No', commonData.empl_mobile_no)}
        {renderPreviewRow('Alt Mobile', commonData.empl_alt_mobile_no)}
        {renderPreviewRow('Email', commonData.empl_email)}
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>Establishment Details</Text>
        {renderPreviewRow('Address 1', commonData.est_address_1)}
        {renderPreviewRow('Address 2', commonData.est_address_2)}
        {renderPreviewRow('Address 3', commonData.est_address_3)}
        {renderPreviewRow('Landmark', commonData.est_landmark)}
        {renderPreviewRow('District', commonData.est_district)}
        {renderPreviewRow('Ward No', commonData.est_ward_no)}
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>Selected Inspection Types</Text>
        {(commonData.selected_types || []).map(type => (
          <Text key={type} style={styles.previewListItem}>• {typeLabels[type] || type}</Text>
        ))}
      </View>

      {commonData.inspection_photo_path && (
        <View style={styles.previewSection}>
          <Text style={styles.previewSectionTitle}>Establishment Photo</Text>
          <Image source={{ uri: commonData.inspection_photo_path }} style={styles.previewImage} />
        </View>
      )}
    </View>
  );

  const renderAsePreview = () => (
    <View style={styles.previewCard}>
      <Text style={styles.previewTitle}>ASE Inspection Report</Text>

      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>Workplace Safety</Text>
        {renderPreviewRow('Cleanliness', aseData.cleanliness_workplace_ase)}
        {renderPreviewRow('Adequate Lighting', aseData.adequate_lighting_ase)}
        {renderPreviewRow('Proper Ventilation', aseData.proper_ventilation_ase)}
        {renderPreviewRow('Fire Prevention', aseData.fire_prevention_measures_ase)}
        {renderPreviewRow('Accident Prevention', aseData.accident_prevention_ase)}
        {renderPreviewRow('Drinking Water', aseData.drinking_water_ase)}
        {renderPreviewRow('Latrine & Urinal', aseData.latrine_urinal_ase)}
        {renderPreviewRow('First Aid', aseData.first_aid_ase)}
        {renderPreviewRow('Creche Facility', aseData.creche_facility_ase)}
        {renderPreviewRow('Canteen', aseData.canteen_ase)}
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>Inspection Findings</Text>
        {renderPreviewRow('Appointment Letters', aseData.issue_of_appointment_letters_ase)}
        {renderPreviewRow('Identity Cards', aseData.issue_of_identity_card_ase)}
        {renderPreviewRow('Payslips', aseData.issue_of_payslip_ase)}
        {renderPreviewRow('ESIC Applicable', aseData.applicable_of_ESIC_ase)}
        {renderPreviewRow('ESIC Employees', aseData.ESIC_ase_no_of_empl)}
        {renderPreviewRow('Registers Maintained', aseData.maintenance_of_registers_ase)}
        {renderPreviewRow('Annual Return', aseData.whether_annual_rep_submitted_ase)}
        {renderPreviewRow('Adolescent Employed', aseData.is_adolescent_employed_ase)}
      </View>

      {(aseData.adolescent_details_ase || []).length > 0 && (
        <View style={styles.previewSection}>
          <Text style={styles.previewSectionTitle}>Adolescent Workers ({aseData.adolescent_details_ase.length})</Text>
          {aseData.adolescent_details_ase.map((ado, i) => (
            <View key={i} style={styles.nestedBlock}>
              <Text style={styles.nestedTitle}>Worker {i + 1}</Text>
              {renderPreviewRow('Name', ado.name)}
              {renderPreviewRow('Age', ado.age)}
              {renderPreviewRow('Working Hours', ado.working_hours)}
              {renderPreviewRow('Wage', ado.wage_amount)}
            </View>
          ))}
        </View>
      )}

      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>Worker Counts - Permanent</Text>
        {renderPreviewRow('Unskilled Male', aseData.permanent_unskilled_male)}
        {renderPreviewRow('Unskilled Female', aseData.permanent_unskilled_female)}
        {renderPreviewRow('Semi-Skilled Male', aseData.permanent_semiskilled_male)}
        {renderPreviewRow('Semi-Skilled Female', aseData.permanent_semiskilled_female)}
        {renderPreviewRow('Skilled Male', aseData.permanent_skilled_male)}
        {renderPreviewRow('Skilled Female', aseData.permanent_skilled_female)}
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>Wages & Work</Text>
        {renderPreviewRow('Notified Wages Paid', aseData.whether_notified_wages_paid)}
        {renderPreviewRow('Hours of Work', aseData.hours_of_work_a_day)}
        {renderPreviewRow('Female Working Hours', aseData.working_hours_of_female)}
        {renderPreviewRow('Weekly Holidays', aseData.whether_weekly_holidays_provided)}
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>Registers</Text>
        {renderPreviewRow('Prescribed Registers', aseData.wheather_prescribed_reg_maintained)}
        {renderPreviewRow('Hours Register', aseData.register_of_hours_of_work)}
        {renderPreviewRow('Overtime Register', aseData.register_of_overtime)}
        {renderPreviewRow('Employment Register', aseData.register_of_employment)}
        {renderPreviewRow('Leave Register', aseData.register_of_leave)}
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>Directions</Text>
        {(aseData.ase_directions || []).map((dir, i) => (
          <Text key={i} style={styles.previewListItem}>{i + 1}. {dir}</Text>
        ))}
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>Remarks</Text>
        <Text style={styles.previewValue}>{aseData.additional_remarks || '-'}</Text>
      </View>
    </View>
  );

  const renderContractPreview = () => (
    <View style={styles.previewCard}>
      <Text style={styles.previewTitle}>Contract Labour Inspection Report</Text>

      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>Safety Measures</Text>
        {renderPreviewRow('Cleanliness', contractData.cleanliness_workplace_contract)}
        {renderPreviewRow('Lighting', contractData.adequate_lighting_contract)}
        {renderPreviewRow('Ventilation', contractData.proper_ventilation_contract)}
        {renderPreviewRow('Fire Prevention', contractData.fire_prevention_measures_contract)}
        {renderPreviewRow('Accident Prevention', contractData.accident_prevention_contract)}
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>Contract Provisions</Text>
        {renderPreviewRow('License Obtained', contractData.whether_license_obtained)}
        {renderPreviewRow('Labour Numbering', contractData.whether_contract_labour_numbering)}
        {renderPreviewRow('Notices Displayed', contractData.whether_notices_regarding_rates_of_wages)}
        {renderPreviewRow('Inspector Notice', contractData.whether_notice_regarding_names)}
        {renderPreviewRow('Copy to Inspector', contractData.whether_copy_of_each_notice_displayed)}
        {renderPreviewRow('Wage Period Notice', contractData.whether_notices_showing_wage_period)}
        {renderPreviewRow('Intimation Submitted', contractData.whether_intimation_of_commencement)}
        {renderPreviewRow('Yearly Return', contractData.whether_half_yearly_return)}
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>Directions</Text>
        {(contractData.contract_directions || []).map((dir, i) => (
          <Text key={i} style={styles.previewListItem}>{i + 1}. {dir}</Text>
        ))}
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>Remarks</Text>
        <Text style={styles.previewValue}>{contractData.additional_remarks2 || '-'}</Text>
      </View>
    </View>
  );

  const renderMwPreview = () => (
    <View style={styles.previewCard}>
      <Text style={styles.previewTitle}>Minimum Wage Inspection Report</Text>

      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>Observations - Code on Wages (A)</Text>
        {renderPreviewRow('Muster Roll', mwData.whether_master_roll_maintained)}
        {renderPreviewRow('Wage Register', mwData.whether_register_of_wages_maintained)}
        {renderPreviewRow('Fine Deductions', mwData.whether_fine_deductions_recorded_appropriately)}
        {renderPreviewRow('Wage Slips', mwData.whether_wage_slips_prescribed)}
        {renderPreviewRow('Annual Return Form III', mwData.whether_annual_return_form3_submitted)}
        {renderPreviewRow('Overtime Register', mwData.whether_overtime_registered)}
        {renderPreviewRow('Weekly Rest', mwData.whether_weekly_rest_is_allowed)}
        {renderPreviewRow('Notices Displayed', mwData.whether_notices_displayed_abstract_name_schedule)}
        {renderPreviewRow('Min Wages Paid', mwData.whether_minimum_wages_fixed_by_govt_paid)}
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>Observations - Code on Wages (B)</Text>
        {renderPreviewRow('Register of Fines', mwData.whether_register_fines_maintained)}
        {renderPreviewRow('Deduction Register', mwData.whether_register_deduction_for_damage_maintained)}
        {renderPreviewRow('Wages on Time', mwData.whether_wages_paid_on_time)}
        {renderPreviewRow('Bank Payment', mwData.whether_salaries_paid_in_their_bank_accounts)}
        {renderPreviewRow('Annual Return Form IV', mwData.whether_annual_return_submitted_rule17)}
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>Equal Remuneration (C)</Text>
        {renderPreviewRow('Equal Pay', mwData.whether_equal_renumeration_paid_men_women_workers)}
        {renderPreviewRow('Register Maintained', mwData.whether_register_maintained_by_employes_section8)}
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>Worker Counts - Permanent</Text>
        {renderPreviewRow('Unskilled M', mwData.permanent_employees_unskilled_male)}
        {renderPreviewRow('Unskilled F', mwData.permanent_employees_unskilled_female)}
        {renderPreviewRow('Skilled M', mwData.permanent_employees_skilled_male)}
        {renderPreviewRow('Skilled F', mwData.permanent_employees_skilled_female)}
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>Directions</Text>
        {(mwData.minimumwage_directions || []).map((dir, i) => (
          <Text key={i} style={styles.previewListItem}>{i + 1}. {dir}</Text>
        ))}
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>Remarks</Text>
        <Text style={styles.previewValue}>{mwData.additional_remarks3 || '-'}</Text>
      </View>
    </View>
  );

  const renderPreviewRow = (label, value) => (
    <View style={styles.previewRow}>
      <Text style={styles.previewLabel}>{label}</Text>
      <Text style={styles.previewValue}>{value || '-'}</Text>
    </View>
  );

  const previewOptions = [
    { key: 'common', label: 'Common Details', color: '#1976D2' },
    ...(commonData.selected_types || []).map(t => ({
      key: t,
      label: typeLabels[t] || t,
      color: t === 'ase' ? '#28a745' : t === 'contract' ? '#ffc107' : '#17a2b8',
    })),
  ];

  return (
    <View>
      {/* Preview Toggle Buttons */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toggleWrapper}>
        {previewOptions.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.toggleBtn,
              activePreview === opt.key && { backgroundColor: opt.color, borderColor: opt.color },
            ]}
            onPress={() => setActivePreview(opt.key)}
          >
            <Text style={[
              styles.toggleBtnText,
              activePreview === opt.key && styles.toggleBtnTextActive,
            ]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Edit Button */}
      {activePreview !== 'common' && (
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => onEdit(activePreview)}
        >
          <Text style={styles.editBtnText}>✏️ Edit {typeLabels[activePreview] || activePreview}</Text>
        </TouchableOpacity>
      )}

      {/* Preview Content */}
      {activePreview === 'common' && renderCommonPreview()}
      {activePreview === 'ase' && renderAsePreview()}
      {activePreview === 'contract' && renderContractPreview()}
      {activePreview === 'minimumwage' && renderMwPreview()}

      {/* Final Submit */}
      <TouchableOpacity style={styles.submitBtn} onPress={onSubmit}>
        <Text style={styles.submitBtnText}>📤 Final Submit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  toggleWrapper: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  toggleBtnTextActive: {
    color: '#fff',
  },
  editBtn: {
    backgroundColor: '#ffc107',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  editBtnText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#1976D2',
    paddingBottom: 10,
  },
  previewSection: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  previewSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: '#f5f5f5',
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  previewLabel: {
    flex: 1,
    fontSize: 13,
    color: '#555',
  },
  previewValue: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
  },
  previewListItem: {
    fontSize: 13,
    color: '#333',
    paddingVertical: 3,
    paddingLeft: 10,
  },
  nestedBlock: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  nestedTitle: {
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 5,
    color: '#1976D2',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  submitBtn: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});