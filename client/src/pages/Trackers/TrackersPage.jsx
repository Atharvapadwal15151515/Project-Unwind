import {
  useState
} from "react";

import {
  RefreshCw,
  Sparkles
} from "lucide-react";

import {
  useAuth
} from "../../context/AuthContext";

import {
  useDailyTrackers
} from "../../hooks/useDailyTrackers";

import TrackerHero from "../../components/trackers/TrackerHero";
import WellnessScoreCard from "../../components/trackers/WellnessScoreCard";
import MoodTrackerCard from "../../components/trackers/MoodTrackerCard";
import EnergyTrackerCard from "../../components/trackers/EnergyTrackerCard";
import SleepTrackerCard from "../../components/trackers/SleepTrackerCard";
import WaterTrackerCard from "../../components/trackers/WaterTrackerCard";
import HabitTrackerCard from "../../components/trackers/HabitTrackerCard";
import CreateHabitModal from "../../components/trackers/CreateHabitModal";
import TrackerSkeleton from "../../components/trackers/TrackerSkeleton";
import AppErrorState
  from "../../components/common/AppStates/AppErrorState";

import ButtonLoader
  from "../../components/common/AppStates/ButtonLoader";

import "./Trackers.css";

function getDisplayName(user) {
  return (
    user?.display_name ||
    user?.displayName ||
    user?.full_name ||
    user?.fullName ||
    user?.username ||
    "there"
  );
}

function TrackersPage() {
  const { user } = useAuth();

  const [
    habitModalOpen,
    setHabitModalOpen
  ] = useState(false);

  const {
    selectedDate,
    setSelectedDate,

    moodEntry,
    energyEntry,
    sleepEntry,

    waterLogs,
    waterTotal,
    waterContainers,

    habits,
    metadata,

    completedHabitCount,
    wellnessScore,

    loading,
    refreshing,
    savingTracker,
    error,

    refresh,

    saveMood,
    saveEnergy,
    saveSleep,

    addWater,
    removeLastWater,

       createNewHabit,
    markHabitComplete,
    markHabitSkipped,
    removeHabit,

    clearError
  } = useDailyTrackers();

  const handleCreateHabit =
    async (payload) => {
      await createNewHabit(
        payload
      );

      setHabitModalOpen(false);
    };

  if (loading) {
    return <TrackerSkeleton />;
  }

  return (
    <div className="trackers-page">
      <TrackerHero
        displayName={
          getDisplayName(user)
        }
        selectedDate={
          selectedDate
        }
        onDateChange={
          setSelectedDate
        }
        refreshing={
          refreshing
        }
        onRefresh={() =>
          refresh()
        }
      />

   {error && (
  <div className="trackers-page__error">
    <AppErrorState
      type="server"
      title="Unable to update your trackers"
      message={error}
      onRetry={refresh}
    />

    <button
      type="button"
      className="trackers-page__dismiss-error"
      onClick={clearError}
    >
      Dismiss
    </button>
  </div>
)}

      <section className="trackers-overview-grid">
        <WellnessScoreCard
          score={
            wellnessScore
          }
          moodEntry={
            moodEntry
          }
          energyEntry={
            energyEntry
          }
          sleepEntry={
            sleepEntry
          }
          waterTotal={
            waterTotal
          }
          habits={
            habits
          }
          completedHabitCount={
            completedHabitCount
          }
        />

        <article className="trackers-encouragement-card">
          <span>
            <Sparkles
              size={21}
            />
          </span>

          <div>
            <small>
              Gentle reminder
            </small>

            <h2>
              Progress does not have
              to be perfect.
            </h2>

            <p>
              Every check-in helps you
              understand yourself a
              little better. Missing a
              day does not erase your
              progress.
            </p>
          </div>
        </article>
      </section>

      <section className="trackers-section">
        <header className="trackers-section__header">
          <div>
            <span>
              Daily check-in
            </span>

            <h2>
              How are you feeling
              today?
            </h2>
          </div>

          <button
            type="button"
            className="trackers-refresh-button"
            onClick={() =>
              refresh()
            }
            disabled={
              refreshing
            }
          >
           {refreshing ? (
  <ButtonLoader
    label="Refreshing…"
    size="small"
  />
) : (
  <>
    <RefreshCw size={16} />
    Refresh
  </>
)}
          </button>
        </header>

        <div className="trackers-main-grid">
          <MoodTrackerCard
            entry={
              moodEntry
            }
            metadata={
              metadata
            }
            saving={
              savingTracker ===
              "mood"
            }
            onSave={
              saveMood
            }
          />

          <EnergyTrackerCard
            entry={
              energyEntry
            }
            saving={
              savingTracker ===
              "energy"
            }
            onSave={
              saveEnergy
            }
          />

          <SleepTrackerCard
            entry={
              sleepEntry
            }
            selectedDate={
              selectedDate
            }
            metadata={
              metadata
            }
            saving={
              savingTracker ===
              "sleep"
            }
            onSave={
              saveSleep
            }
          />

          <WaterTrackerCard
            total={
              waterTotal
            }
            containers={
              waterContainers
            }
            canRemove={
              waterLogs.length > 0
            }
            saving={
              savingTracker ===
              "water"
            }
            removing={
              savingTracker ===
              "water-remove"
            }
            onAddWater={
              addWater
            }
            onRemoveLastWater={
              removeLastWater
            }
          />
        </div>
      </section>

      <section className="trackers-section">
        <header className="trackers-section__header">
          <div>
            <span>
              Daily consistency
            </span>

            <h2>
              Today&apos;s habits
            </h2>
          </div>

          <p>
            {completedHabitCount} of{" "}
            {habits.length} completed
          </p>
        </header>

                <HabitTrackerCard
          habits={
            habits
          }
          savingTracker={
            savingTracker
          }
          onCreate={() =>
            setHabitModalOpen(true)
          }
          onComplete={
            markHabitComplete
          }
          onSkip={
            markHabitSkipped
          }
          onDelete={
            removeHabit
          }
        />
      </section>

      <CreateHabitModal
        open={
          habitModalOpen
        }
        selectedDate={
          selectedDate
        }
        saving={
          savingTracker ===
          "habit-create"
        }
        onClose={() =>
          setHabitModalOpen(false)
        }
        onCreate={
          handleCreateHabit
        }
      />
    </div>
  );
}

export default TrackersPage;