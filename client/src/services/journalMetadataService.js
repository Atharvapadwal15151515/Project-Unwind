import api from "./api";


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function resolveTagId(
  tagOrId
) {
  if (
    typeof tagOrId ===
    "string"
  ) {
    return tagOrId;
  }


  return (
    tagOrId?.tagId ||
    tagOrId?.tag_id
  );
}


function tagPath(
  tagOrId
) {
  const tagId =
    resolveTagId(
      tagOrId
    );


  if (!tagId) {
    throw new Error(
      "Journal tag ID is missing."
    );
  }


  return (
    `/journal/metadata/tags/${tagId}`
  );
}

function resolveActivityId(
  activityOrId
) {
  if (
    typeof activityOrId ===
    "string"
  ) {
    return activityOrId;
  }


  return (
    activityOrId?.activityId ||
    activityOrId?.activity_id
  );
}


function activityPath(
  activityOrId
) {
  const activityId =
    resolveActivityId(
      activityOrId
    );


  if (!activityId) {
    throw new Error(
      "Journal activity ID is missing."
    );
  }


  return (
    `/journal/metadata/activities/${activityId}`
  );
}


/*
|--------------------------------------------------------------------------
| Emotions
|--------------------------------------------------------------------------
*/

export async function getJournalEmotions() {
  const response =
    await api.get(
      "/journal/metadata/emotions"
    );


  return (
    response.data
      ?.data
      ?.emotions ||
    []
  );
}


/*
|--------------------------------------------------------------------------
| Tags
|--------------------------------------------------------------------------
*/

export async function getJournalTags() {
  const response =
    await api.get(
      "/journal/metadata/tags"
    );


  return (
    response.data
      ?.data
      ?.tags ||
    []
  );
}


export async function createJournalTag(
  tagName
) {
  const response =
    await api.post(
      "/journal/metadata/tags",
      {
        tagName
      }
    );


  return (
    response.data
      ?.data
      ?.tag ||
    null
  );
}


export async function updateJournalTag(
  tagOrId,
  tagName
) {
  const response =
    await api.patch(
      tagPath(
        tagOrId
      ),
      {
        tagName
      }
    );


  return (
    response.data
      ?.data
      ?.tag ||
    null
  );
}


export async function deleteJournalTag(
  tagOrId
) {
  const response =
    await api.delete(
      tagPath(
        tagOrId
      )
    );


  return (
    response.data
      ?.data
      ?.tag ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| Activities
|--------------------------------------------------------------------------
*/

export async function getJournalActivities() {
  const response =
    await api.get(
      "/journal/metadata/activities"
    );


  return (
    response.data
      ?.data
      ?.activities ||
    []
  );
}


export async function createJournalActivity(
  activityName
) {
  const response =
    await api.post(
      "/journal/metadata/activities",
      {
        activityName
      }
    );


  return (
    response.data
      ?.data
      ?.activity ||
    null
  );
}


export async function updateJournalActivity(
  activityOrId,
  activityName
) {
  const response =
    await api.patch(
      activityPath(
        activityOrId
      ),
      {
        activityName
      }
    );


  return (
    response.data
      ?.data
      ?.activity ||
    null
  );
}


export async function deleteJournalActivity(
  activityOrId
) {
  const response =
    await api.delete(
      activityPath(
        activityOrId
      )
    );


  return (
    response.data
      ?.data
      ?.activity ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| Error Helper
|--------------------------------------------------------------------------
*/

export function getJournalMetadataError(
  error,
  fallback =
    "Journal metadata could not be updated."
) {
  return (
    error?.response
      ?.data
      ?.message ||
    error?.response
      ?.data
      ?.error ||
    error?.message ||
    fallback
  );
}