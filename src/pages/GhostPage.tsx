import React from "react";
import AccountabilityGhost from "../components/AccountabilityGhost";

export default function GhostPage({ tasks }: any) {
  return (
    <div className="animate-fade-in-up w-full max-w-3xl mx-auto h-[600px]">
      <AccountabilityGhost currentTasks={tasks} />
    </div>
  );
}
