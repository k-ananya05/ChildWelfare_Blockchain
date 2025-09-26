'use strict';

// State transitions for domain operations
class StateManager {
    constructor() {
        this.cases = new Map(); // caseId -> { status, records, flags, accessControl }
        this.sequence = 0;
    }

    getNextSequence() {
        return ++this.sequence;
    }

    applyStateTransition(tx) {
        const { action, childRecordId, data } = tx;
        const caseId = childRecordId;

        switch (action) {
            case 'OpenCase':
                this.cases.set(caseId, {
                    status: 'OPEN',
                    records: [],
                    flags: [],
                    accessControl: new Set([tx.from]),
                    createdAt: Date.now()
                });
                break;

            case 'UploadWelfareRecord':
                const case_ = this.cases.get(caseId);
                if (case_) {
                    case_.records.push({ type: 'welfare', data: data.record, timestamp: Date.now() });
                }
                break;

            case 'AddMedicalRecord':
                const case2 = this.cases.get(caseId);
                if (case2) {
                    case2.records.push({ type: 'medical', data: data.record, timestamp: Date.now() });
                }
                break;

            case 'ValidateCase':
                const case3 = this.cases.get(caseId);
                if (case3) {
                    case3.status = data.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
                    case3.validatedBy = tx.from;
                    case3.validatedAt = Date.now();
                }
                break;

            case 'CloseCase':
                const case4 = this.cases.get(caseId);
                if (case4) {
                    case4.status = 'CLOSED';
                    case4.closedBy = tx.from;
                    case4.closedAt = Date.now();
                }
                break;

            case 'FlagCase':
                const case5 = this.cases.get(caseId);
                if (case5) {
                    case5.flags.push({ reason: data.reason, flaggedBy: tx.from, timestamp: Date.now() });
                }
                break;

            case 'FreezeCase':
                const case6 = this.cases.get(caseId);
                if (case6) {
                    case6.status = 'FROZEN';
                    case6.frozenBy = tx.from;
                    case6.frozenAt = Date.now();
                }
                break;

            case 'UnfreezeCase':
                const case7 = this.cases.get(caseId);
                if (case7) {
                    case7.status = 'OPEN';
                    case7.unfrozenBy = tx.from;
                    case7.unfrozenAt = Date.now();
                }
                break;

            case 'GrantRole':
                const case8 = this.cases.get(caseId);
                if (case8 && case8.accessControl) {
                    case8.accessControl.add(data.grantTo);
                }
                break;

            case 'RevokeRole':
                const case9 = this.cases.get(caseId);
                if (case9 && case9.accessControl) {
                    case9.accessControl.delete(data.revokeFrom);
                }
                break;
        }
    }

    getCase(caseId) {
        return this.cases.get(caseId);
    }

    getAllCases() {
        return Array.from(this.cases.entries()).map(([id, data]) => ({ id, ...data }));
    }
}

module.exports = { StateManager };
