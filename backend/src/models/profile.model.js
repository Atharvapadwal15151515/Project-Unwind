import pool from "../config/database.js";


/*
|--------------------------------------------------------------------------
| Create Profile
|--------------------------------------------------------------------------
*/

export async function createProfile({
  userId,
  fullName,
  dateOfBirth = null,
  gender = null,
  occupationType = null,
  profileImageUrl = null,
  profileImagePublicId = null
}) {
  const query = `
    INSERT INTO user_profiles (
      user_id,
      full_name,
      date_of_birth,
      gender,
      occupation_type,
      profile_image_url,
      profile_image_public_id
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7
    )
    RETURNING *
  `;

  const values = [
    userId,
    fullName,
    dateOfBirth,
    gender,
    occupationType,
    profileImageUrl,
    profileImagePublicId
  ];

  const { rows } =
    await pool.query(
      query,
      values
    );

  return rows[0];
}


/*
|--------------------------------------------------------------------------
| Find Profile By User ID
|--------------------------------------------------------------------------
*/

export async function findProfileByUserId(
  userId
) {
  const query = `
    SELECT *
    FROM user_profiles
    WHERE user_id = $1
    LIMIT 1
  `;

  const { rows } =
    await pool.query(
      query,
      [userId]
    );

  return rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Update Profile
|--------------------------------------------------------------------------
*/

export async function updateProfile(
  userId,
  updates
) {
  const allowedFields = [
    [
      "full_name",
      "fullName"
    ],
    [
      "date_of_birth",
      "dateOfBirth"
    ],
    [
      "gender",
      "gender"
    ],
    [
      "occupation_type",
      "occupationType"
    ]
  ];

  const setClauses = [];
  const values = [userId];

  for (
    const [
      column,
      key
    ] of allowedFields
  ) {
    if (
      updates[key] ===
      undefined
    ) {
      continue;
    }

    values.push(
      updates[key]
    );

    setClauses.push(
      `${column} = $${values.length}`
    );
  }

  if (
    setClauses.length === 0
  ) {
    return findProfileByUserId(
      userId
    );
  }

  setClauses.push(
    "updated_at = NOW()"
  );

  const query = `
    UPDATE user_profiles
    SET
      ${setClauses.join(
        ",\n      "
      )}
    WHERE user_id = $1
    RETURNING *
  `;

  const { rows } =
    await pool.query(
      query,
      values
    );

  return rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Update Profile Image
|--------------------------------------------------------------------------
*/

export async function updateProfileImage({
  userId,
  profileImageUrl,
  profileImagePublicId
}) {
  const query = `
    UPDATE user_profiles
    SET
      profile_image_url = $2,
      profile_image_public_id = $3,
      updated_at = NOW()
    WHERE user_id = $1
    RETURNING *
  `;

  const values = [
    userId,
    profileImageUrl,
    profileImagePublicId
  ];

  const { rows } =
    await pool.query(
      query,
      values
    );

  return rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Remove Profile Image
|--------------------------------------------------------------------------
*/

export async function removeProfileImage(
  userId
) {
  const query = `
    UPDATE user_profiles
    SET
      profile_image_url = NULL,
      profile_image_public_id = NULL,
      updated_at = NOW()
    WHERE user_id = $1
    RETURNING *
  `;

  const { rows } =
    await pool.query(
      query,
      [userId]
    );

  return rows[0] || null;
}