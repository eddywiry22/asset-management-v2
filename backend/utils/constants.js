/**
 * Movement statuses that indicate a movement is not yet finalized or rejected.
 * Used in user/location deactivation guards and related business logic.
 */
const ACTIVE_MOVEMENT_STATUSES = [
  'PENDING_HEAD_APPROVAL',
  'PENDING_DESTINATION_APPROVAL',
  'APPROVED_READY_FOR_FINALIZATION',
];

module.exports = { ACTIVE_MOVEMENT_STATUSES };
