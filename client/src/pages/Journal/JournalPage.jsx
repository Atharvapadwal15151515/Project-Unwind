import {
  useState
} from "react";
import {
  useConfirm
} from "../../context/ConfirmDialogContext";

import JournalAlert
  from "../../components/journal/JournalAlert";


import JournalBook
  from "../../components/journal/JournalBook";


import JournalEditorModal
  from "../../components/journal/JournalEditorModal";


import JournalSecurityBar
  from "../../components/journal/security/JournalSecurityBar";


import JournalSecurityGate
  from "../../components/journal/security/JournalSecurityGate";


import JournalSecuritySettings
  from "../../components/journal/security/JournalSecuritySettings";


import JournalPromptLibrary
  from "../../components/journal/JournalPromptLibrary";


import {
  useJournal
} from "../../hooks/useJournal";


import {
  useJournalAttachments
} from "../../hooks/useJournalAttachments";


import {
  useJournalSecurity
} from "../../hooks/useJournalSecurity";


import {
  getJournalEntryId
} from "../../utils/journalUtils";


import "./JournalPage.css";


function JournalWorkspace({
  journalSecurity
}) {
  /*
  |--------------------------------------------------------------------------
  | UI state
  |--------------------------------------------------------------------------
  */

  const [
    securitySettingsOpen,
    setSecuritySettingsOpen
  ] = useState(false);


  const [
    promptLibraryOpen,
    setPromptLibraryOpen
  ] = useState(false);


  /*
   * Voice notes may require a real entry ID
   * before the normal Save button is clicked.
   *
   * This is your EXISTING workflow.
   */

  const [
    voiceDraftEntry,
    setVoiceDraftEntry
  ] = useState(null);


  /*
  |--------------------------------------------------------------------------
  | Journal
  |--------------------------------------------------------------------------
  */

  const journal =
    useJournal();


  const {
    entries,
    dailyPrompt,
    selectedEntry,
    editor,
    query,
    filter,
    loading,
    saving,
    actionEntryId,
    error,
    editorOpen,
    stats,

    setQuery,
    setFilter,
    clearError,

    openNewEntry,
    openEntry,
    closeEditor,

    updateEditorField,
    selectMood,

    flushJournalAutoSave,

    saveEntry,
    finishEntrySave,

    toggleFavourite,
    archiveEntry,
    restoreEntry,
    removeEntry
  } = journal;


  /*
  |--------------------------------------------------------------------------
  | Active editor entry
  |--------------------------------------------------------------------------
  */

  const activeEditorEntry =
    selectedEntry ||
    voiceDraftEntry ||
    null;
const confirm = useConfirm();

  const activeEditorEntryId =
    getJournalEntryId(
      activeEditorEntry
    );


  /*
  |--------------------------------------------------------------------------
  | Attachments
  |--------------------------------------------------------------------------
  */

  const attachmentManager =
    useJournalAttachments({
      entryId:
        activeEditorEntryId ||
        null,

      active:
        editorOpen
    });


  /*
  |--------------------------------------------------------------------------
  | Security
  |--------------------------------------------------------------------------
  */

  const {
    security,
    isSecurityEnabled,
    pendingAction,

    error:
      securityError,

    notice:
      securityNotice,

    clearError:
      clearSecurityError,

    clearNotice:
      clearSecurityNotice,

    setupPin,
    lock,
    changePin,
    disablePin
  } = journalSecurity;


  /*
  |--------------------------------------------------------------------------
  | Close editor
  |--------------------------------------------------------------------------
  |
  | Existing autosave behavior remains exactly the same.
  |
  */

  async function handleCloseEditor() {
    if (
      saving ||
      attachmentManager
        .uploading
    ) {
      return;
    }


    if (
      attachmentManager
        .hasPendingAttachments
    ) {
      const confirmed =
  await confirm({
    title: "Discard attachments?",
    message:
      "The attachments waiting to upload will be discarded.",
    confirmText: "Discard",
    tone: "danger"
  });


      if (!confirmed) {
        return;
      }
    }


    await flushJournalAutoSave();


    attachmentManager.reset();


    setVoiceDraftEntry(
      null
    );


    closeEditor();


    /*
     * Reload the book so a new auto-saved draft
     * immediately becomes a physical journal page.
     */

    await journal.loadEntries();
  }


  /*
  |--------------------------------------------------------------------------
  | Ensure saved entry
  |--------------------------------------------------------------------------
  |
  | Required by voice journaling.
  |
  | UNCHANGED WORKFLOW.
  |
  */

  async function handleEnsureSavedEntry() {
    if (
      getJournalEntryId(
        selectedEntry
      )
    ) {
      return selectedEntry;
    }


    if (
      getJournalEntryId(
        voiceDraftEntry
      )
    ) {
      return voiceDraftEntry;
    }


    const savedEntry =
      await saveEntry(
        "draft"
      );


    if (
      !getJournalEntryId(
        savedEntry
      )
    ) {
      return null;
    }


    setVoiceDraftEntry(
      savedEntry
    );


    return savedEntry;
  }


  /*
  |--------------------------------------------------------------------------
  | Save
  |--------------------------------------------------------------------------
  |
  | Save entry -> upload pending attachments -> finalise save.
  |
  | Exactly the same workflow you already had.
  |
  */

  async function handleSave(
    status
  ) {
    try {
      const savedEntry =
        await saveEntry(
          status
        );


      if (!savedEntry) {
        return false;
      }


      setVoiceDraftEntry(
        savedEntry
      );


      const attachmentsUploaded =
        await attachmentManager
          .uploadPendingAttachments(
            savedEntry
          );


      if (
        !attachmentsUploaded
      ) {
        return false;
      }


      attachmentManager.reset();


      await finishEntrySave();


      setVoiceDraftEntry(
        null
      );


      return true;
    } catch (
      saveError
    ) {
      console.error(
        "Unable to save journal entry:",
        saveError
      );


      return false;
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Archive
  |--------------------------------------------------------------------------
  */

  async function handleArchive(
    entry
  ) {
    if (
      attachmentManager
        .hasPendingAttachments
    ) {
     const confirmed =
  await confirm({
    title: "Discard attachments?",
    message:
      "The attachments waiting to upload will be discarded if you continue.",
    confirmText: "Continue",
    tone: "warning"
  });


      if (!confirmed) {
        return;
      }
    }


    attachmentManager.reset();


    setVoiceDraftEntry(
      null
    );


    await archiveEntry(
      entry
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Restore / unarchive
  |--------------------------------------------------------------------------
  */

  async function handleRestore(
    entry
  ) {
    attachmentManager.reset();


    setVoiceDraftEntry(
      null
    );


    await restoreEntry(
      entry
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  async function handleDelete(
  entry
) {
  const confirmed =
    await confirm({
      title: "Delete journal entry?",
      message:
        "This journal entry will be moved to Recently Deleted.",
      confirmText: "Move to Recently Deleted",
      tone: "danger"
    });

  if (!confirmed) {
    return;
  }


    attachmentManager.reset();


    setVoiceDraftEntry(
      null
    );


    removeEntry(
      entry
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Create new page
  |--------------------------------------------------------------------------
  */

  function handleOpenNewEntry(
    prompt = null
  ) {
    setVoiceDraftEntry(
      null
    );


    if (prompt) {
      openNewEntry(
        prompt
      );
    } else {
      openNewEntry();
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Open existing page
  |--------------------------------------------------------------------------
  */

  function handleOpenEntry(
    entry
  ) {
    setVoiceDraftEntry(
      null
    );


    openEntry(
      entry
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="journal-page journal-page--book-mode">

      {/* ===================================
          JOURNAL ERROR
         =================================== */}

      <JournalAlert
        message={
          error
        }
        onDismiss={
          clearError
        }
      />


      {/* ===================================
          SECURITY
         =================================== */}

      <JournalSecurityBar
        isSecurityEnabled={
          isSecurityEnabled
        }

        locking={
          pendingAction ===
          "lock"
        }

        onOpenSettings={() => {
          clearSecurityError();

          clearSecurityNotice();


          setSecuritySettingsOpen(
            true
          );
        }}

        onLock={
          lock
        }
      />


      {/* ===================================
          THE ACTUAL DIARY BOOK
         =================================== */}

      <JournalBook
        entries={
          entries
        }

        query={
          query
        }

        filter={
          filter
        }

        loading={
          loading
        }

        actionEntryId={
          actionEntryId
        }

        stats={
          stats
        }

        dailyPrompt={
          dailyPrompt
        }

        onQueryChange={
          setQuery
        }

        onFilterChange={
          setFilter
        }

        onCreateEntry={
          handleOpenNewEntry
        }

        onOpenEntry={
          handleOpenEntry
        }

        onToggleFavourite={
          toggleFavourite
        }

        onBrowsePrompts={() =>
          setPromptLibraryOpen(
            true
          )
        }
      />


      {/* ===================================
          EXISTING PROMPT LIBRARY
         =================================== */}

      <JournalPromptLibrary
        open={
          promptLibraryOpen
        }

        onClose={() =>
          setPromptLibraryOpen(
            false
          )
        }

        onWrite={(
          prompt
        ) => {
          setPromptLibraryOpen(
            false
          );


          handleOpenNewEntry(
            prompt
          );
        }}
      />


      {/* ===================================
          EXISTING JOURNAL EDITOR
         ===================================
         
         IMPORTANT:
         
         Nothing inside the editor workflow
         has been removed.
         
         Clicking a physical diary page simply
         opens your existing full editor.
         
         =================================== */}

      <JournalEditorModal
        open={
          editorOpen
        }

        editor={
          editor
        }

        selectedEntry={
          activeEditorEntry
        }

        saving={
          saving
        }

        actionEntryId={
          actionEntryId
        }

        attachmentManager={
          attachmentManager
        }

        onEnsureSavedEntry={
          handleEnsureSavedEntry
        }

        onClose={
          handleCloseEditor
        }

        onFieldChange={
          updateEditorField
        }

        onSelectMood={
          selectMood
        }

        onSave={
          handleSave
        }

        onArchive={
          handleArchive
        }

        onRestore={
          handleRestore
        }

        onDelete={
          handleDelete
        }
      />


      {/* ===================================
          EXISTING SECURITY SETTINGS
         =================================== */}

      {securitySettingsOpen ? (
        <JournalSecuritySettings
          open

          security={
            security
          }

          isSecurityEnabled={
            isSecurityEnabled
          }

          pendingAction={
            pendingAction
          }

          error={
            securityError
          }

          notice={
            securityNotice
          }

          onClose={() =>
            setSecuritySettingsOpen(
              false
            )
          }

          onSetupPin={
            setupPin
          }

          onChangePin={
            changePin
          }

          onDisablePin={
            disablePin
          }

          onClearError={
            clearSecurityError
          }

          onClearNotice={
            clearSecurityNotice
          }
        />
      ) : null}
    </div>
  );
}


/*
|--------------------------------------------------------------------------
| Journal page
|--------------------------------------------------------------------------
*/

function JournalPage() {
  const journalSecurity =
    useJournalSecurity();


  return (
    <JournalSecurityGate
      journalSecurity={
        journalSecurity
      }
    >
      <JournalWorkspace
        journalSecurity={
          journalSecurity
        }
      />
    </JournalSecurityGate>
  );
}


export default JournalPage;