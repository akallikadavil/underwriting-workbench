import { PrismaClient, UserRole, BusinessType, TransactionType, ProductType, SubmissionStatus, DocumentCategory, ExtractionStatus, AIRecommendationStatus, RuleType, RuleSeverity, ReferralStatus, ComplianceStatus, CoreEntryStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.policyProcessingRecord.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.complianceRecord.deleteMany();
  await prisma.ruleResult.deleteMany();
  await prisma.aIRecommendation.deleteMany();
  await prisma.document.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.rule.deleteMany();
  await prisma.aSEANConfig.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // USERS
  const users = await Promise.all([
    prisma.user.create({ data: { name: 'Siriporn Thanakit', email: 'marketing@uwworkbench.th', password: hashedPassword, role: UserRole.MARKETING, department: 'Marketing', country: 'TH' } }),
    prisma.user.create({ data: { name: 'Chakri Wongchai', email: 'underwriter@uwworkbench.th', password: hashedPassword, role: UserRole.UNDERWRITER, department: 'Underwriting', country: 'TH' } }),
    prisma.user.create({ data: { name: 'Nattaporn Saengthong', email: 'senior@uwworkbench.th', password: hashedPassword, role: UserRole.SENIOR_UNDERWRITER, department: 'Underwriting', country: 'TH' } }),
    prisma.user.create({ data: { name: 'Prasert Limsakul', email: 'policy@uwworkbench.th', password: hashedPassword, role: UserRole.POLICY_PROCESSING, department: 'Policy Processing', country: 'TH' } }),
    prisma.user.create({ data: { name: 'Kanya Rattanaphong', email: 'itadmin@uwworkbench.th', password: hashedPassword, role: UserRole.IT_ADMIN, department: 'IT', country: 'TH' } }),
    prisma.user.create({ data: { name: 'Wiroj Chareonkul', email: 'compliance@uwworkbench.th', password: hashedPassword, role: UserRole.COMPLIANCE, department: 'Compliance', country: 'TH' } }),
    prisma.user.create({ data: { name: 'Malinee Pattanakit', email: 'management@uwworkbench.th', password: hashedPassword, role: UserRole.MANAGEMENT, department: 'Management', country: 'TH' } }),
  ]);

  const [marketing, underwriter, senior, policy, itadmin, compliance, management] = users;

  // RULES
  const rules = await Promise.all([
    prisma.rule.create({ data: { ruleName: 'High Sum Insured Referral', ruleType: RuleType.REFERRAL, severity: RuleSeverity.HIGH, conditionJson: { field: 'sumInsured', operator: 'gt', value: 100000000 }, actionJson: { action: 'REFERRAL_REQUIRED', message: 'Sum insured exceeds THB 100,000,000. Senior underwriter referral required.' }, description: 'Referral required when sum insured exceeds THB 100M', active: true } }),
    prisma.rule.create({ data: { ruleName: 'Chemical Industry High Hazard', ruleType: RuleType.REFERRAL, severity: RuleSeverity.HIGH, conditionJson: { field: 'industry', operator: 'contains', value: 'chemical' }, actionJson: { action: 'REFERRAL_REQUIRED', message: 'Chemical industry classification triggers high hazard referral.' }, description: 'Chemical industry requires senior referral', active: true } }),
    prisma.rule.create({ data: { ruleName: 'Cyber Insurance MFA Missing', productType: ProductType.CYBER_INSURANCE, ruleType: RuleType.REFERRAL, severity: RuleSeverity.HIGH, conditionJson: { field: 'document', operator: 'missing', value: 'MFA_DOCUMENTATION' }, actionJson: { action: 'REFERRAL_REQUIRED', message: 'Cyber Insurance requires MFA documentation. Referral required.' }, description: 'MFA documentation required for Cyber Insurance', active: true } }),
    prisma.rule.create({ data: { ruleName: 'Prior Claims Count Referral', ruleType: RuleType.REFERRAL, severity: RuleSeverity.MEDIUM, conditionJson: { field: 'priorClaimsCount', operator: 'gt', value: 2 }, actionJson: { action: 'REFERRAL_REQUIRED', message: 'More than 2 prior claims. Senior underwriter referral required.' }, description: 'Three or more prior claims trigger referral', active: true } }),
    prisma.rule.create({ data: { ruleName: 'Consent Missing Compliance Block', ruleType: RuleType.BLOCK, severity: RuleSeverity.HIGH, conditionJson: { field: 'consentCaptured', operator: 'eq', value: false }, actionJson: { action: 'COMPLIANCE_BLOCK', message: 'Consent not captured. Submission blocked pending PDPA compliance.' }, description: 'PDPA consent required for all submissions', active: true } }),
    prisma.rule.create({ data: { ruleName: 'Sensitive Data Legal Basis Missing', ruleType: RuleType.BLOCK, severity: RuleSeverity.HIGH, conditionJson: { field: 'sensitiveDataLegalBasis', operator: 'missing', value: true }, actionJson: { action: 'COMPLIANCE_BLOCK', message: 'Sensitive personal data present without valid PDPA Section 26 legal basis.' }, description: 'Legal basis required when sensitive data is present', active: true } }),
    prisma.rule.create({ data: { ruleName: 'Reinsurance Slip Missing Block', ruleType: RuleType.BLOCK, severity: RuleSeverity.HIGH, conditionJson: { field: 'document', operator: 'missing', value: 'REINSURANCE_SLIP' }, actionJson: { action: 'BLOCK_SUBMISSION', message: 'Reinsurance Inward submissions require a reinsurance slip.' }, description: 'Reinsurance slip mandatory for inward reinsurance', active: true } }),
    prisma.rule.create({ data: { ruleName: 'IAR Site Survey Missing', productType: ProductType.INDUSTRIAL_ALL_RISKS, ruleType: RuleType.REFERRAL, severity: RuleSeverity.MEDIUM, conditionJson: { field: 'document', operator: 'missing', value: 'SITE_SURVEY' }, actionJson: { action: 'REFERRAL_REQUIRED', message: 'Industrial All Risks requires site survey report. Referral pending survey.' }, description: 'Site survey required for Industrial All Risks', active: true } }),
    prisma.rule.create({ data: { ruleName: 'Endorsement Sum Insured Change >20%', ruleType: RuleType.REFERRAL, severity: RuleSeverity.MEDIUM, conditionJson: { field: 'sumInsuredChange', operator: 'gt', value: 0.20 }, actionJson: { action: 'REFERRAL_REQUIRED', message: 'Endorsement increases sum insured by more than 20%. Referral required.' }, description: 'Large sum insured changes in endorsements require referral', active: true } }),
    prisma.rule.create({ data: { ruleName: 'Cyber Incident Response Plan Missing', productType: ProductType.CYBER_INSURANCE, ruleType: RuleType.WARNING, severity: RuleSeverity.MEDIUM, conditionJson: { field: 'document', operator: 'missing', value: 'INCIDENT_RESPONSE_PLAN' }, actionJson: { action: 'WARNING', message: 'Incident response plan not provided. Risk assessment may be incomplete.' }, description: 'Incident response plan recommended for Cyber Insurance', active: true } }),
  ]);

  // ASEAN CONFIG
  await prisma.aSEANConfig.createMany({
    data: [
      { country: 'TH', currency: 'THB', language: 'th', regulatoryChecklist: { body: 'OIC', pdpa: true, consentRequired: true }, consentRules: { sensitiveData: 'explicit', marketing: 'opt-in' }, dataResidency: 'Thailand', taxFields: { vat: 0.07, stampDuty: true }, coreMapping: { policyPrefix: 'TH', dateFormat: 'DD/MM/YYYY' } },
      { country: 'SG', currency: 'SGD', language: 'en', regulatoryChecklist: { body: 'MAS', pdpa: true, consentRequired: true }, consentRules: { sensitiveData: 'explicit', marketing: 'opt-in' }, dataResidency: 'Singapore', taxFields: { gst: 0.09 }, coreMapping: { policyPrefix: 'SG', dateFormat: 'DD/MM/YYYY' } },
      { country: 'MY', currency: 'MYR', language: 'ms', regulatoryChecklist: { body: 'BNM', pdpa: true, consentRequired: true }, consentRules: { sensitiveData: 'explicit' }, dataResidency: 'Malaysia', taxFields: { sst: 0.06 }, coreMapping: { policyPrefix: 'MY', dateFormat: 'DD/MM/YYYY' } },
      { country: 'ID', currency: 'IDR', language: 'id', regulatoryChecklist: { body: 'OJK', pdp: true, consentRequired: true }, consentRules: { sensitiveData: 'explicit' }, dataResidency: 'Indonesia', taxFields: { vat: 0.11 }, coreMapping: { policyPrefix: 'ID', dateFormat: 'DD/MM/YYYY' } },
      { country: 'VN', currency: 'VND', language: 'vi', regulatoryChecklist: { body: 'ISA', pdp: true, consentRequired: true }, consentRules: { sensitiveData: 'explicit' }, dataResidency: 'Vietnam', taxFields: { vat: 0.10 }, coreMapping: { policyPrefix: 'VN', dateFormat: 'DD/MM/YYYY' } },
    ]
  });

  // SUBMISSIONS - 20 across products and statuses
  const submissionData = [
    // Case 1: IAR new business, high sum insured, missing site survey
    { submissionNumber: 'UW-2024-001', businessType: BusinessType.DIRECT_INSURANCE, transactionType: TransactionType.NEW_BUSINESS, productType: ProductType.INDUSTRIAL_ALL_RISKS, insuredName: 'Thai Steel Industries Co., Ltd.', brokerName: 'Muang Thai Broker', sumInsured: 450000000, currency: 'THB', industry: 'Manufacturing - Steel', riskLocation: 'Rayong Industrial Estate, Rayong', priorClaimsCount: 1, priorClaimsAmount: 2500000, status: SubmissionStatus.REFERRAL_REQUIRED, riskScore: 8.2, completenessScore: 72, referralRequired: true, notes: 'Missing site survey. High sum insured triggers referral.' },
    // Case 2: Cyber Insurance, MFA missing
    { submissionNumber: 'UW-2024-002', businessType: BusinessType.DIRECT_INSURANCE, transactionType: TransactionType.NEW_BUSINESS, productType: ProductType.CYBER_INSURANCE, insuredName: 'Bangkok Digital Commerce Ltd.', brokerName: 'Asia Pacific Insurance Broker', sumInsured: 25000000, currency: 'THB', industry: 'E-Commerce', riskLocation: 'Bangkok, Silom District', priorClaimsCount: 0, priorClaimsAmount: 0, status: SubmissionStatus.UNDERWRITING_REVIEW, riskScore: 7.1, completenessScore: 65, referralRequired: true, notes: 'MFA documentation and incident response plan missing.' },
    // Case 3: General Liability renewal, increased limit, prior claims
    { submissionNumber: 'UW-2024-003', businessType: BusinessType.DIRECT_INSURANCE, transactionType: TransactionType.RENEWAL, productType: ProductType.GENERAL_LIABILITY, insuredName: 'Central Pattana PLC', brokerName: 'Marsh Thailand', sumInsured: 80000000, currency: 'THB', industry: 'Real Estate', riskLocation: 'Multiple Locations - Bangkok', priorClaimsCount: 3, priorClaimsAmount: 4200000, status: SubmissionStatus.SENIOR_REVIEW, riskScore: 6.8, completenessScore: 88, referralRequired: true, notes: 'Three prior claims. Limit increase from THB 60M to 80M.' },
    // Case 4: Contractor Works endorsement, >35% increase
    { submissionNumber: 'UW-2024-004', businessType: BusinessType.DIRECT_INSURANCE, transactionType: TransactionType.ENDORSEMENT, productType: ProductType.CONTRACTOR_WORKS, insuredName: 'Italian-Thai Development PLC', brokerName: 'Willis Towers Watson Thailand', sumInsured: 675000000, currency: 'THB', industry: 'Construction', riskLocation: 'Eastern Economic Corridor, Chonburi', priorClaimsCount: 0, priorClaimsAmount: 0, status: SubmissionStatus.REFERRAL_REQUIRED, riskScore: 5.5, completenessScore: 91, referralRequired: true, notes: 'Project value increased by 35%. Endorsement referral triggered.' },
    // Case 5: Reinsurance Inward, missing slip
    { submissionNumber: 'UW-2024-005', businessType: BusinessType.REINSURANCE_INWARD, transactionType: TransactionType.NEW_BUSINESS, productType: ProductType.INDUSTRIAL_ALL_RISKS, insuredName: 'Thai Reinsurance PCL', brokerName: 'Guy Carpenter Thailand', sumInsured: 1200000000, currency: 'THB', industry: 'Reinsurance', riskLocation: 'Various - Thailand', priorClaimsCount: 0, priorClaimsAmount: 0, status: SubmissionStatus.PENDING_INFORMATION, riskScore: 6.0, completenessScore: 45, complianceBlocked: false, notes: 'Reinsurance slip missing. Submission blocked at intake.' },
    // Case 6: Public Liability clean renewal
    { submissionNumber: 'UW-2024-006', businessType: BusinessType.DIRECT_INSURANCE, transactionType: TransactionType.RENEWAL, productType: ProductType.PUBLIC_LIABILITY, insuredName: 'Major Cineplex Group PCL', brokerName: 'Aon Thailand', sumInsured: 30000000, currency: 'THB', industry: 'Entertainment', riskLocation: 'Bangkok, Multiple', priorClaimsCount: 0, priorClaimsAmount: 0, status: SubmissionStatus.APPROVED_FOR_POLICY_PROCESSING, riskScore: 2.1, completenessScore: 98, referralRequired: false, notes: 'Clean renewal. All documents provided.' },
    // Case 7: Product Liability with claims
    { submissionNumber: 'UW-2024-007', businessType: BusinessType.DIRECT_INSURANCE, transactionType: TransactionType.NEW_BUSINESS, productType: ProductType.PRODUCT_LIABILITY, insuredName: 'Thai Union Group PCL', brokerName: 'Marsh Thailand', sumInsured: 95000000, currency: 'THB', industry: 'Food Processing', riskLocation: 'Samut Sakhon Province', priorClaimsCount: 2, priorClaimsAmount: 8500000, status: SubmissionStatus.UNDERWRITING_REVIEW, riskScore: 7.4, completenessScore: 82, referralRequired: false, notes: 'Two prior product liability claims. Detailed review required.' },
    // Case 8: Management Liability with sensitive data
    { submissionNumber: 'UW-2024-008', businessType: BusinessType.DIRECT_INSURANCE, transactionType: TransactionType.NEW_BUSINESS, productType: ProductType.MANAGEMENT_LIABILITY, insuredName: 'PTT Exploration and Production PCL', brokerName: 'Lockton Thailand', sumInsured: 150000000, currency: 'THB', industry: 'Energy - Oil & Gas', riskLocation: 'Bangkok, Ratchadapisek', priorClaimsCount: 0, priorClaimsAmount: 0, status: SubmissionStatus.INTAKE_VALIDATION, riskScore: 5.8, completenessScore: 75, complianceBlocked: true, notes: 'Sensitive personal data of directors present. PDPA legal basis required.' },
    // Additional submissions
    { submissionNumber: 'UW-2024-009', businessType: BusinessType.DIRECT_INSURANCE, transactionType: TransactionType.NEW_BUSINESS, productType: ProductType.ERECTION_ALL_RISKS, insuredName: 'Sino-Thai Engineering PCL', brokerName: 'Willis Towers Watson Thailand', sumInsured: 220000000, currency: 'THB', industry: 'Construction - Power', riskLocation: 'Ratchaburi Province', priorClaimsCount: 1, priorClaimsAmount: 3000000, status: SubmissionStatus.ASSIGNED_TO_UNDERWRITING, riskScore: 6.5, completenessScore: 85, referralRequired: false },
    { submissionNumber: 'UW-2024-010', businessType: BusinessType.DIRECT_INSURANCE, transactionType: TransactionType.RENEWAL, productType: ProductType.CYBER_RISK, insuredName: 'Kasikorn Bank PCL', brokerName: 'Aon Thailand', sumInsured: 200000000, currency: 'THB', industry: 'Banking & Finance', riskLocation: 'Bangkok', priorClaimsCount: 0, priorClaimsAmount: 0, status: SubmissionStatus.APPROVED_FOR_QUOTE, riskScore: 4.2, completenessScore: 96 },
    { submissionNumber: 'UW-2024-011', businessType: BusinessType.DIRECT_INSURANCE, transactionType: TransactionType.NEW_BUSINESS, productType: ProductType.GENERAL_LIABILITY, insuredName: 'Charoen Pokphand Foods PCL', brokerName: 'Marsh Thailand', sumInsured: 60000000, currency: 'THB', industry: 'Agribusiness', riskLocation: 'Nakhon Ratchasima', priorClaimsCount: 0, priorClaimsAmount: 0, status: SubmissionStatus.DRAFT, riskScore: null, completenessScore: 30 },
    { submissionNumber: 'UW-2024-012', businessType: BusinessType.DIRECT_INSURANCE, transactionType: TransactionType.ENDORSEMENT, productType: ProductType.INDUSTRIAL_ALL_RISKS, insuredName: 'SCG Packaging PCL', brokerName: 'Lockton Thailand', sumInsured: 380000000, currency: 'THB', industry: 'Packaging - Industrial', riskLocation: 'Rayong Industrial Estate', priorClaimsCount: 1, priorClaimsAmount: 1500000, status: SubmissionStatus.UNDERWRITING_REVIEW, riskScore: 5.9, completenessScore: 88 },
    { submissionNumber: 'UW-2024-013', businessType: BusinessType.DIRECT_INSURANCE, transactionType: TransactionType.NEW_BUSINESS, productType: ProductType.MOVEABLE_ALL_RISKS, insuredName: 'DTAC PCL', brokerName: 'Asia Pacific Insurance Broker', sumInsured: 45000000, currency: 'THB', industry: 'Telecommunications', riskLocation: 'Bangkok', priorClaimsCount: 0, priorClaimsAmount: 0, status: SubmissionStatus.CORE_ENTRY_PENDING, riskScore: 2.8, completenessScore: 99 },
    { submissionNumber: 'UW-2024-014', businessType: BusinessType.DIRECT_INSURANCE, transactionType: TransactionType.RENEWAL, productType: ProductType.PUBLIC_LIABILITY, insuredName: 'BTS Group Holdings PCL', brokerName: 'Marsh Thailand', sumInsured: 100000000, currency: 'THB', industry: 'Transportation', riskLocation: 'Bangkok Skytrain Network', priorClaimsCount: 1, priorClaimsAmount: 500000, status: SubmissionStatus.SUBMITTED, riskScore: null, completenessScore: 60 },
    { submissionNumber: 'UW-2024-015', businessType: BusinessType.REINSURANCE_INWARD, transactionType: TransactionType.RENEWAL, productType: ProductType.GENERAL_LIABILITY, insuredName: 'Asia Insurance 1950 Co., Ltd.', brokerName: 'Guy Carpenter Thailand', sumInsured: 500000000, currency: 'THB', industry: 'Reinsurance', riskLocation: 'Pan-Thailand', priorClaimsCount: 2, priorClaimsAmount: 12000000, status: SubmissionStatus.SENIOR_REVIEW, riskScore: 7.8, completenessScore: 91, referralRequired: true },
    { submissionNumber: 'UW-2024-016', businessType: BusinessType.DIRECT_INSURANCE, transactionType: TransactionType.NEW_BUSINESS, productType: ProductType.CONTRACTOR_WORKS, insuredName: 'Univentures PCL', brokerName: 'Willis Towers Watson Thailand', sumInsured: 88000000, currency: 'THB', industry: 'Real Estate Development', riskLocation: 'Chiang Mai Province', priorClaimsCount: 0, priorClaimsAmount: 0, status: SubmissionStatus.DRAFT, riskScore: null, completenessScore: 15 },
    { submissionNumber: 'UW-2024-017', businessType: BusinessType.DIRECT_INSURANCE, transactionType: TransactionType.NEW_BUSINESS, productType: ProductType.PRODUCT_LIABILITY, insuredName: 'Berli Jucker PCL', brokerName: 'Aon Thailand', sumInsured: 55000000, currency: 'THB', industry: 'Consumer Products', riskLocation: 'Bangkok', priorClaimsCount: 0, priorClaimsAmount: 0, status: SubmissionStatus.CORE_ENTRY_COMPLETED, riskScore: 3.1, completenessScore: 100 },
    { submissionNumber: 'UW-2024-018', businessType: BusinessType.DIRECT_INSURANCE, transactionType: TransactionType.RENEWAL, productType: ProductType.MANAGEMENT_LIABILITY, insuredName: 'CIMB Thai Bank PCL', brokerName: 'Marsh Thailand', sumInsured: 75000000, currency: 'THB', industry: 'Banking & Finance', riskLocation: 'Bangkok', priorClaimsCount: 0, priorClaimsAmount: 0, status: SubmissionStatus.DECLINED, riskScore: 8.9, completenessScore: 78 },
    { submissionNumber: 'UW-2024-019', businessType: BusinessType.DIRECT_INSURANCE, transactionType: TransactionType.NEW_BUSINESS, productType: ProductType.CYBER_INSURANCE, insuredName: 'Minor International PCL', brokerName: 'Lockton Thailand', sumInsured: 120000000, currency: 'THB', industry: 'Hospitality', riskLocation: 'Bangkok', priorClaimsCount: 0, priorClaimsAmount: 0, status: SubmissionStatus.PENDING_INFORMATION, riskScore: 5.2, completenessScore: 58 },
    { submissionNumber: 'UW-2024-020', businessType: BusinessType.DIRECT_INSURANCE, transactionType: TransactionType.RENEWAL, productType: ProductType.ERECTION_ALL_RISKS, insuredName: 'Electricity Generating PCL', brokerName: 'Willis Towers Watson Thailand', sumInsured: 890000000, currency: 'THB', industry: 'Energy - Power Generation', riskLocation: 'Map Ta Phut, Rayong', priorClaimsCount: 0, priorClaimsAmount: 0, status: SubmissionStatus.APPROVED_FOR_POLICY_PROCESSING, riskScore: 4.8, completenessScore: 97, referralRequired: true },
  ];

  const submissions: any[] = [];
  for (const sub of submissionData) {
    const slaDueDate = new Date();
    slaDueDate.setDate(slaDueDate.getDate() + (Math.random() > 0.3 ? Math.floor(Math.random() * 10) + 1 : -Math.floor(Math.random() * 3)));
    const created = await prisma.submission.create({
      data: {
        ...sub,
        sourceType: 'BROKER',
        policyStartDate: new Date('2024-01-01'),
        policyEndDate: new Date('2025-01-01'),
        assignedToUserId: ([SubmissionStatus.UNDERWRITING_REVIEW, SubmissionStatus.REFERRAL_REQUIRED, SubmissionStatus.SENIOR_REVIEW, SubmissionStatus.ASSIGNED_TO_UNDERWRITING] as SubmissionStatus[]).includes(sub.status as SubmissionStatus) ? underwriter.id : undefined,
        createdByUserId: marketing.id,
        slaDueDate,
        referralRequired: sub.referralRequired ?? false,
        complianceBlocked: sub.complianceBlocked ?? false,
      }
    });
    submissions.push(created);
  }

  // DOCUMENTS - 40+ documents
  const documentDefs = [
    { idx: 0, docs: [{ cat: DocumentCategory.PROPOSAL_FORM, name: 'IAR_Proposal_Form_ThaiSteel.pdf', status: ExtractionStatus.COMPLETED, text: 'Industrial All Risks proposal. Insured: Thai Steel Industries Co., Ltd. Location: Rayong Industrial Estate. Buildings, Plant & Machinery, Stock in Process.' }, { cat: DocumentCategory.LOSS_HISTORY, name: 'Loss_History_ThaiSteel_5yr.pdf', status: ExtractionStatus.COMPLETED, text: 'Five year loss history. One claim 2022: THB 2,500,000 machinery breakdown.' }] },
    { idx: 1, docs: [{ cat: DocumentCategory.PROPOSAL_FORM, name: 'Cyber_Proposal_BKKDigital.pdf', status: ExtractionStatus.COMPLETED, text: 'Cyber Insurance proposal. E-commerce platform. 2M daily transactions. AWS hosted. No MFA policy documented.' }, { cat: DocumentCategory.INCIDENT_RESPONSE_PLAN, name: 'IRP_Draft_BKKDigital.pdf', status: ExtractionStatus.FAILED, text: null }] },
    { idx: 2, docs: [{ cat: DocumentCategory.PROPOSAL_FORM, name: 'GL_Renewal_CentralPattana.pdf', status: ExtractionStatus.COMPLETED, text: 'General Liability renewal. 15 shopping malls across Thailand. Public footfall 2M weekly.' }, { cat: DocumentCategory.LOSS_HISTORY, name: 'Claims_History_CentralPattana.pdf', status: ExtractionStatus.COMPLETED, text: 'Three claims: slip & fall 2021 THB 800K, structural 2022 THB 2.1M, third party injury 2023 THB 1.3M.' }, { cat: DocumentCategory.PRIOR_POLICY, name: 'Prior_Policy_CentralPattana_2023.pdf', status: ExtractionStatus.COMPLETED, text: 'Policy No. GL-TH-2023-4521. Sum Insured THB 60,000,000.' }] },
    { idx: 3, docs: [{ cat: DocumentCategory.PROPOSAL_FORM, name: 'CW_Endorsement_ItalianThai.pdf', status: ExtractionStatus.COMPLETED, text: 'Contractor Works endorsement. EEC high-speed rail project. Original contract value THB 500M. Revised THB 675M. 35% increase.' }, { cat: DocumentCategory.ENDORSEMENT_REQUEST, name: 'Endorsement_Request_ItalianThai.pdf', status: ExtractionStatus.COMPLETED, text: 'Formal endorsement request. Project scope expansion. New contractor: Hyundai Engineering.' }] },
    { idx: 4, docs: [{ cat: DocumentCategory.PROPOSAL_FORM, name: 'RI_Inward_ThaiRe.pdf', status: ExtractionStatus.COMPLETED, text: 'Reinsurance Inward submission. Facultative reinsurance. Various risks.' }] },
    { idx: 5, docs: [{ cat: DocumentCategory.PROPOSAL_FORM, name: 'PL_Renewal_MajorCineplex.pdf', status: ExtractionStatus.COMPLETED, text: 'Public Liability renewal. Entertainment venues. 40 cinema locations.' }, { cat: DocumentCategory.PRIOR_POLICY, name: 'Prior_Policy_MajorCineplex.pdf', status: ExtractionStatus.COMPLETED, text: 'Clean renewal. No claims 2023.' }, { cat: DocumentCategory.COMPLIANCE_DOCUMENT, name: 'Consent_Form_MajorCineplex.pdf', status: ExtractionStatus.COMPLETED, text: 'PDPA consent form executed. Privacy notice acknowledged.' }] },
    { idx: 6, docs: [{ cat: DocumentCategory.PROPOSAL_FORM, name: 'ProdLiab_ThaiUnion.pdf', status: ExtractionStatus.COMPLETED, text: 'Product Liability proposal. Food processing - canned seafood. Export to 90 countries.' }, { cat: DocumentCategory.LOSS_HISTORY, name: 'Claims_ThaiUnion_5yr.pdf', status: ExtractionStatus.COMPLETED, text: 'Two product recall claims: 2021 THB 4.2M, 2023 THB 4.3M. US export recall.' }] },
    { idx: 7, docs: [{ cat: DocumentCategory.PROPOSAL_FORM, name: 'MgmtLiab_PTT_EP.pdf', status: ExtractionStatus.COMPLETED, text: 'Management Liability proposal. Directors & Officers, Employment Practices. Sensitive data of 12 directors.' }, { cat: DocumentCategory.COMPLIANCE_DOCUMENT, name: 'PDPA_Assessment_PTTEP.pdf', status: ExtractionStatus.PENDING, text: null }] },
    { idx: 8, docs: [{ cat: DocumentCategory.PROPOSAL_FORM, name: 'EAR_SinoThai.pdf', status: ExtractionStatus.COMPLETED, text: 'Erection All Risks. Gas-fired power plant 700MW. 36-month construction.' }, { cat: DocumentCategory.SITE_SURVEY, name: 'Site_Survey_SinoThai.pdf', status: ExtractionStatus.COMPLETED, text: 'Site survey completed. Risk class 3. Fire suppression adequate.' }] },
    { idx: 9, docs: [{ cat: DocumentCategory.PROPOSAL_FORM, name: 'CyberRisk_Kasikorn.pdf', status: ExtractionStatus.COMPLETED, text: 'Cyber Risk renewal. KBank digital banking. ISO 27001 certified. SOC 2 Type II.' }, { cat: DocumentCategory.MFA_DOCUMENTATION, name: 'MFA_Policy_Kasikorn.pdf', status: ExtractionStatus.COMPLETED, text: 'MFA enforced for all 18,000 employees and customer accounts.' }] },
    { idx: 12, docs: [{ cat: DocumentCategory.PROPOSAL_FORM, name: 'MAR_DTAC.pdf', status: ExtractionStatus.COMPLETED, text: 'Moveable All Risks. Telecommunications equipment. 1,200 cell towers.' }] },
    { idx: 14, docs: [{ cat: DocumentCategory.REINSURANCE_SLIP, name: 'RI_Slip_AsiaInsurance.pdf', status: ExtractionStatus.COMPLETED, text: 'Reinsurance slip. Facultative treaty. 65% cession.' }, { cat: DocumentCategory.PRIOR_POLICY, name: 'Prior_Policy_AsiaInsurance.pdf', status: ExtractionStatus.COMPLETED, text: 'Prior year reinsurance terms.' }] },
    { idx: 19, docs: [{ cat: DocumentCategory.PROPOSAL_FORM, name: 'EAR_EGCO_Renewal.pdf', status: ExtractionStatus.COMPLETED, text: 'Erection All Risks renewal. Map Ta Phut power plant expansion.' }, { cat: DocumentCategory.SITE_SURVEY, name: 'Site_Survey_EGCO.pdf', status: ExtractionStatus.COMPLETED, text: 'Survey completed by risk engineer. Recommended sprinkler upgrade.' }, { cat: DocumentCategory.COMPLIANCE_DOCUMENT, name: 'PDPA_Consent_EGCO.pdf', status: ExtractionStatus.COMPLETED, text: 'Consent captured. Legal basis: contractual necessity.' }] },
  ];

  const allDocs: any[] = [];
  for (const def of documentDefs) {
    for (const doc of def.docs) {
      const created = await prisma.document.create({
        data: {
          submissionId: submissions[def.idx].id,
          fileName: doc.name,
          fileType: 'application/pdf',
          filePath: `/uploads/${doc.name}`,
          documentCategory: doc.cat,
          uploadedByUserId: marketing.id,
          extractedText: doc.text,
          extractionStatus: doc.status,
        }
      });
      allDocs.push({ ...created, idx: def.idx });
    }
  }

  // AI RECOMMENDATIONS - 25+
  const aiRecDefs = [
    { subIdx: 0, agentName: 'Risk Summary Agent', type: 'RISK_ASSESSMENT', text: 'High-risk industrial submission. Steel manufacturing in Rayong Industrial Estate. Major exposures: machinery breakdown, fire, flood (coastal proximity). Estimated risk score 8.2/10.', rationale: 'Historical loss ratio for Thai steel sector: 68%. Rayong flood zone D. Missing site survey prevents complete assessment.', confidence: 0.78, status: AIRecommendationStatus.APPROVED },
    { subIdx: 0, agentName: 'Referral Agent', type: 'REFERRAL_RECOMMENDATION', text: 'Recommend senior underwriter referral. Sum insured THB 450M exceeds THB 100M threshold. Site survey absent. Risk score 8.2 exceeds threshold of 7.0.', rationale: 'Rule triggers: High Sum Insured (THB 450M), IAR Site Survey Missing. Combined triggers mandate senior review.', confidence: 0.95, status: AIRecommendationStatus.APPROVED },
    { subIdx: 0, agentName: 'Compliance Agent', type: 'COMPLIANCE_CHECK', text: 'Consent captured. Privacy notice acknowledged. No sensitive personal data flagged. PDPA compliance: CLEAR.', rationale: 'Review of proposal form confirms written consent. Corporate entity - no individual sensitive data.', confidence: 0.92, status: AIRecommendationStatus.APPROVED },
    { subIdx: 1, agentName: 'Risk Summary Agent', type: 'RISK_ASSESSMENT', text: 'Medium-high cyber risk. E-commerce platform processing 2M daily transactions. AWS infrastructure positive. Absence of documented MFA policy is critical gap.', rationale: 'E-commerce sector average breach cost: USD 3.2M. MFA absence increases credential compromise risk 6x. No incident response plan on file.', confidence: 0.84, status: AIRecommendationStatus.PENDING },
    { subIdx: 1, agentName: 'Clause Recommendation Agent', type: 'CLAUSE_RECOMMENDATION', text: 'Recommend inclusion of: (1) Ransomware sublimit THB 10M, (2) Business interruption 72-hour waiting period, (3) Third-party service provider exclusion for uncontracted vendors.', rationale: 'E-commerce profile and missing MFA documentation warrant enhanced sublimits and exclusions.', confidence: 0.81, status: AIRecommendationStatus.PENDING },
    { subIdx: 2, agentName: 'Risk Summary Agent', type: 'RISK_ASSESSMENT', text: 'Moderate risk retail liability. 15 shopping malls, high public footfall. Three prior claims in 5 years. Limit increase from THB 60M to 80M represents 33% uplift.', rationale: 'Claims frequency above sector median. Slip and fall frequency typical for high-traffic retail. Structural claim 2022 requires investigation.', confidence: 0.87, status: AIRecommendationStatus.APPROVED },
    { subIdx: 2, agentName: 'Referral Agent', type: 'REFERRAL_RECOMMENDATION', text: 'Referral required. Three prior claims triggers mandatory review rule. Limit increase >20% is a secondary trigger. Senior review essential before quote.', rationale: 'Rule: Prior Claims Count > 2. Current claims count: 3. Rule: Sum insured increase on renewal exceeds guideline threshold.', confidence: 0.97, status: AIRecommendationStatus.APPROVED },
    { subIdx: 3, agentName: 'Risk Summary Agent', type: 'RISK_ASSESSMENT', text: 'EEC high-speed rail project. Contractor risk well-managed. Project scope expansion with new contractor Hyundai Engineering introduces coordination risk. Sum insured increase 35%.', rationale: 'Infrastructure projects with mid-construction scope changes carry 2.3x higher delay risk. New contractor onboarding requires verification.', confidence: 0.79, status: AIRecommendationStatus.APPROVED },
    { subIdx: 3, agentName: 'Referral Agent', type: 'REFERRAL_RECOMMENDATION', text: 'Endorsement referral mandatory. Sum insured increased by 35%, exceeding the 20% endorsement referral threshold.', rationale: 'Rule: Endorsement Sum Insured Change > 20%. Actual change: 35%. Referral required per underwriting guidelines.', confidence: 0.99, status: AIRecommendationStatus.APPROVED },
    { subIdx: 4, agentName: 'Intake Agent', type: 'COMPLETENESS_CHECK', text: 'Submission incomplete. Critical document missing: Reinsurance Slip. Completeness score 45%. Cannot proceed to underwriting without reinsurance slip.', rationale: 'Reinsurance Inward submissions require facultative slip with cession details, cedant information, and original risk terms.', confidence: 0.99, status: AIRecommendationStatus.APPROVED },
    { subIdx: 5, agentName: 'Risk Summary Agent', type: 'RISK_ASSESSMENT', text: 'Low-risk clean renewal. Major Cineplex - established cinema chain. Zero claims in policy period. Public liability exposure well-managed. Recommend renewal with no changes.', rationale: 'Entertainment sector liability well-understood. No adverse loss development. Strong safety record per prior survey.', confidence: 0.93, status: AIRecommendationStatus.APPROVED },
    { subIdx: 5, agentName: 'Core Mapping Agent', type: 'CORE_MAPPING', text: 'Core system fields mapped. Policy class: PL. Insured code: MAJCIN-001. Risk location codes assigned. Premium basis: per location. Ready for policy processing.', rationale: 'All mandatory core fields populated. Document completeness 98%. PDPA compliance cleared.', confidence: 0.96, status: AIRecommendationStatus.APPROVED },
    { subIdx: 6, agentName: 'Risk Summary Agent', type: 'RISK_ASSESSMENT', text: 'Product liability for global food exporter. Two significant product recall claims in 5 years. US export market introduces high severity jurisdiction risk. Total prior claims THB 8.5M.', rationale: 'Food sector product recall frequency elevated post-2020. US jurisdiction claims 4x higher average severity than Thailand. Recall management program required.', confidence: 0.88, status: AIRecommendationStatus.APPROVED },
    { subIdx: 7, agentName: 'Compliance Agent', type: 'COMPLIANCE_CHECK', text: 'COMPLIANCE BLOCKED. Sensitive personal data of 12 directors present in proposal. No PDPA Section 26 legal basis recorded. Human review mandatory before processing.', rationale: 'PDPA Section 26 requires explicit consent or valid legal basis for processing sensitive personal data. Directors health, financial status data present in D&O section.', confidence: 0.99, status: AIRecommendationStatus.PENDING },
    { subIdx: 7, agentName: 'Referral Agent', type: 'REFERRAL_RECOMMENDATION', text: 'Sum insured THB 150M exceeds THB 100M referral threshold. Senior review required independent of compliance status.', rationale: 'Rule: High Sum Insured Referral. Amount: THB 150M. Threshold: THB 100M.', confidence: 0.97, status: AIRecommendationStatus.PENDING },
    { subIdx: 9, agentName: 'Risk Summary Agent', type: 'RISK_ASSESSMENT', text: 'Low-risk cyber renewal for Kasikorn Bank. ISO 27001 certified. SOC 2 Type II. MFA enforced. Strong security posture. Risk score 4.2/10.', rationale: 'Banking sector with full security certification stack. Zero claims history. Renewal recommended with standard terms.', confidence: 0.91, status: AIRecommendationStatus.APPROVED },
    { subIdx: 9, agentName: 'Clause Recommendation Agent', type: 'CLAUSE_RECOMMENDATION', text: 'Recommend maintaining prior year cyber terms. Consider SWIFT network coverage endorsement given banking profile. No adverse changes required.', rationale: 'Clean renewal. Strong security posture. SWIFT exposure relevant for correspondent banking operations.', confidence: 0.85, status: AIRecommendationStatus.APPROVED },
    { subIdx: 14, agentName: 'Risk Summary Agent', type: 'RISK_ASSESSMENT', text: 'Reinsurance Inward renewal. Asia Insurance 1950 - established cedant. Two prior claims THB 12M in renewal period. Cession 65%. Review treaty terms for adequacy.', rationale: 'Reinsurance portfolio review indicates acceptable loss ratio. Prior claims within expected range for mixed portfolio treaty.', confidence: 0.82, status: AIRecommendationStatus.PENDING },
    { subIdx: 19, agentName: 'Risk Summary Agent', type: 'RISK_ASSESSMENT', text: 'Large power generation renewal. EGCO Map Ta Phut. Risk engineer survey completed. Sprinkler upgrade recommended. Strong risk management program.', rationale: 'Power generation sector average loss ratio Thailand: 42%. EGCO loss record clean. PML estimated at 35% of TSI.', confidence: 0.89, status: AIRecommendationStatus.APPROVED },
    { subIdx: 19, agentName: 'Core Mapping Agent', type: 'CORE_MAPPING', text: 'Core system mapping complete. EAR class. Location: Map Ta Phut. Currency: THB. Cross-border reinsurance flag: active. Ready for policy processing.', rationale: 'All core fields populated. Cross-border reinsurance to Lloyd\'s syndicate requires transfer flag per PDPA.', confidence: 0.94, status: AIRecommendationStatus.APPROVED },
  ];

  for (const rec of aiRecDefs) {
    await prisma.aIRecommendation.create({
      data: {
        submissionId: submissions[rec.subIdx].id,
        agentName: rec.agentName,
        recommendationType: rec.type,
        recommendationText: rec.text,
        rationale: rec.rationale,
        confidenceScore: rec.confidence,
        status: rec.status,
        approvedByUserId: rec.status === AIRecommendationStatus.APPROVED ? underwriter.id : undefined,
      }
    });
  }

  // COMPLIANCE RECORDS
  const complianceDefs = [
    { idx: 0, consent: true, privacy: true, sensitive: false, legal: 'CONTRACTUAL', crossBorder: false, retention: 'CLASS_A', human: true, status: ComplianceStatus.CLEAR },
    { idx: 1, consent: true, privacy: true, sensitive: false, legal: 'CONTRACTUAL', crossBorder: false, retention: 'CLASS_B', human: false, status: ComplianceStatus.REVIEW_REQUIRED },
    { idx: 2, consent: true, privacy: true, sensitive: false, legal: 'CONTRACTUAL', crossBorder: false, retention: 'CLASS_A', human: true, status: ComplianceStatus.APPROVED },
    { idx: 3, consent: true, privacy: true, sensitive: false, legal: 'CONTRACTUAL', crossBorder: false, retention: 'CLASS_A', human: true, status: ComplianceStatus.CLEAR },
    { idx: 4, consent: true, privacy: false, sensitive: false, legal: '', crossBorder: false, retention: 'CLASS_B', human: false, status: ComplianceStatus.REVIEW_REQUIRED },
    { idx: 5, consent: true, privacy: true, sensitive: false, legal: 'CONTRACTUAL', crossBorder: false, retention: 'CLASS_A', human: true, status: ComplianceStatus.APPROVED },
    { idx: 6, consent: true, privacy: true, sensitive: false, legal: 'CONTRACTUAL', crossBorder: true, retention: 'CLASS_A', human: true, status: ComplianceStatus.APPROVED },
    { idx: 7, consent: false, privacy: false, sensitive: true, sensitiveType: 'DIRECTOR_PERSONAL_DATA', legal: '', crossBorder: false, retention: 'CLASS_B', human: false, status: ComplianceStatus.BLOCKED },
    { idx: 9, consent: true, privacy: true, sensitive: false, legal: 'CONTRACTUAL', crossBorder: false, retention: 'CLASS_A', human: true, status: ComplianceStatus.APPROVED },
    { idx: 12, consent: true, privacy: true, sensitive: false, legal: 'CONTRACTUAL', crossBorder: false, retention: 'CLASS_A', human: true, status: ComplianceStatus.APPROVED },
    { idx: 14, consent: true, privacy: true, sensitive: false, legal: 'CONTRACTUAL', crossBorder: true, retention: 'CLASS_B', human: false, status: ComplianceStatus.REVIEW_REQUIRED },
    { idx: 19, consent: true, privacy: true, sensitive: false, legal: 'CONTRACTUAL', crossBorder: true, retention: 'CLASS_A', human: true, status: ComplianceStatus.APPROVED },
  ];

  for (const c of complianceDefs) {
    await prisma.complianceRecord.create({
      data: {
        submissionId: submissions[c.idx].id,
        consentCaptured: c.consent,
        privacyNoticeAcknowledged: c.privacy,
        sensitiveDataPresent: c.sensitive,
        sensitiveDataType: (c as any).sensitiveType || null,
        legalBasis: c.legal,
        crossBorderTransferRequired: c.crossBorder,
        dataRetentionClass: c.retention,
        humanReviewCompleted: c.human,
        complianceApprovedByUserId: c.status === ComplianceStatus.APPROVED ? compliance.id : undefined,
        complianceStatus: c.status,
      }
    });
  }

  // REFERRALS
  await prisma.referral.create({ data: { submissionId: submissions[0].id, referredByUserId: underwriter.id, referredToUserId: senior.id, referralReason: 'Sum insured THB 450M exceeds THB 100M threshold. Site survey missing. Risk score 8.2.', referralStatus: ReferralStatus.PENDING } });
  await prisma.referral.create({ data: { submissionId: submissions[2].id, referredByUserId: underwriter.id, referredToUserId: senior.id, referralReason: 'Three prior claims. Limit increase 33%. Senior review required per underwriting authority matrix.', referralStatus: ReferralStatus.APPROVED_WITH_CONDITIONS, seniorDecision: 'APPROVED_WITH_CONDITIONS', decisionNotes: 'Approved with 10% premium loading. Claims management clause to be added. Structural exclusion for 2022 incident location.', conditions: '10% premium loading applied. Claims management warranty. Structural exclusion.' } });
  await prisma.referral.create({ data: { submissionId: submissions[3].id, referredByUserId: underwriter.id, referredToUserId: senior.id, referralReason: 'Endorsement sum insured increased 35%. Exceeds 20% guideline threshold.', referralStatus: ReferralStatus.PENDING } });
  await prisma.referral.create({ data: { submissionId: submissions[14].id, referredByUserId: underwriter.id, referredToUserId: senior.id, referralReason: 'Reinsurance Inward renewal. Two prior claims THB 12M. Treaty terms require senior review.', referralStatus: ReferralStatus.PENDING } });

  // POLICY PROCESSING RECORDS
  await prisma.policyProcessingRecord.create({ data: { submissionId: submissions[5].id, coreEntryStatus: CoreEntryStatus.COMPLETED, csvExported: true, jsonExported: true, enteredByUserId: policy.id, coreReferenceNumber: 'POL-TH-2024-00631', completedAt: new Date('2024-11-15') } });
  await prisma.policyProcessingRecord.create({ data: { submissionId: submissions[12].id, coreEntryStatus: CoreEntryStatus.IN_PROGRESS, csvExported: true, jsonExported: false, enteredByUserId: policy.id, coreReferenceNumber: 'POL-TH-2024-00712' } });
  await prisma.policyProcessingRecord.create({ data: { submissionId: submissions[16].id, coreEntryStatus: CoreEntryStatus.COMPLETED, csvExported: true, jsonExported: true, enteredByUserId: policy.id, coreReferenceNumber: 'POL-TH-2024-00698', completedAt: new Date('2024-11-20') } });
  await prisma.policyProcessingRecord.create({ data: { submissionId: submissions[19].id, coreEntryStatus: CoreEntryStatus.PENDING, csvExported: false, jsonExported: false } });

  // RULE RESULTS
  const ruleResultDefs = [
    { subIdx: 0, ruleIdx: 0, triggered: true, msg: 'Sum insured THB 450,000,000 exceeds THB 100,000,000 threshold. Senior referral required.', sev: RuleSeverity.HIGH },
    { subIdx: 0, ruleIdx: 7, triggered: true, msg: 'Industrial All Risks submission: site survey document not found in submission.', sev: RuleSeverity.MEDIUM },
    { subIdx: 1, ruleIdx: 2, triggered: true, msg: 'Cyber Insurance: MFA documentation not provided.', sev: RuleSeverity.HIGH },
    { subIdx: 1, ruleIdx: 9, triggered: true, msg: 'Cyber Insurance: incident response plan missing or extraction failed.', sev: RuleSeverity.MEDIUM },
    { subIdx: 2, ruleIdx: 3, triggered: true, msg: 'Prior claims count 3 exceeds threshold of 2. Referral required.', sev: RuleSeverity.MEDIUM },
    { subIdx: 3, ruleIdx: 8, triggered: true, msg: 'Endorsement: sum insured increased by 35%, exceeding 20% threshold.', sev: RuleSeverity.MEDIUM },
    { subIdx: 4, ruleIdx: 6, triggered: true, msg: 'Reinsurance Inward: reinsurance slip not found in documents.', sev: RuleSeverity.HIGH },
    { subIdx: 7, ruleIdx: 4, triggered: true, msg: 'Consent not captured for submission with sensitive personal data.', sev: RuleSeverity.HIGH },
    { subIdx: 7, ruleIdx: 5, triggered: true, msg: 'Sensitive personal data present. No PDPA Section 26 legal basis recorded.', sev: RuleSeverity.HIGH },
    { subIdx: 7, ruleIdx: 0, triggered: true, msg: 'Sum insured THB 150,000,000 exceeds THB 100,000,000 threshold.', sev: RuleSeverity.HIGH },
    { subIdx: 14, ruleIdx: 0, triggered: true, msg: 'Sum insured THB 500,000,000 exceeds THB 100,000,000 threshold.', sev: RuleSeverity.HIGH },
    { subIdx: 19, ruleIdx: 0, triggered: true, msg: 'Sum insured THB 890,000,000 exceeds THB 100,000,000 threshold.', sev: RuleSeverity.HIGH },
  ];

  for (const rr of ruleResultDefs) {
    await prisma.ruleResult.create({
      data: {
        submissionId: submissions[rr.subIdx].id,
        ruleId: rules[rr.ruleIdx].id,
        triggered: rr.triggered,
        message: rr.msg,
        severity: rr.sev,
      }
    });
  }

  // AUDIT LOGS
  const auditDefs = [
    { sub: 0, action: 'SUBMISSION_CREATED', userId: marketing.id },
    { sub: 0, action: 'STATUS_CHANGED', userId: underwriter.id },
    { sub: 0, action: 'REFERRAL_CREATED', userId: underwriter.id },
    { sub: 1, action: 'SUBMISSION_CREATED', userId: marketing.id },
    { sub: 2, action: 'SUBMISSION_CREATED', userId: marketing.id },
    { sub: 2, action: 'REFERRAL_CREATED', userId: underwriter.id },
    { sub: 2, action: 'REFERRAL_DECISION', userId: senior.id },
    { sub: 5, action: 'APPROVED_FOR_POLICY_PROCESSING', userId: underwriter.id },
    { sub: 5, action: 'CORE_ENTRY_COMPLETED', userId: policy.id },
    { sub: 7, action: 'COMPLIANCE_BLOCKED', userId: compliance.id },
  ];

  for (const a of auditDefs) {
    await prisma.auditLog.create({
      data: {
        userId: a.userId,
        entityType: 'SUBMISSION',
        entityId: submissions[a.sub].id,
        action: a.action,
        newValueJson: { status: submissions[a.sub].status },
      }
    });
  }

  // NOTIFICATIONS
  await prisma.notification.createMany({
    data: [
      { userId: underwriter.id, submissionId: submissions[0].id, message: 'New submission UW-2024-001 assigned to you for underwriting review.' },
      { userId: senior.id, submissionId: submissions[0].id, message: 'Referral received: UW-2024-001 Thai Steel Industries. High sum insured and missing site survey.' },
      { userId: senior.id, submissionId: submissions[2].id, message: 'Referral received: UW-2024-003 Central Pattana. Prior claims and limit increase.' },
      { userId: compliance.id, submissionId: submissions[7].id, message: 'Compliance block on UW-2024-008. Sensitive data without legal basis. Review required.' },
      { userId: underwriter.id, submissionId: submissions[1].id, message: 'UW-2024-002 pending information: MFA documentation required from insured.' },
      { userId: policy.id, submissionId: submissions[5].id, message: 'UW-2024-006 approved for policy processing. Ready for core system entry.' },
      { userId: management.id, message: '3 submissions currently in SLA breach. Review management dashboard.' },
    ]
  });

  console.log('Seed completed successfully.');
  console.log('\nTest user credentials:');
  console.log('  marketing@uwworkbench.th   / Password123!  (Marketing)');
  console.log('  underwriter@uwworkbench.th / Password123!  (Underwriter)');
  console.log('  senior@uwworkbench.th      / Password123!  (Senior Underwriter)');
  console.log('  policy@uwworkbench.th      / Password123!  (Policy Processing)');
  console.log('  itadmin@uwworkbench.th     / Password123!  (IT Admin)');
  console.log('  compliance@uwworkbench.th  / Password123!  (Compliance)');
  console.log('  management@uwworkbench.th  / Password123!  (Management)');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
