import React from "react";
import RescueModeComponent from "../components/RescueModeComponent";

export default function RescuePage({
  tasks,
  savedRescues,
  saveRescuesToLocalStorage,
  setSavedRescues
}: any) {
  return (
    <div className="animate-fade-in-up w-full max-w-4xl mx-auto">
      <RescueModeComponent
        tasks={tasks}
        savedRescues={savedRescues}
        onRescueSaved={(newPlan: any) => {
          const updated = [newPlan, ...savedRescues.filter((r: any) => r.taskId !== newPlan.taskId)];
          saveRescuesToLocalStorage(updated);
          setSavedRescues(updated);
        }}
        onDeleteRescue={(taskId: string) => {
          const updated = savedRescues.filter((r: any) => r.taskId !== taskId);
          saveRescuesToLocalStorage(updated);
          setSavedRescues(updated);
        }}
      />
    </div>
  );
}
