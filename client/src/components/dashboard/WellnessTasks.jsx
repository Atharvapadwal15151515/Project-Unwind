import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Circle,
  Droplets,
  NotebookPen,
  PersonStanding,
  Wind
} from "lucide-react";

const defaultTasks = [
  {
    id: "water",
    title: "Drink a glass of water",
    description: "A small act of physical care.",
    icon: Droplets
  },
  {
    id: "stretch",
    title: "Stretch for two minutes",
    description: "Release a little physical tension.",
    icon: PersonStanding
  },
  {
    id: "breathing",
    title: "Take five slow breaths",
    description: "Pause and notice your breathing.",
    icon: Wind
  },
  {
    id: "reflection",
    title: "Write one honest sentence",
    description: "Give your thoughts somewhere to rest.",
    icon: NotebookPen
  }
];

const STORAGE_KEY = "unwind_wellness_tasks";

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function getSavedTasks() {
  try {
    const savedData = JSON.parse(
      localStorage.getItem(STORAGE_KEY)
    );

    if (savedData?.date === getTodayKey()) {
      return savedData.completed || [];
    }
  } catch {
    return [];
  }

  return [];
}

function WellnessTasks() {
  const [completedTasks, setCompletedTasks] =
    useState(getSavedTasks);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        date: getTodayKey(),
        completed: completedTasks
      })
    );
  }, [completedTasks]);

  const progress = useMemo(() => {
    return Math.round(
      (completedTasks.length /
        defaultTasks.length) *
        100
    );
  }, [completedTasks]);

  const toggleTask = (taskId) => {
    setCompletedTasks((currentTasks) => {
      if (currentTasks.includes(taskId)) {
        return currentTasks.filter(
          (currentTaskId) =>
            currentTaskId !== taskId
        );
      }

      return [...currentTasks, taskId];
    });
  };

  return (
    <motion.article
      className="dashboard-widget wellness-tasks"
      initial={{
        opacity: 0,
        y: 25
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 0.5,
        delay: 0.18
      }}
    >
      <div className="dashboard-widget__header">
        <div>
          <span className="dashboard-widget__eyebrow">
            Gentle routine
          </span>

          <h2>Today’s wellness</h2>
        </div>

        <div className="wellness-tasks__progress">
          <strong>{progress}%</strong>
          <span>complete</span>
        </div>
      </div>

      <div className="wellness-tasks__progress-bar">
        <motion.span
          animate={{
            width: `${progress}%`
          }}
          transition={{
            duration: 0.4
          }}
        />
      </div>

      <div className="wellness-tasks__list">
        {defaultTasks.map((task) => {
          const Icon = task.icon;

          const completed =
            completedTasks.includes(task.id);

          return (
            <motion.button
              type="button"
              key={task.id}
              className={`wellness-task ${
                completed
                  ? "wellness-task--completed"
                  : ""
              }`}
              onClick={() => toggleTask(task.id)}
              whileTap={{
                scale: 0.985
              }}
            >
              <span className="wellness-task__icon">
                <Icon size={18} />
              </span>

              <span className="wellness-task__content">
                <strong>{task.title}</strong>
                <small>{task.description}</small>
              </span>

              <span className="wellness-task__check">
                {completed ? (
                  <Check size={16} />
                ) : (
                  <Circle size={17} />
                )}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.article>
  );
}

export default WellnessTasks;