import pool from "../../config/database.js";

export async function getLandingStats() {
  const query = `
    SELECT
      (
        SELECT COUNT(*)
        FROM users
        WHERE account_status = 'active'
      ) AS total_members,

      (
        SELECT COUNT(*)
        FROM community_posts
      ) AS community_conversations,

      (
        SELECT COUNT(*)
        FROM testimonials
      ) AS shared_experiences,

      (
        SELECT COALESCE(
          ROUND(AVG(rating)::numeric, 1),
          0
        )
        FROM testimonials
      ) AS community_rating
  `;

  const result =
    await pool.query(query);

  const stats =
    result.rows[0];

  return {
    totalMembers:
      Number(stats.total_members) || 0,

    communityConversations:
      Number(
        stats.community_conversations
      ) || 0,

    sharedExperiences:
      Number(
        stats.shared_experiences
      ) || 0,

    communityRating:
      Number(
        stats.community_rating
      ) || 0
  };
}