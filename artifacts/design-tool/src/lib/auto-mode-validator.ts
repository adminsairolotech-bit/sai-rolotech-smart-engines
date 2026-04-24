/**
 * Auto Mode Rules Enforcer
 * Validates each step before proceeding to next
 * Rule: 4.7 runs → check 4.6 completed → then move to 4.8
 */

export interface ValidationResult {
  valid: boolean;
  checkedItems: string[];
  failedItems: string[];
  warnings: string[];
}

export interface StepRules {
  stepId: string;
  stepName: string;
  requiredChecks: string[];
}

export const AUTO_MODE_STEPS: StepRules[] = [
  {
    stepId: "4.6",
    stepName: "Pre-Analysis Complete",
    requiredChecks: [
      "profile-loaded",
      "context-understood",
      "dependencies-identified",
      "no-errors-in-output"
    ]
  },
  {
    stepId: "4.7",
    stepName: "Smart Analysis",
    requiredChecks: [
      "analysis-started",
      "data-processed",
      "insights-generated",
      "no-errors-in-output"
    ]
  },
  {
    stepId: "4.8",
    stepName: "Design Check",
    requiredChecks: [
      "design-validated",
      "constraints-checked",
      "feasibility-confirmed",
      "no-errors-in-output"
    ]
  }
];

export class AutoModeValidator {
  private stepHistory: Map<string, ValidationResult> = new Map();
  private currentStep: string = "4.6";

  /**
   * Run validation for current step before moving to next
   */
  validateStep(stepId: string, results: Record<string, boolean>): ValidationResult {
    const step = AUTO_MODE_STEPS.find(s => s.stepId === stepId);
    if (!step) {
      return {
        valid: false,
        checkedItems: [],
        failedItems: ["unknown-step"],
        warnings: [`Step ${stepId} not found in rules`]
      };
    }

    const checkedItems: string[] = [];
    const failedItems: string[] = [];
    const warnings: string[] = [];

    // Run each required check
    for (const check of step.requiredChecks) {
      checkedItems.push(check);

      if (results[check] === undefined) {
        warnings.push(`Check "${check}" not provided - assuming FAILED`);
        failedItems.push(check);
      } else if (results[check] === false) {
        failedItems.push(check);
      }
      // true = passed
    }

    const result: ValidationResult = {
      valid: failedItems.length === 0,
      checkedItems,
      failedItems,
      warnings
    };

    // Store result
    this.stepHistory.set(stepId, result);

    return result;
  }

  /**
   * Check if can proceed to next step
   * Rule: Previous step MUST be valid
   */
  canProceedTo(nextStepId: string): { canProceed: boolean; reason: string } {
    // Find previous step
    const stepIndex = AUTO_MODE_STEPS.findIndex(s => s.stepId === nextStepId);
    if (stepIndex <= 0) {
      return { canProceed: true, reason: "First step - no previous validation needed" };
    }

    const prevStep = AUTO_MODE_STEPS[stepIndex - 1];
    const prevResult = this.stepHistory.get(prevStep.stepId);

    if (!prevResult) {
      return {
        canProceed: false,
        reason: `Step ${prevStep.stepId} (${prevStep.stepName}) not validated yet - MUST validate before proceeding`
      };
    }

    if (!prevResult.valid) {
      return {
        canProceed: false,
        reason: `Step ${prevStep.stepId} FAILED: ${prevResult.failedItems.join(", ")} - fix before proceeding to ${nextStepId}`
      };
    }

    return {
      canProceed: true,
      reason: `Step ${prevStep.stepId} validated ✓ - proceeding to ${nextStepId}`
    };
  }

  /**
   * Get validation status for all steps
   */
  getStatus(): Record<string, { valid: boolean; checkedItems: number; failedItems: string[] }> {
    const status: Record<string, any> = {};

    for (const step of AUTO_MODE_STEPS) {
      const result = this.stepHistory.get(step.stepId);
      if (result) {
        status[step.stepId] = {
          valid: result.valid,
          checkedItems: result.checkedItems.length,
          failedItems: result.failedItems
        };
      } else {
        status[step.stepId] = { valid: null, checkedItems: 0, failedItems: [] };
      }
    }

    return status;
  }

  /**
   * Reset validator for new session
   */
  reset() {
    this.stepHistory.clear();
    this.currentStep = "4.6";
  }
}

// Singleton instance
export const autoModeValidator = new AutoModeValidator();

/**
 * Usage Example:
 *
 * const validator = new AutoModeValidator();
 *
 * // Step 4.6 validation
 * const result46 = validator.validateStep("4.6", {
 *   "profile-loaded": true,
 *   "context-understood": true,
 *   "dependencies-identified": true,
 *   "no-errors-in-output": true
 * });
 * console.log("4.6 valid:", result46.valid);
 *
 * // Check if can proceed to 4.7
 * const canProceed = validator.canProceedTo("4.7");
 * console.log("Can proceed:", canProceed);
 *
 * // Step 4.7 validation
 * const result47 = validator.validateStep("4.7", {
 *   "analysis-started": true,
 *   "data-processed": true,
 *   "insights-generated": true,
 *   "no-errors-in-output": true
 * });
 * console.log("4.7 valid:", result47.valid);
 */
