import { prisma } from '@/lib/prisma';
import { RuleSeverity, RuleType } from '@prisma/client';

interface SubmissionContext {
  id: string;
  businessType: string;
  transactionType: string;
  productType: string;
  sumInsured: number;
  industry: string | null;
  priorClaimsCount: number;
  documents: { documentCategory: string; extractionStatus: string }[];
  complianceRecord?: {
    consentCaptured: boolean;
    sensitiveDataPresent: boolean;
    legalBasis: string | null;
  } | null;
  previousSumInsured?: number;
}

function evaluateCondition(condition: any, ctx: SubmissionContext): boolean {
  const { field, operator, value } = condition;

  const getField = (f: string): any => {
    switch (f) {
      case 'sumInsured': return ctx.sumInsured;
      case 'industry': return (ctx.industry || '').toLowerCase();
      case 'priorClaimsCount': return ctx.priorClaimsCount;
      case 'consentCaptured': return ctx.complianceRecord?.consentCaptured ?? false;
      case 'sensitiveDataLegalBasis':
        return ctx.complianceRecord?.sensitiveDataPresent && !ctx.complianceRecord?.legalBasis;
      case 'document': return ctx.documents.map(d => d.documentCategory);
      case 'sumInsuredChange':
        if (ctx.previousSumInsured && ctx.previousSumInsured > 0) {
          return Math.abs(ctx.sumInsured - ctx.previousSumInsured) / ctx.previousSumInsured;
        }
        return 0;
      default: return null;
    }
  };

  const fieldVal = getField(field);

  switch (operator) {
    case 'gt': return typeof fieldVal === 'number' && fieldVal > value;
    case 'lt': return typeof fieldVal === 'number' && fieldVal < value;
    case 'eq': return fieldVal === value;
    case 'contains':
      if (typeof fieldVal === 'string') return fieldVal.includes(String(value).toLowerCase());
      return false;
    case 'missing':
      if (field === 'document') return !Array.isArray(fieldVal) || !fieldVal.includes(value);
      if (field === 'sensitiveDataLegalBasis') return fieldVal === true;
      return !fieldVal;
    default: return false;
  }
}

export async function executeRulesForSubmission(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      documents: { select: { documentCategory: true, extractionStatus: true } },
      complianceRecord: true,
    },
  });

  if (!submission) return;

  const rules = await prisma.rule.findMany({ where: { active: true } });

  // Delete previous results
  await prisma.ruleResult.deleteMany({ where: { submissionId } });

  let referralRequired = false;
  let complianceBlocked = false;

  for (const rule of rules) {
    // Check product/business/transaction filters
    if ((rule as any).productType && (rule as any).productType !== submission.productType) continue;
    if ((rule as any).businessType && (rule as any).businessType !== submission.businessType) continue;
    if ((rule as any).transactionType && (rule as any).transactionType !== submission.transactionType) continue;

    const ctx: SubmissionContext = {
      id: submission.id,
      businessType: submission.businessType,
      transactionType: submission.transactionType,
      productType: submission.productType,
      sumInsured: submission.sumInsured,
      industry: submission.industry,
      priorClaimsCount: submission.priorClaimsCount,
      documents: submission.documents,
      complianceRecord: submission.complianceRecord,
    };

    const triggered = evaluateCondition(rule.conditionJson as any, ctx);
    const action = (rule.actionJson as any).action;
    const message = triggered ? (rule.actionJson as any).message : `Rule not triggered: ${rule.ruleName}`;

    await prisma.ruleResult.create({
      data: {
        submissionId,
        ruleId: rule.id,
        triggered,
        message,
        severity: rule.severity,
      },
    });

    if (triggered) {
      if (action === 'REFERRAL_REQUIRED') referralRequired = true;
      if (action === 'COMPLIANCE_BLOCK' || action === 'BLOCK_SUBMISSION') complianceBlocked = true;
    }
  }

  // Update submission flags
  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      referralRequired,
      complianceBlocked,
      riskScore: calculateRiskScore(submission as any),
      completenessScore: calculateCompleteness(submission as any),
    },
  });

  return { referralRequired, complianceBlocked };
}

function calculateRiskScore(submission: any): number {
  let score = 3.0;
  if (submission.sumInsured > 500000000) score += 3;
  else if (submission.sumInsured > 100000000) score += 2;
  else if (submission.sumInsured > 50000000) score += 1;
  if (submission.priorClaimsCount > 2) score += 2;
  else if (submission.priorClaimsCount > 0) score += 1;
  if (['CYBER_INSURANCE', 'MANAGEMENT_LIABILITY'].includes(submission.productType)) score += 1;
  if (submission.industry?.toLowerCase().includes('chemical')) score += 1.5;
  return Math.min(10, parseFloat(score.toFixed(1)));
}

function calculateCompleteness(submission: any): number {
  let score = 0;
  const required = ['insuredName', 'riskLocation', 'sumInsured', 'productType', 'businessType', 'transactionType'];
  for (const field of required) {
    if ((submission as any)[field]) score += 10;
  }
  if (submission.policyStartDate) score += 5;
  if (submission.policyEndDate) score += 5;
  if (submission.brokerName) score += 5;
  if (submission.documents?.length > 0) score += 15;
  if (submission.complianceRecord?.consentCaptured) score += 5;
  if (submission.complianceRecord?.privacyNoticeAcknowledged) score += 5;
  return Math.min(100, score);
}
