import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileCheck2,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Vote,
  X,
  XCircle
} from "lucide-react";

import {
  approveModerationProposal,
  getModerationProposal,
  getModerationProposals,
  rejectModerationProposal
} from "../../services/admin/adminModerationDecision.service";

import "./AdminModerationDecisionPage.css";


function AdminModerationDecisionPage() {
  const [
    proposals,
    setProposals
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    refreshing,
    setRefreshing
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");

  const [
    success,
    setSuccess
  ] = useState("");

  const [
    search,
    setSearch
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter
  ] = useState("pending");

  const [
    actionFilter,
    setActionFilter
  ] = useState("");

  const [
    expandedId,
    setExpandedId
  ] = useState(null);

  const [
    proposalDetails,
    setProposalDetails
  ] = useState({});

  const [
    detailsLoadingId,
    setDetailsLoadingId
  ] = useState(null);

  const [
    votingId,
    setVotingId
  ] = useState(null);


  const loadProposals =
    useCallback(
      async ({
        silent = false
      } = {}) => {
        try {
          if (silent) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const response =
            await getModerationProposals({
              status:
                statusFilter ||
                undefined,

              actionType:
                actionFilter ||
                undefined,

              limit: 50,
              offset: 0
            });

          setProposals(
            response?.proposals ||
            []
          );

        } catch (err) {
          setError(
            err?.response?.data?.message ||
            "Unable to load moderation decisions."
          );

        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        statusFilter,
        actionFilter
      ]
    );


  useEffect(() => {
    loadProposals();
  }, [loadProposals]);


  const visibleProposals =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return proposals;
      }

      return proposals.filter(
        (proposal) => {
          const values = [
            proposal.target_username,
            proposal.target_email,
            proposal.requester_username,
            proposal.reason,
            proposal.action_type,
            proposal.status,
            proposal.proposal_id
          ];

          return values.some(
            (value) =>
              String(
                value || ""
              )
                .toLowerCase()
                .includes(query)
          );
        }
      );
    }, [
      proposals,
      search
    ]);


  const pendingCount =
    proposals.filter(
      (proposal) =>
        proposal.status ===
        "pending"
    ).length;

  const executedCount =
    proposals.filter(
      (proposal) =>
        proposal.status ===
        "executed"
    ).length;

  const rejectedCount =
    proposals.filter(
      (proposal) =>
        proposal.status ===
        "rejected"
    ).length;


  async function handleToggleProposal(
    proposalId
  ) {
    if (
      expandedId ===
      proposalId
    ) {
      setExpandedId(null);
      return;
    }

    setExpandedId(
      proposalId
    );

    if (
      proposalDetails[
        proposalId
      ]
    ) {
      return;
    }

    try {
      setDetailsLoadingId(
        proposalId
      );

      setError("");

      const response =
        await getModerationProposal(
          proposalId
        );

      setProposalDetails(
        (current) => ({
          ...current,

          [proposalId]:
            response
        })
      );

    } catch (err) {
      setError(
        err?.response?.data?.message ||
        "Unable to load proposal details."
      );

    } finally {
      setDetailsLoadingId(
        null
      );
    }
  }


  async function refreshOneProposal(
    proposalId
  ) {
    const response =
      await getModerationProposal(
        proposalId
      );

    setProposalDetails(
      (current) => ({
        ...current,

        [proposalId]:
          response
      })
    );

    await loadProposals({
      silent: true
    });
  }


  async function handleVote(
    proposalId,
    decision
  ) {
    try {
      setVotingId(
        proposalId
      );

      setError("");
      setSuccess("");

      let response;

      if (
        decision ===
        "approve"
      ) {
        response =
          await approveModerationProposal(
            proposalId
          );
      } else {
        response =
          await rejectModerationProposal(
            proposalId
          );
      }

      setSuccess(
        response?.message ||
        (
          decision ===
          "approve"
            ? "Approval recorded successfully."
            : "Rejection recorded successfully."
        )
      );

      await refreshOneProposal(
        proposalId
      );

    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Unable to record your vote."
      );

    } finally {
      setVotingId(null);
    }
  }


  return (
    <main className="admin-decision-page">

      <div className="admin-decision-container">

        <header className="admin-decision-header">

          <div>
            <span className="admin-decision-eyebrow">
              MODERATION GOVERNANCE
            </span>

            <h1>
              Decision Center
            </h1>

            <p>
              Review long suspensions
              and permanent-ban proposals
              requiring administrator
              majority approval.
            </p>
          </div>


          <button
            type="button"
            className="admin-decision-refresh"
            onClick={() =>
              loadProposals({
                silent: true
              })
            }
            disabled={
              refreshing
            }
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "admin-decision-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </header>


        {error && (
          <div
            className="admin-decision-error"
            role="alert"
          >
            <AlertTriangle
              size={17}
            />

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              <X size={15} />
            </button>
          </div>
        )}


        {success && (
          <div className="admin-decision-success">

            <CheckCircle2
              size={17}
            />

            <span>
              {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
            >
              <X size={15} />
            </button>

          </div>
        )}


        <section className="admin-decision-stats">

          <DecisionStat
            label="Loaded Proposals"
            value={
              proposals.length
            }
            icon={FileCheck2}
          />

          <DecisionStat
            label="Pending"
            value={pendingCount}
            icon={Vote}
          />

          <DecisionStat
            label="Executed"
            value={executedCount}
            icon={ShieldCheck}
          />

          <DecisionStat
            label="Rejected"
            value={rejectedCount}
            icon={XCircle}
          />

        </section>


        <section className="admin-decision-toolbar">

          <div className="admin-decision-search">

            <Search size={16} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search user, admin, reason..."
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}

          </div>


          <div className="admin-decision-filters">

            <select
              value={
                statusFilter
              }
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All statuses
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="executed">
                Executed
              </option>

              <option value="rejected">
                Rejected
              </option>

              <option value="cancelled">
                Cancelled
              </option>
            </select>


            <select
              value={
                actionFilter
              }
              onChange={(event) =>
                setActionFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All actions
              </option>

              <option value="long_suspension">
                Long Suspension
              </option>

              <option value="permanent_ban">
                Permanent Ban
              </option>
            </select>

          </div>

        </section>


        <section className="admin-decision-panel">

          <div className="admin-decision-panel-header">

            <div>
              <h2>
                Moderation Proposals
              </h2>

              <p>
                {
                  visibleProposals
                    .length
                }
                {" "}
                {
                  visibleProposals
                    .length === 1
                    ? "proposal"
                    : "proposals"
                }
              </p>
            </div>

          </div>


          {loading ? (
            <div className="admin-decision-state">

              <LoaderCircle
                size={29}
                className="admin-decision-spin"
              />

              <p>
                Loading moderation
                proposals...
              </p>

            </div>
          ) : visibleProposals.length ===
            0 ? (
            <div className="admin-decision-state">

              <Vote size={31} />

              <h3>
                No proposals found
              </h3>

              <p>
                There are no moderation
                proposals matching the
                current filters.
              </p>

            </div>
          ) : (
            <div className="admin-decision-list">

              {visibleProposals.map(
                (proposal) => (
                  <ProposalCard
                    key={
                      proposal.proposal_id
                    }
                    proposal={
                      proposal
                    }
                    expanded={
                      expandedId ===
                      proposal.proposal_id
                    }
                    details={
                      proposalDetails[
                        proposal
                          .proposal_id
                      ]
                    }
                    detailsLoading={
                      detailsLoadingId ===
                      proposal.proposal_id
                    }
                    voting={
                      votingId ===
                      proposal.proposal_id
                    }
                    onToggle={() =>
                      handleToggleProposal(
                        proposal.proposal_id
                      )
                    }
                    onApprove={() =>
                      handleVote(
                        proposal.proposal_id,
                        "approve"
                      )
                    }
                    onReject={() =>
                      handleVote(
                        proposal.proposal_id,
                        "reject"
                      )
                    }
                  />
                )
              )}

            </div>
          )}

        </section>

      </div>

    </main>
  );
}


function ProposalCard({
  proposal,
  expanded,
  details,
  detailsLoading,
  voting,
  onToggle,
  onApprove,
  onReject
}) {
  const approvalCount =
    Number(
      proposal.approval_count ||
      0
    );

  const requiredApprovals =
    Number(
      proposal.required_approvals ||
      0
    );

  const progress =
    requiredApprovals > 0
      ? Math.min(
          (
            approvalCount /
            requiredApprovals
          ) * 100,
          100
        )
      : 0;

  const fullProposal =
    details?.proposal ||
    proposal;

  const currentAdminVote =
    details?.voting
      ?.currentAdminVote ||
    null;

  const votes =
    details?.votes ||
    [];

  const isPending =
    proposal.status ===
    "pending";

  const isLongSuspension =
    proposal.action_type ===
    "long_suspension";


  return (
    <article className="admin-decision-card">

      <div className="admin-decision-card-main">

        <div
          className={
            isLongSuspension
              ? "admin-decision-card-icon admin-decision-card-icon-suspension"
              : "admin-decision-card-icon admin-decision-card-icon-ban"
          }
        >
          {isLongSuspension ? (
            <Clock3 size={19} />
          ) : (
            <Ban size={19} />
          )}
        </div>


        <div className="admin-decision-card-content">

          <div className="admin-decision-card-heading">

            <div>

              <div className="admin-decision-title-line">

                <strong>
                  {isLongSuspension
                    ? "Long Suspension"
                    : "Permanent Ban"}
                </strong>

                <StatusBadge
                  status={
                    proposal.status
                  }
                />

              </div>


              <div className="admin-decision-target">

                <UserRound
                  size={14}
                />

                <span>
                  {proposal.target_username ||
                    "Unknown user"}
                </span>

                {proposal.target_email && (
                  <small>
                    {
                      proposal
                        .target_email
                    }
                  </small>
                )}

              </div>

            </div>


            <button
              type="button"
              className="admin-decision-expand"
              onClick={
                onToggle
              }
              aria-label={
                expanded
                  ? "Collapse proposal"
                  : "Expand proposal"
              }
            >
              {expanded ? (
                <ChevronUp
                  size={18}
                />
              ) : (
                <ChevronDown
                  size={18}
                />
              )}
            </button>

          </div>


          <p className="admin-decision-reason">
            {proposal.reason}
          </p>


          <div className="admin-decision-requester">

            <ShieldCheck
              size={13}
            />

            Requested by{" "}

            <strong>
              {proposal.requester_username ||
                "Administrator"}
            </strong>

          </div>


          <div className="admin-decision-progress">

            <div className="admin-decision-progress-top">

              <span>
                Majority Approval
              </span>

              <strong>
                {approvalCount}
                {" / "}
                {requiredApprovals}
              </strong>

            </div>


            <div className="admin-decision-progress-track">

              <span
                style={{
                  width:
                    `${progress}%`
                }}
              />

            </div>

          </div>


          <div className="admin-decision-meta">

            {isLongSuspension && (
              <span>
                <Clock3 size={13} />

                {formatDuration(
                  proposal
                    .requested_duration_minutes
                )}
              </span>
            )}

            <span>
              Created{" "}
              {formatDateTime(
                proposal.created_at
              )}
            </span>

          </div>


          {expanded && (
            <div className="admin-decision-expanded">

              {detailsLoading ? (
                <div className="admin-decision-details-loading">

                  <LoaderCircle
                    size={22}
                    className="admin-decision-spin"
                  />

                  Loading proposal
                  details...

                </div>
              ) : (
                <>
                  <div className="admin-decision-detail-grid">

                    <DecisionDetail
                      label="Proposal ID"
                      value={
                        fullProposal
                          .proposal_id
                      }
                    />

                    <DecisionDetail
                      label="Target User"
                      value={
                        fullProposal
                          .target_username ||
                        "Unknown"
                      }
                    />

                    <DecisionDetail
                      label="Action"
                      value={
                        formatLabel(
                          fullProposal
                            .action_type
                        )
                      }
                    />

                    <DecisionDetail
                      label="Status"
                      value={
                        formatLabel(
                          fullProposal
                            .status
                        )
                      }
                    />

                    <DecisionDetail
                      label="Active Admins"
                      value={
                        fullProposal
                          .admin_count_snapshot
                      }
                    />

                    <DecisionDetail
                      label="Required Approvals"
                      value={
                        fullProposal
                          .required_approvals
                      }
                    />

                    {isLongSuspension && (
                      <DecisionDetail
                        label="Requested Duration"
                        value={
                          formatDuration(
                            fullProposal
                              .requested_duration_minutes
                          )
                        }
                      />
                    )}

                    {isLongSuspension && (
                      <DecisionDetail
                        label="Requested End"
                        value={
                          formatDateTime(
                            fullProposal
                              .requested_expires_at
                          )
                        }
                      />
                    )}

                  </div>


                  <div className="admin-decision-reason-box">

                    <span>
                      Moderation Reason
                    </span>

                    <p>
                      {
                        fullProposal
                          .reason
                      }
                    </p>

                  </div>


                  <div className="admin-decision-signatures">

                    <div className="admin-decision-signatures-header">

                      <div>
                        <h3>
                          Digital Signatures
                        </h3>

                        <p>
                          Each administrator
                          may sign this
                          proposal once.
                        </p>
                      </div>


                      <span>
                        {votes.length}
                        {" "}
                        signed
                      </span>

                    </div>


                    {votes.length ===
                      0 ? (
                      <div className="admin-decision-no-votes">
                        No signatures
                        recorded.
                      </div>
                    ) : (
                      <div className="admin-decision-vote-list">

                        {votes.map(
                          (vote) => (
                            <VoteItem
                              key={
                                vote.vote_id
                              }
                              vote={vote}
                            />
                          )
                        )}

                      </div>
                    )}

                  </div>


                  {currentAdminVote && (
                    <div className="admin-decision-own-vote">

                      <ShieldCheck
                        size={16}
                      />

                      <span>
                        You already{" "}
                        <strong>
                          {
                            currentAdminVote
                              .decision ===
                            "approve"
                              ? "approved"
                              : "rejected"
                          }
                        </strong>
                        {" "}
                        this proposal.
                      </span>

                    </div>
                  )}


                  {isPending &&
                    !currentAdminVote && (
                    <div className="admin-decision-vote-actions">

                      <button
                        type="button"
                        className="admin-decision-reject"
                        onClick={
                          onReject
                        }
                        disabled={
                          voting
                        }
                      >
                        {voting ? (
                          <LoaderCircle
                            size={17}
                            className="admin-decision-spin"
                          />
                        ) : (
                          <XCircle
                            size={17}
                          />
                        )}

                        Reject & Sign
                      </button>


                      <button
                        type="button"
                        className="admin-decision-approve"
                        onClick={
                          onApprove
                        }
                        disabled={
                          voting
                        }
                      >
                        {voting ? (
                          <LoaderCircle
                            size={17}
                            className="admin-decision-spin"
                          />
                        ) : (
                          <ShieldCheck
                            size={17}
                          />
                        )}

                        Approve & Sign
                      </button>

                    </div>
                  )}


                  {!isPending && (
                    <div className="admin-decision-final-state">

                      {proposal.status ===
                      "executed" ? (
                        <CheckCircle2
                          size={17}
                        />
                      ) : (
                        <ShieldAlert
                          size={17}
                        />
                      )}

                      <span>
                        This proposal is{" "}
                        <strong>
                          {formatLabel(
                            proposal.status
                          )}
                        </strong>
                        {" "}
                        and can no longer
                        receive votes.
                      </span>

                    </div>
                  )}

                </>
              )}

            </div>
          )}

        </div>

      </div>

    </article>
  );
}


function VoteItem({
  vote
}) {
  const approved =
    vote.decision ===
    "approve";

  return (
    <div className="admin-decision-vote-item">

      <div
        className={
          approved
            ? "admin-decision-vote-icon admin-decision-vote-icon-approved"
            : "admin-decision-vote-icon admin-decision-vote-icon-rejected"
        }
      >
        {approved ? (
          <CheckCircle2
            size={15}
          />
        ) : (
          <XCircle
            size={15}
          />
        )}
      </div>


      <div>

        <strong>
          {vote.admin_username ||
            "Administrator"}
        </strong>

        <span>
          {approved
            ? "Approved & signed"
            : "Rejected & signed"}
        </span>

      </div>


      <small>
        {formatDateTime(
          vote.signed_at
        )}
      </small>

    </div>
  );
}


function DecisionStat({
  label,
  value,
  icon: Icon
}) {
  return (
    <article className="admin-decision-stat">

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>


      <div className="admin-decision-stat-icon">
        <Icon size={19} />
      </div>

    </article>
  );
}


function DecisionDetail({
  label,
  value
}) {
  return (
    <div className="admin-decision-detail">

      <span>
        {label}
      </span>

      <strong>
        {value ?? "—"}
      </strong>

    </div>
  );
}


function StatusBadge({
  status
}) {
  return (
    <span
      className={
        `admin-decision-status admin-decision-status-${status}`
      }
    >
      {formatLabel(
        status
      )}
    </span>
  );
}


function formatDuration(
  minutes
) {
  const value =
    Number(minutes);

  if (
    !Number.isFinite(
      value
    ) ||
    value <= 0
  ) {
    return "—";
  }

  const days =
    value / 1440;

  if (
    Number.isInteger(days)
  ) {
    if (days === 1) {
      return "1 day";
    }

    if (
      days === 365
    ) {
      return "1 year";
    }

    return `${days} days`;
  }

  const hours =
    value / 60;

  if (
    Number.isInteger(hours)
  ) {
    return `${hours} hours`;
  }

  return `${value} minutes`;
}


function formatLabel(
  value
) {
  if (!value) {
    return "Unknown";
  }

  return String(value)
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      (character) =>
        character
          .toUpperCase()
    );
}


function formatDateTime(
  value
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(date);
}


export default AdminModerationDecisionPage;