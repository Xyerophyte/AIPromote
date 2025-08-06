import { z } from 'zod';
import { prisma } from './database';
import { ValidationError } from '../utils/errors';

export interface ApprovalWorkflow {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  steps: ApprovalStep[];
  rules: ApprovalRules;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalStep {
  id: string;
  name: string;
  type: 'review' | 'approval' | 'automated_check' | 'feedback' | 'final_approval';
  order: number;
  assignees: ApprovalAssignee[];
  criteria: ApprovalCriteria;
  autoAdvance: boolean;
  timeout?: {
    hours: number;
    action: 'auto_approve' | 'auto_reject' | 'escalate' | 'notify';
  };
  parallel: boolean; // Can multiple assignees work on this step simultaneously
}

export interface ApprovalAssignee {
  type: 'user' | 'role' | 'external';
  id: string;
  name: string;
  email?: string;
  canApprove: boolean;
  canReject: boolean;
  canRequestChanges: boolean;
  canComment: boolean;
}

export interface ApprovalCriteria {
  brandSafety: {
    required: boolean;
    threshold: number; // 0-1 score threshold
    autoReject: boolean;
  };
  contentQuality: {
    required: boolean;
    checkSpelling: boolean;
    checkGrammar: boolean;
    checkReadability: boolean;
    minReadabilityScore?: number;
  };
  compliance: {
    required: boolean;
    checkLegal: boolean;
    checkIndustryRules: boolean;
    requiredApprovals: string[]; // list of approval types needed
  };
  platformOptimization: {
    required: boolean;
    checkCharacterLimits: boolean;
    checkHashtags: boolean;
    checkFormatting: boolean;
  };
  customCriteria: Array<{
    id: string;
    name: string;
    description: string;
    type: 'boolean' | 'score' | 'text' | 'checklist';
    required: boolean;
    threshold?: number; // for score type
    options?: string[]; // for checklist type
  }>;
}

export interface ApprovalRules {
  autoApprovalConditions: {
    enabled: boolean;
    conditions: Array<{
      type: 'brand_safety_score' | 'content_template' | 'user_history' | 'content_type' | 'platform';
      operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'in' | 'contains';
      value: any;
    }>;
    requiresAll: boolean; // AND vs OR logic
  };
  escalationRules: Array<{
    condition: string;
    action: 'notify_manager' | 'add_reviewer' | 'require_additional_approval';
    recipients: string[];
  }>;
  notificationSettings: {
    notifyOnSubmission: boolean;
    notifyOnApproval: boolean;
    notifyOnRejection: boolean;
    notifyOnTimeout: boolean;
    channels: ('email' | 'slack' | 'teams' | 'webhook')[];
  };
}

export interface ContentApprovalRequest {
  id: string;
  contentPieceId: string;
  workflowId: string;
  organizationId: string;
  submitterId: string;
  currentStep: number;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'needs_changes' | 'withdrawn';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  deadline?: Date;
  metadata: {
    platform: string;
    contentType: string;
    originalContent: string;
    requestReason?: string;
    urgencyJustification?: string;
  };
  revisions: ContentRevision[];
  approvals: ContentApproval[];
  comments: ApprovalComment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentRevision {
  id: string;
  version: number;
  content: {
    title?: string;
    body: string;
    hashtags: string[];
    mentions: string[];
    mediaRefs?: any;
  };
  changes: RevisionChange[];
  submitterId: string;
  submitterName: string;
  submissionNotes?: string;
  autoChecks?: {
    brandSafety: { passed: boolean; score: number; issues: string[] };
    contentQuality: { passed: boolean; issues: string[] };
    platformOptimization: { passed: boolean; issues: string[] };
    compliance: { passed: boolean; issues: string[] };
  };
  createdAt: Date;
}

export interface RevisionChange {
  type: 'addition' | 'deletion' | 'modification';
  field: 'title' | 'body' | 'hashtags' | 'mentions' | 'media';
  oldValue?: string;
  newValue?: string;
  position?: { start: number; end: number };
  reason?: string;
}

export interface ContentApproval {
  id: string;
  stepId: string;
  stepName: string;
  reviewerId: string;
  reviewerName: string;
  action: 'approve' | 'reject' | 'request_changes' | 'comment';
  decision: 'approved' | 'rejected' | 'needs_changes';
  comments?: string;
  criteria?: {
    brandSafety?: { passed: boolean; score: number; notes?: string };
    contentQuality?: { passed: boolean; issues: string[]; notes?: string };
    compliance?: { passed: boolean; issues: string[]; notes?: string };
    customChecks?: Array<{ id: string; name: string; passed: boolean; notes?: string }>;
  };
  suggestedChanges?: Array<{
    field: 'title' | 'body' | 'hashtags' | 'mentions';
    suggestion: string;
    reason: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  timeSpent?: number; // minutes spent on review
  createdAt: Date;
}

export interface ApprovalComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  type: 'general' | 'suggestion' | 'question' | 'concern' | 'praise';
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  mentions: string[];
  attachments?: Array<{
    type: 'image' | 'document' | 'link';
    url: string;
    name: string;
  }>;
  createdAt: Date;
}

const CreateApprovalRequestSchema = z.object({
  contentPieceId: z.string(),
  workflowId: z.string(),
  organizationId: z.string(),
  submitterId: z.string(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  deadline: z.date().optional(),
  metadata: z.object({
    platform: z.string(),
    contentType: z.string(),
    requestReason: z.string().optional(),
    urgencyJustification: z.string().optional(),
  }),
});

const SubmitRevisionSchema = z.object({
  requestId: z.string(),
  content: z.object({
    title: z.string().optional(),
    body: z.string(),
    hashtags: z.array(z.string()),
    mentions: z.array(z.string()),
    mediaRefs: z.any().optional(),
  }),
  submissionNotes: z.string().optional(),
  submitterId: z.string(),
});

const ProcessApprovalSchema = z.object({
  requestId: z.string(),
  reviewerId: z.string(),
  action: z.enum(['approve', 'reject', 'request_changes', 'comment']),
  comments: z.string().optional(),
  suggestedChanges: z.array(z.object({
    field: z.enum(['title', 'body', 'hashtags', 'mentions']),
    suggestion: z.string(),
    reason: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
  })).optional(),
  criteria: z.object({
    brandSafety: z.object({
      passed: z.boolean(),
      score: z.number(),
      notes: z.string().optional(),
    }).optional(),
    contentQuality: z.object({
      passed: z.boolean(),
      issues: z.array(z.string()),
      notes: z.string().optional(),
    }).optional(),
    compliance: z.object({
      passed: z.boolean(),
      issues: z.array(z.string()),
      notes: z.string().optional(),
    }).optional(),
  }).optional(),
});

export class ContentApprovalService {
  constructor() {}

  async createApprovalRequest(requestData: z.infer<typeof CreateApprovalRequestSchema>): Promise<ContentApprovalRequest> {
    try {
      const validatedData = CreateApprovalRequestSchema.parse(requestData);

      // Get the workflow to validate it exists
      const workflow = await this.getWorkflowById(validatedData.workflowId);
      if (!workflow) {
        throw new ValidationError('Workflow not found', 'workflowId', validatedData.workflowId);
      }

      // Get the original content
      // In real implementation: const contentPiece = await prisma.contentPiece.findUnique({...});
      const originalContent = "Sample content for approval"; // Mock data

      const approvalRequest: ContentApprovalRequest = {
        id: `apr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...validatedData,
        currentStep: 0,
        status: 'pending',
        metadata: {
          ...validatedData.metadata,
          originalContent,
        },
        revisions: [],
        approvals: [],
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create initial revision from original content
      const initialRevision: ContentRevision = {
        id: `rev_${Date.now()}_0`,
        version: 1,
        content: {
          body: originalContent,
          hashtags: [],
          mentions: [],
        },
        changes: [],
        submitterId: validatedData.submitterId,
        submitterName: 'Content Creator', // In real implementation, fetch from user
        submissionNotes: 'Initial submission',
        createdAt: new Date(),
      };

      approvalRequest.revisions.push(initialRevision);

      // Run automated checks if enabled
      if (workflow.steps[0]?.type === 'automated_check') {
        const autoChecks = await this.runAutomatedChecks(initialRevision.content, workflow.steps[0]);
        initialRevision.autoChecks = autoChecks;

        // Auto-advance if all checks pass and configured to do so
        if (workflow.steps[0].autoAdvance && this.allChecksPass(autoChecks)) {
          approvalRequest.currentStep = 1;
        }
      }

      // Check for auto-approval conditions
      if (await this.shouldAutoApprove(approvalRequest, workflow)) {
        approvalRequest.status = 'approved';
        approvalRequest.currentStep = workflow.steps.length; // Mark as completed
      }

      // In real implementation: save to database
      // await prisma.contentApprovalRequest.create({ data: approvalRequest });

      return approvalRequest;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid approval request data', 'requestData', error.errors);
      }
      throw error;
    }
  }

  async submitRevision(revisionData: z.infer<typeof SubmitRevisionSchema>): Promise<{
    revision: ContentRevision;
    autoChecks?: ContentRevision['autoChecks'];
    nextStep?: string;
  }> {
    try {
      const validatedData = SubmitRevisionSchema.parse(revisionData);

      // Get the approval request
      const approvalRequest = await this.getApprovalRequestById(validatedData.requestId);
      if (!approvalRequest) {
        throw new ValidationError('Approval request not found', 'requestId', validatedData.requestId);
      }

      const workflow = await this.getWorkflowById(approvalRequest.workflowId);
      if (!workflow) {
        throw new ValidationError('Workflow not found', 'workflowId', approvalRequest.workflowId);
      }

      // Get the current revision to compare changes
      const currentRevision = approvalRequest.revisions[approvalRequest.revisions.length - 1];
      const changes = this.calculateContentChanges(currentRevision.content, validatedData.content);

      // Create new revision
      const newRevision: ContentRevision = {
        id: `rev_${Date.now()}_${approvalRequest.revisions.length}`,
        version: approvalRequest.revisions.length + 1,
        content: validatedData.content,
        changes,
        submitterId: validatedData.submitterId,
        submitterName: 'Content Creator', // In real implementation, fetch from user
        submissionNotes: validatedData.submissionNotes,
        createdAt: new Date(),
      };

      // Run automated checks for the new revision
      const currentStep = workflow.steps[approvalRequest.currentStep];
      if (currentStep?.type === 'automated_check') {
        const autoChecks = await this.runAutomatedChecks(newRevision.content, currentStep);
        newRevision.autoChecks = autoChecks;
      }

      // Add revision to the request
      approvalRequest.revisions.push(newRevision);
      approvalRequest.status = 'in_review';
      approvalRequest.updatedAt = new Date();

      // Determine next step
      let nextStep: string | undefined;
      if (currentStep) {
        nextStep = currentStep.name;
        if (currentStep.autoAdvance && newRevision.autoChecks && this.allChecksPass(newRevision.autoChecks)) {
          // Auto-advance to next step
          approvalRequest.currentStep += 1;
          if (approvalRequest.currentStep < workflow.steps.length) {
            nextStep = workflow.steps[approvalRequest.currentStep].name;
          }
        }
      }

      // In real implementation: update database
      // await prisma.contentApprovalRequest.update({ where: { id: validatedData.requestId }, data: approvalRequest });

      return {
        revision: newRevision,
        autoChecks: newRevision.autoChecks,
        nextStep,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid revision data', 'revisionData', error.errors);
      }
      throw error;
    }
  }

  async processApproval(approvalData: z.infer<typeof ProcessApprovalSchema>): Promise<{
    approval: ContentApproval;
    nextStep?: string;
    isComplete: boolean;
  }> {
    try {
      const validatedData = ProcessApprovalSchema.parse(approvalData);

      // Get the approval request
      const approvalRequest = await this.getApprovalRequestById(validatedData.requestId);
      if (!approvalRequest) {
        throw new ValidationError('Approval request not found', 'requestId', validatedData.requestId);
      }

      const workflow = await this.getWorkflowById(approvalRequest.workflowId);
      if (!workflow) {
        throw new ValidationError('Workflow not found', 'workflowId', approvalRequest.workflowId);
      }

      const currentStep = workflow.steps[approvalRequest.currentStep];
      if (!currentStep) {
        throw new ValidationError('Invalid workflow step', 'currentStep', approvalRequest.currentStep);
      }

      // Create approval record
      const approval: ContentApproval = {
        id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        stepId: currentStep.id,
        stepName: currentStep.name,
        reviewerId: validatedData.reviewerId,
        reviewerName: 'Reviewer Name', // In real implementation, fetch from user
        action: validatedData.action,
        decision: this.mapActionToDecision(validatedData.action),
        comments: validatedData.comments,
        criteria: validatedData.criteria,
        suggestedChanges: validatedData.suggestedChanges,
        createdAt: new Date(),
      };

      // Add approval to the request
      approvalRequest.approvals.push(approval);

      // Update request status and determine next steps
      let nextStep: string | undefined;
      let isComplete = false;

      switch (approval.decision) {
        case 'approved':
          // Check if all required approvals for this step are complete
          if (this.isStepComplete(currentStep, approvalRequest.approvals)) {
            approvalRequest.currentStep += 1;
            
            if (approvalRequest.currentStep >= workflow.steps.length) {
              // Workflow complete
              approvalRequest.status = 'approved';
              isComplete = true;
            } else {
              // Move to next step
              nextStep = workflow.steps[approvalRequest.currentStep].name;
              approvalRequest.status = 'in_review';
            }
          }
          break;

        case 'rejected':
          approvalRequest.status = 'rejected';
          isComplete = true;
          break;

        case 'needs_changes':
          approvalRequest.status = 'needs_changes';
          // Stay on current step, waiting for revision
          break;
      }

      approvalRequest.updatedAt = new Date();

      // In real implementation: update database
      // await prisma.contentApprovalRequest.update({ where: { id: validatedData.requestId }, data: approvalRequest });

      return {
        approval,
        nextStep,
        isComplete,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid approval data', 'approvalData', error.errors);
      }
      throw error;
    }
  }

  async addComment(requestId: string, authorId: string, comment: Partial<ApprovalComment>): Promise<ApprovalComment> {
    const approvalRequest = await this.getApprovalRequestById(requestId);
    if (!approvalRequest) {
      throw new ValidationError('Approval request not found', 'requestId', requestId);
    }

    const newComment: ApprovalComment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      authorId,
      authorName: 'Comment Author', // In real implementation, fetch from user
      content: comment.content || '',
      type: comment.type || 'general',
      isResolved: false,
      mentions: comment.mentions || [],
      attachments: comment.attachments || [],
      createdAt: new Date(),
    };

    approvalRequest.comments.push(newComment);
    approvalRequest.updatedAt = new Date();

    // In real implementation: update database

    return newComment;
  }

  async getApprovalRequestById(id: string): Promise<ContentApprovalRequest | null> {
    // In real implementation: fetch from database
    // return await prisma.contentApprovalRequest.findUnique({ where: { id } });
    return null; // Mock implementation
  }

  async getApprovalRequests(filters: {
    organizationId: string;
    status?: ContentApprovalRequest['status'];
    assignedTo?: string;
    priority?: ContentApprovalRequest['priority'];
    page?: number;
    limit?: number;
  }): Promise<{
    requests: ContentApprovalRequest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    // In real implementation: fetch from database with filters
    return {
      requests: [],
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 10,
        total: 0,
        totalPages: 0,
      },
    };
  }

  async getWorkflowById(id: string): Promise<ApprovalWorkflow | null> {
    // Return a default workflow for now
    const defaultWorkflow: ApprovalWorkflow = {
      id: 'wf_default',
      organizationId: 'org_123',
      name: 'Standard Content Review',
      description: 'Standard review process for all content',
      steps: [
        {
          id: 'step_auto_check',
          name: 'Automated Checks',
          type: 'automated_check',
          order: 1,
          assignees: [],
          criteria: {
            brandSafety: { required: true, threshold: 0.8, autoReject: true },
            contentQuality: { required: true, checkSpelling: true, checkGrammar: true, checkReadability: true },
            compliance: { required: true, checkLegal: true, checkIndustryRules: true, requiredApprovals: [] },
            platformOptimization: { required: true, checkCharacterLimits: true, checkHashtags: true, checkFormatting: true },
            customCriteria: [],
          },
          autoAdvance: true,
          parallel: false,
        },
        {
          id: 'step_content_review',
          name: 'Content Review',
          type: 'review',
          order: 2,
          assignees: [
            {
              type: 'role',
              id: 'content_manager',
              name: 'Content Manager',
              canApprove: true,
              canReject: true,
              canRequestChanges: true,
              canComment: true,
            },
          ],
          criteria: {
            brandSafety: { required: false, threshold: 0.8, autoReject: false },
            contentQuality: { required: true, checkSpelling: true, checkGrammar: true, checkReadability: true },
            compliance: { required: true, checkLegal: false, checkIndustryRules: false, requiredApprovals: [] },
            platformOptimization: { required: true, checkCharacterLimits: true, checkHashtags: true, checkFormatting: true },
            customCriteria: [],
          },
          autoAdvance: false,
          timeout: { hours: 24, action: 'notify' },
          parallel: false,
        },
        {
          id: 'step_final_approval',
          name: 'Final Approval',
          type: 'final_approval',
          order: 3,
          assignees: [
            {
              type: 'role',
              id: 'marketing_director',
              name: 'Marketing Director',
              canApprove: true,
              canReject: true,
              canRequestChanges: true,
              canComment: true,
            },
          ],
          criteria: {
            brandSafety: { required: false, threshold: 0.8, autoReject: false },
            contentQuality: { required: false, checkSpelling: false, checkGrammar: false, checkReadability: false },
            compliance: { required: false, checkLegal: false, checkIndustryRules: false, requiredApprovals: [] },
            platformOptimization: { required: false, checkCharacterLimits: false, checkHashtags: false, checkFormatting: false },
            customCriteria: [],
          },
          autoAdvance: false,
          parallel: false,
        },
      ],
      rules: {
        autoApprovalConditions: {
          enabled: true,
          conditions: [
            { type: 'brand_safety_score', operator: 'gte', value: 0.9 },
            { type: 'content_template', operator: 'eq', value: 'approved_template' },
          ],
          requiresAll: true,
        },
        escalationRules: [],
        notificationSettings: {
          notifyOnSubmission: true,
          notifyOnApproval: true,
          notifyOnRejection: true,
          notifyOnTimeout: true,
          channels: ['email'],
        },
      },
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    return id === 'wf_default' ? defaultWorkflow : null;
  }

  private async runAutomatedChecks(content: any, step: ApprovalStep): Promise<ContentRevision['autoChecks']> {
    const checks: ContentRevision['autoChecks'] = {
      brandSafety: { passed: true, score: 0.95, issues: [] },
      contentQuality: { passed: true, issues: [] },
      platformOptimization: { passed: true, issues: [] },
      compliance: { passed: true, issues: [] },
    };

    // Mock automated checks
    if (step.criteria.brandSafety.required) {
      // Simulate brand safety check
      if (content.body.toLowerCase().includes('controversial')) {
        checks.brandSafety.passed = false;
        checks.brandSafety.score = 0.3;
        checks.brandSafety.issues.push('Content contains potentially controversial language');
      }
    }

    if (step.criteria.contentQuality.required) {
      // Simulate content quality checks
      if (content.body.length < 10) {
        checks.contentQuality.passed = false;
        checks.contentQuality.issues.push('Content is too short');
      }
    }

    if (step.criteria.platformOptimization.required) {
      // Simulate platform optimization checks
      if (content.body.length > 280) {
        checks.platformOptimization.passed = false;
        checks.platformOptimization.issues.push('Content exceeds character limit for Twitter');
      }
    }

    return checks;
  }

  private allChecksPass(autoChecks: ContentRevision['autoChecks']): boolean {
    if (!autoChecks) return false;
    
    return autoChecks.brandSafety.passed &&
           autoChecks.contentQuality.passed &&
           autoChecks.platformOptimization.passed &&
           autoChecks.compliance.passed;
  }

  private async shouldAutoApprove(request: ContentApprovalRequest, workflow: ApprovalWorkflow): Promise<boolean> {
    const conditions = workflow.rules.autoApprovalConditions;
    if (!conditions.enabled) return false;

    const results = await Promise.all(
      conditions.conditions.map(async (condition) => {
        // Implement condition checking logic here
        switch (condition.type) {
          case 'brand_safety_score':
            // Check if brand safety score meets threshold
            return true; // Mock implementation
          case 'content_template':
            // Check if content uses approved template
            return true; // Mock implementation
          default:
            return false;
        }
      })
    );

    return conditions.requiresAll ? results.every(Boolean) : results.some(Boolean);
  }

  private calculateContentChanges(oldContent: any, newContent: any): RevisionChange[] {
    const changes: RevisionChange[] = [];

    // Simple change detection - in real implementation, use a proper diff algorithm
    if (oldContent.body !== newContent.body) {
      changes.push({
        type: 'modification',
        field: 'body',
        oldValue: oldContent.body,
        newValue: newContent.body,
      });
    }

    if (JSON.stringify(oldContent.hashtags) !== JSON.stringify(newContent.hashtags)) {
      changes.push({
        type: 'modification',
        field: 'hashtags',
        oldValue: JSON.stringify(oldContent.hashtags),
        newValue: JSON.stringify(newContent.hashtags),
      });
    }

    return changes;
  }

  private mapActionToDecision(action: string): ContentApproval['decision'] {
    switch (action) {
      case 'approve':
        return 'approved';
      case 'reject':
        return 'rejected';
      case 'request_changes':
        return 'needs_changes';
      default:
        return 'needs_changes';
    }
  }

  private isStepComplete(step: ApprovalStep, approvals: ContentApproval[]): boolean {
    const stepApprovals = approvals.filter(a => a.stepId === step.id);
    
    if (step.parallel) {
      // For parallel steps, need approval from all assignees
      return step.assignees.every(assignee =>
        stepApprovals.some(approval =>
          approval.reviewerId === assignee.id && approval.decision === 'approved'
        )
      );
    } else {
      // For sequential steps, need at least one approval
      return stepApprovals.some(approval => approval.decision === 'approved');
    }
  }
}

export const contentApprovalService = new ContentApprovalService();
