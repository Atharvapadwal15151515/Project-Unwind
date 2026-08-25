import api from "../../services/api";


/*
|--------------------------------------------------------------------------
| Get Moderation Proposals
|--------------------------------------------------------------------------
|
| Optional filters:
| status
| actionType
| limit
| offset
|
*/

export async function getModerationProposals({
  status,
  actionType,
  limit = 50,
  offset = 0
} = {}) {
  const params = {
    limit,
    offset
  };

  if (status) {
    params.status =
      status;
  }

  if (actionType) {
    params.actionType =
      actionType;
  }


  const response =
    await api.get(
      "/admin/moderation-decisions",
      {
        params
      }
    );


  return response.data;
}


/*
|--------------------------------------------------------------------------
| Get One Moderation Proposal
|--------------------------------------------------------------------------
*/

export async function getModerationProposal(
  proposalId
) {
  if (!proposalId) {
    throw new Error(
      "Proposal ID is required"
    );
  }


  const response =
    await api.get(
      `/admin/moderation-decisions/${proposalId}`
    );


  return response.data;
}


/*
|--------------------------------------------------------------------------
| Create Long Suspension Proposal
|--------------------------------------------------------------------------
|
| Normally the existing moderation service will create this through the
| Suspend Account form.
|
| This function is available for the Decision Center if needed later.
|
*/

export async function createLongSuspensionProposal(
  userId,
  {
    reason,
    durationMinutes
  }
) {
  const response =
    await api.post(
      `/admin/moderation-decisions/users/${userId}/suspension`,
      {
        reason,
        durationMinutes
      }
    );


  return response.data;
}


/*
|--------------------------------------------------------------------------
| Create Permanent Ban Proposal
|--------------------------------------------------------------------------
*/

export async function createPermanentBanProposal(
  userId,
  reason
) {
  const response =
    await api.post(
      `/admin/moderation-decisions/users/${userId}/ban`,
      {
        reason
      }
    );


  return response.data;
}


/*
|--------------------------------------------------------------------------
| Approve + Digitally Sign Proposal
|--------------------------------------------------------------------------
*/

export async function approveModerationProposal(
  proposalId
) {
  if (!proposalId) {
    throw new Error(
      "Proposal ID is required"
    );
  }


  const response =
    await api.post(
      `/admin/moderation-decisions/${proposalId}/approve`
    );


  return response.data;
}


/*
|--------------------------------------------------------------------------
| Reject + Digitally Sign Proposal
|--------------------------------------------------------------------------
*/

export async function rejectModerationProposal(
  proposalId
) {
  if (!proposalId) {
    throw new Error(
      "Proposal ID is required"
    );
  }


  const response =
    await api.post(
      `/admin/moderation-decisions/${proposalId}/reject`
    );


  return response.data;
}