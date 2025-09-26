'use strict';

// Domain roles and actions
const ROLE_ACTIONS = {
    NGO: ['OpenCase', 'UploadWelfareRecord'],
    Government: ['ValidateCase', 'CloseCase', 'FlagCase'],
    Hospital: ['AddMedicalRecord'],
    Auditor: ['AuditCheck', 'FlagCase'],
    Admin: ['GrantRole', 'RevokeRole', 'FreezeCase', 'UnfreezeCase']
};

// Normalize incoming identifiers
function parseRole(fromField) {
    // Expects strings like: 'NGO_Alpha', 'Government_Alpha', etc.
    if (!fromField) return '';
    return String(fromField).split('_')[0];
}

function isActionAllowed(role, action) {
    const actions = ROLE_ACTIONS[role] || [];
    return actions.includes(action);
}

// Validate transaction according to role-based access and simple lifecycle preconditions
function validateDomainRules(tx) {
    const role = parseRole(tx.from);
    const action = tx?.data?.domainAction || tx.action || '';

    if (!isActionAllowed(role, action)) {
        return { ok: false, reason: `Role ${role} cannot perform ${action}` };
    }

    // Add lifecycle preconditions here (example checks)
    if (action === 'ValidateCase') {
        if (!['APPROVE', 'REJECT'].includes(tx?.data?.decision)) {
            return { ok: false, reason: 'ValidateCase requires decision APPROVE/REJECT' };
        }
    }

    // Example record requirements
    if (['OpenCase', 'UploadWelfareRecord', 'AddMedicalRecord'].includes(action)) {
        if (!tx?.data?.record) {
            return { ok: false, reason: `${action} requires data.record` };
        }
    }

    return { ok: true };
}

module.exports = {
    ROLE_ACTIONS,
    parseRole,
    isActionAllowed,
    validateDomainRules
};


